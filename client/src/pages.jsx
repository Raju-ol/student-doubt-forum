import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { api } from './api';
import { GoogleButton } from './google-button';
import { markdownToText } from './excerpt';
import { safeReturn, signInPath } from './navigation';
import { useUnsavedChanges } from './useUnsavedChanges';
import { TabList } from './tab-list';
import { AcademicFields, AcademicFilter } from './academic-fields';
import { parseAcademicForm, levelOf, levelLabel } from './academics';
import { InstitutionSelect } from './institution-select';
import { useAuth } from './context';
import { useSavedQuestions, savedStorageAvailable } from './saved-questions';
import { Mark, Avatar, Badge, Author, ErrorBox, Loading, Empty, Tags, DoubtCard, QuestionRow, SaveButton, Icon, Pager, VoteButtons, SemesterSelect, date, Markdown, MarkdownEditor } from './components';

function useResource(route) {
  const { token } = useAuth(); const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [version, setVersion] = useState(0);
  useEffect(() => { if (!route) { setLoading(false); return undefined; } const controller = new AbortController(); setLoading(true); setError(''); api(route, { token, signal: controller.signal }).then(result => { if (!controller.signal.aborted) setData(result); }).catch(err => { if (err.name !== 'AbortError') setError(err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [route, token, version]);
  const refresh = () => setVersion(value => value + 1);
  return { data, error, loading, refresh };
}
const STATUS_LABELS = { solved: 'Accepted answers', open: 'No accepted answer' };
const SCOPE_LABELS = { college: 'My college', subject: 'Subject worldwide', all: 'Everything' };
// Parameters that only shape the page, never the API request.
const VIEW_PARAMS = ['view'];

export function Feed() {
  const { subjects: catalogue, user: viewer, loading: sessionLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const query = params.get('search') || '';
  const [search, setSearch] = useState(query);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const savedView = params.get('view') === 'saved';
  const apiParams = new URLSearchParams(params);
  VIEW_PARAMS.forEach(key => apiParams.delete(key));
  const { data, error, loading, refresh } = useResource(savedView ? null : '/doubts?' + apiParams.toString());
  const saved = useSavedQuestions();
  const subject = params.get('subject') || '';
  const status = params.get('status') || '';
  const defaultScope = viewer?.institution ? 'college' : 'all';
  const scope = params.get('scope') || defaultScope;
  const tag = params.get('tag') || '';
  const isLibrary = tag === 'study-library';
  const level = params.get('academicSystem') || (params.get('semester') ? 'semester' : '');
  const advancedCount = [params.get('scope') && params.get('scope') !== defaultScope, status, level].filter(Boolean).length;
  const filtered = [...apiParams.keys()].some(key => key !== 'page');
  const heading = savedView ? 'Saved questions' : query ? `Results for “${query}”` : isLibrary ? 'Study Library'
    : STATUS_LABELS[status] || (subject ? subject : 'Latest questions');

  useEffect(() => setSearch(query), [query]);

  function update(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key); }
    if ('subject' in changes && !changes.subject && next.get('scope') === 'subject') next.set('scope', 'all');
    next.delete('page');
    next.delete('view');
    setParams(next);
  }
  const filter = (key, value) => update({ [key]: value });
  // Discovery links keep the student's search and subject, and toggle off when active.
  function discover(changes, active) {
    const next = new URLSearchParams(params);
    ['page', 'view'].forEach(key => next.delete(key));
    for (const [key, value] of Object.entries(changes)) { if (active || !value) next.delete(key); else next.set(key, value); }
    const text = next.toString();
    return text ? `/?${text}` : '/';
  }
  function filterAcademicLevel(system, index) {
    update({ semester: '', academicSystem: system, academicIndex: index });
  }
  const chips = [
    query && { key: 'search', label: `“${query}”`, clear: () => { setSearch(''); filter('search', ''); } },
    subject && { key: 'subject', label: subject, clear: () => filter('subject', '') },
    tag && { key: 'tag', label: isLibrary ? 'Study Library' : `#${tag}`, clear: () => update(isLibrary ? { tag: '', scope: '' } : { tag: '' }) },
    status && { key: 'status', label: STATUS_LABELS[status] || status, clear: () => filter('status', '') },
    params.get('scope') && params.get('scope') !== defaultScope && { key: 'scope', label: SCOPE_LABELS[scope] || scope, clear: () => filter('scope', '') },
    level && { key: 'level', label: params.get('academicIndex') || params.get('semester') ? `${level[0].toUpperCase() + level.slice(1)} ${params.get('academicIndex') || params.get('semester')}` : level[0].toUpperCase() + level.slice(1), clear: () => filterAcademicLevel('', '') }
  ].filter(Boolean);

  return <div className="explore">
    <section className="explore__top" aria-labelledby="explore-heading">
      <div className="explore__search-row">
        <h1 id="explore-heading" className="explore__title">stuck on something? <mark className="explore__mark">someone’s been there.</mark></h1>
        <form className="explore__search" role="search" onSubmit={event => { event.preventDefault(); filter('search', search.trim()); }}>
          <label className="visually-hidden" htmlFor="question-search">Search questions</label>
          <span className="explore__search-icon"><Icon name="search" size={22} /></span>
          <input id="question-search" type="search" placeholder="Search topics or questions" value={search}
            maxLength={120} onChange={event => setSearch(event.target.value)} />
          <button className="button" type="submit">Search</button>
        </form>
      </div>
      <nav className="explore__discover" aria-label="Quick views">
        <Link className="explore__chip explore__chip--library" to={isLibrary ? discover({ tag: '', scope: '' }, true) : '/?scope=all&tag=study-library'}
          aria-current={isLibrary && !savedView ? 'page' : undefined}><Icon name="book" size={17} />Study Library</Link>
        <div className="explore__views">
        <Link className="explore__chip explore__chip--solved" to={discover({ status: 'solved' }, status === 'solved')}
          aria-current={status === 'solved' && !savedView ? 'page' : undefined}><Icon name="check" size={17} />Accepted answers</Link>
        <Link className="explore__chip explore__chip--open" to={discover({ status: 'open' }, status === 'open')}
          aria-current={status === 'open' && !savedView ? 'page' : undefined} title="Questions without an accepted answer, including ones that already have replies">
          <Icon name="hand" size={17} />No accepted answer</Link>
        <Link className="explore__chip explore__chip--saved" to={savedView ? '/' : '/?view=saved'} aria-current={savedView ? 'page' : undefined}>
          <Icon name="bookmark" size={17} />Saved{saved.length > 0 && <span className="explore__chip-count">{saved.length}</span>}</Link>
        </div>
      </nav>
      {!savedView && catalogue.length > 0 && <div className="explore__subjects" role="group" aria-label="Browse by subject">
        <button type="button" className="explore__subject" aria-pressed={!subject} onClick={() => filter('subject', '')}>All subjects</button>
        {subject && !catalogue.some(item => item.name === subject) && <button type="button" className="explore__subject" aria-pressed="true" onClick={() => filter('subject', '')}>{subject}</button>}
        {catalogue.map(item => <button type="button" key={item.name} className="explore__subject" aria-pressed={subject === item.name}
          onClick={() => filter('subject', subject === item.name ? '' : item.name)}>{item.name}</button>)}
      </div>}
    </section>

    <div className="explore__body">
    <section className="explore__results" aria-labelledby="explore-results">
      <div className="explore__toolbar">
        <div className="explore__heading">
          <h2 id="explore-results">{heading}</h2>
          {savedView ? <span className="muted">Stored on this device only · {saved.length} {saved.length === 1 ? 'question' : 'questions'}</span>
            : data && !loading && !error && <span className="muted" aria-live="polite">{data.total} {data.total === 1 ? 'question' : 'questions'}{status === 'open' ? ' without an accepted answer' : ''}</span>}
        </div>
        {!savedView && <button type="button" className="explore__filters-toggle" aria-expanded={filtersOpen} aria-controls="explore-filters"
          onClick={() => setFiltersOpen(open => !open)}>
          <Icon name="filter" size={17} />Filters{advancedCount > 0 && <span className="explore__chip-count" aria-label={`${advancedCount} active`}>{advancedCount}</span>}
        </button>}
      </div>

      {!savedView && <div id="explore-filters" className="explore__filters" role="group" aria-label="More filters" hidden={!filtersOpen}>
        <div className="explore__filter">
          <label htmlFor="explore-scope">Scope</label>
          <select id="explore-scope" value={scope} onChange={event => filter('scope', event.target.value)}>
            <option value="college" disabled={!viewer?.institution}>My college{!viewer?.institution ? sessionLoading ? '' : ' (set in profile)' : ''}</option>
            <option value="subject" disabled={!subject}>Selected subject worldwide</option>
            <option value="all">Everything</option>
          </select>
        </div>
        <div className="explore__filter">
          <label htmlFor="explore-status">Answer status</label>
          <select id="explore-status" value={status} onChange={event => filter('status', event.target.value)}>
            <option value="">All questions</option>
            <option value="open">No accepted answer</option>
            <option value="solved">Accepted answer</option>
          </select>
        </div>
        <div className="explore__filter explore__filter--level">
          <span className="explore__filter-label" id="explore-level">Academic level</span>
          <div className="explore__level" role="group" aria-labelledby="explore-level"><AcademicFilter params={params} onChange={filterAcademicLevel} /></div>
        </div>
      </div>}

      {!savedView && chips.length > 0 && <div className="explore__active" aria-label="Active filters">
        {chips.map(chip => <button type="button" key={chip.key} className="explore__active-chip" onClick={chip.clear}
          aria-label={`Remove filter ${chip.label}`}>{chip.label} <span aria-hidden="true">×</span></button>)}
        {chips.length > 1 && <button className="text-button" type="button" onClick={() => { setSearch(''); setParams({}); }}>Clear all</button>}
      </div>}

      {savedView ? <SavedList items={saved} />
        : <>
          <ErrorBox message={error} retry={refresh} />
          {loading && <Loading />}
          {!loading && !error && (data?.items.length
            ? <ol className="qlist">{data.items.map(doubt => <QuestionRow key={doubt._id} doubt={doubt} />)}</ol>
            : <Empty title={filtered ? 'No matching questions' : 'Be the first to ask'}>
                {filtered ? 'Try another word, a different subject, or clear the filters.' : 'Share a question from your coursework.'}
              </Empty>)}
          {data && !loading && !error && <Pager page={data.page} pages={data.pages} onChange={page => {
            const next = new URLSearchParams(params);
            next.set('page', page);
            setParams(next);
            window.scrollTo?.({ top: 0 });
          }} />}
        </>}
    </section>
    {!savedView && <aside className="explore__aside" aria-label="Ways to help">
      <section className="explore__card explore__card--hero">
        <h2>be someone’s hero today</h2>
        <p>These doubts are still waiting for an accepted answer. One clear explanation can make someone’s exam.</p>
        <Link className="explore__card-link" to="/?status=open">Find one to answer →</Link>
      </section>
      <section className="explore__card explore__card--library">
        <p className="explore__card-kicker"><Icon name="book" size={16} />Study Library</p>
        <h2>exam-ready explainers</h2>
        <p>Curated questions with worked explanations, 20 per subject. Perfect for the night before.</p>
        <Link className="button button--secondary" to="/?scope=all&tag=study-library">Open the library</Link>
      </section>
    </aside>}
    </div>
  </div>;
}

function SavedList({ items }) {
  const available = savedStorageAvailable();
  const location = useLocation();
  if (!available) return <div className="explore__notice" role="status"><strong>Saving is unavailable in this browser.</strong> Site storage is blocked (for example by private browsing or a privacy setting), so saved questions cannot be kept on this device.</div>;
  if (!items.length) return <Empty title="No saved questions yet">Use <strong>Save</strong> on any question to keep it here. Saves stay on this device and browser only.</Empty>;
  return <ol className="qlist qlist--saved">{items.map(item => <li className="qrow" key={item.id}>
    <div className={`qrow__count qrow__count--${item.status === 'solved' ? 'solved' : 'open'}`}>{item.status === 'solved' ? <><strong>✓</strong><span>accepted</span></> : <><strong>{item.answerCount ?? '–'}</strong><span>{item.answerCount === 1 ? 'answer' : 'answers'}</span></>}</div>
    <div className="qrow__main">
      <h3 className="qrow__title"><Link to={`/doubts/${item.id}`} state={{ from: location.pathname + location.search }}>{item.title}</Link></h3>
      <div className="qrow__meta">{item.subject && <span className="qrow__subject">{item.subject}</span>}<span>Saved {date(item.savedAt)}</span><span>Status as of saving</span></div>
    </div>
    <SaveButton doubt={{ _id: item.id, title: item.title, subject: item.subject, status: item.status, answerCount: item.answerCount }} compact />
  </li>)}</ol>;
}

export function AuthPage({ signup = false }) {
  const { login, user } = useAuth(); const navigate = useNavigate(); const [query] = useSearchParams(); const destination = safeReturn(query.get('returnTo')); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { setError(''); }, [signup]);
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); const body = parseAcademicForm(Object.fromEntries(new FormData(event.currentTarget))); try { const result = await api(signup ? '/auth/signup' : '/auth/login', { method: 'POST', body }); login(result); navigate(destination, { replace: true }); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  if (user) return <div className="state"><h1>You are signed in</h1><Link to="/" className="button">Explore questions</Link></div>;
  async function continueWithGoogle(credential) {
    setBusy(true);
    setError('');
    try {
      const result = await api('/auth/google', { method: 'POST', body: { credential } });
      login(result);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return <div className="auth-layout"><section className="auth-story"><span className="overline">LEARN TOGETHER. GO FURTHER.</span><h1>no doubt is <mark>too small</mark> to ask.</h1><p>Ask freely, explain what you know, and make college a little less confusing for everyone.</p><div className="auth-story__quote">“The only silly question is the one you never ask.”</div></section><section className="panel auth-form"><Mark small /><h2>{signup ? 'Make yourself at home.' : 'Good to see you again.'}</h2><p className="muted">{signup ? 'Join your campus learning community.' : 'Your next discovery is waiting.'}</p><form onSubmit={submit} key={signup ? 'signup' : 'login'}><ErrorBox message={error} />{signup && <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={60} placeholder="Your name" /></label>}<label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@college.edu" /></label><label>Password<input name="password" type={showPassword ? "text" : "password"} autoComplete={signup ? 'new-password' : 'current-password'} required minLength={8} maxLength={72} placeholder={signup ? 'At least 8 characters' : 'Your password'} /></label><button className="text-button password-toggle" type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide password" : "Show password"}</button>{signup && <><AcademicFields id="signup-level" /><InstitutionSelect id="signup-institution" /></>}<button className="button button--full" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create your account →' : 'Sign in →'}</button></form><GoogleButton onCredential={continueWithGoogle} disabled={busy} showDivider />{!signup && <p><Link to="/forgot-password">Forgot password?</Link></p>}<p className="auth-switch">{signup ? 'Already part of the community?' : 'New around here?'} <Link to={(signup ? '/login' : '/signup') + '?returnTo=' + encodeURIComponent(destination)}>{signup ? 'Sign in' : 'Create an account'}</Link></p></section></div>;
}
export function Ask({ edit = false }) {
  const { subjects: catalogue } = useAuth(); const subjects = catalogue.map(item => item.name);
  const { id } = useParams(); const { token, user, notify } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', body: '', subject: 'Data Structures', academicLevel: levelOf(user), tags: '' });
  const [images, setImages] = useState([]); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false); const [ready, setReady] = useState(!edit);
  useEffect(() => { if (!edit) return; let active = true; api(`/doubts/${id}`, { token }).then(doubt => { if (!active) return; if (doubt.author._id !== user._id && user.role !== 'admin') throw new Error('Only the author can edit this doubt.'); setForm({ ...doubt, academicLevel: levelOf(doubt), tags: doubt.tags.join(', ') }); setImages(doubt.images); setReady(true); }).catch(err => { if (active) setError(err.message); }); return () => { active = false; }; }, [id, edit, token, user._id, user.role]);
  const [baseline, setBaseline] = useState(null);
  const fingerprint = JSON.stringify([form.title, form.body, form.subject, form.academicLevel, form.tags, images.map(image => image.publicId)]);
  useEffect(() => { if (ready && baseline === null) setBaseline(fingerprint); }, [ready, baseline, fingerprint]);
  useUnsavedChanges(ready && baseline !== null && fingerprint !== baseline);
  const change = key => event => setForm({ ...form, [key]: event.target.value });
  async function upload(event) { const file = event.target.files[0]; event.target.value = ''; if (!file) return; if (images.length >= 3) { setError('Use up to 3 images.'); return; } if (file.size > 3 * 1024 * 1024) { setError('Each image must be 3 MB or smaller.'); return; } setUploading(true); setError(''); try { const body = new FormData(); body.append('image', file); const image = await api('/uploads', { method: 'POST', body, token }); setImages(current => [...current, image]); } catch (err) { setError(err.message); } finally { setUploading(false); } }
  async function removeImage(image) { setUploading(true); try { await api('/uploads', { method: 'DELETE', body: { publicId: image.publicId }, token }); setImages(current => current.filter(item => item.publicId !== image.publicId)); } catch (err) { setError(err.message); } finally { setUploading(false); } }
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); try { const body = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), imageIds: images.map(i => i.publicId) }; const doubt = await api(edit ? `/doubts/${id}` : '/doubts', { method: edit ? 'PUT' : 'POST', body, token }); notify(edit ? 'Doubt updated.' : 'Your doubt is live in the community!'); navigate(`/doubts/${doubt._id}`); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <div className="form-layout"><section><Link className="back-link" to="/">← Back to questions</Link><h1>{edit ? 'Refine your question.' : 'Let’s clear that doubt.'}</h1><p className="muted">A clear question is the first step to a helpful answer.</p><ErrorBox message={error} />{ready && <form className="panel question-form" onSubmit={submit}><label>Give your doubt a title<input value={form.title} onChange={change('title')} required minLength={10} maxLength={160} placeholder="e.g. How is a process different from a thread?" /><small>Be specific. Think of it as a headline for your question.</small></label><label>What are you stuck on?<MarkdownEditor id="ask-body" rows={10} value={form.body} onChange={next => setForm({ ...form, body: next })} required minLength={20} maxLength={12000} placeholder="Describe the concept, what you tried, and where you got stuck…" /><small>Plain text and code are welcome. Minimum 20 characters.</small></label><div className="form-row"><label>Subject<select value={form.subject} onChange={change('subject')}>{!subjects.includes(form.subject) && <option>{form.subject}</option>}{subjects.map(subject => <option key={subject}>{subject}</option>)}</select></label><AcademicFields id="ask-level" value={form.academicLevel} onChange={value => setForm({ ...form, academicLevel: value })} /></div><label>Tags<input value={form.tags} onChange={change('tags')} placeholder="e.g. java, multithreading, concurrency" maxLength={150} /><small>Separate with commas. Up to 5 tags, 24 characters each.</small></label><div><span className="field-label">Screenshots <span className="muted">(optional)</span></span>{!edit && <label className="upload-zone">{uploading ? 'Uploading…' : '+ Add an image'}<small>JPG, PNG or WebP · up to 3 MB each · 3 images max</small><input aria-label="Upload a screenshot" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={uploading || images.length >= 3} /></label>}<div className="image-previews">{images.map(image => <div key={image.publicId}><img src={image.url} alt="Question attachment preview" />{!edit && <button type="button" aria-label="Remove attachment" disabled={uploading} onClick={() => removeImage(image)}>×</button>}</div>)}</div>{edit && <small className="muted">Existing attachments are preserved when editing.</small>}</div><p className="muted">{edit ? "Editing keeps the original college scope." : user.institution ? "Your question will appear in your selected college and the public worldwide feed." : "Your question will appear in the public worldwide feed."}</p><div className="form-actions"><button className="button" disabled={busy || uploading}>{busy ? 'Saving…' : edit ? 'Save changes' : 'Post your doubt ↗'}</button><Link className="text-button" to={edit ? `/doubts/${id}` : '/'}>Cancel</Link></div></form>}</section><aside className="side-card writing-tips"><span className="side-card__symbol">✧</span><h3>Help others help you</h3><ol><li>Make the title specific.</li><li>Share what you have tried.</li><li>Add relevant details or a screenshot.</li><li>Choose the right subject and tags.</li></ol><p className="muted">Keep personal information out of screenshots. A thoughtful question helps everyone learn.</p></aside></div>;
}
export function Detail() {
  const location = useLocation(); const { id } = useParams(); const { data: doubt, error, loading, refresh } = useResource(`/doubts/${id}`); const { user, token, notify } = useAuth(); const navigate = useNavigate(); const [body, setBody] = useState(''); const [busy, setBusy] = useState(false); const [formError, setFormError] = useState('');
  async function answer(event) { event.preventDefault(); setBusy(true); setFormError(''); try { await api(`/doubts/${id}/answers`, { method: 'POST', body: { body }, token }); setBody(''); refresh(); notify('Your answer has been posted.'); } catch (err) { setFormError(err.message); } finally { setBusy(false); } }
  async function deleteDoubt() { if (!window.confirm('Delete this doubt and all its answers? This cannot be undone.')) return; setBusy(true); try { await api(`/doubts/${id}`, { method: 'DELETE', token }); navigate('/'); notify('Doubt deleted.'); } catch (err) { notify(err.message); } finally { setBusy(false); } }
  if (loading && !doubt) return <Loading />;
  if (error) return <ErrorBox message={error} retry={refresh} />;
  if (!doubt) return null;
  const owner = doubt.author?._id === user?._id; const canEdit = owner || user?.role === 'admin';
  const accepted = doubt.answers.find(item => item.isAccepted);
  const others = doubt.answers.filter(item => !item.isAccepted);
  const total = doubt.answers.length;
  const jumpToComposer = () => {
    const target = document.getElementById('write-answer');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    (target?.querySelector('textarea') || target?.querySelector('a'))?.focus({ preventScroll: true });
  };
  return <div className="qd">
    <Link className="qd__back" to={safeReturn(location.state?.from)}><Icon name="back" size={18} />Back to results</Link>
    <article className="qd__question" aria-labelledby="question-title">
      <div className="qd__kicker">
        <span className="qd__label qd__label--question">Question</span>
        <span className="qd__subject">{doubt.subject}</span>
        <span>{levelLabel(doubt)}</span>
        {doubt.status === 'solved' ? <span className="qd__state qd__state--solved">✓ Solved</span>
          : <span className="qd__state">{total ? 'No accepted answer yet' : 'No answers yet'}</span>}
      </div>
      <h1 id="question-title">{doubt.title}</h1>
      <div className="qd__byline"><Author user={doubt.author} createdAt={doubt.createdAt} /><SaveButton doubt={{ ...doubt, answerCount: total }} /></div>
      <div className="post-body">
        <VoteButtons type="doubt" item={doubt} refresh={refresh} />
        <div className="post-body__content">
          <Markdown source={doubt.body} />
          {doubt.images.length > 0 && <div className="attachments">{doubt.images.map(image => <a key={image.publicId} href={image.url} target="_blank" rel="noreferrer"><img src={image.url} alt="Screenshot attached to the question" /></a>)}</div>}
          <Tags values={doubt.tags} />
          <div className="content-actions">{canEdit && <><Link to={`/doubts/${id}/edit`}>Edit question</Link><button disabled={busy} onClick={deleteDoubt}>Delete</button></>}<ReportButton type="doubt" id={id} /></div>
        </div>
      </div>
    </article>

    <div className="qd__summary">
      <span>{total ? <><strong>{total}</strong> {total === 1 ? 'answer' : 'answers'}{accepted ? ' · 1 accepted' : ' · none accepted yet'}</> : 'No one has answered yet'}</span>
      <button type="button" className="button button--secondary button--small" onClick={jumpToComposer}>Write an answer ↓</button>
    </div>

    {accepted && <section className="qd__accepted" aria-labelledby="accepted-heading">
      <div className="qd__section-head"><h2 id="accepted-heading"><Icon name="check" size={20} />the answer that clicked</h2><span className="muted">Accepted by the student who asked</span></div>
      <AnswerCard answer={accepted} owner={owner} refresh={refresh} />
    </section>}

    <section className="qd__others" aria-labelledby="others-heading">
      <div className={total ? 'qd__section-head' : 'visually-hidden'}><h2 id="others-heading">{accepted ? `${others.length} other ${others.length === 1 ? 'answer' : 'answers'}` : `${total} ${total === 1 ? 'answer' : 'answers'}`}</h2>{others.length > 1 && <span className="muted">Highest voted first</span>}</div>
      {others.length ? others.map(item => <AnswerCard key={item._id} answer={item} owner={owner} refresh={refresh} />)
        : !accepted ? <Empty title="Be the first to answer">Know something that could help? Explain it below.</Empty>
        : <p className="muted qd__none">No other answers yet.</p>}
    </section>

    <section className="qd__compose" id="write-answer" aria-labelledby="compose-heading">
      <h2 id="compose-heading">Your answer</h2>
      <p className="muted">Explain the why, not just the answer. Markdown, code and maths are supported.</p>
      {user ? <form onSubmit={answer}><ErrorBox message={formError} /><label htmlFor="answer-body-input" className="visually-hidden">Your answer</label><MarkdownEditor id="answer-body" rows={7} value={body} onChange={setBody} required minLength={10} maxLength={12000} placeholder="Walk them through the concept…" /><div className="qd__compose-actions"><button className="button" disabled={busy}>{busy ? 'Posting…' : 'Post your answer'}</button><Link className="text-button" to="/ask">Ask a different question instead</Link></div></form>
        : <p className="qd__signin"><Link className="button" to={signInPath(location)}>Sign in to answer</Link> <span className="muted">or</span> <Link to={"/signup?returnTo=" + encodeURIComponent(location.pathname)}>create an account</Link></p>}
    </section>
  </div>;
}
function ReportButton({ type, id }) {
  const { user, token, notify } = useAuth(); const [open, setOpen] = useState(false); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false);
  if (!user) return null;
  async function submit(event) { event.preventDefault(); setBusy(true); try { await api('/reports', { method: 'POST', token, body: { targetType: type, targetId: id, reason } }); setOpen(false); setReason(''); notify('Report sent to the moderators.'); } catch (error) { notify(error.message); } finally { setBusy(false); } }
  return <><button className="text-button" onClick={() => setOpen(!open)}>Report</button>{open && <form className="inline-form" onSubmit={submit}><label>Why are you reporting this?<textarea value={reason} onChange={e => setReason(e.target.value)} minLength={5} maxLength={1000} required rows={2} /></label><button className="button button--small" disabled={busy}>Send report</button><button type="button" className="text-button" onClick={() => setOpen(false)}>Cancel</button></form>}</>;
}
function AnswerCard({ answer, owner, refresh }) {
  const { user, token, notify } = useAuth(); const [editing, setEditing] = useState(false); const [body, setBody] = useState(answer.body); const [comment, setComment] = useState(''); const [showComment, setShowComment] = useState(false); const [busy, setBusy] = useState(false);
  async function action(route, method, payload, success) { setBusy(true); try { await api(route, { method, token, body: payload }); notify(success); refresh(); setEditing(false); setComment(''); setShowComment(false); } catch (error) { notify(error.message); } finally { setBusy(false); } }
  const canEdit = user && (user._id === answer.author?._id || user.role === 'admin');
  return <article className={`panel answer ${answer.isAccepted ? 'answer--accepted' : ''}`}>{answer.isAccepted && <div className="accepted-label">✓ Accepted by question author</div>}<Author user={answer.author} createdAt={answer.createdAt} /><div className="post-body"><VoteButtons item={answer} type="answer" refresh={refresh} /><div className="post-body__content">{editing ? <form onSubmit={e => { e.preventDefault(); action(`/answers/${answer._id}`, 'PUT', { body }, 'Answer updated.'); }}><label>Edit answer<MarkdownEditor id={`edit-answer-${answer._id}`} value={body} onChange={setBody} rows={6} required minLength={10} maxLength={12000} /></label><button className="button button--small" disabled={busy}>Save</button><button className="text-button" type="button" onClick={() => setEditing(false)}>Cancel</button></form> : <Markdown source={answer.body} />}<div className="content-actions">{owner && <button className="accept-button" disabled={busy} onClick={() => action(`/answers/${answer._id}/accept`, 'PATCH', {}, answer.isAccepted ? 'Acceptance removed.' : 'Answer accepted.')}>{answer.isAccepted ? 'Remove acceptance' : '✓ Accept answer'}</button>}{canEdit && <><button disabled={busy} onClick={() => { setBody(answer.body); setEditing(!editing); }}>Edit</button><button disabled={busy} onClick={() => { if (window.confirm('Delete this answer and its comments?')) action(`/answers/${answer._id}`, 'DELETE', null, 'Answer deleted.'); }}>Delete</button></>}<ReportButton type="answer" id={answer._id} /></div><div className="comments">{answer.comments.map(item => <div className="comment" key={item._id}><p>{item.body}</p><Link to={`/users/${item.author?._id}`}>{item.author?.name || 'Deleted user'}</Link><span className="muted"> · {date(item.createdAt)}</span></div>)}</div>{user && (showComment ? <form className="inline-form" onSubmit={e => { e.preventDefault(); action(`/answers/${answer._id}/comments`, 'POST', { body: comment }, 'Comment added.'); }}><label>Add a comment<textarea rows={2} required minLength={2} maxLength={1000} value={comment} onChange={e => setComment(e.target.value)} /></label><button className="button button--small" disabled={busy}>Add comment</button><button type="button" className="text-button" onClick={() => setShowComment(false)}>Cancel</button></form> : <button className="text-button add-comment" onClick={() => setShowComment(true)}>+ Add a comment</button>)}</div></div></article>;
}
export function Profile() {
  const { id } = useParams(); const { data, loading, error, refresh } = useResource(`/users/${id}`); const { user, token, setUser, notify, logout } = useAuth(); const [tab, setTab] = useState('doubts'); const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false);
  async function signOutEverywhere() { if (!window.confirm('Sign out on every device, including this one?')) return; setBusy(true); try { await api('/auth/logout-all', { method: 'POST', token }); logout(); notify('Signed out everywhere. Please sign in again.'); } catch (error) { notify(error.message); } finally { setBusy(false); } }
  async function save(event) { event.preventDefault(); setBusy(true); const body = parseAcademicForm(Object.fromEntries(new FormData(event.currentTarget))); try { const next = await api('/users/me', { method: 'PUT', token, body }); setUser(next); setEditing(false); refresh(); notify('Profile updated.'); } catch (err) { notify(err.message); } finally { setBusy(false); } }
  if (loading && !data) return <Loading />; if (error) return <ErrorBox message={error} />; if (!data) return null;
  return <div className="profile"><section className="panel profile__header"><Avatar name={data.user.name} large /><div><span className="overline">COMMUNITY MEMBER</span><h1>{data.user.name}</h1><Badge role={data.user.role} /><p className="muted">{levelLabel(data.user)} · Joined {date(data.user.createdAt)}</p>{user?._id === id && <div className="content-actions"><button className="text-button" onClick={() => setEditing(!editing)}>Edit profile</button><button className="text-button" disabled={busy} onClick={signOutEverywhere}>Sign out everywhere</button></div>}</div><div className="reputation"><strong>{data.user.reputation}</strong><span>Reputation</span></div></section>{editing && <form className="panel" onSubmit={save}><label>Name<input name="name" defaultValue={data.user.name} required minLength={2} maxLength={60} /></label><AcademicFields id="profile-level" defaultValue={levelOf(data.user)} /><InstitutionSelect id="profile-institution" defaultValue={data.user.institution} /><button className="button" disabled={busy}>Save profile</button></form>}<TabList id="profile-tabs" label="Profile contributions" items={[{value:"doubts",label:`Recent questions (${data.doubts.length})`},{value:"answers",label:`Recent answers (${data.answers.length})`}]} value={tab} onChange={setTab} /><div id="profile-tabs-panel" role="tabpanel" aria-labelledby={`profile-tabs-${tab}`} tabIndex={0}>{tab === 'doubts' ? data.doubts.length ? <div className="doubt-list">{data.doubts.map(d => <DoubtCard doubt={d} key={d._id} />)}</div> : <Empty title="No questions yet" /> : data.answers.length ? data.answers.map(answer => <article className="panel profile-answer" key={answer._id}><Link to={`/doubts/${answer.doubt?._id}`}><h3>{answer.doubt?.title || 'Question removed'}</h3></Link><p className="prose">{markdownToText(answer.body).slice(0, 300)}</p><span className="muted">{date(answer.createdAt)}</span></article>) : <Empty title="No answers yet">A helpful explanation can make someone’s day.</Empty>}</div></div>;
}
export function Admin() {
  const { user, token, notify } = useAuth();
  const managesUsers = user.role === 'admin';
  const [tab, setTab] = useState('users');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const section = managesUsers ? tab : 'reports';
  const { data, loading, error, refresh } = useResource(`/admin/${section}?page=${page}`);

  async function action(route, body) {
    setBusy(true);
    try {
      await api(route, { method: 'PATCH', token, body });
      refresh();
      notify('Moderation action saved.');
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="admin">
    <span className="overline">{managesUsers ? 'Administration' : 'Moderation'}</span>
    <h1>Keep the community helpful.</h1>
    {managesUsers && <>
      <Link to="/admin/catalog">Manage subject catalogue →</Link>
      <p className="muted">Admins manage users and catalogues. Moderators review reports and remove reported content.</p>
      <p className="muted">Your own role and the primary admin are protected. Users can refresh after a role change to see their updated access.</p>
      <TabList id="admin-tabs" label="Moderation sections"
        items={[{ value: 'users', label: 'Users' }, { value: 'reports', label: 'Reports' }]}
        value={section} onChange={value => { setTab(value); setPage(1); }} />
    </>}
    {!managesUsers && <p className="muted">Review reports and remove reported content that breaks the community rules.</p>}
    <div id="admin-tabs-panel" role={managesUsers ? 'tabpanel' : undefined}
      aria-labelledby={managesUsers ? `admin-tabs-${section}` : undefined} tabIndex={0}>
      <ErrorBox message={error} retry={refresh} />
      {loading ? <Loading /> : error ? null : section === 'users'
        ? <div className="table-wrap panel"><table>
            <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{data?.items.map(account => <UserAccessRow key={account._id} account={account}
              currentUserId={user._id} busy={busy} onAction={action} />)}</tbody>
          </table></div>
        : data?.items.length ? data.items.map(report => <article className="panel report" key={report._id}>
            <span className="badge">Reported {report.targetType}</span>
            <h3>{report.content?.title || report.content?.body?.slice(0, 120) || 'Content already removed'}</h3>
            <p className="prose">{report.reason}</p>
            <p className="muted">Reported by {report.reporter?.name} · {date(report.createdAt)}</p>
            {report.content && <Link to={`/doubts/${report.targetType === 'doubt' ? report.target : report.content.doubt}`}>View discussion →</Link>}
            <div className="form-actions">
              <button className="button button--secondary" disabled={busy}
                onClick={() => action(`/admin/reports/${report._id}`, { status: 'dismissed' })}>Dismiss report</button>
              <button className="button button--danger" disabled={busy} onClick={() => {
                if (window.confirm('Remove this reported content? Removing a question also removes its answers, comments and attachments. This cannot be undone.')) {
                  action(`/admin/reports/${report._id}`, { status: 'removed' });
                }
              }}>Remove content</button>
            </div>
          </article>) : <Empty title="All caught up">There are no pending reports to review.</Empty>}
      {data && !loading && !error && <Pager page={page} pages={data.pages} onChange={setPage} />}
    </div>
  </section>;
}

function UserAccessRow({ account, currentUserId, busy, onAction }) {
  const [role, setRole] = useState(account.role);
  useEffect(() => setRole(account.role), [account.role]);
  const self = account._id === currentUserId;
  return <tr>
    <td><Link to={`/users/${account._id}`}>{account.name}</Link><small>{account.email}</small></td>
    <td><select aria-label={`Role for ${account.email}`} value={role} disabled={busy || self}
      onChange={event => setRole(event.target.value)}>
      <option value="student">Student</option>
      <option value="teacher">Teacher</option>
      <option value="moderator">Moderator</option>
      <option value="admin">Admin</option>
    </select></td>
    <td><span className={`badge ${account.isBanned ? 'badge--banned' : 'badge--solved'}`}>{account.isBanned ? 'Suspended' : 'Active'}</span></td>
    <td><div className="table-actions">
      {self ? <span className="muted">Your account</span> : <button className="text-button"
        disabled={busy || role === account.role} onClick={() => {
          if (window.confirm(`Change ${account.email} from ${account.role} to ${role}? Admins can manage other users' access.`)) {
            onAction(`/admin/users/${account._id}/role`, { role });
          }
        }}>Save role</button>}
      {account.role !== 'admin' && <button className="text-button" disabled={busy} onClick={() => {
        if (window.confirm(`${account.isBanned ? 'Restore' : 'Suspend'} access for ${account.name}?`)) {
          onAction(`/admin/users/${account._id}/ban`, { isBanned: !account.isBanned });
        }
      }}>{account.isBanned ? 'Restore access' : 'Suspend'}</button>}
    </div></td>
  </tr>;
}
