import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { tokenFor } from '../src/auth.js';
import { Answer, Doubt, Report, User } from '../src/models.js';

test('moderators get read-only context about a reported author, without email or powers', async t => {
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
  const [moderator, admin, teacher, student, troll, gone] = await Promise.all([make('Mod', { role: 'moderator' }), make('Admin', { role: 'admin' }), make('Prof', { role: 'teacher' }), make('Student'), make('Troll'), make('Gone', { isDeleted: true })]);
  const token = Object.fromEntries(Object.entries({ moderator, admin, teacher, student }).map(([key, user]) => [key, tokenFor(user)]));

  const a = await Doubt.create({ title: 'A question posted in the open', body: 'A long enough description of the question body.', subject: 'Java', author: troll._id });
  const b = await Doubt.create({ title: 'A question posted anonymously', body: 'A long enough description of the question body.', subject: 'Java', author: troll._id, isAnonymous: true });
  const reply = await Answer.create({ doubt: a._id, author: troll._id, body: 'Some **rude** answer text that goes on and on about nothing useful at all, repeatedly, for a long while, to test the excerpt length limit properly here.' });
  const reports = await Promise.all([['doubt', a._id, 'pending'], ['doubt', b._id, 'dismissed'], ['answer', reply._id, 'removed'], ['answer', reply._id, 'removed']].map(([targetType, target, status]) => Report.create({ targetType, target, reporter: student._id, reason: 'Reported for testing', status })));
  assert.equal(reports.length, 4);

  const context = await call(`/admin/users/${troll._id}/context`, { token: token.moderator });
  assert.deepEqual(context.user, { _id: String(troll._id), name: 'Troll', role: 'student', createdAt: context.user.createdAt, isBanned: false });
  assert.deepEqual(context.counts, { questions: 2, answers: 1 });
  assert.deepEqual(context.reportsAbout, { pending: 1, dismissed: 1, removed: 2 });
  // Moderators see anonymous questions' author context, flagged as such, newest first.
  assert.deepEqual(context.recentQuestions.map(item => [item.title, item.isAnonymous]), [['A question posted anonymously', true], ['A question posted in the open', false]]);
  assert.equal(context.recentAnswers[0].doubt.title, 'A question posted in the open');
  assert.ok(context.recentAnswers[0].excerpt.length <= 140 && !context.recentAnswers[0].excerpt.includes('**'));
  assert.ok(!JSON.stringify(context).includes('@example.test'), 'no email address');
  // Admins can read it too; nobody else can.
  assert.equal((await call(`/admin/users/${troll._id}/context`, { token: token.admin })).counts.questions, 2);
  await call(`/admin/users/${troll._id}/context`, { token: token.teacher, status: 403 });
  await call(`/admin/users/${troll._id}/context`, { token: token.student, status: 403 });
  await call(`/admin/users/${troll._id}/context`, { status: 401 });
  await call('/admin/users/not-an-id/context', { token: token.moderator, status: 400 });
  await call('/admin/users/000000000000000000000000/context', { token: token.moderator, status: 404 });
  await call(`/admin/users/${gone._id}/context`, { token: token.moderator, status: 404 });
  // A user with no history is all zeros.
  assert.deepEqual((await call(`/admin/users/${student._id}/context`, { token: token.moderator })).reportsAbout, { pending: 0, dismissed: 0, removed: 0 });

  // The report queue now carries the author id so the screen can ask for this context.
  const queue = await call('/admin/reports', { token: token.moderator });
  assert.ok(queue.items.every(item => item.content.author === String(troll._id)));
  // Context is read-only: a moderator still cannot suspend or change roles.
  await call(`/admin/users/${troll._id}/ban`, { token: token.moderator, method: 'PATCH', body: { isBanned: true }, status: 403 });
  await call(`/admin/users/${troll._id}/role`, { token: token.moderator, method: 'PATCH', body: { role: 'teacher' }, status: 403 });
});
