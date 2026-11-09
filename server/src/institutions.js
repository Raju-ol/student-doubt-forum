import mongoose from 'mongoose';
import { Institution, User, Doubt } from './models.js';
import { requireUser, requireAdmin } from './auth.js';
import { fail, text } from './validation.js';
export async function institutionFields(body) {
  if (!Object.hasOwn(body, 'institution')) return {};
  if (!body.institution) return { institution: null };
  if (typeof body.institution !== 'string' || !mongoose.isObjectIdOrHexString(body.institution) || !await Institution.exists({ _id: body.institution })) fail(400, 'Choose a college from the catalogue.');
  return { institution: body.institution };
}
export function mountInstitutionRoutes(api, { wrap, ok }) {
  api.get('/institutions', wrap(async (req, res) => { ok(res, await Institution.find().select('name slug country isVerified').sort({ name: 1 }).limit(500)); }));
  api.post('/admin/institutions', requireUser, requireAdmin, wrap(async (req, res) => {
    await Institution.init();
    const name = text(req.body.name, 'College name', 2, 140);
    const slug = text(req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), 'College slug', 1, 100);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail(400, 'Use a lowercase slug with letters, numbers and hyphens.');
    const country = req.body.country ? text(req.body.country, 'Country code', 2, 2).toUpperCase() : '';
    if (country && !/^[A-Z]{2}$/.test(country)) fail(400, 'Use a two-letter country code.');
    try { ok(res, await Institution.create({ name, slug, country, isVerified: false }), 'College added.', 201); }
    catch (error) { if (error.code === 11000) fail(409, 'That college slug already exists.'); throw error; }
  }));
}
export async function migrateInstitution({ institution, userIds, apply = false }) {
  if (!mongoose.isObjectIdOrHexString(institution) || !await Institution.exists({ _id: institution })) throw new Error('Choose an existing institution.');
  if (!Array.isArray(userIds) || userIds.length > 10000 || userIds.some(id => typeof id !== 'string' || !mongoose.isObjectIdOrHexString(id))) throw new Error('Supply at most 10000 valid user IDs.');
  const ids = [...new Set(userIds)];
  const eligible = await User.find({ _id: { $in: ids }, isDeleted: { $ne: true }, $or: [{ institution: { $exists: false } }, { institution }] }).select('_id').lean();
  const eligibleIds = eligible.map(user => user._id);
  const users = { _id: { $in: eligibleIds }, institution: { $exists: false }, isDeleted: { $ne: true } };
  const questions = { author: { $in: eligibleIds }, institution: { $exists: false } };
  const result = { mode: apply ? 'apply' : 'dry-run', users: await User.countDocuments(users), questions: await Doubt.countDocuments(questions) };
  if (apply) { await User.updateMany(users, { $set: { institution } }); await Doubt.updateMany(questions, { $set: { institution } }); }
  return result;
}
