import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { verifyGoogleIdentity } from '../src/google-auth.js';
import { User } from '../src/models.js';
import { fail } from '../src/validation.js';

test('Google login keeps existing profiles separate until explicitly linked', async t => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  delete process.env.GOOGLE_CLIENT_ID;
  await assert.rejects(verifyGoogleIdentity('unconfigured'), { status: 503 });
  const dbName = `forum_test_${Date.now()}_${randomBytes(3).toString('hex')}`;
  await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017', { dbName });
  const identities = {
    owner: { subject: 'subject-1', email: 'owner@gmail.com', name: 'Forum Owner', authoritativeEmail: true },
    newcomer: { subject: 'subject-2', email: 'newcomer@gmail.com', name: 'New Member', authoritativeEmail: true },
    sameEmail: { subject: 'subject-3', email: 'owner@gmail.com', name: 'Other Identity', authoritativeEmail: true },
  };
  const server = createApp({ googleIdentity: async credential => {
    if (!Object.hasOwn(identities, credential)) fail(401, 'Invalid Google credential.');
    return identities[credential];
  } }).listen(0, '127.0.0.1');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    assert.equal(mongoose.connection.name, dbName);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await User.init();
  await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));

  async function request(path, { method = 'POST', body, token, status = 200 } = {}) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json();
    assert.equal(response.status, status, `${path}: ${payload.message}`);
    return payload.data;
  }

  const fields = { email: 'owner@gmail.com', name: 'Existing Profile', password: 'ForumTest12345' };
  const owner = await request('/auth/signup', { body: fields, status: 201 });
  await request('/auth/google', { body: { credential: 'bad' }, status: 401 });
  await request('/auth/google', { body: { credential: 'owner' }, status: 409 });
  await request('/auth/google/link', { body: { credential: 'owner', password: fields.password }, status: 401 });
  await request('/auth/google/link', { body: { credential: 'newcomer', password: fields.password }, token: owner.token, status: 400 });
  await request('/auth/google/link', { body: { credential: 'owner', password: 'WrongPassword' }, token: owner.token, status: 401 });
  const linked = await request('/auth/google/link', { body: { credential: 'owner', password: fields.password }, token: owner.token });
  assert.equal(linked.googleLinked, true);
  assert.equal(linked.googleSubject, undefined);
  assert.equal(linked._id, owner.user._id);
  assert.equal(linked.name, fields.name);
  const login = await request('/auth/google', { body: { credential: 'owner' } });
  assert.equal(login.user._id, owner.user._id);
  await request('/auth/google', { body: { credential: 'sameEmail' }, status: 409 });

  const newAccount = await request('/auth/google', { body: { credential: 'newcomer', role: 'admin' }, status: 201 });
  assert.equal(newAccount.user.role, 'student');
  assert.equal(newAccount.user.emailVerified, true);
  const restored = await request('/auth/me', { method: 'GET', token: newAccount.token });
  assert.equal(restored.googleLinked, true);
  await request('/auth/login', { body: { email: identities.newcomer.email, password: fields.password }, status: 401 });
  await request('/users/me', { method: 'DELETE', body: { credential: 'owner', confirmation: 'DELETE' }, token: newAccount.token, status: 403 });
  await request('/users/me', { method: 'DELETE', body: { credential: 'newcomer', confirmation: 'DELETE' }, token: newAccount.token });
  await request('/auth/me', { method: 'GET', token: newAccount.token, status: 401 });
  assert.equal((await User.findById(newAccount.user._id).select('+googleSubject')).googleSubject, undefined);

  await User.updateOne({ _id: owner.user._id }, { $set: { isBanned: true } });
  await request('/auth/google', { body: { credential: 'owner' }, status: 403 });
});
