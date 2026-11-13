import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { tokenFor } from '../src/auth.js';
import { Answer, Doubt, User, Vote } from '../src/models.js';

test('profile growth: counts and milestones come from real activity and respect anonymity', async t => {
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
  const profile = async (id, token) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/users/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const payload = await response.json();
    assert.equal(response.status, 200, payload.message);
    return payload.data.growth;
  };
  const make = (name, extra = {}) => User.create({ name, email: `${name.toLowerCase()}@example.test`, reputation: 0, emailVerifiedAt: new Date(), ...extra });
  const [newcomer, star, fan1, fan2, teacher] = await Promise.all([make('Newcomer'), make('Star'), make('Fan1'), make('Fan2'), make('Teach', { role: 'teacher' })]);
  const ask = (author, title, extra = {}) => Doubt.create({ title, body: 'A long enough description of the question body.', subject: 'Java', author: author._id, ...extra });

  // A user with no activity has every counter at zero and no milestone.
  const empty = await profile(newcomer._id);
  assert.deepEqual(empty.stats, { questions: 0, answers: 0, accepted: 0, answerUpvotes: 0, sameDoubt: 0, endorsed: 0 });
  assert.ok(empty.milestones.every(item => !item.earned && item.progress === 0));

  // Star asks two public questions and one anonymous one, and answers 3 questions.
  const publicOne = await ask(star, 'A public question about interfaces in Java');
  const publicTwo = await ask(star, 'Another public question about generics in Java');
  const hidden = await ask(star, 'A shy question about basics in Java', { isAnonymous: true });
  const others = await Promise.all([1, 2, 3].map(n => ask(newcomer, `Somebody else's question number ${n} about Java`)));
  const answers = await Promise.all(others.map((doubt, index) => Answer.create({ doubt: doubt._id, author: star._id, body: `Answer number ${index} with enough characters.` })));
  await Doubt.updateOne({ _id: others[0]._id }, { acceptedAnswer: answers[0]._id });
  await Answer.updateOne({ _id: answers[1]._id }, { endorsedBy: teacher._id });
  await Vote.create({ targetType: 'answer', target: answers[0]._id, user: fan1._id, value: 1 });
  await Vote.create({ targetType: 'answer', target: answers[0]._id, user: fan2._id, value: 1 });
  await Vote.create({ targetType: 'answer', target: answers[1]._id, user: fan1._id, value: -1 });
  await Vote.create({ targetType: 'doubt', target: publicOne._id, user: fan1._id, value: 1 });
  await Vote.create({ targetType: 'doubt', target: hidden._id, user: fan2._id, value: 1 });
  await Vote.create({ targetType: 'doubt', target: publicTwo._id, user: fan2._id, value: -1 }); // legacy downvote, ignored

  const publicView = await profile(star._id);
  assert.deepEqual(publicView.stats, { questions: 2, answers: 3, accepted: 1, answerUpvotes: 2, sameDoubt: 1, endorsed: 1 });
  const ownView = await profile(star._id, tokenFor(star));
  assert.deepEqual(ownView.stats, { questions: 3, answers: 3, accepted: 1, answerUpvotes: 2, sameDoubt: 2, endorsed: 1 });

  const byKey = Object.fromEntries(publicView.milestones.map(item => [item.key, item]));
  for (const key of ['first-question', 'first-answer', 'first-accepted', 'teacher-endorsed']) assert.equal(byKey[key].earned, true, key);
  for (const key of ['helper-10', 'liked-25', 'shared-doubt-10']) assert.equal(byKey[key].earned, false, key);
  assert.deepEqual([byKey['helper-10'].progress, byKey['helper-10'].target], [3, 10]);
  assert.deepEqual([byKey['liked-25'].progress, byKey['liked-25'].target], [2, 25]);
  assert.equal(byKey['first-question'].hint, 'Ask your first doubt');
});
