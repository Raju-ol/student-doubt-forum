import mongoose from 'mongoose';

const { Schema } = mongoose;
const ref = (name, required = true) => ({ type: Schema.Types.ObjectId, ref: name, required });
const options = { timestamps: true };
const image = new Schema({ url: String, publicId: String }, { _id: false });
const userSchema = new Schema({
  name: { type: String, required: true, maxlength: 60 },
  email: { type: String, unique: true, required: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  semester: { type: Number, min: 1, max: 8, required: true },
  // null identifies an existing account awaiting lazy initialisation/backfill.
  reputation: { type: Number, default: null },
  tokenVersion: { type: Number, default: 0, min: 0 },
  emailVerifiedAt: { type: Date, default: null },
  verificationHash: { type: String, select: false },
  verificationExpires: { type: Date, select: false },
  resetHash: { type: String, select: false },
  resetExpires: { type: Date, select: false },
  isBanned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }, deletedAt: Date
}, options);
const doubtSchema = new Schema({
  title: { type: String, required: true, maxlength: 160 },
  body: { type: String, required: true, maxlength: 12000 },
  subject: { type: String, required: true, maxlength: 60 },
  semester: { type: Number, required: true, min: 1, max: 8 },
  tags: [{ type: String, maxlength: 24 }],
  images: [image],
  author: ref('User'),
  acceptedAnswer: ref('Answer', false)
}, options);
// Unfiltered feed sort.
doubtSchema.index({ createdAt: -1 });
// One compound index per feed filter, each ending in the createdAt sort key.
doubtSchema.index({ subject: 1, createdAt: -1 });
doubtSchema.index({ semester: 1, createdAt: -1 });
doubtSchema.index({ tags: 1, createdAt: -1 });
doubtSchema.index({ acceptedAnswer: 1, createdAt: -1 });
doubtSchema.index({ author: 1, createdAt: -1 });
doubtSchema.index({ title: 'text', body: 'text', tags: 'text' }, { name: 'doubt_search', weights: { title: 10, tags: 5, body: 1 }, default_language: 'english' });
const answerSchema = new Schema({ doubt: ref('Doubt'), body: { type: String, required: true, maxlength: 12000 }, author: ref('User') }, options);
answerSchema.index({ doubt: 1, createdAt: 1 });
// Profile page lists a user's latest answers.
answerSchema.index({ author: 1, createdAt: -1 });
const voteSchema = new Schema({ targetType: { type: String, enum: ['doubt', 'answer'], required: true }, target: { type: Schema.Types.ObjectId, required: true }, user: ref('User'), value: { type: Number, enum: [-1, 1], required: true } }, options);
voteSchema.index({ targetType: 1, target: 1, user: 1 }, { unique: true });
const commentSchema = new Schema({ answer: ref('Answer'), body: { type: String, required: true, maxlength: 1000 }, author: ref('User') }, options);
// Every question detail view loads comments once per answer.
commentSchema.index({ answer: 1, createdAt: 1 });
const reportSchema = new Schema({ targetType: { type: String, enum: ['doubt', 'answer'], required: true }, target: { type: Schema.Types.ObjectId, required: true }, reason: { type: String, maxlength: 1000, required: true }, reporter: ref('User'), status: { type: String, enum: ['pending', 'dismissed', 'removed'], default: 'pending' } }, options);
// Moderation queue reads pending reports, newest first.
reportSchema.index({ status: 1, createdAt: -1 });
const uploadSchema = new Schema({ publicId: { type: String, unique: true, required: true }, url: { type: String, required: true }, owner: ref('User'), doubt: ref('Doubt', false) }, options);
// Unused-upload count check and attached-image cleanup.
uploadSchema.index({ owner: 1, doubt: 1 });
export const User = mongoose.model('User', userSchema);
export const Doubt = mongoose.model('Doubt', doubtSchema);
export const Answer = mongoose.model('Answer', answerSchema);
export const Vote = mongoose.model('Vote', voteSchema);
export const Comment = mongoose.model('Comment', commentSchema);
export const Report = mongoose.model('Report', reportSchema);
export const Upload = mongoose.model('Upload', uploadSchema);
