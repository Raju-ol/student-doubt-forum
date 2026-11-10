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
import { levelLabel, levelOf } from './academics';
import { useSavedQuestions, toggleSaved } from './saved-questions';
export { TabList } from './tab-list';
export const date = value => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export function Mark({ small = false }) { return <span className={`brand ${small ? 'brand--small' : ''}`}><span className="brand__icon">?</span><span>Doubt<span className="brand__accent">Forum</span></span></span>; }
// Inline stroke icons shared by the header, tab bar and quick views.
const ICON_PATHS = {
  home: 'M3 11 12 4l9 7v9h-6v-6H9v6H3z',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM4 20.5A2.5 2.5 0 0 0 6.5 23H20',
  bookmark: 'M6 3h12v18l-6-4.5L6 21z',
  plus: 'M12 5v14M5 12h14',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  check: 'm5 12 4.5 4.5L19 7',
  hand: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3.6 15a1.5 1.5 0 0 1 2.4-1.8L8 15',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.3-4.3',
  filter: 'M4 6h16M7 12h10M10 18h4',
  back: 'M15 6 9 12l6 6',
  menu: 'M4 7h16M4 12h16M4 17h16'
};
export function Icon({ name, size = 20 }) { return <svg className="icon" aria-hidden="true" width={size} height={size} viewBox="0 0 24 24"><path d={ICON_PATHS[name]} /></svg>; }
export function Navbar() {
  const { user, logout } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [expanded, setExpanded] = useState(false); const menuButton = useRef(null);
  useEffect(() => setExpanded(false), [location.pathname, location.search]);
  function closeMenu(event) { if (expanded && event.key === 'Escape') { event.preventDefault(); setExpanded(false); menuButton.current?.focus(); } }
  return <header className="header" onKeyDown={closeMenu}><div className="header__inner">
    <Link className="header__brand" to="/" aria-label="Doubt Forum home"><Mark /></Link>
    <button className="nav-toggle" ref={menuButton} aria-expanded={expanded} aria-controls="main-navigation" onClick={() => setExpanded(!expanded)}><Icon name="menu" /><span>Menu</span></button>
    <nav id="main-navigation" className={expanded ? "navigation navigation--open" : "navigation"} aria-label="Main navigation">
      <NavLink to="/" end>Explore</NavLink>
      <Link to="/?scope=all&tag=study-library">Study Library</Link>
      <Link to="/?view=saved">Saved</Link>
      {user?.role === 'admin' && <NavLink to="/admin">Moderation</NavLink>}
      <ThemeControl />
      {user && <NotificationBell />}
      <Link className="button button--small nav-ask" to="/ask"><Icon name="plus" size={18} />Ask a doubt</Link>
      {user ? <>
        <Link className="user-link" to={`/users/${user._id}`}><Avatar name={user.name} /><span>{user.name.split(' ')[0]}</span></Link>
        <Link to={`/users/${user._id}?tab=doubts`}>My questions</Link>
        <Link to="/account">Account</Link>
        <button className="text-button" onClick={() => { logout(); navigate('/'); }}>Sign out</button>
      </> : <Link className="nav-signin" to="/login">Sign in</Link>}
    </nav>
  </div></header>;
}
// Phone-only bottom bar: the main places plus Ask in thumb reach.
export function MobileTabBar() {
  const { user } = useAuth(); const location = useLocation(); const params = new URLSearchParams(location.search);
  const onExplore = location.pathname === '/';
  const library = onExplore && params.get('tag') === 'study-library'; const saved = onExplore && params.get('view') === 'saved';
  const here = { explore: onExplore && !library && !saved, library, saved, me: user && location.pathname === `/users/${user._id}` };
  const tab = (key, to, icon, label) => <Link className="tabbar__item" to={to} aria-current={here[key] ? 'page' : undefined}><Icon name={icon} size={22} /><span>{label}</span></Link>;
  return <nav className="tabbar" aria-label="Quick navigation">
    {tab('explore', '/', 'home', 'Explore')}
    {tab('library', '/?scope=all&tag=study-library', 'book', 'Library')}
    <Link className="tabbar__ask" to="/ask" aria-label="Ask a doubt" aria-current={location.pathname === '/ask' ? 'page' : undefined}><Icon name="plus" size={28} /></Link>
    {tab('saved', '/?view=saved', 'bookmark', 'Saved')}
    {user ? tab('me', `/users/${user._id}`, 'user', 'Me') : tab('me', '/login', 'user', 'Sign in')}
  </nav>;
}
export function Avatar({ name = '?', large = false }) { return <span className={`avatar ${large ? 'avatar--large' : ''}`} aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>; }
export function Badge({ role }) { return role === 'teacher' || role === 'admin' ? <span className={`badge badge--${role}`}>{role === 'teacher' ? '✓ Teacher' : 'Admin'}</span> : null; }
export function Author({ user, createdAt }) { return <div className="author"><Avatar name={user?.name || 'Deleted user'} /><Link to={user ? `/users/${user._id}` : '/'}>{user?.name || 'Deleted user'}</Link><Badge role={user?.role} />{createdAt && <span className="muted">{date(createdAt)}</span>}</div>; }
export function ErrorBox({ message, retry }) { return message ? <div className="error" role="alert">{message}{retry && <button className="text-button retry-button" onClick={retry}>Try again</button>}</div> : null; }
export function Loading() { return <div className="state" role="status"><span className="spinner" /> Loading…</div>; }
export function Empty({ title = 'No doubts here yet', children }) { return <div className="empty"><span className="empty__icon">?</span><h3>{title}</h3><p className="muted">{children || 'Start the conversation. Your question could help someone else, too.'}</p></div>; }
export function Tags({ values = [] }) { return <div className="tags">{values.map(tag => <Link key={tag} className="tag" to={`/?tag=${encodeURIComponent(tag)}`}>{tag}</Link>)}</div>; }
export function DoubtCard({ doubt }) { const location = useLocation(); return <article className="doubt-card"><div className="doubt-card__stats"><span><strong>{doubt.votes}</strong> votes</span><span className={doubt.status === 'solved' ? 'doubt-card__solved' : ''}><strong>{doubt.answerCount}</strong> {doubt.answerCount === 1 ? 'answer' : 'answers'}</span></div><div className="doubt-card__main"><div className="eyebrow"><span>{doubt.subject}</span><span>{levelLabel(doubt)}</span>{doubt.status === 'solved' && <span className="badge badge--solved">✓ Accepted answer</span>}</div><h2><Link to={`/doubts/${doubt._id}`} state={{ from: location.pathname + location.search }}>{doubt.title}</Link></h2><p className="doubt-card__preview">{markdownToText(doubt.body)}</p><Tags values={doubt.tags} /><Author user={doubt.author} createdAt={doubt.createdAt} /></div></article>; }
// Flat Explore row. Status wording follows the API: "open" means no accepted
// answer, so "No answers yet" is shown only when the real count is zero.
export function questionStatus(doubt) {
  if (doubt.status === 'solved') return { tone: 'solved', label: 'Accepted answer' };
  return doubt.answerCount === 0 ? { tone: 'zero', label: 'No answers yet' } : { tone: 'open', label: 'No accepted answer' };
}
export function QuestionRow({ doubt }) {
  const location = useLocation(); const status = questionStatus(doubt); const count = doubt.answerCount ?? 0;
  return <li className="qrow">
    <div className={`qrow__count qrow__count--${status.tone}`}><strong>{count}</strong><span>{count === 1 ? 'answer' : 'answers'}</span></div>
    <div className="qrow__main">
      <h3 className="qrow__title"><Link to={`/doubts/${doubt._id}`} state={{ from: location.pathname + location.search }}>{doubt.title}</Link></h3>
      <p className="qrow__preview">{markdownToText(doubt.body)}</p>
      <div className="qrow__meta">
        <span className="qrow__subject">{doubt.subject}</span>
        <span className={`qrow__status qrow__status--${status.tone}`}>{status.tone === 'solved' ? '✓ ' : ''}{status.label}</span>
        <span>{levelOf(doubt)?.label || 'Any level'}</span>
        <span>{doubt.votes} {Math.abs(doubt.votes) === 1 ? 'vote' : 'votes'}</span>
        {doubt.tags?.slice(0, 3).map(tag => <Link key={tag} className="qrow__tag" to={`/?tag=${encodeURIComponent(tag)}`}>#{tag}</Link>)}
        <span className="qrow__by">{doubt.author?.name || 'Deleted user'} · {date(doubt.createdAt)}</span>
      </div>
    </div>
    <SaveButton doubt={doubt} compact />
  </li>;
}
// Native button, so Enter and Space work; aria-pressed announces the state.
export function SaveButton({ doubt, compact = false }) {
  const { notify } = useAuth(); const saved = useSavedQuestions().some(item => item.id === doubt._id);
  function toggle() {
    const result = toggleSaved(doubt);
    if (!result.ok) notify('This browser is blocking site storage, so the question could not be saved on this device.');
    else notify(result.saved ? 'Saved on this device. Find it under Saved on Explore.' : 'Removed from saved questions.');
  }
  return <button type="button" className={`save-button${compact ? ' save-button--compact' : ''}`} aria-pressed={saved} onClick={toggle}
    title={saved ? 'Remove from saved questions on this device' : 'Save this question on this device'}>
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path d="M6 3h12v18l-6-4.5L6 21z" /></svg>
    <span>{saved ? 'Saved' : 'Save'}</span>{compact && <span className="visually-hidden">: {doubt.title}</span>}
  </button>;
}
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
      <textarea ref={area} id={`${id}-input`} hidden={!writing} rows={rows} value={value} onChange={event => onChange(event.target.value)} required={required} minLength={minLength} maxLength={maxLength} placeholder={placeholder} />
      {!writing && (value.trim() ? <Markdown source={value} /> : <p className="muted editor__empty">Nothing to preview yet.</p>)}
    </div>
    <small className="editor__hint">Markdown is supported. Use the code block button for code, and <code>$x^2$</code> for maths.</small>
  </div>;
}
