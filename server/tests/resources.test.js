import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { tokenFor } from '../src/auth.js';
import { Doubt, Resource, User } from '../src/models.js';
import { externalLink } from '../src/resources.js';

test('external links must be plain https', () => {
  assert.equal(externalLink('https://drive.google.com/file/d/1/view'), 'https://drive.google.com/file/d/1/view');
  for (const bad of ['http://example.com/a', 'javascript:alert(1)', 'https://user:pw@example.com/', 'not a link', '']) {
    assert.throws(() => externalLink(bad), /https/, bad);
  }
});

test('resource library, trending tags, contributors and view counts', async t => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  delete process.env.CLOUDINARY_API_SECRET;
  const dbName = `forum_test_${Date.now()}_${randomBytes(3).toString('hex')}`;
  await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017', { dbName });
  const server = createApp().listen(0, '127.0.0.1');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    assert.equal(mongoose.connection.name, dbName);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await Promise.all([User.init(), Doubt.init(), Resource.init()]);
  await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
  const base = () => `http://127.0.0.1:${server.address().port}/api/v1`;
  const request = async (path, { token, method = 'GET', body, status = 200 } = {}) => {
    const response = await fetch(base() + path, {
      method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = await response.json();
    assert.equal(response.status, status, payload.message);
    return payload.data;
  };

  const student = await User.create({ name: 'Asha Rao', email: 'asha@example.test', reputation: 40, emailVerifiedAt: new Date() });
  const other = await User.create({ name: 'Ravi K', email: 'ravi@example.test', reputation: 0, emailVerifiedAt: new Date() });
  const admin = await User.create({ name: 'Admin', email: 'admin@example.test', role: 'admin', reputation: 90, emailVerifiedAt: new Date() });
  const hidden = await User.create({ name: 'Banned', email: 'banned@example.test', reputation: 500, isBanned: true });
  const token = tokenFor(student);

  // Sharing needs an account, a valid category and an https link (no storage is configured here).
  await request('/resources', { method: 'POST', body: { title: 'DBMS notes', category: 'notes', link: 'https://example.com/a' }, status: 401 });
  await request('/resources', { token, method: 'POST', body: { title: 'DBMS notes', category: 'movies', link: 'https://example.com/a' }, status: 400 });
  await request('/resources', { token, method: 'POST', body: { title: 'DBMS notes', category: 'notes', link: 'http://example.com/a' }, status: 400 });
  const shared = await request('/resources', { token, method: 'POST', body: { title: 'DBMS notes (complete)', category: 'notes', link: 'https://example.com/dbms.pdf' }, status: 201 });
  assert.equal(shared.kind, 'link');
  assert.equal(shared.uploader.name, 'Asha Rao');
  assert.equal('url' in shared, false);
  await request('/resources', { token, method: 'POST', body: { title: 'OS cheat sheet', category: 'cheatsheets', link: 'https://example.com/os' }, status: 201 });

  const list = await request('/resources?category=notes');
  assert.equal(list.total, 1);
  assert.equal(list.items[0].title, 'DBMS notes (complete)');
  assert.equal((await request('/resources')).total, 2);
  assert.equal((await request('/resources?search=cheat')).total, 1);

  // Downloads redirect to the stored link and are counted.
  const response = await fetch(`${base()}/resources/${shared._id}/download`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://example.com/dbms.pdf');
  assert.equal((await request('/resources/popular'))[0].title, 'DBMS notes (complete)');
  assert.equal((await Resource.findById(shared._id)).downloads, 1);
  await request('/resources/not-an-id/download', { status: 400 });

  // Only the sharer or a moderator can remove one.
  await request(`/resources/${shared._id}`, { token: tokenFor(other), method: 'DELETE', status: 403 });
  await request(`/resources/${shared._id}`, { token: tokenFor(admin), method: 'DELETE' });
  assert.equal((await request('/resources')).total, 1);

  // Trending tags skip the sample library; views count each detail fetch.
  const question = await Doubt.create({ title: 'What is normalization in DBMS?', body: 'Explain 1NF to 3NF.', subject: 'DBMS', author: student._id, tags: ['dbms', 'sql'] });
  await Doubt.create({ title: 'Another SQL question here', body: 'Second question body text.', subject: 'DBMS', author: student._id, tags: ['sql'] });
  await Doubt.create({ title: 'A sample library question', body: 'Sample library body text.', subject: 'DBMS', author: student._id, tags: ['sql', 'study-library'] });
  const trending = await request('/tags/trending');
  assert.deepEqual(trending, [{ tag: 'sql', count: 2 }, { tag: 'dbms', count: 1 }]);
  assert.equal((await request(`/doubts/${question._id}`)).views, 0);
  assert.equal((await request(`/doubts/${question._id}/view`, { method: 'POST' })).views, 1);
  assert.equal((await request(`/doubts/${question._id}/view`, { method: 'POST' })).views, 2);
  assert.equal((await request('/doubts?scope=all')).items.find(item => item._id === String(question._id)).views, 2);

  const contributors = await request('/contributors');
  assert.deepEqual(contributors.map(user => user.name), ['Admin', 'Asha Rao']);
  assert.ok(!contributors.some(user => user._id === String(hidden._id)));
  assert.equal(Object.keys(contributors[0]).includes('email'), false);
});
