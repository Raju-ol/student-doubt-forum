import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { tokenFor } from '../src/auth.js';
import { Answer, Doubt, Report, Resource, TeacherRequest, User } from '../src/models.js';

test('the admin overview counts real activity this week against last, and what is waiting', async t => {
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
  const get = async (token, status = 200) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/admin/overview`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const payload = await response.json();
    assert.equal(response.status, status, payload.message);
    return payload.data;
  };
  const daysAgo = n => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  const make = (name, extra = {}) => User.create({ name, email: `${name.toLowerCase()}@example.test`, reputation: 0, emailVerifiedAt: new Date(), ...extra });
  const admin = await make('Admin', { role: 'admin', createdAt: daysAgo(60) });
  const moderator = await make('Mod', { role: 'moderator', createdAt: daysAgo(60) });
  const recent = await make('Recent', { createdAt: daysAgo(2) });
  const lastWeekUser = await make('Earlier', { createdAt: daysAgo(10) });
  await make('Old', { createdAt: daysAgo(40) });
  await User.create({ name: 'Study Library (Demo)', email: 'study-library@doubt-forum.invalid', reputation: 0, isBanned: true, createdAt: daysAgo(1) });
  await make('Gone', { isDeleted: true, createdAt: daysAgo(1) });

  const ask = (title, age, extra = {}) => Doubt.create({ title, body: 'A long enough description of the question body.', subject: 'Java', author: recent._id, createdAt: daysAgo(age), ...extra });
  const answered = await ask('This week and answered by someone', 1);
  const waiting = await ask('This week and still waiting for answers', 3);
  const earlier = await ask('Last week and still waiting for answers', 9);
  await ask('Older than two weeks and unanswered', 30);
  const sample = await ask('A sample question from the study library', 1, { tags: ['study-library'] });
  await Answer.create({ doubt: answered._id, author: lastWeekUser._id, body: 'An answer given this week by a student.', createdAt: daysAgo(1) });
  await Answer.create({ doubt: earlier._id, author: lastWeekUser._id, body: 'An answer from last week that is now stale.', createdAt: daysAgo(8) });
  await Answer.create({ doubt: sample._id, author: lastWeekUser._id, body: 'A sample explanation that must not count.', createdAt: daysAgo(1) });
  // earlier now has an answer too, so unanswered = waiting + the 30-day-old one.
  await Report.create({ targetType: 'doubt', target: waiting._id, reporter: recent._id, reason: 'Looks wrong to me', status: 'pending' });
  await Report.create({ targetType: 'doubt', target: waiting._id, reporter: lastWeekUser._id, reason: 'Already handled', status: 'dismissed' });
  await TeacherRequest.create({ user: recent._id, subjects: ['Java'], note: 'Physics faculty, XYZ Academy' });
  await Resource.create({ title: 'Thread notes', category: 'notes', kind: 'link', url: 'https://example.test/a', uploader: recent._id, downloads: 4 });
  await Resource.create({ title: 'Exam paper', category: 'papers', kind: 'link', url: 'https://example.test/b', uploader: recent._id, downloads: 7 });

  const data = await get(tokenFor(admin));
  assert.deepEqual(data.weeks.questions, { thisWeek: 2, lastWeek: 1 });
  assert.deepEqual(data.weeks.answers, { thisWeek: 1, lastWeek: 1 });
  // Sample accounts and deleted accounts are not signups.
  assert.deepEqual(data.weeks.signups, { thisWeek: 1, lastWeek: 1 });
  assert.deepEqual(data.waiting, { unanswered: 2, reports: 1, teacherRequests: 1 });
  assert.deepEqual(data.totals, { users: 5, questions: 4, answers: 2, resources: 2, downloads: 11 });

  await get(tokenFor(moderator), 403);
  await get(tokenFor(recent), 403);
  await get(null, 401);
});
