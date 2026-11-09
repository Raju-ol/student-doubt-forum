import mongoose from 'mongoose';
import { Doubt, Answer, Vote, Comment, Upload } from './models.js';
import { fail } from './validation.js';

export const authorFields = 'name role semester createdAt';
export async function findDoc(Model, id) {
  if (typeof id !== 'string' || !mongoose.isObjectIdOrHexString(id)) fail(400, 'Invalid record ID.');
  const doc = await Model.findById(id);
  if (!doc) fail(404, 'This content could not be found.');
  return doc;
}
// Two grouped queries for the whole page instead of two per item, so a 30-item
// feed costs 2 round trips rather than 60. The shape returned is unchanged.
export async function decorateMany(docs, type, user) {
  if (!docs.length) return [];
  const ids = docs.map(doc => doc._id);
  // The unique vote index guarantees at most one vote per user per target, so
  // summing the viewer's own value yields that single vote or 0.
  const mine = user?._id ? { $sum: { $cond: [{ $eq: ['$user', user._id] }, '$value', 0] } } : { $sum: 0 };
  const [voteRows, answerRows] = await Promise.all([
    Vote.aggregate([
      { $match: { targetType: type, target: { $in: ids } } },
      { $group: { _id: '$target', votes: { $sum: '$value' }, mine } }
    ]),
    type === 'doubt'
      ? Answer.aggregate([{ $match: { doubt: { $in: ids } } }, { $group: { _id: '$doubt', count: { $sum: 1 } } }])
      : []
  ]);
  const voteMap = new Map(voteRows.map(row => [String(row._id), row]));
  const answerMap = new Map(answerRows.map(row => [String(row._id), row.count]));
  return docs.map(doc => {
    const result = doc.toObject();
    const row = voteMap.get(String(doc._id));
    result.votes = row?.votes || 0;
    result.myVote = row?.mine || 0;
    if (type === 'doubt') {
      result.answerCount = answerMap.get(String(doc._id)) || 0;
      result.status = doc.acceptedAnswer ? 'solved' : 'open';
    }
    return result;
  });
}
export async function decorate(doc, type, user) {
  return (await decorateMany([doc], type, user))[0];
}
export async function toggleVote(req, Model, type) {
  const doc = await findDoc(Model, req.params.id);
  if (String(doc.author) === String(req.user._id)) fail(403, 'You cannot vote on your own content.');
  if (![1, -1].includes(req.body.value)) fail(400, 'Vote must be 1 or -1.');
  const filter = { targetType: type, target: doc._id, user: req.user._id };
  const previous = await Vote.findOne(filter);
  if (previous?.value === req.body.value) await Vote.deleteOne({ _id: previous._id });
  else await Vote.findOneAndUpdate(filter, { value: req.body.value }, { upsert: true, runValidators: true });
  await doc.populate('author', authorFields);
  return decorate(doc, type, req.user);
}
export async function removeAnswer(answer) {
  await Doubt.updateOne({ _id: answer.doubt, acceptedAnswer: answer._id }, { $unset: { acceptedAnswer: 1 } });
  await Promise.all([Comment.deleteMany({ answer: answer._id }), Vote.deleteMany({ targetType: 'answer', target: answer._id })]);
  await answer.deleteOne();
}
export async function removeDoubt(doubt, cloudinary) {
  const images = await Upload.find({ doubt: doubt._id });
  // Keep the records when remote deletion fails so the operation can be retried.
  for (const image of images) { await cloudinary.uploader.destroy(image.publicId); await image.deleteOne(); }
  const answers = await Answer.find({ doubt: doubt._id });
  for (const answer of answers) await removeAnswer(answer);
  await Vote.deleteMany({ targetType: 'doubt', target: doubt._id });
  await doubt.deleteOne();
}
export async function reputation(userId) {
  const answers = await Answer.find({ author: userId }).select('_id').lean();
  const ids = answers.map(a => a._id);
  const [votes, accepted] = await Promise.all([Vote.find({ targetType: 'answer', target: { $in: ids } }).lean(), Doubt.countDocuments({ acceptedAnswer: { $in: ids } })]);
  return votes.reduce((sum, v) => sum + (v.value === 1 ? 10 : -2), 0) + accepted * 15;
}
