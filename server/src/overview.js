import { Answer, Doubt, Report, Resource, TeacherRequest, User } from './models.js';
import { requireAdmin } from './auth.js';

const DAY = 24 * 60 * 60 * 1000;

// The 200 sample questions, their placeholder accounts and their answers are
// not community activity, so they are left out of every number.
const SAMPLE_EMAIL = /@doubt-forum\.invalid$/;

export async function overview(now = Date.now()) {
  const thisWeek = new Date(now - 7 * DAY);
  const lastWeek = new Date(now - 14 * DAY);
  const sampleIds = await Doubt.find({ tags: 'study-library' }).distinct('_id');
  const community = { tags: { $ne: 'study-library' } };
  const realUsers = { isDeleted: { $ne: true }, email: { $not: SAMPLE_EMAIL } };
  const realAnswers = { doubt: { $nin: sampleIds } };
  const weekly = async (Model, base) => {
    const [current, previous] = await Promise.all([
      Model.countDocuments({ ...base, createdAt: { $gte: thisWeek } }),
      Model.countDocuments({ ...base, createdAt: { $gte: lastWeek, $lt: thisWeek } })
    ]);
    return { thisWeek: current, lastWeek: previous };
  };
  const answeredIds = await Answer.distinct('doubt', realAnswers);
  const [questions, answers, signups, unanswered, reports, teacherRequests, users, totalQuestions, totalAnswers, resources, downloads] = await Promise.all([
    weekly(Doubt, community), weekly(Answer, realAnswers), weekly(User, realUsers),
    Doubt.countDocuments({ ...community, _id: { $nin: answeredIds } }),
    Report.countDocuments({ status: 'pending' }), TeacherRequest.countDocuments({ status: 'pending' }),
    User.countDocuments(realUsers), Doubt.countDocuments(community), Answer.countDocuments(realAnswers),
    Resource.countDocuments(), Resource.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }])
  ]);
  return {
    weeks: { questions, answers, signups },
    waiting: { unanswered, reports, teacherRequests },
    totals: { users, questions: totalQuestions, answers: totalAnswers, resources, downloads: downloads[0]?.total || 0 }
  };
}

export function mountOverviewRoutes(admin, { wrap, ok }) {
  admin.get('/overview', requireAdmin, wrap(async (req, res) => ok(res, await overview())));
}
