import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { tokenFor } from '../src/auth.js';
import { User } from '../src/models.js';

test('anonymous questions hide the asker from everyone except the asker and staff', async t => {
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
  const [shy, peer, teacher, moderator, admin] = await Promise.all([make('Shy'), make('Peer'), make('Prof', { role: 'teacher' }), make('Mod', { role: 'moderator' }), make('Admin', { role: 'admin' })]);
  const token = Object.fromEntries(Object.entries({ shy, peer, teacher, moderator, admin }).map(([key, user]) => [key, tokenFor(user)]));
  const body = { title: 'I am embarrassed to ask this basic thing', body: 'Please explain what a pointer is, from the very start.', subject: 'Java', tags: [] };

  await call('/doubts', { token: token.shy, method: 'POST', status: 400, body: { ...body, anonymous: 'yes' } });
  const open = await call('/doubts', { token: token.shy, method: 'POST', status: 201, body: { ...body, title: 'A perfectly normal public question' } });
  const hidden = await call('/doubts', { token: token.shy, method: 'POST', status: 201, body: { ...body, anonymous: true } });
  assert.equal(open.isAnonymous, false); assert.equal(hidden.isAnonymous, true);

  const asSeenBy = async who => {
    const opts = who ? { token: token[who] } : {};
    const feed = (await call('/doubts?scope=all', opts)).items.find(item => item._id === hidden._id);
    const page = await call(`/doubts/${hidden._id}`, opts);
    assert.equal(feed.isAnonymous, true); assert.equal(page.isAnonymous, true);
    assert.deepEqual(feed.author, page.author, 'feed and question page agree');
    return page.author;
  };
  for (const viewer of [null, 'peer', 'teacher']) {
    const author = await asSeenBy(viewer);
    assert.deepEqual(author, { name: 'Anonymous', role: 'student' }, `${viewer ?? 'guest'} sees only Anonymous`);
  }
  for (const viewer of ['shy', 'moderator', 'admin']) assert.equal((await asSeenBy(viewer))._id, String(shy._id), `${viewer} sees the author`);
  // A normal question is unaffected.
  assert.equal((await call(`/doubts/${open._id}`)).author.name, 'Shy');

  // The public profile lists only non-anonymous questions; the owner and staff see both.
  const titles = async who => (await call(`/users/${shy._id}`, who ? { token: token[who] } : {})).doubts.map(item => item.title).sort();
  assert.deepEqual(await titles(null), ['A perfectly normal public question']);
  assert.deepEqual(await titles('teacher'), ['A perfectly normal public question']);
  assert.equal((await titles('shy')).length, 2);
  assert.equal((await titles('admin')).length, 2);

  // Related and similar suggestions carry no author at all.
  assert.ok(!JSON.stringify(await call(`/doubts/${open._id}/related`)).includes('Shy'));

  // Accepting an answer must not reveal the asker's name in the answerer's notification.
  const reply = await call(`/doubts/${hidden._id}/answers`, { token: token.peer, method: 'POST', status: 201, body: { body: 'A pointer stores the address of another value in memory.' } });
  const peerNotes = async () => (await call('/notifications', { token: token.peer })).items;
  await call(`/answers/${reply._id}/accept`, { token: token.shy, method: 'PATCH' });
  const accepted = (await peerNotes()).find(item => item.type === 'answer_accepted');
  assert.equal(accepted.actor.name, 'Anonymous');
  assert.equal(accepted.target.title, hidden.title);
  assert.equal(accepted.target.isAnonymous, undefined, 'the flag itself is not exposed in notifications');
  // The asker still hears about the answer, and editing keeps the question anonymous.
  assert.ok((await call('/notifications', { token: token.shy })).items.some(item => item.type === 'question_answered'));
  await call(`/doubts/${hidden._id}`, { token: token.shy, method: 'PUT', body: { ...body, title: 'Still embarrassed, now with a clearer title', anonymous: false } });
  assert.equal((await call(`/doubts/${hidden._id}`)).author.name, 'Anonymous');
});
