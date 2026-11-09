import { mkdirSync, readdirSync, copyFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const output = path.resolve(root, '..', 'deliverables', 'student-doubt-forum');
if (existsSync(output)) throw new Error('Package staging already exists. Preserve or rename the earlier package before making another.');
const entries = ['package.json', 'package-lock.json', '.gitignore', 'README.md', 'PROJECT_CONTEXT.md', 'render.yaml', 'Start Application.cmd', 'client', 'server', 'docs', 'scripts'];
function copy(source, destination) {
  const name = path.basename(source);
  if (['node_modules', 'dist', '.git', 'coverage'].includes(name) || (name.startsWith('.env') && name !== '.env.example') || name.endsWith('.log')) return;
  if (statSync(source).isDirectory()) { mkdirSync(destination, { recursive: true }); for (const entry of readdirSync(source)) copy(path.join(source, entry), path.join(destination, entry)); }
  else { mkdirSync(path.dirname(destination), { recursive: true }); copyFileSync(source, destination); }
}
for (const entry of entries) copy(path.join(root, entry), path.join(output, entry));
console.log('Clean source staging created. Private .env files, dependencies and build outputs excluded.');
