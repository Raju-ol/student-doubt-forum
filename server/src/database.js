import mongoose from 'mongoose';

let connectionPromise;

export function validateConfiguration() {
  if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI in the private server configuration.');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 random characters.');
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
