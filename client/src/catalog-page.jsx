import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './context';
import { api } from './api';
import { ErrorBox } from './components';
export function CatalogPage() {
  const { subjects, refreshSubjects, institutions, refreshInstitutions, token, notify } = useAuth(); const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); const form = event.currentTarget; setBusy(true); setError('');
    const body = Object.fromEntries(new FormData(form)); body.aliases = body.aliases.split(',').map(value => value.trim()).filter(Boolean);
    try { await api('/admin/subjects', { method: 'POST', token, body }); form.reset(); await refreshSubjects(); notify('Subject added to the catalogue.'); }
    catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  async function addInstitution(event) {
    event.preventDefault(); const form = event.currentTarget; setBusy(true); setError('');
    try { await api('/admin/institutions', { method: 'POST', token, body: Object.fromEntries(new FormData(form)) }); form.reset(); await refreshInstitutions(); notify('College added.'); }
    catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <section className="account-page"><Link to="/admin">← Moderation</Link><h1>Subject catalogue</h1><p>Add a canonical subject and alternative names. Aliases help students find the same subject under different names.</p><ErrorBox message={error} /><form className="panel" onSubmit={submit}><label>Subject name<input name="name" required minLength={2} maxLength={60} /></label><label>Slug (optional)<input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} placeholder="e.g. computer-science" /></label><label>Alternative names<input name="aliases" placeholder="Separate names with commas" maxLength={900} /></label><label>Field (optional)<input name="field" maxLength={60} /></label><button className="button" disabled={busy}>Add subject</button></form><ul>{subjects.map(subject => <li key={subject._id}>{subject.icon} <strong>{subject.name}</strong>{subject.aliases.length ? ` — ${subject.aliases.join(', ')}` : ''}</li>)}</ul><h2>Colleges</h2><p>College selection is for public feed discovery, not a verified membership badge.</p><form className="panel" onSubmit={addInstitution}><label>College name<input name="name" required minLength={2} maxLength={140} /></label><label>College slug (optional)<input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} /></label><label>Country code (optional)<input name="country" minLength={2} maxLength={2} placeholder="IN" /></label><button className="button" disabled={busy}>Add college</button></form><ul>{institutions.map(item => <li key={item._id}>{item.name}{item.country ? ` (${item.country})` : ''}</li>)}</ul></section>;
}
