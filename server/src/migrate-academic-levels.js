import 'dotenv/config';
import mongoose from 'mongoose';
import { migrateAcademicLevels } from './academic-migration.js';
const args = process.argv.slice(2), dbName = args.find(value => value.startsWith('--database='))?.slice(11), apply = args.includes('--apply');
if (!dbName || !/^[A-Za-z0-9_-]{1,64}$/.test(dbName) || ['admin', 'local', 'config'].includes(dbName)) throw new Error('Supply --database=INTENDED_DATABASE.');
if (apply && !(args.includes('--confirm-backup') && args.includes('--confirm-writes-paused'))) throw new Error('Test a database copy, take a backup, pause writes and confirm both before applying.');
if (!process.env.MONGO_URI) throw new Error('Configure MONGO_URI privately.');
try { await mongoose.connect(process.env.MONGO_URI, { dbName, serverSelectionTimeoutMS: 10000 }); console.log(JSON.stringify(await migrateAcademicLevels({ apply }))); }
catch { console.error('Academic migration failed. Review private database configuration; no credentials are logged.'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
