import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { tokenFor } from '../src/auth.js';
import { Answer, Doubt, TeacherRequest, User, Vote } from '../src/models.js';

test('teacher verification, dashboard queue and answer highlight', async t => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const dbName = `forum_test_${Date.now()}_${randomBytes(3).toString('hex')}`;
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017', { dbName });
  const server = createApp().listen(0, '127.0.0.1');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    assert.equal(mongoose.connection.name, dbName);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
  const call = async (path, { token, method = 'GET', body, status = 200 } = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`, {
      method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${payload.message}`);
    return payload;
  };
  const make = (name, extra = {}) => User.create({ name, email: `${name.toLowerCase()}@example.test`, reputation: 0, emailVerifiedAt: new Date(), ...extra });
  const [student, voter, moderator, admin] = await Promise.all([make('Riya'), make('Voter'), make('Mod', { role: 'moderator' }), make('Admin', { role: 'admin' })]);
  const tokens = Object.fromEntries(Object.entries({ student, voter, moderator, admin }).map(([key, user]) => [key, tokenFor(user)]));

  await t.test('sign-up with the teacher checkbox creates a student account plus a pending request', async () => {
    const signup = await call('/auth/signup', { method: 'POST', status: 201, body: {
      name: 'Prof Verma', email: 'verma@example.test', password: 'password-123',
      teacher: { subjects: ['DSA', 'Operating Systems'], note: 'Assistant professor, CS dept' }
    } });
    assert.equal(signup.data.user.role, 'student');
    const request = await TeacherRequest.findOne({ user: signup.data.user._id });
    assert.equal(request.status, 'pending');
    // Subject aliases are normalised to catalogue names for the dashboard filter.
    assert.deepEqual(request.subjects, ['Data Structures', 'Operating Systems']);
    // An invalid teacher request blocks the sign-up before the account exists.
    await call('/auth/signup', { method: 'POST', status: 400, body: {
      name: 'No Subjects', email: 'nosubjects@example.test', password: 'password-123', teacher: { subjects: [], note: 'Physics faculty' }
    } });
    assert.equal(await User.countDocuments({ email: 'nosubjects@example.test' }), 0);
  });

  let requestId;
  await t.test('a student can request the badge later, once at a time', async () => {
    await call('/teacher-requests', { token: tokens.student, method: 'POST', status: 400, body: { subjects: ['Java'], note: 'Hi' } });
    const created = await call('/teacher-requests', { token: tokens.student, method: 'POST', status: 201, body: { subjects: ['Java', 'java'], note: 'Physics faculty, XYZ Academy' } });
    requestId = created.data._id;
    assert.deepEqual(created.data.subjects, ['Java']);
    await call('/teacher-requests', { token: tokens.student, method: 'POST', status: 409, body: { subjects: ['Java'], note: 'Asking again already' } });
    const mine = await call('/teacher-requests/me', { token: tokens.student });
    assert.equal(mine.data.status, 'pending');
    const none = await call('/teacher-requests/me', { token: tokens.voter });
    assert.equal(none.data, null);
  });

  await t.test('only admins review the queue; decline keeps the student role and allows retrying', async () => {
    await call('/admin/teacher-requests', { token: tokens.moderator, status: 403 });
    await call('/admin/teacher-requests', { token: tokens.student, status: 403 });
    const queue = await call('/admin/teacher-requests', { token: tokens.admin });
    assert.equal(queue.data.total, 2);
    // Oldest first, so the longest-waiting request is reviewed first.
    assert.ok(new Date(queue.data.items[0].createdAt) <= new Date(queue.data.items[1].createdAt));
    await call(`/admin/teacher-requests/${requestId}`, { token: tokens.admin, method: 'PATCH', status: 400, body: { status: 'nonsense' } });
    await call(`/admin/teacher-requests/${requestId}`, { token: tokens.admin, method: 'PATCH', status: 400, body: { status: 'declined' } });
    await call(`/admin/teacher-requests/${requestId}`, { token: tokens.admin, method: 'PATCH', body: { status: 'declined', reason: 'Please add which institute you teach at.' } });
    assert.equal((await User.findById(student._id)).role, 'student');
    const mine = await call('/teacher-requests/me', { token: tokens.student });
    assert.equal(mine.data.status, 'declined');
    assert.match(mine.data.declineReason, /institute/);
    // A resolved request stays resolved.
    await call(`/admin/teacher-requests/${requestId}`, { token: tokens.admin, method: 'PATCH', status: 409, body: { status: 'approved' } });
    // Declining does not block a new request.
    const retry = await call('/teacher-requests', { token: tokens.student, method: 'POST', status: 201, body: { subjects: ['Java'], note: 'Physics faculty, XYZ Academy, 6 years' } });
    requestId = retry.data._id;
  });

  await t.test('approval grants the badge, records the decision and notifies the teacher', async () => {
    const result = await call(`/admin/teacher-requests/${requestId}`, { token: tokens.admin, method: 'PATCH', body: { status: 'approved' } });
    assert.equal(result.data.status, 'approved');
    assert.equal(String(result.data.decidedBy), String(admin._id));
    const promoted = await User.findById(student._id);
    assert.equal(promoted.role, 'teacher');
    assert.deepEqual([...promoted.teacherSubjects], ['Java']);
    const notifications = await call('/notifications', { token: tokens.student });
    assert.equal(notifications.data.items[0].type, 'teacher_approved');
    // A teacher cannot file another request.
    await call('/teacher-requests', { token: tokens.student, method: 'POST', status: 409, body: { subjects: ['Java'], note: 'Again?' } });
    // Teachers manage their subjects; students cannot.
    await call('/users/me', { token: tokens.voter, method: 'PUT', status: 403, body: { name: 'Voter', teacherSubjects: ['Java'] } });
    const updated = await call('/users/me', { token: tokens.student, method: 'PUT', body: { name: 'Riya', teacherSubjects: ['Java', 'DBMS'] } });
    assert.deepEqual(updated.data.teacherSubjects, ['Java', 'DBMS']);
  });

  await t.test('the teacher queue lists unresolved questions in registered subjects, oldest first', async () => {
    await call('/teacher/queue', { token: tokens.voter, status: 403 });
    const subject = (name, extra = {}) => Doubt.create({ title: `A long enough ${name} question title`, body: 'A long enough description of the question body.', subject: name, author: voter._id, ...extra });
    const older = await subject('Java', { createdAt: new Date('2026-01-01') });
    const newer = await subject('DBMS');
    const foreign = await subject('Physics');
    const sample = await subject('Java', { tags: ['study-library'] });
    const solvedDoubt = await subject('Java');
    const solvedAnswer = await Answer.create({ doubt: solvedDoubt._id, author: student._id, body: 'Solved it with an explanation.' });
    await Doubt.updateOne({ _id: solvedDoubt._id }, { acceptedAnswer: solvedAnswer._id });
    const queue = await call('/teacher/queue', { token: tokens.student });
    const ids = queue.data.items.map(item => String(item._id));
    assert.deepEqual(ids, [String(older._id), String(newer._id)]);
    assert.ok(!ids.includes(String(foreign._id)) && !ids.includes(String(sample._id)) && !ids.includes(String(solvedDoubt._id)));
    assert.deepEqual(queue.data.subjects, ['Java', 'DBMS']);
    // An admin without registered subjects gets an empty queue, not an error.
    const empty = await call('/teacher/queue', { token: tokens.admin });
    assert.deepEqual(empty.data.items, []);
  });

  await t.test('teacher answers sort above other unaccepted answers, below the accepted one', async () => {
    const doubt = await Doubt.create({ title: 'Which answer should be read first here?', body: 'A long enough description of the question body.', subject: 'Java', author: voter._id });
    const studentAnswer = await Answer.create({ doubt: doubt._id, author: admin._id, body: 'A reply from a non-teacher with more votes.' });
    const teacherAnswer = await Answer.create({ doubt: doubt._id, author: student._id, body: 'A teacher reply with fewer votes.' });
    await Vote.create({ targetType: 'answer', target: studentAnswer._id, user: voter._id, value: 1 });
    let detail = await call(`/doubts/${doubt._id}`);
    assert.deepEqual(detail.data.answers.map(item => String(item._id)), [String(teacherAnswer._id), String(studentAnswer._id)]);
    // Acceptance still outranks the teacher highlight.
    await call(`/answers/${studentAnswer._id}/accept`, { token: tokens.voter, method: 'PATCH' });
    detail = await call(`/doubts/${doubt._id}`);
    assert.deepEqual(detail.data.answers.map(item => String(item._id)), [String(studentAnswer._id), String(teacherAnswer._id)]);
  });
});
