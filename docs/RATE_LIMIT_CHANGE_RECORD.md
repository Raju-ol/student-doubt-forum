# Shared rate limiting — 9 November 2026

The owner created a free Upstash Redis database in Singapore and reported saving
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel Production and
Preview. Credentials were not read into chat or committed.

## Behavior

- API: 600 requests per IP subnet / 15 minutes, before authentication lookup.
- Login and signup share 30 requests per IP subnet / 15 minutes.
- Upload: 15 requests per authenticated account / hour, before multipart parsing.
- IPv6 uses express-rate-limit's default subnet grouping. Keys use HMAC-SHA256
  with the application's signing secret; raw IPs, email addresses and tokens are
  not stored in key names. These are pseudonymous counters, not anonymized data.
- Separate prefixes for API/auth/upload and production/preview. Preview branches
  in the same environment intentionally share counters.
- `rate-limit-redis` 6.0.2 supplies atomic Lua increments and expiration; REST
  commands use HTTPS POST with a bearer header, a three-second timeout and no
  redirects. NOSCRIPT responses trigger the library's script reload/retry.
- Upstash errors block requests with a safe 503, rather than silently reverting
  to per-instance memory. Missing/invalid production configuration also blocks
  protected routes. Local development without Redis retains the memory store.
- Health bypasses the limiter and reports configuration mode (`redis`, `memory`,
  or `unavailable`). The mode alone does not prove Redis connectivity; successful
  protected API calls are also needed. A healthy MongoDB health response can
  coexist with a Redis outage.
- Vercel automatically trusts one platform proxy hop; other hosts retain the
  existing explicit `TRUST_PROXY=1` opt-in. Do not expose a differently proxied
  origin with this setting without reviewing the proxy chain.

Free Redis quota exhaustion or outages can therefore temporarily block the API.
Monitor command usage in Upstash. No paid plan was selected or authorized.
This is request throttling, not complete DDoS protection.

## Validation

65 tests pass and production build succeeds. New tests cover HTTPS command
transport, private error handling, two app instances sharing a counter, 429 and
Retry-After, separate IP/account/scope buckets, expiry, NOSCRIPT reload, outage
503 and local/production mode selection. Shared-counter tests use a REST contract
fake; they are not a real Redis concurrency/load test. Live check pending push.

## Operations

Set both variables privately in Vercel project Environment Variables and redeploy.
Use the normal read/write REST token, not the read-only token. Never prefix these
variables with `VITE_`, publish them, or paste them into documentation. Keep the
same JWT_SECRET across production instances for stable key identities. A secret
rotation also starts new rate-limit identities.

Sources: [Redis store](https://github.com/express-rate-limit/rate-limit-redis),
[Upstash REST](https://upstash.com/docs/redis/features/restapi),
[Vercel request headers](https://vercel.com/docs/headers/request-headers).
