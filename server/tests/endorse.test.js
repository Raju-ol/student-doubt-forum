import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { tokenFor } from '../src/auth.js';
import { Answer, Doubt, User, Vote } from '../src/models.js';

test('teachers endorse answers; the endorsement ranks, notifies and has clear ownership', async t => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const dbName = `forum_test_${Date.now()}_${randomBytes(3).toString('hex')}`;
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017', { dbName });
  const server = createApp().listen(0, '127.0.0.1');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    assert.equal(mongoose.connection.name, dbName);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
  const call = async (path, { token, method = 'GET', body, status = 200 } = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`, {
      method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${payload.message}`);
    return payload.data;
  };
  const make = (name, extra = {}) => User.create({ name, email: `${name.toLowerCase()}@example.test`, reputation: 0, emailVerifiedAt: new Date(), ...extra });
  const [asker, helper, loud, voter, meera, ravi, admin] = await Promise.all([make('Asker'), make('Helper'), make('Loud'), make('Voter'), make('Meera', { role: 'teacher' }), make('Ravi', { role: 'teacher' }), make('Admin', { role: 'admin' })]);
  const token = Object.fromEntries(Object.entries({ asker, helper, meera, ravi, admin, voter }).map(([key, user]) => [key, tokenFor(user)]));
  const doubt = await Doubt.create({ title: 'Which answer should be read first here?', body: 'A long enough description of the question body.', subject: 'Java', author: asker._id });
  const quiet = await Answer.create({ doubt: doubt._id, author: helper._id, body: 'A correct but quiet explanation from a student.' });
  const popular = await Answer.create({ doubt: doubt._id, author: loud._id, body: 'A popular explanation with more votes than the others.' });
  const teaching = await Answer.create({ doubt: doubt._id, author: ravi._id, body: 'A teacher answer, which ranks above plain answers.' });
  await Vote.create({ targetType: 'answer', target: popular._id, user: voter._id, value: 1 });
  const order = async () => (await call(`/doubts/${doubt._id}`)).answers.map(item => String(item._id));
  const ids = (...docs) => docs.map(item => String(item._id));
  assert.deepEqual(await order(), ids(teaching, popular, quiet));

  await call(`/answers/${quiet._id}/endorse`, { method: 'PATCH', status: 401 });
  await call(`/answers/${quiet._id}/endorse`, { token: token.voter, method: 'PATCH', status: 403 });
  await call(`/answers/${quiet._id}/endorse`, { token: token.asker, method: 'PATCH', status: 403 });
  await call('/answers/not-an-id/endorse', { token: token.meera, method: 'PATCH', status: 400 });
  await call(`/answers/${teaching._id}/endorse`, { token: token.ravi, method: 'PATCH', status: 403 });

  assert.deepEqual(await call(`/answers/${quiet._id}/endorse`, { token: token.meera, method: 'PATCH' }), { endorsed: true });
  const page = await call(`/doubts/${doubt._id}`);
  // Endorsed outranks a teacher-written answer, which outranks votes.
  assert.deepEqual(page.answers.map(item => String(item._id)), ids(quiet, teaching, popular));
  assert.equal(page.answers[0].endorsedBy.name, 'Meera');
  assert.equal(page.answers[1].endorsedBy ?? null, null);
  // The answerer is told, and the teacher is named.
  const note = (await call('/notifications', { token: token.helper })).items.find(item => item.type === 'answer_endorsed');
  assert.equal(note.actor.name, 'Meera'); assert.equal(note.target.title, doubt.title);

  // Only the endorsing teacher (or an admin) can remove it.
  await call(`/answers/${quiet._id}/endorse`, { token: token.ravi, method: 'PATCH', status: 409 });
  assert.deepEqual(await call(`/answers/${quiet._id}/endorse`, { token: token.meera, method: 'PATCH' }), { endorsed: false });
  assert.deepEqual(await order(), ids(teaching, popular, quiet));
  // Endorsing again does not send a second notification.
  await call(`/answers/${quiet._id}/endorse`, { token: token.meera, method: 'PATCH' });
  assert.equal((await call('/notifications', { token: token.helper })).items.filter(item => item.type === 'answer_endorsed').length, 1);
  assert.deepEqual(await call(`/answers/${quiet._id}/endorse`, { token: token.admin, method: 'PATCH' }), { endorsed: false });

  // Acceptance still outranks everything and stays the asker's right.
  await call(`/answers/${quiet._id}/endorse`, { token: token.ravi, method: 'PATCH' });
  await call(`/answers/${popular._id}/accept`, { token: token.asker, method: 'PATCH' });
  assert.deepEqual(await order(), ids(popular, quiet, teaching));
  await call(`/answers/${quiet._id}/accept`, { token: token.meera, method: 'PATCH', status: 403 });
});
