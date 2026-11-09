import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './context';
import { ErrorBox, Loading, Empty, Pager, date } from './components';

export function NotificationBell() {
  const { token } = useAuth(); const location = useLocation(); const [unread, setUnread] = useState(null);
  useEffect(() => {
    let active = true;
    const refresh = () => { if (document.visibilityState !== 'hidden') api('/notifications', { token }).then(data => { if (active) setUnread(data.unread); }).catch(() => { if (active) setUnread(null); }); };
    refresh(); const interval = setInterval(refresh, 60000); window.addEventListener('forum-notifications', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { active = false; clearInterval(interval); window.removeEventListener('forum-notifications', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [token, location.pathname]);
  return <Link to="/notifications" aria-label={`Notifications${unread === null ? '' : `, ${unread} unread`}`}>🔔 <span>Notifications{unread ? ` (${unread > 99 ? '99+' : unread})` : ''}</span></Link>;
}
export function NotificationsPage() {
  const { token } = useAuth(); const [page, setPage] = useState(1), [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [version, setVersion] = useState(0), [busy, setBusy] = useState(false);
  useEffect(() => { const controller = new AbortController(); setLoading(true); api(`/notifications?page=${page}`, { token, signal: controller.signal }).then(setData).catch(error => { if (error.name !== 'AbortError') setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [page, token, version]);
  async function read(id) {
    setBusy(true); setError('');
    try { await api(id ? `/notifications/${id}/read` : '/notifications/read', { method: id ? 'PATCH' : 'POST', token }); setVersion(v => v + 1); window.dispatchEvent(new Event('forum-notifications')); }
    catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  const descriptions = { question_answered: 'answered your question', answer_accepted: 'accepted your answer', answer_commented: 'commented on your answer' };
  return <section className="account-page"><h1>Notifications</h1><ErrorBox message={error} retry={() => { setError(''); setVersion(v => v + 1); }} />{Boolean(data?.unread) && <button className="button button--secondary" disabled={busy} onClick={() => read()}>Mark all as read</button>}{loading ? <Loading /> : data?.items.length ? data.items.map(item => <article className="panel notification" key={item._id}><p>{!item.readAt && <strong>New · </strong>}{item.actor?.name || 'Deleted user'} {descriptions[item.type]}.</p>{item.target ? <Link to={`/doubts/${item.target._id}`} onClick={() => { if (!item.readAt) read(item._id); }}>{item.target.title}</Link> : <p className="muted">This discussion was removed.</p>}<p className="muted">{date(item.createdAt)}</p>{!item.readAt && <button className="text-button" disabled={busy} onClick={() => read(item._id)}>Mark as read</button>}</article>) : !error && <Empty title="No notifications yet">Replies and accepted answers will appear here.</Empty>}{data && <Pager page={page} pages={data.pages} onChange={setPage} />}</section>;
}
