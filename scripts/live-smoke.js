import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const origin = process.argv[2];
if (!origin || !origin.startsWith('https://')) throw new Error('Supply the intended HTTPS application origin.');
const base = new URL('/api/v1', origin).href;
const stamp = Date.now();
const secret = randomBytes(24).toString('hex');
let first, doubt;
async function call(route, method = 'GET', body, token, expected = 200) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(base + route, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  assert.equal(response.status, expected, `${method} ${route}: ${result.code || result.message || 'Unexpected response'}`);
  return result.data;
}
try {
  assert.equal((await call('/health')).database, 'connected');
  console.log('PASS: live database health');
  const emailA = `qa-a-${stamp}@example.test`;
  first = await call('/auth/signup', 'POST', { name: 'QA Test Student A', email: emailA, password: secret, semester: 3 }, null, 201);
  const second = await call('/auth/signup', 'POST', { name: 'QA Test Student B', email: `qa-b-${stamp}@example.test`, password: secret, semester: 3 }, null, 201);
  const login = await call('/auth/login', 'POST', { email: emailA, password: secret });
  assert.equal(login.user._id, first.user._id);
  assert.equal((await call('/auth/me', 'GET', null, first.token))._id, first.user._id);
  console.log('PASS: two signups, login and session lookup');
  await call('/doubts', 'POST', {}, null, 401);
  doubt = await call('/doubts', 'POST', { title: `QA verification ${stamp}: database normalization`, body: 'Temporary automated deployment verification. Why does database normalization reduce redundant data?', subject: 'DBMS', semester: 3, tags: ['qa-verification'] }, first.token, 201);
  const answer = await call(`/doubts/${doubt._id}/answers`, 'POST', { body: 'Normalization separates related entities and uses keys to reduce redundancy and prevent update anomalies.' }, second.token, 201);
  console.log('PASS: authenticated question and second-student answer');
  await call(`/answers/${answer._id}/vote`, 'POST', { value: 1 }, first.token);
  await call(`/answers/${answer._id}/accept`, 'PATCH', {}, first.token);
  await call(`/answers/${answer._id}/comments`, 'POST', { body: 'Temporary QA comment verifying the live discussion flow.' }, first.token, 201);
  const detail = await call(`/doubts/${doubt._id}`);
  assert.equal(detail.status, 'solved');
  assert.equal(detail.answers[0].votes, 1);
  assert.equal(detail.answers[0].isAccepted, true);
  assert.equal(detail.answers[0].comments.length, 1);
  const search = await call(`/doubts?search=${stamp}&subject=DBMS`);
  assert.ok(search.items.some(item => item._id === doubt._id));
  const profile = await call(`/users/${second.user._id}`);
  assert.equal(profile.user.reputation, 25);
  await call('/admin/users', 'GET', null, first.token, 403);
  console.log('PASS: votes, acceptance, comments, search, reputation and admin protection');
} finally {
  if (doubt && first) { await call(`/doubts/${doubt._id}`, 'DELETE', null, first.token); console.log('CLEANUP: temporary question, answer and comments removed'); }
  console.log(first ? 'NOTE: clearly named QA test accounts remain; no passwords or session tokens have been printed or saved.' : 'NOTE: no first test account was created; no passwords or tokens saved.');
}
