import { createApp } from '../server/src/app.js';
import { connectDatabase } from '../server/src/database.js';

const app = createApp({ serveClient: false });

export default async function handler(req, res) {
  try {
    await connectDatabase();
  } catch {
    // Never return connection strings or credentials in a public error response.
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Database connection is unavailable. Please try again shortly.' }));
    return;
  }
  return app(req, res);
}
