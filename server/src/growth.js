import { Answer, Doubt, Vote } from './models.js';

// Milestones are derived from counts, never stored, so they can never drift.
const MILESTONES = [
  { key: 'first-question', label: 'First question', hint: 'Ask your first doubt', stat: 'questions', target: 1 },
  { key: 'first-answer', label: 'First answer', hint: 'Help a classmate with an answer', stat: 'answers', target: 1 },
  { key: 'first-accepted', label: 'First accepted answer', hint: 'Get an answer accepted by the asker', stat: 'accepted', target: 1 },
  { key: 'helper-10', label: '10 answers given', hint: 'Give 10 answers', stat: 'answers', target: 10 },
  { key: 'liked-25', label: '25 upvotes on answers', hint: 'Earn 25 upvotes across your answers', stat: 'answerUpvotes', target: 25 },
  { key: 'shared-doubt-10', label: 'A doubt 10 students share', hint: 'Get 10 "Same doubt" presses on your questions', stat: 'sameDoubt', target: 10 },
  { key: 'teacher-endorsed', label: 'Teacher endorsed', hint: 'Have a teacher endorse one of your answers', stat: 'endorsed', target: 1 }
];

// includeAnonymous: only the owner and staff count questions asked anonymously.
export async function growthFor(userId, { includeAnonymous = false } = {}) {
  const questionFilter = { author: userId, ...(includeAnonymous ? {} : { isAnonymous: { $ne: true } }) };
  const [questionIds, answers] = await Promise.all([
    Doubt.find(questionFilter).distinct('_id'),
    Answer.find({ author: userId }).select('_id endorsedBy').lean()
  ]);
  const answerIds = answers.map(answer => answer._id);
  const [accepted, answerUpvotes, sameDoubt] = await Promise.all([
    answerIds.length ? Doubt.countDocuments({ acceptedAnswer: { $in: answerIds } }) : 0,
    answerIds.length ? Vote.countDocuments({ targetType: 'answer', target: { $in: answerIds }, value: 1 }) : 0,
    questionIds.length ? Vote.countDocuments({ targetType: 'doubt', target: { $in: questionIds }, value: 1 }) : 0
  ]);
  const stats = { questions: questionIds.length, answers: answers.length, accepted, answerUpvotes, sameDoubt, endorsed: answers.filter(answer => answer.endorsedBy).length };
  const milestones = MILESTONES.map(({ key, label, hint, stat, target }) => ({ key, label, hint, target, progress: Math.min(stats[stat], target), earned: stats[stat] >= target }));
  return { stats, milestones };
}
