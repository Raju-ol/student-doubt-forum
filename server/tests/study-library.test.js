import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { tokenFor } from '../src/auth.js';
import { Answer, Doubt, User } from '../src/models.js';

test('only an administrator can publish the study library, with no duplicate or overwritten posts', async t => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const dbName = `forum_test_${Date.now()}_${randomBytes(3).toString('hex')}`;
  await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017', { dbName });
  const server = createApp().listen(0, '127.0.0.1');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    assert.equal(mongoose.connection.name, dbName);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await Promise.all([User.init(), Doubt.init(), Answer.init()]);
  await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));

  const admin = await User.create({ name: 'Test Admin', email: 'admin@example.test', role: 'admin' });
  const student = await User.create({ name: 'Test Student', email: 'student@example.test' });
  const original = await Doubt.create({
    title: 'Why does binary search need sorted input?',
    body: 'This student question must remain intact.',
    subject: 'Data Structures',
    author: student._id,
  });

  async function request(path, { token, method = 'GET', body, status = 200 } = {}) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json();
    assert.equal(response.status, status, payload.message);
    return payload.data;
  }

  const adminToken = tokenFor(admin);
  const endpoint = '/admin/study-library';
  const body = { confirm: 'study-library-v1' };
  await request(endpoint, { status: 401 });
  await request(endpoint, { token: tokenFor(student), method: 'POST', body, status: 403 });
  await request(endpoint, { token: adminToken, method: 'POST', body: {}, status: 400 });
  const preview = await request(endpoint, { token: adminToken });
  assert.equal(preview.published, false);
  assert.equal(preview.questionCount, 200);
  assert.equal(preview.subjects.length, 10);
  assert.equal(await Doubt.countDocuments(), 1);

  const result = await request(endpoint, { token: adminToken, method: 'POST', body });
  assert.deepEqual(result, { alreadyImported: false, questionCount: 200, answerCount: 200 });
  assert.equal(await Doubt.countDocuments({ tags: 'study-library', institution: null }), 200);
  assert.equal(await Answer.countDocuments(), 200);
  assert.equal((await Doubt.findById(original._id)).body, original.body);
  const feed = await request('/doubts?scope=all&tag=study-library&limit=1');
  assert.equal(feed.total, 200);
  const sample = await request(`/doubts/${feed.items[0]._id}`);
  assert.match(sample.body, /sample question/i);
  assert.equal(sample.answers.length, 1);
  assert.match(sample.answers[0].body, /AI-generated/);
  assert.match(sample.answers[0].author.name, /Demo/);

  await request(`/doubts/${sample._id}`, { token: adminToken, method: 'DELETE' });
  const retry = await request(endpoint, { token: adminToken, method: 'POST', body });
  assert.equal(retry.alreadyImported, true);
  assert.equal(await Doubt.countDocuments(), 200);
  assert.equal(await Answer.countDocuments(), 199);
});
