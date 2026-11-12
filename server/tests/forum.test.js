import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models.js';
import { createServer } from 'node:http';
import { calculateReputation, ensureReputation } from '../src/reputation.js';
import jwt from 'jsonwebtoken';

test('Student Doubt Forum integration flow', async t => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const dbName = `forum_test_${Date.now()}_${randomBytes(3).toString('hex')}`;
  await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017', { dbName, serverSelectionTimeoutMS: 8000 });
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    if (!/^forum_test_\d+_[a-f0-9]{6}$/.test(mongoose.connection.name)) throw new Error('Refusing to clean an unexpected database.');
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  });
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  async function request(route, method = 'GET', body, token, status = 200) {
    const headers = {}; if (token) headers.Authorization = `Bearer ${token}`; if (body) headers['Content-Type'] = 'application/json';
    const response = await fetch(base + route, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const result = await response.json(); assert.equal(response.status, status, `${method} ${route}: ${JSON.stringify(result)}`);
    assert.equal(result.success, status < 400); return result.data;
  }
  let a, b, c, doubt, answer;
  const fields = { name: 'Test Student', email: 'student-a@example.test', password: 'CollegeTest123!', semester: 3 };
  await t.test('health confirms MongoDB connection', async () => { assert.equal((await request('/health')).database, 'connected'); });
  await t.test('signup ignores privileged role and hashes the password', async () => {
    a = await request('/auth/signup', 'POST', { ...fields, role: 'admin', reputation: 1000 }, null, 201);
    assert.equal(a.user.role, 'student'); assert.equal(a.user.passwordHash, undefined);
    const user = await User.findById(a.user._id).select('+passwordHash'); assert.notEqual(user.passwordHash, fields.password); assert.match(user.passwordHash, /^\$2/);
  });
  await t.test('duplicate normalized email is rejected', async () => { await request('/auth/signup', 'POST', { ...fields, email: 'STUDENT-A@EXAMPLE.TEST' }, null, 409); });
  await t.test('invalid signup and password length are rejected', async () => { await request('/auth/signup', 'POST', { ...fields, email: 'bad' }, null, 400); await request('/auth/signup', 'POST', { ...fields, password: 'x' }, null, 400); });
  await t.test('wrong password rejected; valid login succeeds', async () => { await request('/auth/login', 'POST', { email: fields.email, password: 'wrongPassword' }, null, 401); const login = await request('/auth/login', 'POST', fields); assert.equal(login.user._id, a.user._id); });
  await t.test('session restored using current-user endpoint', async () => { assert.equal((await request('/auth/me', 'GET', null, a.token))._id, a.user._id); });
  await t.test('invalid token and anonymous writes rejected', async () => { await request('/auth/me', 'GET', null, 'bad-token', 401); await request('/doubts', 'POST', {}, null, 401); });
  await t.test('second student and administrator accounts created', async () => {
    b = await request('/auth/signup', 'POST', { ...fields, name: 'Second Student', email: 'student-b@example.test' }, null, 201);
    c = await request('/auth/signup', 'POST', { ...fields, name: 'Moderator', email: 'admin@example.test' }, null, 201);
    await User.updateOne({ _id: c.user._id }, { role: 'admin' });
  });
  await t.test('doubt uses authenticated author and validates fields', async () => {
    await request('/doubts', 'POST', { title: 'short' }, a.token, 400);
    doubt = await request('/doubts', 'POST', { title: 'Why do we normalize database tables?', body: 'I understand tables but I am confused about database normalization and redundancy.', subject: 'DBMS', semester: 3, tags: ['SQL', 'normalization'], author: b.user._id }, a.token, 201);
    assert.equal(doubt.author, a.user._id);
  });
  await t.test('tags are stored without leading # characters', async () => {
    const extra = await request('/doubts', 'POST', { title: 'Do hash-prefixed tags get cleaned?', body: 'Posting with hash-prefixed tags to confirm the stored tags drop the leading symbol.', subject: 'DBMS', semester: 3, tags: ['#Java', '##daitm', 'java'] }, a.token, 201);
    assert.deepEqual(extra.tags, ['java', 'daitm']);
    await request('/doubts', 'POST', { title: 'Is a hash-only tag rejected?', body: 'A tag that is only hash characters should fail validation instead of storing empty.', subject: 'DBMS', semester: 3, tags: ['##'] }, a.token, 400);
    await request(`/doubts/${extra._id}`, 'DELETE', null, a.token);
  });
  await t.test('indexed word search, filters, pagination and punctuation work', async () => {
    const list = await request('/doubts?search=normalize&subject=DBMS&semester=3&tag=sql'); assert.equal(list.total, 1); assert.equal(list.items[0]._id, doubt._id);
    assert.equal((await request('/doubts?search=%5B')).total, 0);
    await request('/doubts?page=-1', 'GET', null, null, 400);
    await request('/doubts?search[x]=y', 'GET', null, null, 200);
    assert.equal((await request('/doubts?search=normalizing')).total, 1);
    assert.equal((await request('/doubts?search=normali')).total, 0);
    assert.equal((await request('/doubts?search=sql')).total, 1);
    assert.equal((await request('/doubts?search=normalize&subject=Java')).total, 0);
  });
  await t.test('invalid IDs and missing records return safe errors', async () => { await request('/doubts/nope', 'GET', null, null, 400); await request('/doubts/000000000000000000000000', 'GET', null, null, 404); });
  await t.test('non-owner edits/deletes and self-votes blocked', async () => { await request(`/doubts/${doubt._id}`, 'PUT', {}, b.token, 403); await request(`/doubts/${doubt._id}`, 'DELETE', null, b.token, 403); await request(`/doubts/${doubt._id}/vote`, 'POST', { value: 1 }, a.token, 403); });
  await t.test('doubt vote add, remove and switch', async () => {
    const route = `/doubts/${doubt._id}/vote`;
    assert.equal((await request(route, 'POST', { value: 1 }, b.token)).votes, 1);
    assert.equal((await request(route, 'POST', { value: 1 }, b.token)).votes, 0);
    assert.equal((await request(route, 'POST', { value: 1 }, b.token)).votes, 1);
    assert.equal((await request(route, 'POST', { value: -1 }, b.token)).votes, -1);
  });
  await t.test('second student posts answer and comment', async () => {
    answer = await request(`/doubts/${doubt._id}/answers`, 'POST', { body: 'Normalization splits related data into tables to reduce redundancy and prevent update anomalies.', author: a.user._id }, b.token, 201);
    assert.equal(answer.author, b.user._id);
    await request(`/answers/${answer._id}/comments`, 'POST', { body: 'Can you explain the second normal form as well?' }, a.token, 201);
    const guestItem = (await request('/doubts')).items.find(item => item._id === doubt._id);
    const voterItem = (await request('/doubts', 'GET', null, b.token)).items.find(item => item._id === doubt._id);
    assert.equal(voterItem.answerCount, 1);
    assert.equal(voterItem.votes, -1);
    assert.equal(voterItem.myVote, -1);
    assert.equal(guestItem.myVote, 0);
    assert.equal(guestItem.author._id, a.user._id);
    assert.equal(guestItem.author.email, undefined);
    assert.equal(guestItem.author.passwordHash, undefined);
  });
  await t.test('answer permissions and self-votes enforced', async () => { await request(`/answers/${answer._id}`, 'PUT', { body: 'An unauthorized change' }, a.token, 403); await request(`/answers/${answer._id}/vote`, 'POST', { value: 1 }, b.token, 403); await request(`/answers/${answer._id}/accept`, 'PATCH', {}, b.token, 403); });
  await t.test('answer voting updates reputation without duplicate awards', async () => {
    await request(`/answers/${answer._id}/vote`, 'POST', { value: 1 }, a.token);
    assert.equal((await request(`/users/${b.user._id}`)).user.reputation, 10);
    await request(`/answers/${answer._id}/vote`, 'POST', { value: -1 }, a.token);
    assert.equal((await request(`/users/${b.user._id}`)).user.reputation, -2);
    await request(`/answers/${answer._id}/vote`, 'POST', { value: 1 }, a.token);
  });
  await t.test('only one answer can be accepted; accepting toggles', async () => {
    await request(`/answers/${answer._id}/accept`, 'PATCH', {}, a.token);
    assert.equal((await request(`/users/${b.user._id}`)).user.reputation, 25);
    let detail = await request(`/doubts/${doubt._id}`); assert.equal(detail.status, 'solved'); assert.equal(detail.answers[0].isAccepted, true); assert.equal(detail.answers[0].comments.length, 1);
    const other = await request(`/doubts/${doubt._id}/answers`, 'POST', { body: 'Another explanation using functional dependencies and normal forms.' }, c.token, 201);
    await request(`/answers/${other._id}/accept`, 'PATCH', {}, a.token);
    detail = await request(`/doubts/${doubt._id}`); assert.equal(detail.answers.filter(item => item.isAccepted).length, 1); assert.equal(detail.answers[0]._id, other._id);
    await request(`/answers/${other._id}/accept`, 'PATCH', {}, a.token); assert.equal((await request(`/doubts/${doubt._id}`)).status, 'open');
    await request(`/answers/${other._id}`, 'DELETE', null, c.token);
  });
  await t.test('stored scores agree with reconciliation and legacy backfill preserves history', async () => {
    let user = await User.findById(b.user._id).lean();
    assert.equal(user.reputation, 10);
    assert.equal(user.reputation, await calculateReputation(user._id));
    await User.collection.updateOne({ _id: user._id }, { $unset: { reputation: '' } });
    const [one, two] = await Promise.all([ensureReputation(user._id), ensureReputation(user._id)]);
    assert.equal(one, 10); assert.equal(two, 10);
    await request(`/answers/${answer._id}/vote`, 'POST', { value: 1 }, a.token);
    assert.equal((await request(`/users/${b.user._id}`)).user.reputation, 0);
    await request(`/answers/${answer._id}/vote`, 'POST', { value: -1 }, a.token);
    assert.equal((await request(`/users/${b.user._id}`)).user.reputation, -2);
    await request(`/answers/${answer._id}/vote`, 'POST', { value: 1 }, a.token);
    user = await User.findById(b.user._id).lean();
    assert.equal(user.reputation, await calculateReputation(user._id));
  });
  await t.test('profile changes do not allow privilege escalation', async () => {
    const updated = await request('/users/me', 'PUT', { name: 'Renamed Student', semester: 4, role: 'admin' }, a.token); assert.equal(updated.role, 'student'); assert.equal(updated.semester, 4);
    const publicProfile = await request(`/users/${a.user._id}`); assert.equal(publicProfile.user.email, undefined); assert.equal(publicProfile.user.passwordHash, undefined);
  });
  await t.test('non-admin cannot access moderation', async () => { await request('/admin/users', 'GET', null, a.token, 403); });
  await t.test('admin can promote teacher; badge source updates', async () => { await request(`/admin/users/${b.user._id}/role`, 'PATCH', { role: 'teacher' }, c.token); const detail = await request(`/doubts/${doubt._id}`); assert.equal(detail.answers[0].author.role, 'teacher'); });
  await t.test('banned user cannot use an existing token or log in', async () => {
    await request(`/admin/users/${b.user._id}/ban`, 'PATCH', { isBanned: true }, c.token);
    await request('/auth/me', 'GET', null, b.token, 401);
    await request('/auth/login', 'POST', { email: 'student-b@example.test', password: fields.password }, null, 403);
    await request(`/admin/users/${b.user._id}/ban`, 'PATCH', { isBanned: false }, c.token);
    await request(`/admin/users/${c.user._id}/ban`, 'PATCH', { isBanned: true }, c.token, 403);
  });
  await t.test('reports deduplicate and admin can dismiss', async () => {
    const payload = { targetType: 'answer', targetId: answer._id, reason: 'Testing the moderation report workflow.' };
    const report = await request('/reports', 'POST', payload, a.token, 201);
    await request('/reports', 'POST', payload, a.token, 409);
    const reports = await request('/admin/reports', 'GET', null, c.token); assert.equal(reports.items[0]._id, report._id);
    await request(`/admin/reports/${report._id}`, 'PATCH', { status: 'dismissed' }, c.token);
    assert.equal((await request('/admin/reports', 'GET', null, c.token)).total, 0);
  });
  await t.test('accepting then deleting an answer reopens the doubt', async () => { await request(`/answers/${answer._id}/accept`, 'PATCH', {}, a.token); await request(`/answers/${answer._id}`, 'DELETE', null, b.token); const detail = await request(`/doubts/${doubt._id}`); assert.equal(detail.status, 'open'); assert.equal(detail.answerCount, 0); });
  await t.test('answer deletion reverses vote and acceptance credits exactly once', async () => {
    const user = await User.findById(b.user._id).lean();
    assert.equal(user.reputation, 0);
    assert.equal(await calculateReputation(user._id), 0);
    await request(`/answers/${answer._id}`, 'DELETE', null, b.token, 404);
    assert.equal((await User.findById(b.user._id).lean()).reputation, 0);
  });
  await t.test('admin removes reported content', async () => { const report = await request('/reports', 'POST', { targetType: 'doubt', targetId: doubt._id, reason: 'Testing doubt removal through moderation.' }, b.token, 201); await request(`/admin/reports/${report._id}`, 'PATCH', { status: 'removed' }, c.token); await request(`/doubts/${doubt._id}`, 'GET', null, null, 404); });
  await t.test('unowned image IDs rejected and upload delete cannot target other users', async () => {
    await request('/doubts', 'POST', { title: 'Question with a forged screenshot', body: 'This question tries to attach an image that does not belong to the user.', subject: 'DBMS', semester: 2, imageIds: ['foreign-image'] }, a.token, 400);
    await request('/uploads', 'DELETE', { publicId: 'foreign-image' }, a.token, 404);
  });
  await t.test('Vercel handler serves API requests using the shared database connection', async () => {
    process.env.MONGO_URI = `mongodb://127.0.0.1:27017/${dbName}`;
    const { default: handler } = await import('../../api/index.js');
    const functionServer = createServer(handler).listen(0, '127.0.0.1');
    await new Promise(resolve => functionServer.once('listening', resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${functionServer.address().port}/api/v1/health`);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).data.database, 'connected');
      const profile = await fetch(`http://127.0.0.1:${functionServer.address().port}/api/v1/users/${a.user._id}`);
      assert.equal((await profile.json()).data.user.name, 'Renamed Student');
      const fallback = await fetch(`http://127.0.0.1:${functionServer.address().port}/api/unknown`);
      assert.equal(fallback.status, 404);
    } finally { await new Promise(resolve => functionServer.close(resolve)); }
  });
  await t.test('sign out everywhere revokes old and legacy tokens but allows a new login', async () => {
    const legacy = jwt.sign({}, process.env.JWT_SECRET, { subject: a.user._id, expiresIn: '1h' });
    await request('/auth/me', 'GET', null, legacy);
    await request('/auth/logout-all', 'POST', {}, a.token);
    await request('/auth/me', 'GET', null, a.token, 401);
    await request('/auth/me', 'GET', null, legacy, 401);
    await request('/auth/logout-all', 'POST', {}, null, 401);
    const signedIn = await request('/auth/login', 'POST', { email: fields.email, password: fields.password });
    await request('/auth/me', 'GET', null, signedIn.token);
    assert.equal(signedIn.user.tokenVersion, undefined);
  });
});
