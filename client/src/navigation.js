export function safeReturn(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/';
  try { const url = new URL(value, 'https://forum.invalid'); return url.origin === 'https://forum.invalid' && !['/login', '/signup'].includes(url.pathname) ? url.pathname + url.search + url.hash : '/'; } catch { return '/'; }
}
export function signInPath(location) {
  return '/login?returnTo=' + encodeURIComponent(safeReturn(location.pathname + location.search + location.hash));
}
