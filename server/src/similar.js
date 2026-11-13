import { Doubt, Answer } from './models.js';
import { findDoc } from './forum.js';

// Title or tag matches score about 11 or more; a match only in the body scores
// about 0.5, which is noise for "similar question" suggestions.
export const MIN_SCORE = 5;
const SHORTEST_QUERY = 8;

// $text treats quotes as phrases and a leading minus as exclusion; people type
// both in titles, so neutralise them.
const cleanQuery = value => String(value ?? '').replace(/["\\]/g, ' ').replace(/(^|\s)-+/g, '$1').replace(/\s+/g, ' ').trim().slice(0, 300);

export async function similarDoubts(query, { exclude, limit = 5 } = {}) {
  const search = cleanQuery(query);
  if (search.length < SHORTEST_QUERY) return [];
  const rows = await Doubt.find(
    { $text: { $search: search }, ...(exclude ? { _id: { $ne: exclude } } : {}) },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } }).limit(limit * 2).select('title subject acceptedAnswer createdAt');
  const picked = rows.filter(row => row.get('score') >= MIN_SCORE).slice(0, limit);
  if (!picked.length) return [];
  const counts = new Map((await Answer.aggregate([
    { $match: { doubt: { $in: picked.map(row => row._id) } } },
    { $group: { _id: '$doubt', count: { $sum: 1 } } }
  ])).map(row => [String(row._id), row.count]));
  return picked.map(row => ({
    _id: row._id, title: row.title, subject: row.subject, createdAt: row.createdAt,
    status: row.acceptedAnswer ? 'solved' : 'open', answerCount: counts.get(String(row._id)) || 0
  }));
}

export function mountSimilarRoutes(api, { wrap, ok }) {
  // Registered before /doubts/:id so "similar" is not read as a question id.
  api.get('/doubts/similar', wrap(async (req, res) => ok(res, await similarDoubts(req.query.title))));
  api.get('/doubts/:id/related', wrap(async (req, res) => {
    const doubt = await findDoc(Doubt, req.params.id);
    const topics = doubt.tags.filter(tag => tag !== 'study-library');
    ok(res, await similarDoubts(`${doubt.title} ${topics.join(' ')}`, { exclude: doubt._id }));
  }));
}
