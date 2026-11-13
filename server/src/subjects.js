import mongoose from 'mongoose';
import { Subject, Doubt } from './models.js';
import { fail, text, escapeRegex } from './validation.js';
import { requireUser, requireAdmin } from './auth.js';
import { recordAudit } from './audit.js';
export const subjectKey = value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const seeds = [
  ['Data Structures', ['DSA', 'Data Structures and Algorithms'], '{}'], ['DBMS', ['Database Management Systems', 'Databases'], '▤'], ['Java', [], 'J'], ['Operating Systems', ['OS'], '⌘'], ['Computer Networks', ['Networking'], '◎'], ['Mathematics', ['Math', 'Maths'], '∑'], ['Web Development', [], '⌨'], ['Python', [], 'Py'], ['C and C++', ['C', 'C++', 'C Programming'], 'C'], ['Other', [], '◈'],
  ['Physics', [], '⚛'], ['Chemistry', [], '⚗'], ['Biology', [], '♧'], ['Statistics', [], '∑'], ['Economics', [], '↗'], ['Accounting', ['Accountancy'], '▤'], ['Business Studies', [], '◈'], ['History', [], '◷'], ['Geography', [], '◎'], ['Political Science', [], '◈'], ['Sociology', [], '◈'], ['Psychology', [], '◈'], ['English Literature', [], 'Aa'], ['Law', ['Legal Studies'], '⚖'], ['Anatomy', [], '◈'], ['Physiology', [], '◈'], ['Pharmacology', [], '◈'], ['Mechanical Engineering', [], '⚙'], ['Electrical Engineering', [], 'ϟ'], ['Civil Engineering', [], '⌂'], ['Architecture', [], '⌂'], ['Art and Design', [], '✎'],
];
const ready = new WeakMap();
export function subjectFields(body) {
  const name = text(body.name, 'Subject name', 2, 60);
  const slug = text(body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), 'Subject slug', 1, 80);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail(400, 'Use a lowercase slug with letters, numbers and hyphens.');
  if (!Array.isArray(body.aliases || []) || (body.aliases || []).length > 15) fail(400, 'Use at most 15 aliases.');
  const aliases = [...new Set((body.aliases || []).map(value => text(value, 'Alias', 1, 60)))];
  return { name, slug, aliases, keys: [...new Set([name, ...aliases].map(subjectKey))], field: body.field ? text(body.field, 'Field', 1, 60) : '', icon: body.icon ? text(body.icon, 'Icon', 1, 8) : '◈' };
}
export async function ensureSubjects() {
  const db = mongoose.connection.db;
  if (!ready.has(db)) ready.set(db, (async () => {
    await Subject.init();
    try { await Subject.bulkWrite(seeds.map(([name, aliases, icon]) => { const fields = subjectFields({ name, aliases, icon }); return { updateOne: { filter: { slug: fields.slug }, update: { $setOnInsert: fields }, upsert: true } }; }), { ordered: false }); }
    catch (error) { if (error.code !== 11000) throw error; } // concurrent cold starts
  })().catch(error => { ready.delete(db); throw error; }));
  await ready.get(db);
}
export async function resolveSubject(value) {
  const name = text(value, 'Subject', 2, 60); await ensureSubjects();
  const found = await Subject.findOne({ keys: subjectKey(name) });
  return found ? { subject: found.name, subjectId: found._id } : { subject: name, subjectId: undefined };
}
export async function subjectFilter(value) {
  const name = text(value, 'Subject', 2, 60); await ensureSubjects();
  const found = await Subject.findOne({ keys: subjectKey(name) });
  return found ? { $or: [{ subjectId: found._id }, { subject: { $in: [found.name, ...found.aliases].map(value => new RegExp(`^${escapeRegex(value)}$`, 'i')) } }] } : { subject: name };
}
export async function listSubjects() {
  await ensureSubjects();
  return Subject.find().select('name slug aliases field icon').sort({ name: 1 }).limit(500);
}
export function mountSubjectRoutes(api, { wrap, ok }) {
  api.get('/subjects', wrap(async (req, res) => { ok(res, await listSubjects()); }));
  api.post('/admin/subjects', requireUser, requireAdmin, wrap(async (req, res) => {
    await ensureSubjects();
    try { const subject = await Subject.create(subjectFields(req.body)); await recordAudit(req.user, 'catalog.subject', `Added the subject ${subject.name}`, { targetType: 'subject', target: subject._id }); ok(res, subject, 'Subject added.', 201); }
    catch (error) { if (error.code === 11000) fail(409, 'That subject name, slug or alias already belongs to the catalogue.'); throw error; }
  }));
}
export async function migrateSubjects({ apply = false } = {}) {
  if (!await Subject.exists({})) throw new Error('Initialize the subject catalogue before migrating questions.');
  let matched = 0, unknown = 0;
  for await (const doc of Doubt.find({ subjectId: { $exists: false } }).select('_id subject').lean().cursor()) {
    const found = await Subject.findOne({ keys: subjectKey(doc.subject) });
    if (!found) { unknown++; continue; } matched++;
    if (apply) await Doubt.updateOne({ _id: doc._id, subjectId: { $exists: false } }, { $set: { subjectId: found._id, subject: found.name } });
  }
  return { mode: apply ? 'apply' : 'dry-run', matched, unknown };
}
