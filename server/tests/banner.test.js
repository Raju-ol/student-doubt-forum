import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { tokenFor } from '../src/auth.js';
import { AuditLog, User } from '../src/models.js';

test('the announcement banner is public to read, admin-only to change, plain text and audited', async t => {
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
  const [admin, moderator, student] = await Promise.all([make('Admin', { role: 'admin' }), make('Mod', { role: 'moderator' }), make('Student')]);
  const token = { admin: tokenFor(admin), moderator: tokenFor(moderator), student: tokenFor(student) };

  assert.deepEqual(await call('/banner'), { text: '', updatedAt: null });
  await call('/admin/banner', { method: 'PUT', body: { text: 'x' }, status: 401 });
  await call('/admin/banner', { token: token.student, method: 'PUT', body: { text: 'x' }, status: 403 });
  await call('/admin/banner', { token: token.moderator, method: 'PUT', body: { text: 'x' }, status: 403 });
  await call('/admin/banner', { token: token.admin, method: 'PUT', body: {}, status: 400 });
  await call('/admin/banner', { token: token.admin, method: 'PUT', body: { text: 'x'.repeat(141) }, status: 400 });

  // Whitespace is collapsed; the text is stored as plain text and returned to guests.
  const set = await call('/admin/banner', { token: token.admin, method: 'PUT', body: { text: '  Exam week:   extra teachers online Thursday <b>5pm</b>  ' } });
  assert.equal(set.text, 'Exam week: extra teachers online Thursday <b>5pm</b>');
  assert.ok(set.updatedAt);
  assert.deepEqual(await call('/banner'), set);
  // Changing it again moves the timestamp, which is how a dismissed banner comes back for new text.
  await new Promise(resolve => setTimeout(resolve, 15));
  const changed = await call('/admin/banner', { token: token.admin, method: 'PUT', body: { text: 'Results are out' } });
  assert.ok(new Date(changed.updatedAt) > new Date(set.updatedAt));
  // An empty text removes it.
  assert.deepEqual(await call('/admin/banner', { token: token.admin, method: 'PUT', body: { text: '   ' } }), { text: '', updatedAt: null });
  assert.deepEqual(await call('/banner'), { text: '', updatedAt: null });

  const actions = (await AuditLog.find().sort({ createdAt: 1 })).map(entry => entry.action);
  assert.deepEqual(actions, ['banner.set', 'banner.set', 'banner.clear']);
});
