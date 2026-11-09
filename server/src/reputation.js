import { User, Answer, Vote, Doubt } from './models.js';

export const voteCredit = value => value === 1 ? 10 : value === -1 ? -2 : 0;

// Reconciliation stays in MongoDB; individual vote documents never leave it.
export async function calculateReputation(userId) {
  const rows = await Answer.aggregate([
    { $match: { author: userId } },
    { $lookup: { from: Vote.collection.name, let: { answer: '$_id' }, pipeline: [
      { $match: { $expr: { $and: [{ $eq: ['$target', '$$answer'] }, { $eq: ['$targetType', 'answer'] }] } } },
      { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$value', 1] }, 10, -2] } } } }
    ], as: 'credits' } },
    { $lookup: { from: Doubt.collection.name, localField: '_id', foreignField: 'acceptedAnswer', as: 'accepted' } },
    { $group: { _id: null, total: { $sum: { $add: [{ $ifNull: [{ $arrayElemAt: ['$credits.total', 0] }, 0] }, { $multiply: [{ $size: '$accepted' }, 15] }] } } } }
  ]);
  return rows[0]?.total || 0;
}

export async function ensureReputation(userId) {
  const user = await User.findById(userId).select('reputation').lean();
  if (!user) return 0;
  if (typeof user.reputation === 'number') return user.reputation;
  const score = await calculateReputation(userId);
  // Only initialise a legacy account once. A concurrent initialiser cannot
  // overwrite increments already applied by another request.
  await User.updateOne({ _id: userId, reputation: null }, { $set: { reputation: score } });
  return (await User.findById(userId).select('reputation').lean())?.reputation || 0;
}

export async function addReputation(userId, delta) {
  if (delta) await User.updateOne({ _id: userId }, { $inc: { reputation: delta } });
}
