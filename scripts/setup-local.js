import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (!existsSync('server/.env')) {
  writeFileSync('server/.env', `PORT=5000\nMONGO_URI=mongodb://127.0.0.1:27017/student_doubt_forum\nJWT_SECRET=${randomBytes(48).toString('hex')}\nCLIENT_URL=http://127.0.0.1:5173\n`);
  console.log('Created private local configuration. Existing MongoDB service must be running.');
} else console.log('Existing private configuration preserved.');
