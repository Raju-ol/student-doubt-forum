import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { tokenFor } from '../src/auth.js';
import { Answer, Doubt, Report, User } from '../src/models.js';

test('authentication, ownership and admin boundaries', async t => {
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
  const call = async (path, { token, method = 'GET', body, status = 200, raw } = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`, {
      method, headers: { ...(body || raw ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: raw ?? (body ? JSON.stringify(body) : undefined)
    });
    const payload = await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${payload.message}`);
    return payload;
  };
  const make = (name, extra = {}) => User.create({ name, email: `${name.toLowerCase()}@example.test`, reputation: 0, emailVerifiedAt: new Date(), ...extra });
  const [owner, other, moderator, admin, banned] = await Promise.all([make('Owner'), make('Other'), make('Mod', { role: 'moderator' }), make('Admin', { role: 'admin' }), make('Banned', { isBanned: true })]);
  const tokens = Object.fromEntries(Object.entries({ owner, other, moderator, admin, banned }).map(([key, user]) => [key, tokenFor(user)]));
  const question = await Doubt.create({ title: 'Why is the sky blue at noon?', body: 'A long enough description of the question.', subject: 'Physics', author: owner._id });
  const answer = await Answer.create({ doubt: question._id, author: other._id, body: 'Rayleigh scattering explains it.' });

  // Authentication.
  await call('/doubts', { method: 'POST', body: { title: 'x' }, status: 401 });
  await call('/doubts', { token: 'not-a-token', status: 401 });
  await call('/doubts', { token: tokens.banned, status: 401 });
  await call('/auth/me', { token: `${tokens.owner.slice(0, -3)}abc`, status: 401 });
  const stale = tokens.other;
  await call('/auth/logout-all', { token: stale, method: 'POST' });
  await call('/auth/me', { token: stale, status: 401 });

  // Validation.
  await call('/doubts', { token: tokens.owner, method: 'POST', body: { title: 'short', body: 'too short', subject: 'Physics' }, status: 400 });
  await call('/doubts', { token: tokens.owner, method: 'POST', raw: '[]', status: 400 });
  await call('/doubts/not-an-id', { status: 400 });
  await call('/doubts?scope=college', { status: 401 });
  await call('/doubts?scope=nonsense', { status: 400 });

  // Ownership: only the author or an admin changes a question; moderators go through reports.
  const edit = { title: 'Why is the sky blue at noon?!', body: 'An edited description that is long enough.', subject: 'Physics' };
  await call(`/doubts/${question._id}`, { token: tokens.moderator, method: 'PUT', body: edit, status: 403 });
  await call(`/doubts/${question._id}`, { token: tokens.moderator, method: 'DELETE', status: 403 });
  await call(`/doubts/${question._id}`, { method: 'PUT', body: edit, status: 401 });
  await call(`/doubts/${question._id}`, { token: tokens.owner, method: 'PUT', body: edit });
  await call(`/answers/${answer._id}`, { token: tokens.owner, method: 'DELETE', status: 403 });

  // Votes and acceptance.
  await call(`/doubts/${question._id}/vote`, { token: tokens.owner, method: 'POST', body: { value: 1 }, status: 403 });
  await call(`/doubts/${question._id}/vote`, { token: tokens.moderator, method: 'POST', body: { value: 5 }, status: 400 });
  await call(`/answers/${answer._id}/accept`, { token: tokens.moderator, method: 'PATCH', status: 403 });
  await call(`/answers/${answer._id}/accept`, { token: tokens.owner, method: 'PATCH' });

  // Admin area.
  await call('/admin/reports', { status: 401 });
  await call('/admin/reports', { token: tokens.owner, status: 403 });
  await call('/admin/reports', { token: tokens.moderator });
  for (const path of ['/admin/users', '/admin/study-library']) await call(path, { token: tokens.moderator, status: 403 });
  await call(`/admin/users/${owner._id}/role`, { token: tokens.moderator, method: 'PATCH', body: { role: 'admin' }, status: 403 });
  await call(`/admin/users/${owner._id}/ban`, { token: tokens.moderator, method: 'PATCH', body: { isBanned: true }, status: 403 });
  await call(`/admin/users/${admin._id}/ban`, { token: tokens.admin, method: 'PATCH', body: { isBanned: true }, status: 403 });
  await call(`/admin/users/${owner._id}/ban`, { token: tokens.admin, method: 'PATCH', body: { isBanned: 'yes' }, status: 400 });

  // A report resolves once; a dismissed report must not remove content later.
  const reported = await call('/reports', { token: tokens.owner, method: 'POST', body: { targetType: 'answer', targetId: String(answer._id), reason: 'This answer is spam.' }, status: 201 });
  await call('/reports', { token: tokens.owner, method: 'POST', body: { targetType: 'answer', targetId: String(answer._id), reason: 'Reporting again.' }, status: 409 });
  await call(`/admin/reports/${reported.data._id}`, { token: tokens.moderator, method: 'PATCH', body: { status: 'nonsense' }, status: 400 });
  await call(`/admin/reports/${reported.data._id}`, { token: tokens.moderator, method: 'PATCH', body: { status: 'dismissed' } });
  await call(`/admin/reports/${reported.data._id}`, { token: tokens.moderator, method: 'PATCH', body: { status: 'removed' }, status: 409 });
  assert.equal(await Answer.countDocuments({ _id: answer._id }), 1);
  assert.equal((await Report.findById(reported.data._id)).status, 'dismissed');

  // Views are counted by an explicit call, never by a refresh after voting or answering.
  const before = (await call(`/doubts/${question._id}`)).data.views;
  await call(`/doubts/${question._id}`);
  assert.equal((await call(`/doubts/${question._id}`)).data.views, before);
  assert.equal((await call(`/doubts/${question._id}/view`, { method: 'POST' })).data.views, before + 1);
  await call('/doubts/not-an-id/view', { method: 'POST', status: 400 });

  // Upload errors name the limit of the endpoint that failed.
  const form = new FormData();
  form.append('title', 'Big notes'); form.append('category', 'notes');
  form.append('file', new Blob([Buffer.alloc(4 * 1024 * 1024 + 10, 1)]), 'big.pdf');
  const big = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/resources`, { method: 'POST', headers: { Authorization: `Bearer ${tokens.owner}` }, body: form });
  assert.equal(big.status, 400);
  assert.match((await big.json()).message, /4 MB/);
});
