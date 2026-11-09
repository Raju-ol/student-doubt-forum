import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User, Doubt, Subject } from '../src/models.js';
import { migrateSubjects, subjectKey } from '../src/subjects.js';

test('subject catalogue resolves aliases, prevents collisions and migrates legacy names safely', async t => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const dbName = `forum_test_${Date.now()}_${randomBytes(3).toString('hex')}`;
  await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017', { dbName });
  const server = createApp().listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); if (!/^forum_test_\d+_[a-f0-9]{6}$/.test(mongoose.connection.name)) throw new Error('Unsafe database'); await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
  const req = async (route, method = 'GET', body, token, expected = 200) => {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/api/v1${route}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const b = await r.json(); assert.equal(r.status, expected, b.message); return b.data;
  };
  const catalog = await req('/subjects'); assert.ok(catalog.length >= 30); assert.equal(subjectKey('  Database  Systems '), 'database systems');
  await req('/subjects'); assert.equal(await Subject.countDocuments(), catalog.length);
  const user = await req('/auth/signup', 'POST', { name: 'Subject Student', email: 'subject@example.test', password: 'Subject123' }, null, 201);
  await req('/admin/subjects', 'POST', { name: 'New field' }, user.token, 403);
  await User.updateOne({ _id: user.user._id }, { role: 'admin' });
  const created = await req('/admin/subjects', 'POST', { name: 'Astronomy', aliases: ['Space Science'] }, user.token, 201);
  await req('/admin/subjects', 'POST', { name: 'Another name', aliases: ['space science'] }, user.token, 409);
  const question = await req('/doubts', 'POST', { title: 'How do stellar systems form?', body: 'This question should use the canonical astronomy subject.', subject: 'SPACE SCIENCE' }, user.token, 201);
  assert.equal(question.subject, 'Astronomy'); assert.equal(question.subjectId, created._id);
  assert.equal((await req('/doubts?subject=Space%20Science')).total, 1);
  const legacy = await Doubt.create({ title: 'A legacy database question', body: 'Legacy names remain searchable.', subject: 'databases', semester: 2, author: user.user._id });
  assert.equal((await req('/doubts?subject=DBMS')).total, 1);
  const before = await migrateSubjects(); assert.equal(before.matched, 1); assert.equal((await Doubt.findById(legacy._id)).subjectId, undefined);
  await migrateSubjects({ apply: true }); assert.equal((await Doubt.findById(legacy._id)).subject, 'DBMS');
  assert.equal((await migrateSubjects({ apply: true })).matched, 0);
});
