import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI in server/.env before starting.');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Set JWT_SECRET to a random value of at least 32 characters.');
await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
await Promise.all(Object.values(mongoose.models).map(model => model.init()));
console.log('MongoDB connected.');
const server = createApp().listen(process.env.PORT || 5000, '0.0.0.0', () => console.log(`Doubt Forum is running on port ${process.env.PORT || 5000}.`));
async function stop() { server.close(async () => { await mongoose.disconnect(); process.exit(0); }); }
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
