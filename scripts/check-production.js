// Read-only, low-volume deployment check. Never signs in or changes content.
const origin = new URL(process.argv[2] || 'https://student-doubt-forum-theta.vercel.app');
if (origin.protocol !== 'https:') throw new Error('Use an HTTPS deployment URL.');
let failures = 0;
for (const path of ['/', '/login', '/api/v1/health', '/api/v1/doubts?scope=all&limit=1']) {
  try {
    const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(20000), redirect: 'error' });
    const problems = [];
    if (response.status !== 200) problems.push(`HTTP ${response.status}`);
    if (response.headers.get('x-content-type-options') !== 'nosniff') problems.push('missing nosniff');
    const csp = response.headers.get('content-security-policy') || '';
    if (!csp.includes("script-src 'self'")) problems.push('missing script CSP');
    if (!response.headers.get('referrer-policy')) problems.push('missing referrer policy');
    if (path.startsWith('/api/') && !response.headers.get('cache-control')?.includes('no-store')) problems.push('API missing no-store');
    if (path === '/api/v1/health' && response.ok) {
      const health = await response.json();
      if (!health.success || health.data?.database !== 'connected' || health.data?.rateLimitStore !== 'redis') problems.push('database/shared limiter not ready');
    } else await response.body?.cancel();
    if (problems.length) failures++;
    console.log(`${problems.length ? 'FAIL' : 'PASS'} ${path}${problems.length ? ': ' + problems.join(', ') : ''}`);
  } catch { failures++; console.log(`FAIL ${path}: deployment could not be reached`); }
}
process.exitCode = failures ? 1 : 0;
