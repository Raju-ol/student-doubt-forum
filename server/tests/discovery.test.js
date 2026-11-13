import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Answer, Doubt, User, Vote } from '../src/models.js';

test('feed sorting, related questions and the duplicate check', async t => {
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
  const call = async (path, { status = 200 } = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`);
    const payload = await response.json();
    assert.equal(response.status, status, `GET ${path}: ${payload.message}`);
    return payload.data;
  };
  const make = name => User.create({ name, email: `${name.toLowerCase()}@example.test`, reputation: 0, emailVerifiedAt: new Date() });
  const [asker, ...voters] = await Promise.all(['Asker', 'V1', 'V2', 'V3'].map(make));
  const ask = (title, extra = {}) => Doubt.create({ title, body: 'A long enough description of the question body.', subject: 'Java', author: asker._id, ...extra });
  const reply = (doubt, count) => Promise.all(Array.from({ length: count }, (_, i) => Answer.create({ doubt: doubt._id, author: voters[i % voters.length]._id, body: `Reply number ${i} with enough text.` })));
  const same = (doubt, count) => Promise.all(voters.slice(0, count).map(user => Vote.create({ targetType: 'doubt', target: doubt._id, user: user._id, value: 1 })));

  // Oldest to newest: quiet (0 answers, 0 votes), busy (3, 1), liked (1, 3), fresh (0, 0).
  const quiet = await ask('How does garbage collection decide what to free?', { createdAt: new Date('2026-10-01') });
  const busy = await ask('What does the volatile keyword guarantee in Java threads?', { createdAt: new Date('2026-10-02') });
  const liked = await ask('Why is String immutable in Java and how does interning work?', { createdAt: new Date('2026-10-03') });
  const fresh = await ask('When should I prefer an interface over an abstract class?', { createdAt: new Date('2026-10-04') });
  await reply(busy, 3); await same(busy, 1);
  await reply(liked, 1); await same(liked, 3);
  // A legacy question downvote must not count as a "Same doubt".
  await Vote.create({ targetType: 'doubt', target: quiet._id, user: voters[0]._id, value: -1 });
  const ids = (data) => data.items.map(item => String(item._id));
  const order = (...docs) => docs.map(doc => String(doc._id));

  await t.test('newest is the default and unchanged', async () => {
    assert.deepEqual(ids(await call('/doubts?scope=all')), order(fresh, liked, busy, quiet));
    assert.deepEqual(ids(await call('/doubts?scope=all&sort=newest')), order(fresh, liked, busy, quiet));
  });
  await t.test('votes sorts by Same doubt count, then newest', async () => {
    const data = await call('/doubts?scope=all&sort=votes');
    assert.deepEqual(ids(data), order(liked, busy, fresh, quiet));
    assert.deepEqual(data.items.map(item => item.votes), [3, 1, 0, 0]);
  });
  await t.test('answers sorts most answered first', async () => {
    const data = await call('/doubts?scope=all&sort=answers');
    assert.deepEqual(ids(data), order(busy, liked, fresh, quiet));
    assert.deepEqual(data.items.map(item => item.answerCount), [3, 1, 0, 0]);
  });
  await t.test('unanswered puts questions with no answers first, newest first among them', async () => {
    assert.deepEqual(ids(await call('/doubts?scope=all&sort=unanswered')), order(fresh, quiet, liked, busy));
  });
  await t.test('sorting paginates, keeps filters and reports the full total', async () => {
    const first = await call('/doubts?scope=all&sort=answers&limit=2');
    const second = await call('/doubts?scope=all&sort=answers&limit=2&page=2');
    assert.deepEqual([...ids(first), ...ids(second)], order(busy, liked, fresh, quiet));
    assert.equal(first.total, 4); assert.equal(first.pages, 2);
    const open = await call('/doubts?scope=all&sort=votes&status=open&subject=Java');
    assert.equal(open.total, 4);
    const none = await call('/doubts?scope=all&sort=votes&subject=Physics');
    assert.deepEqual(none.items, []);
  });
  await t.test('an unknown sort is rejected', async () => {
    await call('/doubts?sort=popular', { status: 400 });
  });

  const gcTwin = await ask('Garbage collection basics: how are unused objects freed?', { tags: ['java', 'memory'], createdAt: new Date('2026-10-05') });
  const physics = await ask('Why does projectile range peak at 45 degrees?', { subject: 'Physics', createdAt: new Date('2026-10-06') });
  const sample = await ask('Garbage collection worked example for the exam', { tags: ['study-library'], createdAt: new Date('2026-10-07') });
  await reply(gcTwin, 2);
  const keys = data => data.map(item => String(item._id));

  await t.test('related questions share a title or tag topic, exclude the question itself and carry no body or author', async () => {
    const related = await call(`/doubts/${quiet._id}/related`);
    const found = keys(related);
    assert.ok(found.includes(String(gcTwin._id)));
    assert.ok(!found.includes(String(quiet._id)) && !found.includes(String(physics._id)));
    const twin = related.find(item => String(item._id) === String(gcTwin._id));
    assert.deepEqual(Object.keys(twin).sort(), ['_id', 'answerCount', 'createdAt', 'status', 'subject', 'title']);
    assert.equal(twin.answerCount, 2); assert.equal(twin.status, 'open');
    assert.ok(related.length <= 5);
    // The internal sample tag never becomes a search term.
    const sampleRelated = await call(`/doubts/${sample._id}/related`);
    assert.ok(!keys(sampleRelated).includes(String(sample._id)));
    await call('/doubts/not-an-id/related', { status: 400 });
    await call('/doubts/000000000000000000000000/related', { status: 404 });
  });
  await t.test('the duplicate check ranks title matches, ignores noise and punctuation, and needs a real title', async () => {
    const hits = await call(`/doubts/similar?title=${encodeURIComponent('how does garbage collection work')}`);
    const found = keys(hits);
    assert.ok(found.includes(String(quiet._id)) && found.includes(String(gcTwin._id)));
    assert.ok(!found.includes(String(physics._id)));
    // A match only inside a question body is not suggested.
    await ask('Plain unrelated headline about nothing', { body: 'The long description mentions quicksort pivots somewhere inside it.' });
    assert.deepEqual(await call(`/doubts/similar?title=${encodeURIComponent('quicksort pivots explained')}`), []);
    // Quotes and a leading minus are typed by people and must not break or invert the search.
    assert.ok(keys(await call(`/doubts/similar?title=${encodeURIComponent('"garbage" -collection freed objects')}`)).includes(String(gcTwin._id)));
    assert.deepEqual(await call('/doubts/similar?title=Java'), []);
    assert.deepEqual(await call('/doubts/similar'), []);
  });
});
