export const THEMES = ['system', 'light', 'dark'];
export function themePreference(value) { return THEMES.includes(value) ? value : 'system'; }
export function resolvedTheme(preference, systemDark) { return themePreference(preference) === 'system' ? systemDark ? 'dark' : 'light' : preference; }
