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
      setLibrary(current => ({ ...current, published: true }));
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
        ? <p><Link to={`/?scope=all&tag=${encodeURIComponent(library.tag)}`}>Browse published study questions</Link></p>
        : <button className="button" type="button" onClick={publish} disabled={busy}>{busy ? 'Publishing…' : 'Publish study library'}</button>}
    </>}
  </section>;
}
