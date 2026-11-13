import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { api } from './api';
import { useAuth } from './context';
import { ErrorBox, Loading, Empty, Pager, QuestionRow, date, SubjectPicker, TeacherRequestFields } from './components';
import { useResource } from './pages';

// Account settings section: request the badge, see the request state, or (for
// verified teachers) manage the subjects that feed the teacher dashboard.
export function TeacherBadgeSettings() {
  const { user, token, notify, setUser } = useAuth();
  const { data: request, loading, refresh } = useResource(user.role === 'student' ? '/teacher-requests/me' : null);
  const [subjects, setSubjects] = useState(user.teacherSubjects || []);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!['student', 'teacher'].includes(user.role)) return null;

  async function submitRequest(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await api('/teacher-requests', { method: 'POST', token, body: { subjects, note } });
      notify('Teacher request sent. You can keep using the forum while it is reviewed.');
      setNote(''); setSubjects([]); refresh();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function saveSubjects(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const next = await api('/users/me', { method: 'PUT', token, body: { name: user.name, teacherSubjects: subjects } });
      setUser(next); notify('Teaching subjects updated.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <section aria-label="Teacher badge">
    <h2>Teacher badge</h2>
    <ErrorBox message={error} />
    {user.role === 'teacher' ? <>
      <p>You are a verified teacher. Your answers are highlighted, and <Link to="/teach">your dashboard</Link> lists unresolved questions in your subjects.</p>
      <form onSubmit={saveSubjects}>
        <SubjectPicker value={subjects} onChange={setSubjects} />
        <button className="button button--secondary" disabled={busy || !subjects.length}>Save teaching subjects</button>
      </form>
    </> : loading ? <Loading /> : request?.status === 'pending' ? <div className="dx-notice" role="status">
      <strong>Teacher verification pending.</strong> An admin will review your request{request.createdAt ? ` from ${date(request.createdAt)}` : ''}. You can keep asking and answering as a student meanwhile.
    </div> : <>
      {request?.status === 'declined' && <div className="dx-notice" role="status">
        <strong>Your previous request was declined.</strong>{request.declineReason ? ` Reason: ${request.declineReason}` : ''} You can send a new request below.
      </div>}
      <p>Teach at a college or coaching institute? Request the Teacher badge: an admin verifies every request, so the badge stays trustworthy.</p>
      <form onSubmit={submitRequest}>
        <TeacherRequestFields subjects={subjects} onSubjects={setSubjects} note={note} onNote={setNote} />
        <button className="button" disabled={busy || !subjects.length}>Request the Teacher badge</button>
      </form>
    </>}
  </section>;
}

// The teacher dashboard: unresolved questions in the teacher's subjects,
// oldest first — a ten-minute daily routine rather than a lucky find.
export function TeacherDashboard() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, error, loading, refresh } = useResource(`/teacher/queue?page=${page}`);
  const subjects = data?.subjects || user.teacherSubjects || [];
  return <section className="teach">
    <span className="overline">Teacher dashboard</span>
    <h1>Doubts waiting for you. <GraduationCap aria-hidden="true" size={28} /></h1>
    <p className="muted">Unresolved questions in your subjects, longest-waiting first. Ten minutes here goes a long way.</p>
    {subjects.length > 0 && <p className="teach__subjects">Your subjects: {subjects.map(name => <Link key={name} className="tag" to={`/?subject=${encodeURIComponent(name)}`}>{name}</Link>)} <Link className="text-button" to="/account">Change</Link></p>}
    <ErrorBox message={error} retry={refresh} />
    {loading ? <Loading /> : !error && (subjects.length === 0
      ? <Empty title="Choose your subjects first">Pick the subjects you teach in <Link to="/account">Account settings</Link>, and their unresolved questions will line up here.</Empty>
      : data?.items.length
        ? <>
            <p className="dx-count" aria-live="polite">{data.total} unresolved {data.total === 1 ? 'question' : 'questions'}</p>
            <ol className="dx-qlist">{data.items.map(doubt => <QuestionRow key={doubt._id} doubt={doubt} />)}</ol>
            <Pager page={data.page} pages={data.pages} onChange={next => { setPage(next); window.scrollTo?.({ top: 0 }); }} />
          </>
        : <Empty title="All caught up">No unresolved questions in your subjects right now. Check back tomorrow.</Empty>)}
  </section>;
}
