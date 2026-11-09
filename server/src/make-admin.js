import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models.js';
const email = process.argv[2]?.trim().toLowerCase();
if (!email) throw new Error('Run: node src/make-admin.js your-registered-email');
await mongoose.connect(process.env.MONGO_URI);
const user = await User.findOne({ email });
if (!user) { console.error('Register this account through the application first.'); process.exitCode = 1; }
else { user.role = 'admin'; await user.save(); console.log('The registered account is now an administrator.'); }
await mongoose.disconnect();
