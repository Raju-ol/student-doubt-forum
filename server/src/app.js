import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLimiterFactory } from './rate-limits.js';
import { issueEmail, mountEmailRoutes, requireVerified, sendTransactionalEmail } from './email.js';
import { mountAccountRoutes } from './account.js';
import { notifyUser, mountNotificationRoutes } from './notifications.js';
import { academicFields, effectiveLevel } from './academics.js';
import { mountSubjectRoutes, resolveSubject, subjectFilter } from './subjects.js';
import { mountInstitutionRoutes, institutionFields } from './institutions.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import mongoose from 'mongoose';
import { User, Doubt, Answer, Comment, Report, Upload } from './models.js';
import { fail, text, semester, email, password, tags, positiveInt } from './validation.js';
import { identify, requireUser, requireAdmin, owns, safeUser, tokenFor } from './auth.js';
import { findDoc, decorate, decorateMany, toggleVote, toggleAcceptance, removeAnswer, removeDoubt, reputation, authorFields } from './forum.js';

const ok = (res, data, message = '', status = 200) => res.status(status).json({ success: true, data, message });
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export function createApp({ serveClient = true, sendEmail = sendTransactionalEmail } = {}) {
  const limiter = createLimiterFactory();
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === '1' || process.env.VERCEL === '1') app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: { directives: { 'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'], 'script-src': ["'self'"], 'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : null } } }));
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://127.0.0.1:5173' }));
  app.use(express.json({ limit: '100kb' }));
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
  const api = express.Router();
  app.use('/api/v1', api);
  api.get('/health', (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'Database unavailable.' });
    ok(res, { database: 'connected', rateLimitStore: limiter.mode }, 'Doubt Forum API is running.');
  });
  api.use(limiter('api', 600, 15 * 60 * 1000), wrap(identify));
  const authLimit = limiter('auth', 30, 15 * 60 * 1000);
  const authEmailLimit = limiter('auth-email', 30, 15 * 60 * 1000, { email: true });
  api.post('/auth/signup', authLimit, authEmailLimit, wrap(async (req, res) => {
    const fields = { name: text(req.body.name, 'Name', 2, 60), email: email(req.body.email), ...academicFields(req.body), ...await institutionFields(req.body) };
    const hash = await bcrypt.hash(password(req.body.password), 12);
    const user = await User.create({ ...fields, passwordHash: hash, reputation: 0 });
    if (process.env.EMAIL_ENABLED === '1') { try { await issueEmail(user, 'verify', sendEmail); } catch { console.error('Email delivery failed: signup_verification'); } }
    ok(res, { user: safeUser(user), token: tokenFor(user) }, 'Welcome to Doubt Forum!', 201);
  }));
  api.post('/auth/login', authLimit, authEmailLimit, wrap(async (req, res) => {
    const address = email(req.body.email);
    const secret = password(req.body.password);
    const user = await User.findOne({ email: address, isDeleted: { $ne: true } }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(secret, user.passwordHash))) fail(401, 'Email or password is incorrect.');
    if (user.isBanned) fail(403, 'Your account has been suspended.');
    ok(res, { user: safeUser(user), token: tokenFor(user) }, 'Welcome back!');
  }));
  api.get('/auth/me', requireUser, (req, res) => ok(res, safeUser(req.user)));
  api.post('/auth/logout-all', requireUser, wrap(async (req, res) => {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    ok(res, null, 'Signed out on all devices. Please sign in again.');
  }));
  mountEmailRoutes(api, { limiter, wrap, ok, sendEmail });
  mountAccountRoutes(api, { limiter, wrap, ok, cloudinary });
  mountNotificationRoutes(api, { wrap, ok });
  mountSubjectRoutes(api, { wrap, ok });
  mountInstitutionRoutes(api, { wrap, ok });
  api.get('/doubts', wrap(async (req, res) => {
    const page = positiveInt(req.query.page, 1, 10000);
    const limit = positiveInt(req.query.limit, 10, 30);
    const filter = {};
    const scope = req.query.scope || (req.user?.institution ? 'college' : 'all');
    if (!['all', 'college', 'subject'].includes(scope)) fail(400, 'Choose a valid feed scope.');
    if (scope === 'college') {
      if (!req.user) fail(401, 'Sign in to view your college feed.');
      if (!req.user.institution) fail(400, 'Choose your college in your profile first.');
      filter.institution = req.user.institution;
    }
    if (scope === 'subject' && !req.query.subject) fail(400, 'Choose a subject for the worldwide subject feed.');
    if (req.query.search) filter.$text = { $search: text(req.query.search, 'Search', 1, 120) };
    if (req.query.subject) (filter.$and ||= []).push(await subjectFilter(req.query.subject));
    if (req.query.semester) filter.semester = semester(req.query.semester);
    if (req.query.academicSystem) {
      const system = text(req.query.academicSystem, 'Academic system', 1, 20);
      if (!['semester', 'year', 'grade', 'other'].includes(system)) fail(400, 'Invalid academic system.');
      const index = req.query.academicIndex ? positiveInt(req.query.academicIndex, 1, 30) : null;
      const levelFilter = { 'academicLevel.system': system, ...(index ? { 'academicLevel.index': index } : {}) };
      filter.$or = [levelFilter, ...(system === 'semester' ? [{ academicLevel: null, semester: index || { $exists: true } }] : [])];
    }
    if (req.query.tag) filter.tags = text(req.query.tag, 'Tag', 1, 24).toLowerCase();
    if (req.query.status === 'solved') filter.acceptedAnswer = { $ne: null };
    if (req.query.status === 'open') filter.acceptedAnswer = null;
    const query = filter.$text ? Doubt.find(filter, { searchScore: { $meta: 'textScore' } }).sort({ searchScore: { $meta: 'textScore' }, createdAt: -1, _id: -1 }) : Doubt.find(filter).sort({ createdAt: -1, _id: -1 });
    const [docs, total] = await Promise.all([query.skip((page - 1) * limit).limit(limit).populate('author', authorFields), Doubt.countDocuments(filter)]);
    ok(res, { items: await decorateMany(docs, 'doubt', req.user), total, page, pages: Math.ceil(total / limit) });
  }));
  async function doubtFields(body) {
    return { title: text(body.title, 'Title', 10, 160), body: text(body.body, 'Description', 20, 12000), ...await resolveSubject(body.subject), ...academicFields(body), tags: tags(body.tags) };
  }
  api.post('/doubts', requireUser, requireVerified, wrap(async (req, res) => {
    const fields = await doubtFields(req.body);
    const ids = req.body.imageIds ?? [];
    if (!Array.isArray(ids) || ids.length > 3 || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) fail(400, 'Use up to 3 unique images.');
    const uploads = await Upload.find({ publicId: { $in: ids }, owner: req.user._id, doubt: null });
    if (uploads.length !== ids.length) fail(400, 'Some images are unavailable. Upload them again.');
    const doubt = await Doubt.create({ ...fields, institution: req.body.institution === null ? null : req.user.institution || null, author: req.user._id, images: uploads.map(u => ({ url: u.url, publicId: u.publicId })) });
    await Upload.updateMany({ _id: { $in: uploads.map(u => u._id) } }, { doubt: doubt._id });
    ok(res, doubt, 'Your doubt has been posted.', 201);
  }));
  api.get('/doubts/:id', wrap(async (req, res) => {
    const doubt = await findDoc(Doubt, req.params.id);
    await doubt.populate('author', authorFields);
    const answers = await Answer.find({ doubt: doubt._id }).sort({ createdAt: 1 }).populate('author', authorFields);
    // One comment query for the whole page instead of one per answer.
    const [decorated, comments] = await Promise.all([decorateMany(answers, 'answer', req.user), Comment.find({ answer: { $in: answers.map(a => a._id) } }).sort({ createdAt: 1 }).populate('author', authorFields)]);
    const byAnswer = new Map();
    for (const comment of comments) { const key = String(comment.answer); if (!byAnswer.has(key)) byAnswer.set(key, []); byAnswer.get(key).push(comment); }
    const result = decorated.map(answer => ({ ...answer, isAccepted: String(doubt.acceptedAnswer) === String(answer._id), comments: byAnswer.get(String(answer._id)) || [] }));
    result.sort((a, b) => Number(b.isAccepted) - Number(a.isAccepted) || b.votes - a.votes);
    ok(res, { ...await decorate(doubt, 'doubt', req.user), answers: result });
  }));
  api.put('/doubts/:id', requireUser, wrap(async (req, res) => {
    const doubt = await findDoc(Doubt, req.params.id); owns(req.user, doubt.author);
    Object.assign(doubt, await doubtFields(req.body)); await doubt.save(); ok(res, doubt, 'Doubt updated.');
  }));
  api.delete('/doubts/:id', requireUser, wrap(async (req, res) => { const doubt = await findDoc(Doubt, req.params.id); owns(req.user, doubt.author); await removeDoubt(doubt, cloudinary); ok(res, null, 'Doubt deleted.'); }));
  api.post('/doubts/:id/vote', requireUser, wrap(async (req, res) => ok(res, await toggleVote(req, Doubt, 'doubt'))));
  api.post('/doubts/:id/answers', requireUser, requireVerified, wrap(async (req, res) => {
    const doubt = await findDoc(Doubt, req.params.id);
    const answer = await Answer.create({ doubt: doubt._id, author: req.user._id, body: text(req.body.body, 'Answer', 10, 12000) });
    await notifyUser({ user: doubt.author, actor: req.user._id, type: 'question_answered', target: doubt._id, eventKey: `answer:${answer._id}` });
    ok(res, answer, 'Answer posted. Thank you for helping!', 201);
  }));
  api.put('/answers/:id', requireUser, wrap(async (req, res) => { const answer = await findDoc(Answer, req.params.id); owns(req.user, answer.author); answer.body = text(req.body.body, 'Answer', 10, 12000); await answer.save(); ok(res, answer, 'Answer updated.'); }));
  api.delete('/answers/:id', requireUser, wrap(async (req, res) => { const answer = await findDoc(Answer, req.params.id); owns(req.user, answer.author); await removeAnswer(answer); ok(res, null, 'Answer deleted.'); }));
  api.post('/answers/:id/vote', requireUser, wrap(async (req, res) => ok(res, await toggleVote(req, Answer, 'answer'))));
  api.patch('/answers/:id/accept', requireUser, wrap(async (req, res) => {
    const answer = await findDoc(Answer, req.params.id); const doubt = await findDoc(Doubt, String(answer.doubt));
    if (String(doubt.author) !== String(req.user._id)) fail(403, 'Only the student who asked can accept an answer.');
    const accepted = await toggleAcceptance(answer, doubt);
    if (accepted) await notifyUser({ user: answer.author, actor: req.user._id, type: 'answer_accepted', target: doubt._id, eventKey: `accepted:${answer._id}` });
    ok(res, { accepted }, accepted ? 'Answer accepted.' : 'Answer acceptance removed.');
  }));
  api.post('/answers/:id/comments', requireUser, requireVerified, wrap(async (req, res) => {
    const answer = await findDoc(Answer, req.params.id);
    const comment = await Comment.create({ answer: answer._id, author: req.user._id, body: text(req.body.body, 'Comment', 2, 1000) });
    await notifyUser({ user: answer.author, actor: req.user._id, type: 'answer_commented', target: answer.doubt, eventKey: `comment:${comment._id}` });
    ok(res, comment, 'Comment added.', 201);
  }));
  api.get('/users/:id', wrap(async (req, res) => {
    const user = await findDoc(User, req.params.id);
    if (user.isDeleted) fail(404, 'This account has been deleted.');
    const [doubts, answers, score] = await Promise.all([Doubt.find({ author: user._id }).sort({ createdAt: -1 }).limit(50).populate('author', authorFields), Answer.find({ author: user._id }).sort({ createdAt: -1 }).limit(50).populate('doubt', 'title'), reputation(user._id)]);
    ok(res, { user: { _id: user._id, name: user.name, role: user.role, semester: user.semester, academicLevel: effectiveLevel(user), institution: user.institution || null, createdAt: user.createdAt, reputation: score }, doubts: await decorateMany(doubts, 'doubt', req.user), answers });
  }));
  api.put('/users/me', requireUser, wrap(async (req, res) => { req.user.name = text(req.body.name, 'Name', 2, 60); Object.assign(req.user, academicFields(req.body), await institutionFields(req.body)); await req.user.save(); ok(res, safeUser(req.user), 'Profile updated.'); }));
  api.post('/reports', requireUser, wrap(async (req, res) => {
    if (!['doubt', 'answer'].includes(req.body.targetType)) fail(400, 'Invalid report type.');
    const target = await findDoc(req.body.targetType === 'doubt' ? Doubt : Answer, req.body.targetId);
    if (await Report.exists({ target: target._id, reporter: req.user._id, status: 'pending' })) fail(409, 'You have already reported this content.');
    ok(res, await Report.create({ targetType: req.body.targetType, target: target._id, reporter: req.user._id, reason: text(req.body.reason, 'Reason', 5, 1000) }), 'Report sent to the moderators.', 201);
  }));
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024, files: 1 }, fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) });
  api.post('/uploads', requireUser, requireVerified, limiter('upload', 15, 60 * 60 * 1000, { account: true }), upload.single('image'), wrap(async (req, res) => {
    if (!process.env.CLOUDINARY_API_SECRET) fail(503, 'Image uploads are not configured yet. You can still post a text doubt.');
    if (!req.file) fail(400, 'Choose a JPG, PNG or WebP image up to 3 MB.');
    const b = req.file.buffer;
    const valid = (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) || b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP');
    if (!valid) fail(400, 'The file is not a supported image.');
    if (await Upload.countDocuments({ owner: req.user._id, doubt: null }) >= 9) fail(400, 'Remove unused uploads before adding more images.');
    const image = await new Promise((resolve, reject) => { const stream = cloudinary.uploader.upload_stream({ folder: 'student-doubt-forum', resource_type: 'image', allowed_formats: ['jpg', 'png', 'webp'], transformation: [{ width: 1800, height: 1800, crop: 'limit' }] }, (err, value) => err ? reject(err) : resolve(value)); stream.end(b); });
    const saved = await Upload.create({ publicId: image.public_id, url: image.secure_url, owner: req.user._id });
    ok(res, saved, 'Image uploaded.', 201);
  }));
  api.delete('/uploads', requireUser, wrap(async (req, res) => {
    const publicId = text(req.body.publicId, 'Image ID', 1, 200);
    const image = await Upload.findOne({ publicId, owner: req.user._id, doubt: null });
    if (!image) fail(404, 'Unused image not found.');
    await cloudinary.uploader.destroy(publicId); await image.deleteOne(); ok(res, null, 'Image removed.');
  }));
  const admin = express.Router(); api.use('/admin', requireUser, requireAdmin, admin);
  admin.get('/users', wrap(async (req, res) => {
    const page = positiveInt(req.query.page, 1, 10000);
    const [items, total] = await Promise.all([User.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).skip((page - 1) * 25).limit(25), User.countDocuments({ isDeleted: { $ne: true } })]);
    ok(res, { items: items.map(safeUser), page, pages: Math.ceil(total / 25), total });
  }));
  admin.patch('/users/:id/ban', wrap(async (req, res) => {
    const user = await findDoc(User, req.params.id);
    if (user.isDeleted) fail(404, 'This account has been deleted.');
    if (user.role === 'admin') fail(403, 'Administrator accounts cannot be suspended here.');
    if (typeof req.body.isBanned !== 'boolean') fail(400, 'Provide the account status.');
    user.isBanned = req.body.isBanned; await user.save(); ok(res, safeUser(user), 'Account status updated.');
  }));
  admin.patch('/users/:id/role', wrap(async (req, res) => {
    const user = await findDoc(User, req.params.id);
    if (user.isDeleted) fail(404, 'This account has been deleted.');
    if (user.role === 'admin' || !['student', 'teacher'].includes(req.body.role)) fail(403, 'Only student and teacher roles can be changed here.');
    user.role = req.body.role; await user.save(); ok(res, safeUser(user), 'Role updated.');
  }));
  admin.get('/reports', wrap(async (req, res) => {
    const page = positiveInt(req.query.page, 1, 10000);
    const filter = { status: 'pending' };
    const [reports, total] = await Promise.all([Report.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 25).limit(25).populate('reporter', 'name'), Report.countDocuments(filter)]);
    const items = await Promise.all(reports.map(async report => ({ ...report.toObject(), content: await (report.targetType === 'doubt' ? Doubt : Answer).findById(report.target).select('title body doubt') })));
    ok(res, { items, page, pages: Math.ceil(total / 25), total });
  }));
  admin.patch('/reports/:id', wrap(async (req, res) => {
    const report = await findDoc(Report, req.params.id);
    if (!['dismissed', 'removed'].includes(req.body.status)) fail(400, 'Choose dismiss or remove.');
    if (req.body.status === 'removed') { const Model = report.targetType === 'doubt' ? Doubt : Answer; const target = await Model.findById(report.target); if (target) { if (report.targetType === 'doubt') await removeDoubt(target, cloudinary); else await removeAnswer(target); } }
    report.status = req.body.status; await report.save(); ok(res, report, 'Report resolved.');
  }));
  app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API route not found.' }));
  const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url));
  if (serveClient && existsSync(clientDist)) { app.use(express.static(clientDist)); app.get('/{*path}', (req, res) => res.sendFile(path.join(clientDist, 'index.html'))); }
  app.use((err, req, res, next) => {
    let status = err.status || 500;
    let message = status < 500 || err.expose ? err.message : 'Something went wrong. Please try again.';
    if (err.code === 11000) { status = 409; message = 'This record already exists. For signup, try a different email.'; }
    if (err.name === 'CastError' || err.name === 'ValidationError' || err.name === 'MulterError') { status = 400; message = err.name === 'MulterError' ? 'Choose one JPG, PNG or WebP image up to 3 MB.' : 'Please check the information you entered.'; }
    if (err instanceof SyntaxError && 'body' in err) { status = 400; message = 'Invalid JSON request.'; }
    if (status >= 500) console.error('Request failed:', err.name, err.code || 'server_error');
    res.status(status).json({ success: false, message });
  });
  return app;
}
