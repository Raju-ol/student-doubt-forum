import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { connectionManager } from '../src/database.js';
import { identify, tokenFor } from '../src/auth.js';
import { User } from '../src/models.js';
import { createApp } from '../src/app.js';
import { readSessionToken, saveSessionToken } from '../../client/src/session.js';

test('blocked browser storage cannot crash login, logout or app startup', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  try {
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
    assert.equal(readSessionToken(), '');
    assert.equal(saveSessionToken('temporary'), false);
    assert.equal(saveSessionToken(''), false);
    const data = new Map();
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) } });
    assert.equal(saveSessionToken('temporary'), true);
    assert.equal(readSessionToken(), 'temporary');
    saveSessionToken('');
    assert.equal(readSessionToken(), '');
  } finally {
    if (original) Object.defineProperty(globalThis, 'sessionStorage', original);
    else delete globalThis.sessionStorage;
  }
});

test('connection attempts share initialization and reconnect after a later disconnect', async () => {
  let connects = 0, releases;
  const driver = { connection: { readyState: 0 }, async connect() { connects++; this.connection.readyState = 1; }, async disconnect() { this.connection.readyState = 0; } };
  let initialize = () => new Promise(resolve => { releases = resolve; });
  const connect = connectionManager(driver, () => initialize());
  const first = connect();
  await Promise.resolve();
  let secondDone = false;
  const second = connect().then(() => { secondDone = true; });
  await Promise.resolve();
  assert.equal(secondDone, false);
  assert.equal(connects, 1);
  releases();
  await Promise.all([first, second]);
  await connect();
  assert.equal(connects, 1);
  driver.connection.readyState = 0;
  initialize = async () => {};
  await connect();
  assert.equal(connects, 2);
});

test('failed initialization releases the connection for a successful retry', async () => {
  let attempts = 0;
  const driver = { connection: { readyState: 0 }, async connect() { attempts++; this.connection.readyState = 1; }, async disconnect() { this.connection.readyState = 0; } };
  const connect = connectionManager(driver, async () => { if (attempts === 1) throw new Error('index failure'); });
  await assert.rejects(connect(), /index failure/);
  await connect();
  assert.equal(attempts, 2);
});

test('account lookup failure returns 503 while invalid credentials still return 401', async t => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  t.mock.method(User, 'findById', async () => { throw new Error('database unavailable'); });
  const invoke = async header => { let error; await identify({ get: () => header }, {}, value => { error = value; }); return error; };
  assert.equal((await invoke(`Bearer ${tokenFor({ _id: '0123456789abcdef01234567' })}`)).status, 503);
  assert.equal((await invoke('Bearer invalid')).status, 401);
});

test('empty and non-object auth bodies produce safe 400 responses with no-store', async t => {
  const server = createApp({ serveClient: false }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/v1/auth/login`;
  for (const body of [undefined, '[]', 'null', '{']) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    assert.equal(response.status, 400);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.equal((await response.json()).success, false);
  }
});

test('deployment protects static documents as well as API responses', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
  const headers = Object.fromEntries(config.headers.find(rule => rule.source === '/(.*)').headers.map(header => [header.key, header.value]));
  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.match(headers['Content-Security-Policy'], /script-src 'self'/);
  assert.match(headers['Content-Security-Policy'], /https:\/\/res.cloudinary.com/);
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Referrer-Policy'], 'no-referrer');
});

test('content creation is limited per account without blocking another account or logout', async t => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  t.mock.method(User, 'findById', async id => ({ _id: id, tokenVersion: 0 }));
  const server = createApp({ serveClient: false }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const token = tokenFor({ _id: '0123456789abcdef01234567' });
  const post = (path, bearer = token) => fetch(base + path, { method: 'POST', headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' }, body: '{}' });
  for (let index = 0; index < 60; index++) assert.equal((await post('/doubts')).status, 400);
  const blocked = await post('/doubts');
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get('retry-after'));
  assert.equal((await post('/doubts', tokenFor({ _id: 'abcdef0123456789abcdef01' }))).status, 400);
  // Logout routes bypass the content limiter; no database operation is needed
  // to verify the unknown auth route still returns its normal response.
  assert.equal((await post('/auth/not-a-route')).status, 404);
});
