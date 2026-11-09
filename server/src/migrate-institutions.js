import 'dotenv/config';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import { migrateInstitution } from './institutions.js';
const args = process.argv.slice(2), option = name => args.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const dbName = option('database'), institution = option('institution'), file = option('user-ids-file'), apply = args.includes('--apply');
if (!dbName || !/^[A-Za-z0-9_-]{1,64}$/.test(dbName) || ['admin', 'local', 'config'].includes(dbName) || !institution || !file) throw new Error('Supply explicit --database, --institution and --user-ids-file paths/IDs.');
if (apply && !(args.includes('--confirm-backup') && args.includes('--confirm-writes-paused'))) throw new Error('Test a copy, back up and pause writes before applying.');
if (!process.env.MONGO_URI) throw new Error('Configure MONGO_URI privately.');
try { const userIds = JSON.parse(await readFile(file, 'utf8')); await mongoose.connect(process.env.MONGO_URI, { dbName, serverSelectionTimeoutMS: 10000 }); console.log(JSON.stringify(await migrateInstitution({ institution, userIds, apply }))); }
catch { console.error('Institution migration failed. Review explicit mapping/private configuration. No IDs or credentials logged.'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
