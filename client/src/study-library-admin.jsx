import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './api';
import { ErrorBox } from './components';

export function StudyLibraryAdmin({ token }) {
  const [library, setLibrary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api('/admin/study-library', { token, signal: controller.signal })
      .then(setLibrary)
      .catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [token]);

  async function publish() {
    if (!window.confirm(`Publish ${library.questionCount} labeled demo questions and AI answers to the public feed?`)) return;
    setBusy(true);
    setError('');
    try {
      await api('/admin/study-library', { method: 'POST', token, body: { confirm: 'study-library-v1' } });
      setLibrary(current => ({ ...current, published: true, presentCount: current.questionCount }));
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function republish() {
    if (!window.confirm(`Reset the study library and publish all ${library.questionCount} demo questions again? Library questions that were deleted on purpose come back too.`)) return;
    setBusy(true);
    setError('');
    try {
      await api('/admin/study-library', { method: 'DELETE', token, body: { confirm: 'study-library-v1' } });
      await api('/admin/study-library', { method: 'POST', token, body: { confirm: 'study-library-v1' } });
      setLibrary(current => ({ ...current, published: true, presentCount: current.questionCount }));
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel">
    <h2>Study library</h2>
    <ErrorBox message={error} />
    {library && <>
      <p>{library.questionCount} demo questions and AI-generated study answers across {library.subjects.length} subjects.</p>
      <p className="muted">{library.subjects.join(' · ')}</p>
      {library.published
        ? library.presentCount < library.questionCount
          ? <>
              <p>Marked as published, but only {library.presentCount} of {library.questionCount} questions are live.</p>
              <button className="button" type="button" onClick={republish} disabled={busy}>{busy ? 'Republishing…' : 'Reset and republish'}</button>
            </>
          : <p><Link to={`/?scope=all&tag=${encodeURIComponent(library.tag)}`}>Browse published study questions</Link></p>
        : <button className="button" type="button" onClick={publish} disabled={busy}>{busy ? 'Publishing…' : 'Publish study library'}</button>}
    </>}
  </section>;
}
