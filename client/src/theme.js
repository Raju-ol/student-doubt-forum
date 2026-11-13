// 'light' is the warm peach look and 'dark' the deep purple one; 'system' follows the device.
// Stored names stay 'light'/'dark' so older saved choices work. An old 'bento' choice falls back to 'system'.
export const THEMES = ['system', 'light', 'dark'];
export const THEME_LABELS = { system: 'Auto', light: 'Light', dark: 'Dark' };
export function themePreference(value) { return THEMES.includes(value) ? value : 'system'; }
export function nextTheme(value) { return THEMES[(THEMES.indexOf(themePreference(value)) + 1) % THEMES.length]; }
export function resolvedTheme(preference, systemDark) { return themePreference(preference) === 'system' ? systemDark ? 'dark' : 'light' : preference; }
