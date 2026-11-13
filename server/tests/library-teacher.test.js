import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { tokenFor } from '../src/auth.js';
import { User } from '../src/models.js';

test('teacher uploads are labelled and listed on the Teacher recommended shelf', async t => {
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
  const [meera, ravi, student] = await Promise.all([make('Meera', { role: 'teacher' }), make('Ravi', { role: 'teacher' }), make('Student')]);
  const token = { meera: tokenFor(meera), ravi: tokenFor(ravi), student: tokenFor(student) };
  const share = (who, title, category = 'notes') => call('/resources', { token: token[who], method: 'POST', status: 201, body: { title, category, link: 'https://example.test/file' } });

  const own = await share('student', 'Student notes on threads');
  const notes = await share('meera', 'Teacher notes on normalisation');
  const paper = await share('ravi', 'Teacher previous year paper', 'papers');
  assert.equal(own.fromTeacher, false);
  assert.equal(notes.fromTeacher, true);

  // Everything is still listed together, with the label on the teacher uploads.
  const all = await call('/resources');
  assert.equal(all.total, 3);
  assert.deepEqual(Object.fromEntries(all.items.map(item => [item.title, item.fromTeacher])), { 'Student notes on threads': false, 'Teacher notes on normalisation': true, 'Teacher previous year paper': true });

  // The shelf lists only teachers' uploads, newest first, and combines with a category.
  const shelf = await call('/resources?shelf=teacher');
  assert.deepEqual(shelf.items.map(item => item.title), ['Teacher previous year paper', 'Teacher notes on normalisation']);
  assert.equal(shelf.total, 2);
  assert.deepEqual((await call('/resources?shelf=teacher&category=papers')).items.map(item => item._id), [paper._id]);
  assert.deepEqual((await call('/resources?shelf=teacher&limit=1&page=2')).items.map(item => item._id), [notes._id]);
  await call('/resources?shelf=popular', { status: 400 });
  await call('/resources?shelf=', { status: 400 });

  // The label follows the uploader's role today, and suspended teachers leave the shelf.
  assert.equal((await call('/resources/popular')).find(item => item._id === notes._id).fromTeacher, true);
  await User.updateOne({ _id: ravi._id }, { role: 'student' });
  assert.deepEqual((await call('/resources?shelf=teacher')).items.map(item => item._id), [notes._id]);
  await User.updateOne({ _id: meera._id }, { isBanned: true });
  assert.deepEqual((await call('/resources?shelf=teacher')).items, []);
});
