import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { User, Doubt, Answer, Comment, Vote, Report, Upload, Notification } from './models.js';
import { requireUser } from './auth.js';
import { fail, password } from './validation.js';

export function mountAccountRoutes(api, { limiter, wrap, ok, cloudinary }) {
  api.get('/users/me/export', requireUser, limiter('export', 3, 60 * 60 * 1000, { account: true }), wrap(async (req, res) => {
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="doubt-forum-data.ndjson"');
    res.setHeader('Cache-Control', 'no-store');
    // Explicit allow-list: no password hash, token version or recovery hashes.
    res.write(JSON.stringify({ type: 'account', data: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, semester: req.user.semester, createdAt: req.user.createdAt } }) + '\n');
    const lists = [
      ['question', Doubt, { author: req.user._id }, 'title body subject semester tags images author acceptedAnswer createdAt updatedAt'],
      ['answer', Answer, { author: req.user._id }, 'doubt body author createdAt updatedAt'],
      ['comment', Comment, { author: req.user._id }, 'answer body author createdAt updatedAt'],
      ['vote', Vote, { user: req.user._id }, 'targetType target value createdAt updatedAt'],
      ['report', Report, { reporter: req.user._id }, 'targetType target reason status createdAt updatedAt'],
      ['upload', Upload, { owner: req.user._id }, 'url doubt createdAt updatedAt'],
      ['notification', Notification, { user: req.user._id }, 'actor type target readAt createdAt'],
    ];
    try {
      for (const [type, Model, filter, projection] of lists) {
        for await (const data of Model.find(filter).select(projection).lean().cursor()) {
          if (res.destroyed) return;
          if (!res.write(JSON.stringify({ type, data }) + '\n')) await new Promise(resolve => { const done = () => { res.off('drain', done); res.off('close', done); resolve(); }; res.once('drain', done); res.once('close', done); });
        }
      }
      res.end();
    } catch { if (!res.destroyed) res.destroy(); }
  }));
  api.delete('/users/me', requireUser, limiter('account-delete', 5, 60 * 60 * 1000, { account: true }), wrap(async (req, res) => {
    if (req.user.role === 'admin') fail(403, 'Transfer administrator ownership before deleting this account. Contact the project owner.');
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!await bcrypt.compare(password(req.body.password), user.passwordHash)) fail(401, 'Password is incorrect.');
    if (req.body.confirmation !== 'DELETE') fail(400, 'Type DELETE to confirm account deletion.');
    // Remove images first. A provider failure keeps the account accessible so
    // the user can retry; already-removed images are safe to retry.
    for await (const upload of Upload.find({ owner: user._id }).cursor()) {
      let result;
      try { result = await cloudinary.uploader.destroy(upload.publicId); }
      catch { fail(503, 'Image cleanup is temporarily unavailable. Please retry account deletion later.'); }
      if (!['ok', 'not found'].includes(result.result)) fail(503, 'Image cleanup is temporarily unavailable. Please retry later.');
      await Doubt.updateMany({ 'images.publicId': upload.publicId }, { $pull: { images: { publicId: upload.publicId } } });
      await Upload.deleteOne({ _id: upload._id, owner: user._id });
    }
    const removed = await User.findOneAndUpdate({ _id: user._id, passwordHash: user.passwordHash, isDeleted: { $ne: true } }, {
      $set: { name: 'Deleted user', email: `deleted-${user._id}-${randomBytes(8).toString('hex')}@deleted.invalid`, passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 12), role: 'student', isDeleted: true, deletedAt: new Date(), emailVerifiedAt: null, isBanned: true },
      $unset: { verificationHash: 1, verificationExpires: 1, resetHash: 1, resetExpires: 1 }, $inc: { tokenVersion: 1 },
    });
    if (!removed) fail(409, 'Your account changed during deletion. Sign in again and retry.');
    // Authored discussions and votes remain attached to the anonymous tombstone
    // so threads, vote totals and other authors' reputation are not corrupted.
    ok(res, null, 'Account deleted. Your discussions remain attributed to Deleted user.');
  }));
}
