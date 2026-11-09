import mongoose from 'mongoose';

let connectionPromise;

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
  if (mongoose.connection.readyState === 1) return;
  // Reuse a connection across requests within a warm Vercel function instance.
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5
    }).then(async () => {
      await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    }).catch(error => {
      connectionPromise = undefined;
      throw error;
    });
  }
  await connectionPromise;
}
