import 'dotenv/config';
import mongoose from 'mongoose';
import { migrateSubjects } from './subjects.js';
const args = process.argv.slice(2), dbName = args.find(value => value.startsWith('--database='))?.slice(11), apply = args.includes('--apply');
if (!dbName || !/^[A-Za-z0-9_-]{1,64}$/.test(dbName) || ['admin', 'local', 'config'].includes(dbName)) throw new Error('Supply --database=INTENDED_DATABASE.');
if (apply && !(args.includes('--confirm-backup') && args.includes('--confirm-writes-paused'))) throw new Error('Test a copy, back up and pause writes before applying.');
if (!process.env.MONGO_URI) throw new Error('Configure MONGO_URI privately.');
try { await mongoose.connect(process.env.MONGO_URI, { dbName, serverSelectionTimeoutMS: 10000 }); console.log(JSON.stringify(await migrateSubjects({ apply }))); }
catch { console.error('Subject migration failed. Review catalogue/private database configuration. No credentials logged.'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
