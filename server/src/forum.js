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
export async function decorate(doc, type, user) {
  const result = doc.toObject();
  const votes = await Vote.find({ targetType: type, target: doc._id }).lean();
  result.votes = votes.reduce((sum, vote) => sum + vote.value, 0);
  result.myVote = votes.find(vote => String(vote.user) === String(user?._id))?.value || 0;
  if (type === 'doubt') {
    result.answerCount = await Answer.countDocuments({ doubt: doc._id });
    result.status = doc.acceptedAnswer ? 'solved' : 'open';
  }
  return result;
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
