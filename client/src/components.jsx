import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context';
import { api } from './api';
import { markdownToText } from './excerpt';
import { EDITOR_TOOLS, applyTool, EDITOR_TABS, nextTab } from './editor';
import { signInPath } from './navigation';
import { ThemeControl } from './theme-control';
export { ThemeControl } from './theme-control';
import { NotificationBell } from './notifications';
import { levelLabel } from './academics';
export { TabList } from './tab-list';
export const date = value => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export function Mark({ small = false }) { return <span className={`brand ${small ? 'brand--small' : ''}`}><span className="brand__icon">?</span><span>Doubt<span className="brand__accent">Forum</span></span></span>; }
export function Navbar() {
  const { user, logout } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [expanded, setExpanded] = useState(false); const menuButton = useRef(null);
  useEffect(() => setExpanded(false), [location.pathname]);
  function closeMenu(event) { if (expanded && event.key === 'Escape') { event.preventDefault(); setExpanded(false); menuButton.current?.focus(); } }
  return <header className="header" onKeyDown={closeMenu}><div className="header__inner"><Link to="/" aria-label="Doubt Forum home"><Mark /></Link><ThemeControl /><button className="nav-toggle button button--secondary" ref={menuButton} aria-expanded={expanded} aria-controls="main-navigation" onClick={() => setExpanded(!expanded)}>Menu</button><nav id="main-navigation" className={expanded ? "navigation navigation--open" : "navigation"} aria-label="Main navigation"><NavLink to="/" end>Explore</NavLink>{user?.role === 'admin' && <NavLink to="/admin">Moderation</NavLink>}<Link className="button button--small" to="/ask">+ Ask a doubt</Link>{user ? <><Link className="user-link" to={`/users/${user._id}`}><Avatar name={user.name} /><span>{user.name.split(' ')[0]}</span></Link><Link to={`/users/${user._id}?tab=doubts`}>My questions</Link><NotificationBell /><Link to="/account">Account</Link><button className="text-button" onClick={() => { logout(); navigate('/'); }}>Sign out</button></> : <Link className="text-button" to="/login">Sign in</Link>}</nav></div></header>;
}
export function Avatar({ name = '?', large = false }) { return <span className={`avatar ${large ? 'avatar--large' : ''}`} aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>; }
export function Badge({ role }) { return role === 'teacher' || role === 'admin' ? <span className={`badge badge--${role}`}>{role === 'teacher' ? '✓ Teacher' : 'Admin'}</span> : null; }
export function Author({ user, createdAt }) { return <div className="author"><Avatar name={user?.name || 'Deleted user'} /><Link to={user ? `/users/${user._id}` : '/'}>{user?.name || 'Deleted user'}</Link><Badge role={user?.role} />{createdAt && <span className="muted">{date(createdAt)}</span>}</div>; }
export function ErrorBox({ message, retry }) { return message ? <div className="error" role="alert">{message}{retry && <button className="text-button retry-button" onClick={retry}>Try again</button>}</div> : null; }
export function Loading() { return <div className="state" role="status"><span className="spinner" /> Loading…</div>; }
export function Empty({ title = 'No doubts here yet', children }) { return <div className="empty"><span className="empty__icon">?</span><h3>{title}</h3><p className="muted">{children || 'Start the conversation. Your question could help someone else, too.'}</p></div>; }
export function Tags({ values = [] }) { return <div className="tags">{values.map(tag => <Link key={tag} className="tag" to={`/?tag=${encodeURIComponent(tag)}`}>{tag}</Link>)}</div>; }
export function DoubtCard({ doubt }) { const location = useLocation(); return <article className="doubt-card"><div className="doubt-card__stats"><span><strong>{doubt.votes}</strong> votes</span><span className={doubt.status === 'solved' ? 'doubt-card__solved' : ''}><strong>{doubt.answerCount}</strong> {doubt.answerCount === 1 ? 'answer' : 'answers'}</span></div><div className="doubt-card__main"><div className="eyebrow"><span>{doubt.subject}</span><span>{levelLabel(doubt)}</span>{doubt.status === 'solved' && <span className="badge badge--solved">✓ Accepted answer</span>}</div><h2><Link to={`/doubts/${doubt._id}`} state={{ from: location.pathname + location.search }}>{doubt.title}</Link></h2><p className="doubt-card__preview">{markdownToText(doubt.body)}</p><Tags values={doubt.tags} /><Author user={doubt.author} createdAt={doubt.createdAt} /></div></article>; }
export function Pager({ page, pages, onChange }) { return pages > 1 && <div className="pager"><button className="button button--secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Previous</button><span>Page {page} of {pages}</span><button className="button button--secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next →</button></div>; }
export function VoteButtons({ item, type, refresh }) {
  const { token, user, notify } = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [busy, setBusy] = useState(false);
  async function vote(value) { if (!user) { navigate(signInPath(location)); return; } setBusy(true); try { await api(`/${type}s/${item._id}/vote`, { method: 'POST', token, body: { value } }); await refresh(); } catch (error) { notify(error.message); } finally { setBusy(false); } }
  return <div className="vote" aria-label="Voting"><button aria-label="Upvote" aria-pressed={item.myVote === 1} disabled={busy || item.author?._id === user?._id} onClick={() => vote(1)}>▲</button><strong>{item.votes}</strong><button aria-label="Downvote" aria-pressed={item.myVote === -1} disabled={busy || item.author?._id === user?._id} onClick={() => vote(-1)}>▼</button></div>;
}
export function Protected({ children, admin = false }) { const { user, loading } = useAuth(); const location = useLocation(); if (loading) return <Loading />; if (!user) return <div className="panel state"><h2>Join the conversation</h2><p>Sign in to ask questions and help other students.</p><Link className="button" to={signInPath(location)}>Sign in to continue</Link></div>; if (admin && user.role !== 'admin') return <ErrorBox message="This page is for administrators." />; return children; }
export function SemesterSelect({ value, onChange, id = 'semester', defaultValue }) { return <select id={id} name="semester" value={value} defaultValue={defaultValue} onChange={onChange} required>{Array.from({ length: 8 }, (_, i) => <option key={i + 1} value={i + 1}>Semester {i + 1}</option>)}</select>; }

