// Some privacy settings disable Web Storage. The current tab can still log in
// using React state; persistence must never prevent logout or crash startup.
export function readSessionToken() {
  try { return globalThis.sessionStorage?.getItem('forum-token') || ''; } catch { return ''; }
}
export function saveSessionToken(token) {
  try {
    if (token) globalThis.sessionStorage?.setItem('forum-token', token);
    else globalThis.sessionStorage?.removeItem('forum-token');
    return true;
  } catch { return false; }
}
