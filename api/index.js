import { createApp } from '../server/src/app.js';
import { connectDatabase, connectionErrorCode } from '../server/src/database.js';

const app = createApp({ serveClient: false });

export default async function handler(req, res) {
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
  return app(req, res);
}
