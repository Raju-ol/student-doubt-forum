import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { createApp } from '../src/app.js';
import { User, Doubt, Upload } from '../src/models.js';

test('account export is private and deletion anonymizes threads and revokes access', async t => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const dbName = `forum_test_${Date.now()}_${randomBytes(3).toString('hex')}`;
  await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017', { dbName });
  const destroyed = [], originalDestroy = cloudinary.uploader.destroy;
  cloudinary.uploader.destroy = async id => { destroyed.push(id); return { result: 'ok' }; };
  const server = createApp().listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { cloudinary.uploader.destroy = originalDestroy; await new Promise(resolve => server.close(resolve)); if (!/^forum_test_\d+_[a-f0-9]{6}$/.test(mongoose.connection.name)) throw new Error('Unsafe test database'); await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
  const req = async (route, method = 'GET', body, token, expected = 200) => {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/api/v1${route}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    assert.equal(r.status, expected, route); return r;
  };
  const fields = { name: 'Private Name', email: 'private@example.test', password: 'AccountTest123', semester: 2 };
  const owner = (await (await req('/auth/signup', 'POST', fields, null, 201)).json()).data;
  const other = (await (await req('/auth/signup', 'POST', { ...fields, email: 'other@example.test', name: 'Other Student' }, null, 201)).json()).data;
  const question = await Doubt.create({ title: 'A retained discussion question', body: 'Keep this discussion after deleting the author account.', subject: 'DBMS', semester: 2, author: owner.user._id, images: [{ url: 'https://example.test/image', publicId: 'owned-image' }] });
  await Upload.create({ owner: owner.user._id, doubt: question._id, publicId: 'owned-image', url: 'https://example.test/image' });
  await Upload.create({ owner: other.user._id, publicId: 'other-image', url: 'https://example.test/other' });
  await req('/users/me/export', 'GET', null, null, 401);
  const exportResponse = await req('/users/me/export', 'GET', null, owner.token);
  assert.match(exportResponse.headers.get('content-disposition'), /attachment/);
  const exported = await exportResponse.text(); const records = exported.trim().split('\n').map(JSON.parse);
  assert.equal(records[0].data.email, fields.email); assert.equal(records.filter(r => r.type === 'question').length, 1);
  assert.doesNotMatch(exported, /passwordHash|tokenVersion|resetHash|verificationHash|other@example/);
  await req('/users/me', 'DELETE', { password: 'wrong-password', confirmation: 'DELETE' }, owner.token, 401);
  await req('/users/me', 'DELETE', { password: fields.password, confirmation: 'NO' }, owner.token, 400);
  assert.equal(destroyed.length, 0);
  await User.updateOne({ _id: owner.user._id }, { $unset: { isDeleted: 1 } }); // legacy account
  await req('/users/me', 'DELETE', { password: fields.password, confirmation: 'DELETE' }, owner.token);
  assert.deepEqual(destroyed, ['owned-image']);
  const deleted = await User.findById(owner.user._id).select('+verificationHash +resetHash');
  assert.equal(deleted.name, 'Deleted user'); assert.equal(deleted.isDeleted, true); assert.notEqual(deleted.email, fields.email);
  assert.equal(deleted.verificationHash, undefined); assert.equal(deleted.resetHash, undefined);
  assert.equal((await Doubt.findById(question._id)).images.length, 0);
  assert.ok(await Upload.exists({ publicId: 'other-image' }));
  await req('/auth/me', 'GET', null, owner.token, 401);
  await req('/auth/login', 'POST', { email: fields.email, password: fields.password }, null, 401);
  await req(`/users/${owner.user._id}`, 'GET', null, null, 404);
  const thread = (await (await req(`/doubts/${question._id}`)).json()).data;
  assert.equal(thread.author.name, 'Deleted user');
});
