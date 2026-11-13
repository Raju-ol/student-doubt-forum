import mongoose from 'mongoose';
import { User } from './models.js';
import { findDoc } from './forum.js';
import { fail } from './validation.js';

// Pin one existing administrator so later promotions and concurrent demotions
// cannot leave the site without an administrator.
async function primaryAdmin() {
  const settings = mongoose.connection.collection('admin_settings');
  const existing = await settings.findOne({ _id: 'primary-admin' });
  if (existing) return existing.userId;
  const first = await User.findOne({
    role: 'admin', isDeleted: { $ne: true }, isBanned: { $ne: true }
  }).sort({ createdAt: 1, _id: 1 }).select('_id').lean();
  if (!first) fail(503, 'No active administrator is available.');
  try {
    await settings.updateOne({ _id: 'primary-admin' }, {
      $setOnInsert: { userId: first._id, createdAt: new Date() }
    }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  return (await settings.findOne({ _id: 'primary-admin' })).userId;
}

export async function changeUserRole(actor, id, role) {
  if (!['student', 'teacher', 'moderator', 'admin'].includes(role)) {
    fail(400, 'Choose Student, Teacher, Moderator or Admin.');
  }
  const user = await findDoc(User, id);
  if (user.isDeleted) fail(404, 'This account has been deleted.');
  if (String(actor._id) === String(user._id)) {
    fail(403, 'Ask another administrator to change your role.');
  }
  if (String(await primaryAdmin()) === String(user._id)) {
    fail(403, 'The primary administrator role is protected.');
  }
  if (user.isBanned && ['admin', 'moderator'].includes(role)) {
    fail(409, 'Restore this account before granting administration or moderation access.');
  }
  if (role === user.role) return user;
  const updated = await User.findOneAndUpdate({
    _id: user._id, role: user.role, isBanned: user.isBanned ? true : { $ne: true }, isDeleted: { $ne: true }
  }, { $set: { role } }, { new: true });
  if (!updated) fail(409, 'This account changed. Refresh the user list and try again.');
  updated.$locals.previousRole = user.role;
  return updated;
}
