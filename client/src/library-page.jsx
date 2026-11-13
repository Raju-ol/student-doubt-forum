import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Download, ExternalLink, FileText, Link2, Presentation, Sparkles, Trash2, Upload } from 'lucide-react';
import { API_ROOT, api } from './api';
import { useAuth } from './context';
import { useResource } from './pages';
import { formatSize } from './format';
import { Avatar, ErrorBox, Loading, Empty, Pager } from './components';

export const RESOURCE_CATEGORIES = [['', 'All'], ['notes', 'Notes'], ['papers', 'Previous Year Papers'], ['cheatsheets', 'Cheat Sheets'], ['books', 'Books'], ['others', 'Others']];
const KIND_LABELS = { pdf: 'PDF', doc: 'DOC', ppt: 'PPT', link: 'Link' };
const MAX_FILE = 4 * 1024 * 1024;

const KindIcon = ({ kind }) => kind === 'ppt' ? <Presentation aria-hidden="true" size={26} /> : kind === 'link' ? <Link2 aria-hidden="true" size={26} /> : <FileText aria-hidden="true" size={26} />;
const downloadUrl = resource => `${API_ROOT}/resources/${resource._id}/download`;

function ResourceCard({ resource, canRemove, onRemove }) {
  const details = [KIND_LABELS[resource.kind], formatSize(resource.size)].filter(Boolean).join(' · ');
  return <li className="rcard">
    <div className="rcard__head">
      <span className={`ftile ftile--${resource.kind}`}><KindIcon kind={resource.kind} /></span>
      <div className="rcard__info">
        <h3 title={resource.title}>{resource.title}</h3>
        <p>{details}</p>
        {resource.uploader && <p className="rcard__by">by {resource.uploader.name}{resource.fromTeacher && <span className="badge badge--teacher rcard__teacher">✓ Teacher</span>}</p>}
      </div>
    </div>
    <a className="rcard__download" href={downloadUrl(resource)} target="_blank" rel="noopener noreferrer">
      {resource.kind === 'link' ? <ExternalLink aria-hidden="true" size={16} /> : <Download aria-hidden="true" size={16} />}
      {resource.kind === 'link' ? 'Open' : 'Download'}<span className="visually-hidden">: {resource.title}</span>
    </a>
    {canRemove && <button type="button" className="rcard__remove" onClick={() => onRemove(resource)} aria-label={`Remove ${resource.title}`}><Trash2 aria-hidden="true" size={15} /></button>}
  </li>;
}

