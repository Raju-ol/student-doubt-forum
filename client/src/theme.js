// 'light' is the Sticker Notebook look, 'dark' is After Hours and 'bento' is the
// pastel tile look. Stored names stay 'light'/'dark' so older saved choices work.
export const THEMES = ['system', 'light', 'dark', 'bento'];
export const THEME_LABELS = { system: 'Auto', light: 'Sticker', dark: 'After Hours', bento: 'Bento' };
export function themePreference(value) { return THEMES.includes(value) ? value : 'system'; }
export function nextTheme(value) { return THEMES[(THEMES.indexOf(themePreference(value)) + 1) % THEMES.length]; }
export function resolvedTheme(preference, systemDark) { return themePreference(preference) === 'system' ? systemDark ? 'dark' : 'light' : preference; }
