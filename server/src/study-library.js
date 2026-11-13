import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import questions from './demo-questions.json' with { type: 'json' };
import answers from './demo-answers.json' with { type: 'json' };
import { Answer, Comment, Doubt, Subject, User, Vote } from './models.js';
import { ensureSubjects, subjectKey } from './subjects.js';
import { fail, text } from './validation.js';
import { recordAudit } from './audit.js';

const batch = 'study-library-v1';
const demoTag = 'study-library';
const questionLabel = 'This is a sample question from the Doubt Forum study library.';
const answerLabel = 'AI-generated study example. Verify important details with your course material.';
const imports = () => mongoose.connection.collection('study_library_imports');
const idFor = key => new mongoose.Types.ObjectId(
  createHash('sha256').update(`${batch}:${key}`).digest('hex').slice(0, 24)
);

function libraryItems() {
  const seenIds = new Set();
  const seenTitles = new Set();
  const items = questions.map(row => {
    const title = text(row.title, 'Title', 10, 160);
    if (seenIds.has(row.id) || seenTitles.has(title.toLowerCase())) throw new Error('Duplicate study library question.');
    seenIds.add(row.id);
    seenTitles.add(title.toLowerCase());
    const question = text(row.question, 'Question', 20, 11000);
    const answer = text(answers[row.id], 'Answer', 10, 11000);
    return {
      id: row.id,
      title,
      subject: row.subject,
      body: `${question}\n\n> ${questionLabel}`,
      answer: `${answer}\n\n> ${answerLabel}`,
    };
  });
  if (Object.keys(answers).length !== items.length) throw new Error('Study library question and answer counts differ.');
  return items;
}

async function importStudyLibrary(adminId) {
  const existing = await imports().findOne({ _id: batch });
  if (existing) return { alreadyImported: true, questionCount: existing.questionCount, answerCount: existing.answerCount };

  const items = libraryItems();
  await ensureSubjects();
  const subjectKeys = [...new Set(items.map(item => subjectKey(item.subject)))];
  const subjects = await Subject.find({ keys: { $in: subjectKeys } }).select('name keys').lean();
  const subjectsByKey = new Map(subjects.flatMap(subject => subject.keys.map(key => [key, subject])));
  if (subjectKeys.some(key => !subjectsByKey.has(key))) throw new Error('A study library subject is missing.');

  const now = new Date();
  const author = idFor('question-author');
  const responder = idFor('answer-author');
  await User.bulkWrite([
    { id: author, name: 'Study Library (Demo)', email: 'study-library@doubt-forum.invalid' },
    { id: responder, name: 'AI Study Assistant (Demo)', email: 'ai-study-assistant@doubt-forum.invalid' },
  ].map(({ id, ...fields }) => ({
    updateOne: {
      filter: { _id: id, email: fields.email },
      update: { $setOnInsert: { ...fields, role: 'student', reputation: 0, isBanned: true, createdAt: now, updatedAt: now } },
      upsert: true,
    },
  })), { timestamps: false });

  // Seed each answer before publishing its question. Deterministic IDs and
  // insert-only writes make interrupted or concurrent imports safe to retry.
  await Answer.bulkWrite(items.map(item => ({
    updateOne: {
      filter: { _id: idFor(`answer:${item.id}`), doubt: idFor(`question:${item.id}`), author: responder },
      update: { $setOnInsert: { body: item.answer, createdAt: now, updatedAt: now } },
      upsert: true,
    },
  })), { timestamps: false });
  await Doubt.bulkWrite(items.map(item => {
    const subject = subjectsByKey.get(subjectKey(item.subject));
    return {
      updateOne: {
        filter: { _id: idFor(`question:${item.id}`), author },
        update: { $setOnInsert: {
          title: item.title, body: item.body, subject: subject.name, subjectId: subject._id,
          tags: [demoTag], images: [], institution: null, createdAt: now, updatedAt: now,
        } },
        upsert: true,
      },
    };
  }), { timestamps: false });
  const result = { questionCount: items.length, answerCount: items.length };
  await imports().updateOne({ _id: batch }, {
    $setOnInsert: { ...result, importedBy: adminId, importedAt: now },
  }, { upsert: true });
  return { alreadyImported: false, ...result };
}

// Removes every library question, its answers, votes and comments, and the
// completion marker, so a fresh publish can rebuild the full set — the recovery
// path when the marker survives but the content was deleted from the database.
async function resetStudyLibrary() {
  const author = idFor('question-author');
  const doubtIds = (await Doubt.find({ author }).select('_id').lean()).map(doubt => doubt._id);
  const answerIds = (await Answer.find({ doubt: { $in: doubtIds } }).select('_id').lean()).map(answer => answer._id);
  await Vote.deleteMany({ $or: [{ targetType: 'doubt', target: { $in: doubtIds } }, { targetType: 'answer', target: { $in: answerIds } }] });
  await Comment.deleteMany({ answer: { $in: answerIds } });
  await Answer.deleteMany({ _id: { $in: answerIds } });
  await Doubt.deleteMany({ _id: { $in: doubtIds } });
  await imports().deleteOne({ _id: batch });
  return { removedQuestions: doubtIds.length, removedAnswers: answerIds.length };
}

export function mountStudyLibraryRoutes(admin, { wrap, ok, limiter }) {
  admin.get('/study-library', wrap(async (req, res) => {
    const complete = await imports().findOne({ _id: batch });
    const presentCount = await Doubt.countDocuments({ author: idFor('question-author') });
    const subjects = [...new Set(questions.map(question => question.subject))];
    ok(res, { published: Boolean(complete), presentCount, questionCount: questions.length, subjects, tag: demoTag });
  }));
  admin.delete('/study-library', limiter('study-library-import', 5, 15 * 60 * 1000, { account: true }), wrap(async (req, res) => {
    if (req.body.confirm !== batch) fail(400, 'Confirm the study library reset.');
    const result = await resetStudyLibrary();
    await recordAudit(req.user, 'library.reset', `Reset the Worked Q&A set (${result.removedQuestions} questions removed)`);
    ok(res, result, 'Study library reset. Publish it again to restore the full set.');
  }));
  admin.post('/study-library', limiter('study-library-import', 5, 15 * 60 * 1000, { account: true }), wrap(async (req, res) => {
    if (req.body.confirm !== batch) fail(400, 'Confirm the study library import.');
    const result = await importStudyLibrary(req.user._id);
    if (!result.alreadyImported) await recordAudit(req.user, 'library.publish', `Published the Worked Q&A set (${result.questionCount} questions)`);
    ok(res, result, result.alreadyImported ? 'Study library already published.' : 'Study library published.');
  }));
}
