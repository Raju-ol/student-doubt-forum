import React, { useEffect, useState } from 'react';
import { themePreference, resolvedTheme, nextTheme } from './theme';
const labels = { system: 'System', light: 'Light', dark: 'Dark' };
export function ThemeControl() {
  const [preference, setPreference] = useState(() => { try { return themePreference(localStorage.getItem('forum-theme')); } catch { return 'system'; } });
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => { document.documentElement.dataset.theme = resolvedTheme(preference, media.matches); };
    update(); media.addEventListener('change', update);
    try { localStorage.setItem('forum-theme', preference); } catch {}
    return () => media.removeEventListener('change', update);
  }, [preference]);
  return <button type="button" className="theme-control" data-mode={preference} aria-label={`Color theme: ${labels[preference]}. Switch to ${labels[nextTheme(preference)]}`} title="Click to cycle System → Light → Dark" onClick={() => setPreference(current => nextTheme(current))}>
    <span className="theme-control__track" aria-hidden="true"><span className="theme-control__thumb" />
      <span className="theme-control__icon" data-icon="system"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg></span>
      <span className="theme-control__icon" data-icon="light"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg></span>
      <span className="theme-control__icon" data-icon="dark"><svg viewBox="0 0 24 24"><path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" /></svg></span>
    </span><span className="theme-control__label" aria-live="polite">{labels[preference]}</span>
  </button>;
}