// marked, KaTeX and highlight.js are about 130 KB gzipped, so they are loaded
// on demand rather than in the main bundle. The feed and the sign-in screens
// never need them.
let rendererPromise;
let loadedRenderer;
const loadRenderer = () => (rendererPromise ||= import('./markdown-view').then(module => (loadedRenderer = module.renderMarkdown)));

// Renders a stored Markdown body. The HTML is produced and sanitised in
// markdown.js; nothing unsanitised ever reaches dangerouslySetInnerHTML.
export function Markdown({ source }) {
  const [render, setRender] = useState(() => loadedRenderer);
  useEffect(() => {
    if (render) return;
    let active = true;
    loadRenderer().then(fn => { if (active) setRender(() => fn); });
    return () => { active = false; };
  }, [render]);
  if (typeof source !== 'string' || !source.trim()) return null;
  // Until the renderer arrives the raw text is shown, escaped by React, so the
  // body is readable on a slow connection and never unsafe.
  if (!render) return <p className="prose">{source}</p>;
  return <div className="prose markdown" dangerouslySetInnerHTML={{ __html: render(source) }} />;
}

// A plain textarea with formatting buttons and a preview, because students will
// click buttons but will not learn Markdown syntax from a hint.
export function MarkdownEditor({ value, onChange, rows = 10, placeholder, required, minLength, maxLength, id = 'markdown-editor' }) {
  const [tab, setTab] = useState('write');
  const area = useRef(null);
  const tabRefs = [useRef(null), useRef(null)];
  const apply = tool => {
    const element = area.current;
    if (!element) return;
    const result = applyTool(value, element.selectionStart, element.selectionEnd, tool);
    onChange(result.text);
    requestAnimationFrame(() => { element.focus(); element.setSelectionRange(result.caretStart, result.caretEnd); });
  };
  const onTabKey = event => {
    const next = nextTab(tab, event.key);
    if (!next) return;
    event.preventDefault();
    setTab(next);
    tabRefs[EDITOR_TABS.indexOf(next)].current?.focus();
  };
  const writing = tab === 'write';
  return <div className="editor">
    <div className="editor__bar">
      <div className="editor__tools" role="group" aria-label="Formatting">
        {EDITOR_TOOLS.map(tool => <button key={tool.label} type="button" className="editor__tool" title={tool.label} aria-label={tool.label} disabled={!writing} onClick={() => apply(tool)}>{tool.icon}</button>)}
      </div>
      <div className="editor__tabs" role="tablist" aria-label="Editor view">
        <button type="button" ref={tabRefs[0]} role="tab" id={`${id}-tab-write`} aria-selected={writing} aria-controls={`${id}-panel`} tabIndex={writing ? 0 : -1} onKeyDown={onTabKey} onClick={() => setTab('write')}>Write</button>
        <button type="button" ref={tabRefs[1]} role="tab" id={`${id}-tab-preview`} aria-selected={!writing} aria-controls={`${id}-panel`} tabIndex={writing ? -1 : 0} onKeyDown={onTabKey} onClick={() => setTab('preview')}>Preview</button>
      </div>
    </div>
    <div className="editor__panel" id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${writing ? 'write' : 'preview'}`}>
      {/* The textarea stays mounted so switching to preview never loses the caret or an in-flight draft. */}
      <textarea ref={area} hidden={!writing} rows={rows} value={value} onChange={event => onChange(event.target.value)} required={required} minLength={minLength} maxLength={maxLength} placeholder={placeholder} />
      {!writing && (value.trim() ? <Markdown source={value} /> : <p className="muted editor__empty">Nothing to preview yet.</p>)}
    </div>
    <small className="editor__hint">Markdown is supported. Use the code block button for code, and <code>$x^2$</code> for maths.</small>
  </div>;
}
