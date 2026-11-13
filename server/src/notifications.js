import mongoose from 'mongoose';
import { Notification, User } from './models.js';
import { requireUser } from './auth.js';
import { fail, positiveInt } from './validation.js';

export async function notifyUser({ user, actor, type, target, eventKey }) {
  if (String(user) === String(actor)) return;
  try {
    if (!await User.exists({ _id: user, isDeleted: { $ne: true }, isBanned: false })) return;
    await Notification.updateOne({ eventKey }, { $setOnInsert: { user, actor, type, target, eventKey } }, { upsert: true });
  } catch { console.error('Notification creation failed'); }
}
export function mountNotificationRoutes(api, { wrap, ok }) {
  api.get('/notifications', requireUser, wrap(async (req, res) => {
    const page = positiveInt(req.query.page, 1, 10000), user = req.user._id;
    const [items, total, unread] = await Promise.all([
      Notification.find({ user }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 25).limit(25).populate('actor', 'name').populate('target', 'title isAnonymous'),
      Notification.countDocuments({ user }), Notification.countDocuments({ user, readAt: null }),
    ]);
    res.setHeader('Cache-Control', 'no-store');
    // "X accepted your answer" must not name the asker of an anonymous question.
    const shown = items.map(item => {
      const row = item.toObject();
      if (row.type === 'answer_accepted' && row.target?.isAnonymous) row.actor = { name: 'Anonymous' };
      if (row.target) delete row.target.isAnonymous;
      return row;
    });
    ok(res, { items: shown, unread, page, pages: Math.ceil(total / 25), total });
  }));
  api.post('/notifications/read', requireUser, wrap(async (req, res) => { await Notification.updateMany({ user: req.user._id, readAt: null }, { $set: { readAt: new Date() } }); ok(res, null, 'Notifications marked as read.'); }));
  api.patch('/notifications/:id/read', requireUser, wrap(async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) fail(400, 'Invalid notification.');
    const item = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { $set: { readAt: new Date() } });
    if (!item) fail(404, 'Notification not found.');
    ok(res, null, 'Notification marked as read.');
  }));
}
