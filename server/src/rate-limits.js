import { createHmac } from 'node:crypto';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

const unavailable = () => Object.assign(new Error('Request protection is temporarily unavailable. Please try again shortly.'), { status: 503 });
class ProtectedRedisStore extends RedisStore {
  async increment(key) {
    try { return await super.increment(key); }
    catch { throw unavailable(); }
  }
}

// Keep credentials out of URLs, error messages and logs. Never silently fall back
// to independent memory counters when a deployed Redis store fails.
export function redisCommand({ url, token, fetchImpl = fetch }) {
  let endpoint;
  try { endpoint = new URL(url); } catch { throw unavailable(); }
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/' || !token) throw unavailable();
  return async (...command) => {
    try {
      const response = await fetchImpl(endpoint.href, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(command), signal: AbortSignal.timeout(3000), redirect: 'error',
      });
      if (!response.ok) throw unavailable();
      const body = await response.json();
      if (body.error) {
        // RedisStore needs this exact class of error to reload evicted scripts.
        if (/^NOSCRIPT(?:\s|$)/.test(body.error)) throw new Error('NOSCRIPT script unavailable');
        throw unavailable();
      }
      if (!Object.hasOwn(body, 'result')) throw unavailable();
      return body.result;
    } catch (error) {
      if (error.message === 'NOSCRIPT script unavailable') throw error;
      throw unavailable();
    }
  };
}

export function createLimiterFactory({ env = process.env, fetchImpl = fetch } = {}) {
  const configured = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
  const deployed = env.NODE_ENV === 'production' || env.VERCEL === '1';
  const shared = configured || deployed;
  let sendCommand;
  if (configured) {
    try { sendCommand = redisCommand({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN, fetchImpl }); }
    catch { sendCommand = async () => { throw unavailable(); }; }
  } else if (shared) sendCommand = async () => { throw unavailable(); };
  const environment = env.VERCEL_ENV || (deployed ? 'production' : 'development');
  const prefix = `forum:rl:v1:${environment}:`;
  const factory = (scope, limit, windowMs, { account = false } = {}) => rateLimit({
    windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false,
    passOnStoreError: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    ...(shared ? { store: new ProtectedRedisStore({ sendCommand, prefix: `${prefix}${scope}:` }) } : {}),
    keyGenerator: req => {
      const identity = account && req.user ? `user:${req.user._id}` : `ip:${ipKeyGenerator(req.ip)}`;
      // Pseudonymous Redis keys; no email addresses, tokens or raw IP addresses.
      return createHmac('sha256', env.JWT_SECRET || 'local-development-only').update(identity).digest('hex');
    },
  });
  factory.mode = configured ? 'redis' : shared ? 'unavailable' : 'memory';
  return factory;
}
