import multer from 'multer';
import mongoose from 'mongoose';
import { Doubt, Resource, User } from './models.js';
import { requireUser } from './auth.js';
import { requireVerified } from './email.js';
import { findDoc } from './forum.js';
import { fail, positiveInt, text } from './validation.js';

export const RESOURCE_CATEGORIES = ['notes', 'papers', 'cheatsheets', 'books', 'others'];
const MAX_BYTES = 4 * 1024 * 1024; // Vercel functions reject request bodies above ~4.5 MB.
const ZIP = [0x50, 0x4b, 0x03, 0x04];
const OLE = [0xd0, 0xcf, 0x11, 0xe0];
// Extension decides the kind; the leading bytes must agree so a renamed file is refused.
const FILE_TYPES = {
  pdf: { kind: 'pdf', magic: [0x25, 0x50, 0x44, 0x46] },
  doc: { kind: 'doc', magic: OLE },
  docx: { kind: 'doc', magic: ZIP },
  ppt: { kind: 'ppt', magic: OLE },
  pptx: { kind: 'ppt', magic: ZIP }
};
const startsWith = (buffer, magic) => magic.every((byte, index) => buffer[index] === byte);
const publicFields = 'title description category kind size downloads createdAt uploader';
const present = resource => ({
  _id: resource._id, title: resource.title, description: resource.description, category: resource.category,
  kind: resource.kind, size: resource.size, downloads: resource.downloads, createdAt: resource.createdAt,
  uploader: resource.uploader && resource.uploader.name ? { _id: resource.uploader._id, name: resource.uploader.name } : null
});

export function externalLink(value) {
  let url;
  try { url = new URL(String(value || '').trim()); } catch { fail(400, 'Enter a full link starting with https://'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 500) fail(400, 'Links must start with https:// and be under 500 characters.');
  return url.href;
}

export function mountResourceRoutes(api, { wrap, ok, limiter, cloudinary }) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 } });
  const category = value => RESOURCE_CATEGORIES.includes(value) ? value : fail(400, 'Choose a category.');

  api.get('/resources', wrap(async (req, res) => {
    const page = positiveInt(req.query.page, 1, 10000);
    const limit = positiveInt(req.query.limit, 12, 30);
    const filter = {};
    if (req.query.category) filter.category = category(req.query.category);
    if (req.query.search) filter.$text = { $search: text(req.query.search, 'Search', 1, 120) };
    const [items, total] = await Promise.all([
      Resource.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).select(publicFields).populate('uploader', 'name'),
      Resource.countDocuments(filter)
    ]);
    ok(res, { items: items.map(present), total, page, pages: Math.ceil(total / limit) });
  }));

  api.get('/resources/popular', wrap(async (req, res) => {
    const items = await Resource.find().sort({ downloads: -1, createdAt: -1 }).limit(5).select(publicFields).populate('uploader', 'name');
    ok(res, items.map(present));
  }));

  api.post('/resources', requireUser, requireVerified, limiter('resource-create', 10, 60 * 60 * 1000, { account: true }),
    upload.single('file'), wrap(async (req, res) => {
      const fields = { title: text(req.body.title, 'Title', 4, 120), category: category(req.body.category), uploader: req.user._id };
      if (req.body.description) fields.description = text(req.body.description, 'Description', 1, 300);
      if (req.file) {
        const extension = (req.file.originalname.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
        const type = FILE_TYPES[extension];
        if (!type || !startsWith(req.file.buffer, type.magic)) fail(400, 'Upload a PDF, Word or PowerPoint file up to 4 MB.');
        if (!process.env.CLOUDINARY_API_SECRET) fail(503, 'File uploads are not configured yet. Share a link instead.');
        const publicId = `student-doubt-forum/resources/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
        const stored = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ resource_type: 'raw', public_id: publicId, overwrite: false }, (error, value) => error ? reject(error) : resolve(value)).end(req.file.buffer);
        });
        Object.assign(fields, { kind: type.kind, url: stored.secure_url, publicId: stored.public_id, size: req.file.size });
      } else {
        Object.assign(fields, { kind: 'link', url: externalLink(req.body.link) });
      }
      const resource = await Resource.create(fields);
      await resource.populate('uploader', 'name');
      ok(res, present(resource), 'Resource shared. Thank you!', 201);
    }));

  // A plain GET redirect, so the browser downloads straight from storage and the count rises once per request.
  api.get('/resources/:id/download', wrap(async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) fail(400, 'Invalid record ID.');
    const resource = await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }).select('url');
    if (!resource) fail(404, 'This resource is no longer available.');
    res.redirect(302, resource.url);
  }));

  api.delete('/resources/:id', requireUser, wrap(async (req, res) => {
    const resource = await findDoc(Resource, req.params.id);
    const isStaff = ['admin', 'moderator'].includes(req.user.role);
    if (String(resource.uploader) !== String(req.user._id) && !isStaff) fail(403, 'Only the person who shared this, or a moderator, can remove it.');
    if (resource.publicId) { try { await cloudinary.uploader.destroy(resource.publicId, { resource_type: 'raw' }); } catch { console.error('Resource file cleanup failed'); } }
    await resource.deleteOne();
    ok(res, null, 'Resource removed.');
  }));

  // Most-used tags over the last 30 days. The sample library is excluded so it never crowds out real activity.
  api.get('/tags/trending', wrap(async (req, res) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await Doubt.aggregate([
      { $match: { createdAt: { $gte: since }, tags: { $ne: 'study-library' } } },
      { $unwind: '$tags' },
      { $match: { tags: { $ne: 'study-library' } } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 8 }
    ]);
    ok(res, rows.map(row => ({ tag: row._id, count: row.count })));
  }));

  api.get('/contributors', wrap(async (req, res) => {
    const users = await User.find({ isBanned: { $ne: true }, isDeleted: { $ne: true }, reputation: { $gt: 0 } })
      .sort({ reputation: -1, createdAt: 1 }).limit(10).select('name role reputation');
    ok(res, users.map(user => ({ _id: user._id, name: user.name, role: user.role, reputation: user.reputation })));
  }));
}
