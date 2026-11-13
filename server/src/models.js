import mongoose from 'mongoose';

const { Schema } = mongoose;
const ref = (name, required = true) => ({ type: Schema.Types.ObjectId, ref: name, required });
const options = { timestamps: true };
const image = new Schema({ url: String, publicId: String }, { _id: false });
const academicLevel = new Schema({ system: { type: String, enum: ['semester', 'year', 'grade', 'other'], required: true }, index: { type: Number, min: 1, max: 30 }, label: { type: String, maxlength: 60, required: true } }, { _id: false });
const userSchema = new Schema({
  name: { type: String, required: true, maxlength: 60 },
  email: { type: String, unique: true, required: true, lowercase: true },
  passwordHash: { type: String, select: false },
  googleSubject: { type: String, unique: true, sparse: true, select: false },
  role: { type: String, enum: ['student', 'teacher', 'moderator', 'admin'], default: 'student' },
  semester: { type: Number, min: 1, max: 8 },
  academicLevel: { type: academicLevel, default: undefined },
  institution: ref('Institution', false),
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
  subjectId: ref('Subject', false),
  institution: ref('Institution', false),
  semester: { type: Number, min: 1, max: 8 },
  academicLevel: { type: academicLevel, default: undefined },
  tags: [{ type: String, maxlength: 24 }],
  images: [image],
  author: ref('User'),
  acceptedAnswer: ref('Answer', false),
  views: { type: Number, default: 0, min: 0 }
}, options);
// Unfiltered feed sort.
doubtSchema.index({ createdAt: -1 });
// One compound index per feed filter, each ending in the createdAt sort key.
doubtSchema.index({ subject: 1, createdAt: -1 });
doubtSchema.index({ subjectId: 1, createdAt: -1 });
doubtSchema.index({ institution: 1, createdAt: -1 });
doubtSchema.index({ semester: 1, createdAt: -1 });
doubtSchema.index({ 'academicLevel.system': 1, 'academicLevel.index': 1, createdAt: -1 });
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
const resourceSchema = new Schema({
  title: { type: String, required: true, maxlength: 120 },
  description: { type: String, maxlength: 300, default: '' },
  category: { type: String, enum: ['notes', 'papers', 'cheatsheets', 'books', 'others'], required: true },
  kind: { type: String, enum: ['pdf', 'doc', 'ppt', 'link'], required: true },
  url: { type: String, required: true, maxlength: 500 },
  publicId: { type: String, default: null },
  size: { type: Number, default: 0, min: 0 },
  downloads: { type: Number, default: 0, min: 0 },
  uploader: ref('User')
}, options);
resourceSchema.index({ category: 1, createdAt: -1 });
resourceSchema.index({ downloads: -1, createdAt: -1 });
resourceSchema.index({ title: 'text', description: 'text' }, { name: 'resource_search' });
export const Resource = mongoose.model('Resource', resourceSchema);
const notificationSchema = new Schema({ user: ref('User'), actor: ref('User'), type: { type: String, enum: ['question_answered', 'answer_accepted', 'answer_commented'], required: true }, target: ref('Doubt'), readAt: { type: Date, default: null }, eventKey: { type: String, required: true, unique: true } }, options);
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
export const Notification = mongoose.model('Notification', notificationSchema);
const subjectSchema = new Schema({ name: { type: String, required: true, maxlength: 60 }, slug: { type: String, required: true, unique: true }, aliases: [String], keys: { type: [String], required: true }, field: { type: String, maxlength: 60 }, icon: { type: String, maxlength: 8 } }, options);
subjectSchema.index({ keys: 1 }, { unique: true });
export const Subject = mongoose.model('Subject', subjectSchema);
const institutionSchema = new Schema({ name: { type: String, required: true, maxlength: 140 }, slug: { type: String, required: true, unique: true }, country: { type: String, maxlength: 2 }, isVerified: { type: Boolean, default: false } }, options);
export const Institution = mongoose.model('Institution', institutionSchema);
