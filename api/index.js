import { createApp } from '../server/src/app.js';
import { connectDatabase, connectionErrorCode } from '../server/src/database.js';

// Vercel supplies X-Forwarded-For even when system env vars are not exposed.
const app = createApp({ serveClient: false, trustProxy: true });

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  const started = performance.now();
  try {
    await connectDatabase();
  } catch (error) {
    const code = connectionErrorCode(error);
    console.error('Database initialization failed:', code);
    // Never return connection strings or credentials in a public error response.
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Database connection is unavailable. Please try again shortly.', code }));
    return;
  }
  res.setHeader('Server-Timing', `db-ready;dur=${Math.round(performance.now() - started)}`);
  return app(req, res);
}
