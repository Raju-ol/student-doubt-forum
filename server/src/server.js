import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDatabase } from './database.js';
await connectDatabase();
console.log('MongoDB connected.');
const server = createApp().listen(process.env.PORT || 5000, '0.0.0.0', () => console.log(`Doubt Forum is running on port ${process.env.PORT || 5000}.`));
async function stop() { server.close(async () => { await mongoose.disconnect(); process.exit(0); }); }
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
