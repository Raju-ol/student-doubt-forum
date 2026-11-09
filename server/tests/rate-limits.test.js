import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createHash } from 'node:crypto';
import { createLimiterFactory, redisCommand } from '../src/rate-limits.js';

test('Redis transport keeps credentials private and preserves only NOSCRIPT errors', async () => {
  let request;
  const send = redisCommand({ url: 'https://example.upstash.io', token: 'private-token', fetchImpl: async (url, options) => {
    request = { url, options }; return { ok: true, json: async () => ({ result: 7 }) };
  } });
  assert.equal(await send('INCR', 'key'), 7);
  assert.equal(request.url, 'https://example.upstash.io/');
  assert.equal(request.options.headers.Authorization, 'Bearer private-token');
  assert.deepEqual(JSON.parse(request.options.body), ['INCR', 'key']);
  assert.equal(request.options.redirect, 'error');
  for (const response of [{ ok: false }, { ok: true, json: async () => ({ error: 'private-token internal-error' }) }, { ok: true, json: async () => ({}) }]) {
    const command = redisCommand({ url: 'https://example.upstash.io', token: 'private-token', fetchImpl: async () => response });
    await assert.rejects(command('PING'), error => error.status === 503 && !error.message.includes('private-token'));
  }
  const command = redisCommand({ url: 'https://example.upstash.io', token: 'secret', fetchImpl: async () => ({ ok: true, json: async () => ({ error: 'NOSCRIPT private details' }) }) });
  await assert.rejects(command('PING'), /^Error: NOSCRIPT script unavailable$/);
  assert.throws(() => redisCommand({ url: 'http://example.com', token: 'secret' }), { status: 503 });
});

test('two app instances share limits, separate scopes and recover after expiry', async t => {
  // REST contract fake: the library supplies the actual atomic Redis Lua scripts.
  // A real Upstash deployment is checked separately; this is not a Redis emulator.
  let now = Date.now();
  const scripts = new Map(), counters = new Map();
  let fail = false;
  const fetchImpl = async (url, options) => {
    if (fail) throw new Error('secret network detail');
    const [command, ...args] = JSON.parse(options.body);
    let result;
    if (command === 'SCRIPT') {
      result = createHash('sha1').update(args[1]).digest('hex'); scripts.set(result, args[1]);
    } else if (command === 'EVALSHA') {
      if (!scripts.has(args[0])) return { ok: true, json: async () => ({ error: 'NOSCRIPT missing' }) };
      const key = args[2], windowMs = Number(args[3]);
      let entry = counters.get(key);
      if (!entry || entry.expires <= now) entry = { count: 0, expires: now + windowMs };
      entry.count++; counters.set(key, entry);
      result = [entry.count, entry.expires - now];
    } else throw new Error('Unexpected Redis command');
    return { ok: true, json: async () => ({ result }) };
  };
  const env = { UPSTASH_REDIS_REST_URL: 'https://example.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'secret', JWT_SECRET: 'test-signing-secret', VERCEL_ENV: 'preview' };
  const servers = [];
  for (let i = 0; i < 2; i++) {
    const app = express(), limiter = createLimiterFactory({ env, fetchImpl });
    app.set('trust proxy', 1);
    app.get('/auth', limiter('auth', 2, 1000), (req, res) => res.json({ ok: true }));
    app.get('/upload', (req, res, next) => { req.user = { _id: req.get('test-user') }; next(); }, limiter('upload', 1, 1000, { account: true }), (req, res) => res.json({ ok: true }));
    app.use((error, req, res, next) => res.status(error.status || 500).json({ message: error.message }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve)); servers.push(server);
  }
  t.after(() => Promise.all(servers.map(server => new Promise(resolve => server.close(resolve)))));
  const get = (i, route, headers = {}) => fetch(`http://127.0.0.1:${servers[i].address().port}${route}`, { headers });
  assert.equal((await get(0, '/auth')).status, 200);
  assert.equal((await get(1, '/auth')).status, 200);
  const blocked = await get(0, '/auth'); assert.equal(blocked.status, 429); assert.ok(blocked.headers.get('retry-after'));
  assert.equal((await get(1, '/auth', { 'X-Forwarded-For': '192.0.2.2' })).status, 200);
  assert.equal((await get(0, '/upload', { 'test-user': 'a' })).status, 200);
  assert.equal((await get(1, '/upload', { 'test-user': 'a', 'X-Forwarded-For': '192.0.2.3' })).status, 429);
  assert.equal((await get(1, '/upload', { 'test-user': 'b' })).status, 200);
  assert.ok([...counters.keys()].every(key => /^forum:rl:v1:preview:(auth|upload):[a-f0-9]{64}$/.test(key)));
  now += 1001; scripts.clear(); // Exercise NOSCRIPT recovery as well as expiry.
  assert.equal((await get(1, '/auth')).status, 200);
  fail = true;
  const unavailable = await get(0, '/auth'); assert.equal(unavailable.status, 503); assert.doesNotMatch(await unavailable.text(), /secret/);
});

test('local development uses memory, production without credentials never falls back', () => {
  assert.equal(createLimiterFactory({ env: {} }).mode, 'memory');
  assert.equal(createLimiterFactory({ env: { NODE_ENV: 'production' } }).mode, 'unavailable');
});
