
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User, Report, Doubt } from '../src/models.js';
import { tokenFor } from '../src/auth.js';

test('admin role grants and moderator boundaries are enforced by the API', async t => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const dbName = 'forum_test_' + Date.now() + '_' + randomBytes(3).toString('hex');
  await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017', { dbName });
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    assert.equal(mongoose.connection.name, dbName);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  const [primary, secondary, member, ordinary, suspended, deleted] = await User.create([
    { name: 'Owner', email: 'owner@example.test', role: 'admin', createdAt: new Date('2020-01-01') },
    { name: 'Second Admin', email: 'admin@example.test', role: 'admin' },
    { name: 'Member', email: 'member@example.test', role: 'student' },
    { name: 'Ordinary Student', email: 'ordinary@example.test', role: 'student' },
    { name: 'Suspended', email: 'suspended@example.test', role: 'student', isBanned: true },
    { name: 'Deleted user', email: 'deleted@example.test', role: 'student', isDeleted: true }
  ]);
  const base = 'http://127.0.0.1:' + server.address().port + '/api/v1';
  const ownerToken = tokenFor(primary);
  const memberToken = tokenFor(member);
  async function request(route, method, body, token, status = 200) {
    const response = await fetch(base + route, {
      method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const result = await response.json();
    assert.equal(response.status, status, result.message);
    return result.data;
  }
  const change = (account, role, token = ownerToken, status = 200) =>
    request('/admin/users/' + account._id + '/role', 'PATCH', { role }, token, status);

  await t.test('students and anonymous callers cannot assign roles', async () => {
    await change(ordinary, 'admin', memberToken, 403);
    await change(ordinary, 'admin', null, 401);
    assert.equal((await User.findById(ordinary._id)).role, 'student');
  });
  await t.test('admin can grant moderator and the existing session uses its current database role', async () => {
    assert.equal((await change(member, 'moderator')).role, 'moderator');
    assert.equal((await request('/auth/me', 'GET', undefined, memberToken)).role, 'moderator');
    const report = await Report.create({ targetType: 'doubt', target: new mongoose.Types.ObjectId(), reporter: ordinary._id, reason: 'QA report' });
    assert.equal((await request('/admin/reports', 'GET', undefined, memberToken)).items.length, 1);
    await request('/admin/reports/' + report._id, 'PATCH', { status: 'dismissed' }, memberToken);
    assert.equal((await Report.findById(report._id)).status, 'dismissed');
    const question = await Doubt.create({
      author: ordinary._id, title: 'Disposable moderation question',
      body: 'A disposable local question for the moderation test.', subject: 'DBMS'
    });
    const removal = await Report.create({
      targetType: 'doubt', target: question._id, reporter: ordinary._id, reason: 'QA removal'
    });
    await request('/admin/reports/' + removal._id, 'PATCH', { status: 'removed' }, memberToken);
    assert.equal(await Doubt.findById(question._id), null);
  });
  await t.test('moderators cannot list users, grant roles, ban accounts or manage catalogues and imports', async () => {
    await request('/admin/users', 'GET', undefined, memberToken, 403);
    await change(ordinary, 'admin', memberToken, 403);
    await request('/admin/users/' + ordinary._id + '/ban', 'PATCH', { isBanned: true }, memberToken, 403);
    await request('/admin/subjects', 'POST', { name: 'Forbidden subject' }, memberToken, 403);
    await request('/admin/institutions', 'POST', { name: 'Forbidden college' }, memberToken, 403);
    await request('/admin/study-library', 'GET', undefined, memberToken, 403);
    await request('/admin/study-library', 'POST', { confirm: 'study-library-v1' }, memberToken, 403);
  });
  await t.test('admin can grant admin and revoke that grant on another account', async () => {
    assert.equal((await change(member, 'admin')).role, 'admin');
    await request('/admin/users', 'GET', undefined, memberToken);
    await change(member, 'teacher');
    assert.equal((await User.findById(member._id)).role, 'teacher');
    await request('/admin/reports', 'GET', undefined, memberToken, 403);
    await change(member, 'student');
  });
  await t.test('own role, primary admin, invalid roles and unavailable targets are protected', async () => {
    await change(primary, 'student', ownerToken, 403);
    await change(primary, 'student', tokenFor(secondary), 403);
    await change(ordinary, 'owner', ownerToken, 400);
    await change(suspended, 'admin', ownerToken, 409);
    await change(suspended, 'moderator', ownerToken, 409);
    await change(deleted, 'admin', ownerToken, 404);
    await request('/admin/users/not-an-id/role', 'PATCH', { role: 'moderator' }, ownerToken, 400);
    assert.equal((await User.findById(primary._id)).role, 'admin');
  });
  await t.test('later promotions cannot replace the pinned primary administrator', async () => {
    await change(ordinary, 'admin');
    const setting = await mongoose.connection.collection('admin_settings').findOne({ _id: 'primary-admin' });
    assert.equal(String(setting.userId), String(primary._id));
    await Promise.all([
      change(secondary, 'moderator'),
      change(ordinary, 'student')
    ]);
    assert.equal(await User.countDocuments({ role: 'admin', isDeleted: { $ne: true }, isBanned: { $ne: true } }), 1);
  });
});