export function LibraryPage() {
  const { user, token, notify } = useAuth();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const search = params.get('search') || '';
  const page = params.get('page') || '1';
  const shelf = params.get('shelf') === 'teacher' ? 'teacher' : '';
  const query = new URLSearchParams({ page });
  if (category) query.set('category', category);
  if (shelf) query.set('shelf', shelf);
  if (search) query.set('search', search);
  const list = useResource('/resources?' + query.toString());
  const popular = useResource('/resources/popular');
  const popularItems = Array.isArray(popular.data) ? popular.data : [];
  const isStaff = ['admin', 'moderator'].includes(user?.role);

  function choose(value) {
    const next = new URLSearchParams(params);
    next.delete('page');
    if (value) next.set('category', value); else next.delete('category');
    setParams(next);
  }
  function toggleShelf() {
    const next = new URLSearchParams(params);
    next.delete('page');
    if (shelf) next.delete('shelf'); else next.set('shelf', 'teacher');
    setParams(next);
  }
  async function remove(resource) {
    if (!window.confirm(`Remove “${resource.title}” from the library?`)) return;
    try { await api(`/resources/${resource._id}`, { method: 'DELETE', token }); notify('Resource removed.'); list.refresh(); popular.refresh(); }
    catch (error) { notify(error.message); }
  }

  return <div className="dx-page">
    <div className="dx-main">
      <section className="dx-hero dx-hero--library" aria-labelledby="library-heading">
        <div className="dx-hero__text">
          <h1 id="library-heading">Study <span className="dx-accent">Library</span></h1>
          <p>Access curated notes, resources and study materials to boost your learning! <Sparkles className="dx-hero__heart" aria-hidden="true" size={15} /></p>
        </div>
        <p className="dx-hero__script" aria-hidden="true">Study Smart Not Hard!</p>
        <img className="dx-hero__art" src="/illustrations/hero-library.png" alt="" width="480" height="320" />
      </section>

      <div className="dx-controls">
        <div className="dx-chips" role="group" aria-label="Filter by type">
          {RESOURCE_CATEGORIES.map(([value, label]) => <button key={value || 'all'} type="button" className="dx-chip" aria-pressed={category === value} onClick={() => choose(value)}>{label}</button>)}
          <button type="button" className="dx-chip dx-chip--teacher" aria-pressed={shelf === 'teacher'} onClick={toggleShelf}>✓ Teacher recommended</button>
        </div>
      </div>

      {search && <div className="dx-active"><button type="button" className="dx-active__chip" aria-label={`Remove filter “${search}”`} onClick={() => { const next = new URLSearchParams(params); next.delete('search'); setParams(next); }}>“{search}” <span aria-hidden="true">×</span></button></div>}

      <section className="dx-results" aria-label="Study materials">
        <ErrorBox message={list.error} retry={list.refresh} />
        {list.loading && <Loading />}
        {!list.loading && !list.error && (list.data?.items.length
          ? <ul className="dx-rgrid">{list.data.items.map(resource => <ResourceCard key={resource._id} resource={resource} canRemove={Boolean(user) && (isStaff || resource.uploader?._id === user._id)} onRemove={remove} />)}</ul>
          : <Empty title={shelf && !search && !category ? 'No teacher recommendations yet' : search || category || shelf ? 'No matching materials' : 'No materials shared yet'}>
              {shelf && !search && !category ? 'Verified teachers can share notes and papers here; they will be listed on this shelf.' : search || category || shelf ? 'Try another category or clear the search.' : 'Be the first to share notes, a previous year paper or a cheat sheet with your classmates.'}
            </Empty>)}
        {list.data && !list.loading && !list.error && <Pager page={list.data.page} pages={list.data.pages} onChange={value => {
          const next = new URLSearchParams(params); next.set('page', value); setParams(next); window.scrollTo?.({ top: 0 });
        }} />}
      </section>
    </div>

    <aside className="dx-aside" aria-label="Library highlights">
      <section className="dx-widget">
        <h2>Popular Resources</h2>
        {popularItems.length > 0
          ? <ol className="dx-popular">{popularItems.map((resource, index) => <li key={resource._id}><span className="dx-popular__rank">{index + 1}</span><a href={downloadUrl(resource)} target="_blank" rel="noopener noreferrer">{resource.title}</a></li>)}</ol>
          : <p className="dx-widget__empty">The most downloaded materials will be listed here.</p>}
      </section>
      <section className="dx-widget dx-widget--share">
        <h2>Have useful notes?</h2>
        <p>Share them with the community!</p>
        <Link className="dx-button" to="/library/share"><Upload aria-hidden="true" size={16} />Upload Resource <ArrowRight aria-hidden="true" size={15} /></Link>
      </section>
      <section className="dx-widget">
        <h2>Worked Q&amp;A</h2>
        <p className="dx-widget__text">Exam-style questions with step-by-step explanations.</p>
        <Link className="dx-widget__link" to="/?scope=all&tag=study-library">Browse worked questions <ArrowRight aria-hidden="true" size={15} /></Link>
      </section>
    </aside>
  </div>;
}

