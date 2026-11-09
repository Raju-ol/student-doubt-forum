import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models.js';
import { calculateReputation } from './reputation.js';

// A dry run is the default. Explicitly name the database; never infer a live
// migration target from an accidentally selected .env file.
const args = process.argv.slice(2);
const name = args.find(value => value.startsWith('--database='))?.slice(11);
const apply = args.includes('--apply');
if (!name || !/^[A-Za-z0-9_-]{1,64}$/.test(name) || ['admin', 'local', 'config'].includes(name)) throw new Error('Supply --database=INTENDED_DATABASE.');
if (apply && !args.includes('--confirm-writes-paused')) throw new Error('Pause application writes and add --confirm-writes-paused before applying.');
if (!process.env.MONGO_URI) throw new Error('Configure MONGO_URI privately before running this script.');
try {
  await mongoose.connect(process.env.MONGO_URI, { dbName: name, serverSelectionTimeoutMS: 10000 });
  let checked = 0, changed = 0;
  for await (const user of User.find().select('_id reputation').lean().cursor()) {
    const score = await calculateReputation(user._id);
    checked++;
    if (user.reputation !== score) {
      changed++;
      if (apply) await User.updateOne({ _id: user._id }, { $set: { reputation: score } });
    }
  }
  console.log(JSON.stringify({ mode: apply ? 'applied' : 'dry-run', checked, different: changed }));
} catch {
  console.error('Reconciliation failed. Check private configuration/database permissions. No credentials are logged.');
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
