import React, { useEffect, useState } from 'react';
import { themePreference, resolvedTheme } from './theme';
export function ThemeControl() {
  const [preference, setPreference] = useState(() => { try { return themePreference(localStorage.getItem('forum-theme')); } catch { return 'system'; } });
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => { document.documentElement.dataset.theme = resolvedTheme(preference, media.matches); };
    update(); media.addEventListener('change', update);
    try { localStorage.setItem('forum-theme', preference); } catch {}
    return () => media.removeEventListener('change', update);
  }, [preference]);
  return <label className="theme-control">Theme<select aria-label="Color theme" value={preference} onChange={event => setPreference(event.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>;
}
