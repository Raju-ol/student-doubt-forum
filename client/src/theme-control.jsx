import React, { useEffect, useState } from 'react';
import { THEMES, THEME_LABELS, themePreference, resolvedTheme } from './theme';
const HINTS = { system: 'Follow your device: Sticker by day, Chalkboard in dark mode', light: 'Sticker (light)', dark: 'Chalkboard (dark)', bento: 'Bento (soft pastel)' };
const ICONS = {
  system: <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>,
  light: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>,
  dark: <svg viewBox="0 0 24 24"><path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" /></svg>,
  bento: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="10" rx="2.5" /><rect x="13" y="3" width="8" height="6" rx="2.5" /><rect x="3" y="15" width="8" height="6" rx="2.5" /><rect x="13" y="11" width="8" height="10" rx="2.5" /></svg>
};
// One pressed button per look; native buttons keep Tab, Enter and Space working.
export function ThemeControl() {
  const [preference, setPreference] = useState(() => { try { return themePreference(localStorage.getItem('forum-theme')); } catch { return 'system'; } });
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => { document.documentElement.dataset.theme = resolvedTheme(preference, media.matches); };
    update(); media.addEventListener('change', update);
    try { localStorage.setItem('forum-theme', preference); } catch {}
    return () => media.removeEventListener('change', update);
  }, [preference]);
  return <div className="theme-control" role="group" aria-label="Theme" data-mode={preference}>
    {THEMES.map(mode => <button key={mode} type="button" className="theme-control__option" data-option={mode} aria-pressed={preference === mode}
      title={HINTS[mode]} onClick={() => setPreference(mode)}>
      <span className="theme-control__icon" aria-hidden="true">{ICONS[mode]}</span><span className="theme-control__name">{THEME_LABELS[mode]}</span>
    </button>)}
  </div>;
}
