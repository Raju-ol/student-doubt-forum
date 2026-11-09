import mongoose from 'mongoose';

// Cache only an in-flight attempt. A resolved promise must not mask a later
// disconnect in a warm serverless instance.
export function connectionManager(driver, initialize) {
  let pending;
  return async function connect(uri, options) {
    if (pending) return pending;
    if (driver.connection.readyState === 1) return;
    pending = (async () => {
      try {
        await driver.connect(uri, options);
        await initialize();
      } catch (error) {
        try { await driver.disconnect(); } catch { /* Preserve the original failure. */ }
        throw error;
      }
    })();
    try { await pending; } finally { pending = undefined; }
  };
}
const connect = connectionManager(mongoose, () => Promise.all(Object.values(mongoose.models).map(model => model.init())));

export function validateConfiguration() {
  if (!process.env.MONGO_URI) throw Object.assign(new Error('Set MONGO_URI in the private server configuration.'), { code: 'MONGO_URI_MISSING' });
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw Object.assign(new Error('JWT_SECRET must contain at least 32 random characters.'), { code: 'JWT_SECRET_INVALID' });
}

export function connectionErrorCode(error) {
  if (['MONGO_URI_MISSING', 'JWT_SECRET_INVALID'].includes(error?.code)) return error.code;
  const related = [error, error?.cause, ...(error?.reason?.servers?.values?.() || [])].flatMap(item => [item, item?.error, item?.error?.cause]);
  if (related.some(item => item?.code === 18 || item?.codeName === 'AuthenticationFailed')) return 'DATABASE_AUTH_FAILED';
  if (related.some(item => item?.code === 13 || item?.codeName === 'Unauthorized')) return 'DATABASE_PERMISSION_DENIED';
  if (error?.name === 'MongoParseError') return 'DATABASE_URI_INVALID';
  if (error?.name === 'MongooseServerSelectionError' || error?.name === 'MongoServerSelectionError') return 'DATABASE_NETWORK_UNAVAILABLE';
  if (related.some(item => ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEOUT'].includes(item?.code))) return 'DATABASE_NETWORK_UNAVAILABLE';
  return 'DATABASE_CONNECTION_FAILED';
}

export async function connectDatabase() {
  validateConfiguration();
  await connect(process.env.MONGO_URI, {
      // Match the Atlas readWrite grant even when the copied URI ends in '/'.
      dbName: 'student_doubt_forum',
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 2
    });
}
