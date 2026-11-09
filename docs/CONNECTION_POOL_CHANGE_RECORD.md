# Serverless database pool

9 November 2026. Each warm API instance now opens at most two pooled MongoDB connections instead of five. This reduces per-instance connection pressure on Atlas. It does not cap the total number of Vercel instances and is not evidence of a load-tested traffic ceiling. Vercel instances can handle concurrent requests; the smaller pool is a conservative tradeoff, not a claim that each instance only serves one request.

The full local suite and build are run before committing. Live saturation/latency under load and total production connection counts are not verified. Application query behavior and permissions are unchanged.
