// Saved questions live in this browser only (first version, no account sync).
// Web Storage can be disabled or full; every access is guarded so saving never
// breaks reading. A small snapshot is kept so the Saved view needs no requests.
import { useEffect, useState } from 'react';

export const SAVED_KEY = 'doubt-forum.saved.v1';
export const SAVED_LIMIT = 200;
const EVENT = 'doubt-forum:saved';

function storage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

export function savedStorageAvailable() {
  const store = storage();
  if (!store) return false;
  try { const probe = SAVED_KEY + '.probe'; store.setItem(probe, '1'); store.removeItem(probe); return true; } catch { return false; }
}

function clean(item) {
  if (!item || typeof item.id !== 'string' || !item.id || typeof item.title !== 'string') return null;
  return {
    id: item.id.slice(0, 64),
    title: item.title.slice(0, 200),
    subject: typeof item.subject === 'string' ? item.subject.slice(0, 80) : '',
    status: item.status === 'solved' ? 'solved' : 'open',
    answerCount: Number.isInteger(item.answerCount) && item.answerCount >= 0 ? item.answerCount : null,
    savedAt: typeof item.savedAt === 'string' ? item.savedAt : new Date(0).toISOString()
  };
}

export function readSaved() {
  try {
    const raw = storage()?.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    return parsed.map(clean).filter(item => item && !seen.has(item.id) && seen.add(item.id));
  } catch { return []; }
}

function write(items) {
  try { storage().setItem(SAVED_KEY, JSON.stringify(items.slice(0, SAVED_LIMIT))); } catch { return false; }
  // Tell other Save buttons on this page; a notification problem is not a save failure.
  try { globalThis.dispatchEvent?.(new Event(EVENT)); } catch { /* ignore */ }
  return true;
}

export const isSaved = id => readSaved().some(item => item.id === id);

// Returns { ok, saved } so the caller can tell the student when storage refused.
export function toggleSaved(doubt) {
  const items = readSaved();
  if (items.some(item => item.id === doubt._id)) {
    return { ok: write(items.filter(item => item.id !== doubt._id)), saved: false };
  }
  const entry = clean({ id: doubt._id, title: doubt.title, subject: doubt.subject, status: doubt.status, answerCount: doubt.answerCount ?? doubt.answers?.length, savedAt: new Date().toISOString() });
  if (!entry) return { ok: false, saved: false };
  return { ok: write([entry, ...items]), saved: true };
}

export function removeSaved(id) { return write(readSaved().filter(item => item.id !== id)); }

export function useSavedQuestions() {
  const [items, setItems] = useState(readSaved);
  useEffect(() => {
    const update = () => setItems(readSaved());
    globalThis.addEventListener?.(EVENT, update);
    globalThis.addEventListener?.('storage', update);
    return () => { globalThis.removeEventListener?.(EVENT, update); globalThis.removeEventListener?.('storage', update); };
  }, []);
  return items;
}
