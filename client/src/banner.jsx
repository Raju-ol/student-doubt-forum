import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { api } from './api';
import { useAuth } from './context';
import { ErrorBox } from './components';

export const DISMISSED_KEY = 'doubt-forum.banner.dismissed';
const MAX = 140;
const readDismissed = () => { try { return localStorage.getItem(DISMISSED_KEY); } catch { return null; } };

// The admin's one-line announcement, above every page. Dismissing hides that
// announcement on this device; a changed announcement shows again.
export function SiteBanner() {
  const [banner, setBanner] = useState(null);
  const [dismissed, setDismissed] = useState(readDismissed);
  useEffect(() => {
    let active = true;
    api('/banner').then(value => { if (active) setBanner(value); }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (!banner?.text || dismissed === banner.updatedAt) return null;
  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, banner.updatedAt); } catch { /* blocked storage: hide until reload */ }
    setDismissed(banner.updatedAt);
  }
  return <div className="site-banner" role="status">
    <Megaphone aria-hidden="true" size={18} />
    <span>{banner.text}</span>
    <button type="button" aria-label="Dismiss announcement" onClick={dismiss}>×</button>
  </div>;
}

// Admin only: write, replace or remove the announcement.
export function BannerEditor() {
  const { token, notify } = useAuth();
  const [text, setText] = useState('');
  const [live, setLive] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api('/banner').then(value => { if (active) { setText(value.text); setLive(value.text); } }).catch(() => {});
    return () => { active = false; };
  }, []);
  async function save(next) {
    setBusy(true); setError('');
    try {
      const result = await api('/admin/banner', { method: 'PUT', token, body: { text: next } });
      setText(result.text); setLive(result.text); notify(next ? 'Banner is live.' : 'Banner removed.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="panel banner-editor" aria-labelledby="banner-heading">
    <h2 id="banner-heading">Site banner</h2>
    <p className="muted">One plain line shown above every page, such as “Exam week: extra teachers online Thursday”. Visitors can dismiss it on their device.</p>
    <ErrorBox message={error} />
    <form onSubmit={event => { event.preventDefault(); save(text); }}>
      <label>Announcement<input value={text} maxLength={MAX} onChange={event => setText(event.target.value)} placeholder="No banner right now" /></label>
      <small className="muted">{text.length} of {MAX} characters{live && live === text ? ' · live now' : ''}</small>
      <div className="form-actions">
        <button className="button" disabled={busy || !text.trim() || text === live}>Publish banner</button>
        <button type="button" className="button button--secondary" disabled={busy || !live} onClick={() => save('')}>Remove banner</button>
      </div>
    </form>
  </section>;
}
