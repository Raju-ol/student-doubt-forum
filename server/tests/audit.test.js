import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { tokenFor } from '../src/auth.js';
import { Answer, AuditLog, Doubt, User } from '../src/models.js';

test('the audit log records who changed what, to whom, and only to admins', async t => {
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
  // The first admin created is the protected primary admin.
  const [root, admin, moderator, riya, sam, author] = [await make('Root', { role: 'admin' }), await make('Admin', { role: 'admin' }), await make('Mod', { role: 'moderator' }), await make('Riya'), await make('Sam'), await make('Author')];
  const token = Object.fromEntries(Object.entries({ admin, moderator, riya, sam, author }).map(([key, user]) => [key, tokenFor(user)]));
  const log = async (query = '') => (await call(`/admin/audit${query}`, { token: token.admin })).items;

  assert.deepEqual(await log(), []);

  // Roles and suspensions.
  await call(`/admin/users/${riya._id}/role`, { token: token.admin, method: 'PATCH', body: { role: 'teacher' } });
  await call(`/admin/users/${riya._id}/role`, { token: token.admin, method: 'PATCH', body: { role: 'teacher' } }); // no change, no entry
  await call(`/admin/users/${sam._id}/ban`, { token: token.admin, method: 'PATCH', body: { isBanned: true } });
  await call(`/admin/users/${sam._id}/ban`, { token: token.admin, method: 'PATCH', body: { isBanned: false } });
  // Reports: dismiss one, remove content for another.
  const spam = await Doubt.create({ title: 'Buy cheap notes from my website now', body: 'Visit my site for a very cheap price list of notes.', subject: 'Java', author: author._id });
  const rude = await Answer.create({ doubt: spam._id, author: author._id, body: 'An answer that breaks the rules somehow.' });
  const r1 = await call('/reports', { token: token.riya, method: 'POST', status: 201, body: { targetType: 'answer', targetId: String(rude._id), reason: 'This is rude.' } });
  const r2 = await call('/reports', { token: token.riya, method: 'POST', status: 201, body: { targetType: 'doubt', targetId: String(spam._id), reason: 'This is spam.' } });
  await call(`/admin/reports/${r1._id}`, { token: token.moderator, method: 'PATCH', body: { status: 'dismissed' } });
  await call(`/admin/reports/${r2._id}`, { token: token.moderator, method: 'PATCH', body: { status: 'removed' } });
  // Admin deletes other people's posts; a person deleting their own is not an admin action.
  const doomed = await Doubt.create({ title: 'A question the admin will delete soon', body: 'A long enough description of the question body.', subject: 'Java', author: author._id });
  const doomedAnswer = await Answer.create({ doubt: doomed._id, author: sam._id, body: 'An answer the admin will delete as well.' });
  await call(`/answers/${doomedAnswer._id}`, { token: token.admin, method: 'DELETE' });
  await call(`/doubts/${doomed._id}`, { token: token.admin, method: 'DELETE' });
  const own = await Doubt.create({ title: 'A question the author deletes by themself', body: 'A long enough description of the question body.', subject: 'Java', author: author._id });
  await call(`/doubts/${own._id}`, { token: token.author, method: 'DELETE' });
  // Library resources: staff removal is logged, an uploader removing their own is not.
  const share = title => call('/resources', { token: token.sam, method: 'POST', status: 201, body: { title, category: 'notes', link: 'https://example.test/notes' } });
  const mine = await share('My own notes on threads'); const flagged = await share('Suspicious notes pack');
  await call(`/resources/${mine._id}`, { token: token.sam, method: 'DELETE' });
  await call(`/resources/${flagged._id}`, { token: token.moderator, method: 'DELETE' });
  // Catalogue and teacher requests.
  await call('/admin/subjects', { token: token.admin, method: 'POST', status: 201, body: { name: 'Robotics' } });
  await call('/teacher-requests', { token: token.sam, method: 'POST', status: 201, body: { subjects: ['Java'], note: 'Teaching assistant, CS dept' } });
  const pending = await call('/admin/teacher-requests', { token: token.admin });
  await call(`/admin/teacher-requests/${pending.items[0]._id}`, { token: token.admin, method: 'PATCH', body: { status: 'declined', reason: 'Please add your institute.' } });

  const entries = await log();
  const lines = entries.map(entry => `${entry.action} | ${entry.actor.name} | ${entry.summary}`);
  assert.deepEqual(lines.reverse(), [
    'user.role | Admin | Changed Riya from student to teacher',
    'user.suspend | Admin | Suspended Sam (student)',
    'user.restore | Admin | Restored Sam (student)',
    'report.dismiss | Mod | Dismissed a report on answer on “Buy cheap notes from my website now”',
    'report.remove | Mod | Removed doubt “Buy cheap notes from my website now”',
    'answer.delete | Admin | Deleted an answer on “A question the admin will delete soon”',
    'doubt.delete | Admin | Deleted question “A question the admin will delete soon”',
    'resource.remove | Mod | Removed the Library resource “Suspicious notes pack”',
    'catalog.subject | Admin | Added the subject Robotics',
    'teacher.decline | Admin | Declined the teacher request of Sam: Please add your institute.'
  ]);
  assert.equal(await AuditLog.countDocuments(), 10);

  // Newest first, paginated, and filterable by action family.
  const newest = await log();
  assert.equal(newest[0].action, 'teacher.decline');
  assert.deepEqual((await log('?action=user')).map(entry => entry.action), ['user.restore', 'user.suspend', 'user.role']);
  assert.deepEqual((await log('?action=report.remove')).map(entry => entry.action), ['report.remove']);
  const page = await call('/admin/audit?page=1', { token: token.admin });
  assert.equal(page.total, 10); assert.equal(page.pages, 1);

  // Only administrators may read it.
  await call('/admin/audit', { token: token.moderator, status: 403 });
  await call('/admin/audit', { token: token.riya, status: 403 });
  await call('/admin/audit', { status: 401 });
});
