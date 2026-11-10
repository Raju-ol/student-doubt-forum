// Saved questions are stored per device. Storage can be missing, blocked,
// full or corrupted; none of those may throw into the page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readSaved, toggleSaved, removeSaved, isSaved, savedStorageAvailable, SAVED_KEY, SAVED_LIMIT } from '../../client/src/saved-questions.js';

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key), data };
}
function withStorage(store, fn) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: typeof store === 'function' ? store : () => store });
  try { return fn(); } finally { if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else delete globalThis.localStorage; }
}
const doubt = (id, extra = {}) => ({ _id: id, title: `Question ${id}`, subject: 'DBMS', status: 'open', answerCount: 2, ...extra });

test('save, unsave and newest-first ordering with a snapshot for the Saved view', () => withStorage(memoryStorage(), () => {
  assert.equal(savedStorageAvailable(), true);
  assert.deepEqual(toggleSaved(doubt('a')), { ok: true, saved: true });
  assert.deepEqual(toggleSaved(doubt('b', { status: 'solved', answerCount: 0 })), { ok: true, saved: true });
  assert.deepEqual(readSaved().map(item => item.id), ['b', 'a']);
  assert.equal(readSaved()[0].status, 'solved');
  assert.equal(readSaved()[0].answerCount, 0);
  assert.equal(isSaved('a'), true);
  assert.deepEqual(toggleSaved(doubt('a')), { ok: true, saved: false });
  assert.equal(isSaved('a'), false);
  assert.equal(removeSaved('b'), true);
  assert.deepEqual(readSaved(), []);
}));

test('blocked, missing or throwing storage never throws and reports failure', () => {
  const throwing = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); }, removeItem() { throw new Error('SecurityError'); } };
  withStorage(throwing, () => {
    assert.equal(savedStorageAvailable(), false);
    assert.deepEqual(readSaved(), []);
    assert.deepEqual(toggleSaved(doubt('a')), { ok: false, saved: true });
    assert.equal(isSaved('a'), false);
  });
  withStorage(() => { throw new Error('Access denied'); }, () => {
    assert.equal(savedStorageAvailable(), false);
    assert.deepEqual(readSaved(), []);
    assert.equal(toggleSaved(doubt('a')).ok, false);
  });
  withStorage(undefined, () => { assert.equal(savedStorageAvailable(), false); assert.equal(toggleSaved(doubt('a')).ok, false); });
});

test('corrupted or hostile stored data is ignored, de-duplicated and capped', () => {
  const store = memoryStorage();
  withStorage(store, () => {
    store.setItem(SAVED_KEY, '{not json');
    assert.deepEqual(readSaved(), []);
    store.setItem(SAVED_KEY, JSON.stringify({ id: 'x' }));
    assert.deepEqual(readSaved(), []);
    store.setItem(SAVED_KEY, JSON.stringify([{ id: 'a', title: 'A' }, { id: 'a', title: 'dup' }, { id: 7, title: 'bad' }, null, { id: 'b', title: 'B', status: 'weird', answerCount: -3 }]));
    const items = readSaved();
    assert.deepEqual(items.map(item => item.id), ['a', 'b']);
    assert.equal(items[1].status, 'open');
    assert.equal(items[1].answerCount, null);
    store.setItem(SAVED_KEY, JSON.stringify(Array.from({ length: SAVED_LIMIT + 5 }, (_, i) => ({ id: 'q' + i, title: 'T' }))));
    toggleSaved(doubt('new'));
    assert.equal(readSaved().length, SAVED_LIMIT);
    assert.equal(readSaved()[0].id, 'new');
  });
});