export function ShareResource() {
  const { user, token, notify } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('file');
  const [form, setForm] = useState({ title: '', category: 'notes', description: '', link: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const change = key => event => setForm({ ...form, [key]: event.target.value });

  function pick(event) {
    const chosen = event.target.files[0];
    if (chosen && chosen.size > MAX_FILE) { setError('Files must be 4 MB or smaller. Share a link for larger files.'); event.target.value = ''; return; }
    setError(''); setFile(chosen || null);
  }
  async function submit(event) {
    event.preventDefault(); setError('');
    if (mode === 'file' && !file) { setError('Choose a PDF, Word or PowerPoint file.'); return; }
    setBusy(true);
    try {
      let body;
      if (mode === 'file') {
        body = new FormData();
        body.append('title', form.title); body.append('category', form.category);
        if (form.description) body.append('description', form.description);
        body.append('file', file);
      } else body = { title: form.title, category: form.category, description: form.description || undefined, link: form.link };
      await api('/resources', { method: 'POST', token, body });
      notify('Resource shared. Thank you!');
      navigate('/library');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <div className="dx-form-page">
    <Link className="back-link" to="/library">← Back to the library</Link>
    <h1>Share a study resource</h1>
    <p className="muted">Notes, previous year papers, cheat sheets or books that helped you. Only share material you are allowed to share.</p>
    {user?.role === 'teacher' && <p className="dx-notice" role="note">As a verified teacher, what you share is labelled <strong>✓ Teacher</strong> and listed on the Teacher recommended shelf.</p>}
    <ErrorBox message={error} />
    <form className="dx-form" onSubmit={submit}>
      <label htmlFor="resource-title">Title</label>
      <input id="resource-title" value={form.title} onChange={change('title')} required minLength={4} maxLength={120} placeholder="e.g. DBMS Notes (Complete)" />
      <label htmlFor="resource-category">Category</label>
      <select id="resource-category" value={form.category} onChange={change('category')}>
        {RESOURCE_CATEGORIES.filter(([value]) => value).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <label htmlFor="resource-description">Description <span className="muted">(optional)</span></label>
      <textarea id="resource-description" rows={3} value={form.description} onChange={change('description')} maxLength={300} placeholder="Which semester, unit or exam is this for?" />
      <fieldset className="dx-mode">
        <legend>How do you want to share it?</legend>
        <label><input type="radio" name="mode" checked={mode === 'file'} onChange={() => setMode('file')} /> Upload a file</label>
        <label><input type="radio" name="mode" checked={mode === 'link'} onChange={() => setMode('link')} /> Share a link</label>
      </fieldset>
      {mode === 'file'
        ? <><label htmlFor="resource-file">PDF, Word or PowerPoint · up to 4 MB</label>
          <input id="resource-file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={pick} /></>
        : <><label htmlFor="resource-link">Link (Google Drive, OneDrive…)</label>
          <input id="resource-link" type="url" value={form.link} onChange={change('link')} required placeholder="https://" maxLength={500} /></>}
      <button className="dx-button" type="submit" disabled={busy}>{busy ? 'Sharing…' : 'Share with the community'}</button>
    </form>
  </div>;
}

export function ContributorsPage() {
  const { data, error, loading, refresh } = useResource('/contributors');
  const list = Array.isArray(data) ? data : [];
  return <div className="dx-form-page">
    <Link className="back-link" to="/">← Back to questions</Link>
    <h1>Top Contributors</h1>
    <p className="muted">Students who earn the most reputation by writing answers other students find useful.</p>
    <ErrorBox message={error} retry={refresh} />
    {loading && <Loading />}
    {!loading && !error && (list.length
      ? <ol className="dx-people">{list.map((person, index) => <li key={person._id}><span className="dx-popular__rank">{index + 1}</span><Avatar name={person.name} /><Link to={`/users/${person._id}`}>{person.name}</Link><strong>{person.reputation} pts</strong></li>)}</ol>
      : <Empty title="No contributors yet">Answer a question and get upvotes to appear here.</Empty>)}
  </div>;
}
