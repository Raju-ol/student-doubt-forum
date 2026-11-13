import { Answer, Doubt, Report, User } from './models.js';
import { findDoc } from './forum.js';
import { fail } from './validation.js';
import { summarize } from './share.js';

// Read-only context for judging a report: what this person has posted and how
// often their posts were reported. No email, and no ban or role powers.
export function mountModerationContextRoutes(admin, { wrap, ok }) {
  admin.get('/users/:id/context', wrap(async (req, res) => {
    const user = await findDoc(User, req.params.id);
    if (user.isDeleted) fail(404, 'This account has been deleted.');
    const [questionIds, answerIds, recentQuestions, recentAnswers] = await Promise.all([
      Doubt.find({ author: user._id }).distinct('_id'),
      Answer.find({ author: user._id }).distinct('_id'),
      Doubt.find({ author: user._id }).sort({ createdAt: -1 }).limit(10).select('title isAnonymous createdAt'),
      Answer.find({ author: user._id }).sort({ createdAt: -1 }).limit(10).select('doubt body createdAt').populate('doubt', 'title')
    ]);
    const rows = await Report.aggregate([{ $match: { target: { $in: [...questionIds, ...answerIds] } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const reportsAbout = { pending: 0, dismissed: 0, removed: 0, ...Object.fromEntries(rows.map(row => [row._id, row.count])) };
    ok(res, {
      user: { _id: user._id, name: user.name, role: user.role, createdAt: user.createdAt, isBanned: user.isBanned },
      counts: { questions: questionIds.length, answers: answerIds.length },
      reportsAbout,
      recentQuestions: recentQuestions.map(item => ({ _id: item._id, title: item.title, isAnonymous: item.isAnonymous, createdAt: item.createdAt })),
      recentAnswers: recentAnswers.map(item => ({ _id: item._id, doubt: item.doubt ? { _id: item.doubt._id, title: item.doubt.title } : null, excerpt: summarize(item.body, 140), createdAt: item.createdAt }))
    });
  }));
}
