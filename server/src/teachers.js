import { TeacherRequest, User, Doubt } from './models.js';
import { fail, text, positiveInt } from './validation.js';
import { requireUser, requireAdmin } from './auth.js';
import { resolveSubject, subjectFilter } from './subjects.js';
import { institutionFields } from './institutions.js';
import { changeUserRole } from './admin-roles.js';
import { notifyUser } from './notifications.js';
import { recordAudit } from './audit.js';
import { findDoc, decorateMany, authorFields } from './forum.js';

export async function teacherSubjectList(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) fail(400, 'Choose 1 to 5 subjects you teach.');
  const names = [];
  for (const item of value) {
    // Normalise to the catalogue name when the subject is known, so the
    // dashboard filter matches questions the same way the feed does.
    const { subject } = await resolveSubject(item);
    if (!names.includes(subject)) names.push(subject);
  }
  return names;
}

export async function teacherRequestFields(body) {
  return {
    subjects: await teacherSubjectList(body.subjects),
    note: text(body.note, 'About your teaching', 5, 200),
    ...await institutionFields(body)
  };
}

export function mountTeacherRoutes(api, { wrap, ok }) {
  api.post('/teacher-requests', requireUser, wrap(async (req, res) => {
    if (req.user.role === 'teacher') fail(409, 'You already have the Teacher badge.');
    if (req.user.role !== 'student') fail(409, 'Your account already has moderation access.');
    const fields = await teacherRequestFields(req.body);
    if (fields.institution === undefined && req.user.institution) fields.institution = req.user.institution;
    if (await TeacherRequest.exists({ user: req.user._id, status: 'pending' })) fail(409, 'Your teacher request is already waiting for review.');
    try {
      const request = await TeacherRequest.create({ ...fields, user: req.user._id });
      ok(res, request, 'Teacher request sent. You can keep using the forum while it is reviewed.', 201);
    } catch (error) {
      if (error.code === 11000) fail(409, 'Your teacher request is already waiting for review.');
      throw error;
    }
  }));
  api.get('/teacher-requests/me', requireUser, wrap(async (req, res) => {
    const request = await TeacherRequest.findOne({ user: req.user._id }).sort({ createdAt: -1, _id: -1 }).populate('institution', 'name');
    ok(res, request);
  }));
  // The teacher dashboard: unresolved questions in the subjects the teacher
  // registered, oldest first, so long-waiting students are seen first.
  api.get('/teacher/queue', requireUser, wrap(async (req, res) => {
    if (!['teacher', 'admin'].includes(req.user.role)) fail(403, 'The teacher dashboard is for verified teachers.');
    const page = positiveInt(req.query.page, 1, 10000);
    const limit = positiveInt(req.query.limit, 10, 30);
    const subjects = req.user.teacherSubjects || [];
    if (!subjects.length) return ok(res, { items: [], total: 0, page: 1, pages: 0, subjects });
    const clauses = (await Promise.all(subjects.map(name => subjectFilter(name)))).flatMap(clause => clause.$or ?? [clause]);
    const filter = { acceptedAnswer: null, tags: { $ne: 'study-library' }, $or: clauses };
    const [docs, total] = await Promise.all([
      Doubt.find(filter).sort({ createdAt: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).populate('author', authorFields),
      Doubt.countDocuments(filter)
    ]);
    ok(res, { items: await decorateMany(docs, 'doubt', req.user), total, page, pages: Math.ceil(total / limit), subjects });
  }));
}

export function mountTeacherAdminRoutes(admin, { wrap, ok }) {
  admin.get('/teacher-requests', requireAdmin, wrap(async (req, res) => {
    const page = positiveInt(req.query.page, 1, 10000);
    const filter = { status: 'pending' };
    const [items, total] = await Promise.all([
      TeacherRequest.find(filter).sort({ createdAt: 1, _id: 1 }).skip((page - 1) * 25).limit(25).populate('user', 'name email role createdAt').populate('institution', 'name'),
      TeacherRequest.countDocuments(filter)
    ]);
    ok(res, { items, page, pages: Math.ceil(total / 25), total });
  }));
  admin.patch('/teacher-requests/:id', requireAdmin, wrap(async (req, res) => {
    if (!['approved', 'declined'].includes(req.body.status)) fail(400, 'Choose approve or decline.');
    const reason = req.body.status === 'declined' ? text(req.body.reason, 'Decline reason', 2, 200) : '';
    const request = await findDoc(TeacherRequest, req.params.id);
    const updated = await TeacherRequest.findOneAndUpdate(
      { _id: request._id, status: 'pending' },
      { $set: { status: req.body.status, decidedBy: req.user._id, decidedAt: new Date(), declineReason: reason } },
      { new: true }
    );
    if (!updated) fail(409, 'This request has already been resolved.');
    if (req.body.status === 'approved') {
      try {
        await changeUserRole(req.user, String(request.user), 'teacher');
        await User.updateOne({ _id: request.user }, { $set: { teacherSubjects: request.subjects } });
      } catch (error) {
        // Leave the request open again so the admin can retry or decline.
        await TeacherRequest.updateOne({ _id: request._id }, { $set: { status: 'pending', decidedBy: null, decidedAt: null, declineReason: '' } });
        throw error;
      }
    }
    await notifyUser({ user: request.user, actor: req.user._id, type: req.body.status === 'approved' ? 'teacher_approved' : 'teacher_declined', eventKey: `teacher:${request._id}:${req.body.status}` });
    const requester = await User.findById(request.user).select('name');
    await recordAudit(req.user, req.body.status === 'approved' ? 'teacher.approve' : 'teacher.decline', `${req.body.status === 'approved' ? 'Approved' : 'Declined'} the teacher request of ${requester?.name ?? 'a deleted user'}${reason ? `: ${reason}` : ''}`, { targetType: 'user', target: request.user });
    ok(res, updated, req.body.status === 'approved' ? 'Teacher badge granted. The teacher has been notified.' : 'Request declined. The requester has been notified.');
  }));
}
