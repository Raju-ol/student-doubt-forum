// Explore and Question Detail behaviour in jsdom: status wording, discovery
// links, filter disclosure, saved questions and the reading order on Detail.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import React from 'react';

const entry = fileURLToPath(new URL('../../client/src/pages.jsx', import.meta.url));
const cache = fileURLToPath(new URL('../../node_modules/.cache/', import.meta.url));
await mkdir(cache, { recursive: true });
const directory = await mkdtemp(join(cache, 'forum-explore-'));
const outfile = join(directory, 'pages.mjs');
await build({
  stdin: { contents: "export { Feed, Detail } from './pages.jsx'; export { Provider } from './context.jsx';", resolveDir: dirname(entry), sourcefile: 'qa-explore.jsx', loader: 'jsx' }, outfile, bundle: true, format: 'esm', platform: 'browser',
  jsx: 'automatic', loader: { '.jsx': 'jsx', '.css': 'empty' },
  external: ['react', 'react-dom', 'react-dom/*', 'react/*', 'react-router-dom'],
  define: { 'import.meta.env.VITE_API_URL': '""' }, logLevel: 'silent'
});
const { Feed, Detail, Provider } = await import(pathToFileURL(outfile).href);
const { createRoot } = await import('react-dom/client');
const { MemoryRouter, Routes, Route } = await import('react-router-dom');
test.after(() => rm(directory, { recursive: true, force: true }));

const doubt = (id, status, answerCount, extra = {}) => ({ _id: id, title: `Title ${id}`, body: 'Body text', subject: 'DBMS', tags: [], votes: 0, myVote: 0, status, answerCount, author: { _id: 'u1', name: 'Asha' }, createdAt: '2026-11-01T00:00:00Z', images: [], ...extra });
const FEED = [doubt('d1', 'open', 2), doubt('d2', 'open', 0), doubt('d3', 'solved', 1)];

async function mount(path, { storage = 'memory', detail } = {}) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
  const data = new Map();
  const store = storage === 'blocked'
    ? { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } }
    : { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
  const requests = [];
  const saved = { window: globalThis.window, document: globalThis.document, localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage, fetch: globalThis.fetch, dispatchEvent: globalThis.dispatchEvent, addEventListener: globalThis.addEventListener, removeEventListener: globalThis.removeEventListener, Event: globalThis.Event };
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  globalThis.localStorage = store; globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  globalThis.dispatchEvent = event => dom.window.dispatchEvent(event);
  globalThis.addEventListener = (...args) => dom.window.addEventListener(...args);
  globalThis.removeEventListener = (...args) => dom.window.removeEventListener(...args);
  globalThis.Event = dom.window.Event;
  dom.window.scrollTo = () => {};
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globalThis.fetch = async url => {
    requests.push(String(url));
    const body = String(url).startsWith('/api/v1/catalog') ? { subjects: [{ name: 'DBMS' }, { name: 'Java' }], institutions: [] }
      : String(url).startsWith('/api/v1/doubts/') ? detail
      : { items: FEED, total: 23, page: 1, pages: 3 };
    return { ok: true, json: async () => ({ success: true, data: body }) };
  };
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const host = dom.window.document.getElementById('root');
  const root = createRoot(host);
  await React.act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: [path] },
    React.createElement(Provider, null, React.createElement(Routes, null,
      React.createElement(Route, { path: '/', element: React.createElement(Feed) }),
      React.createElement(Route, { path: '/doubts/:id', element: React.createElement(Detail) }))))));
  await React.act(async () => new Promise(resolve => setTimeout(resolve, 20)));
  return {
    dom, host, data, requests,
    click: async element => React.act(async () => { element.click(); await new Promise(resolve => setTimeout(resolve, 10)); }),
    cleanup: async () => { await React.act(async () => root.unmount()); for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } }
  };
}

test('status wording follows the API: open with replies is Unresolved, no replies is Unanswered', async () => {
  const view = await mount('/?status=open');
  try {
    const rows = [...view.host.querySelectorAll('.qcard')];
    assert.equal(rows.length, 3);
    assert.match(rows[0].querySelector('.qcard__status').textContent, /^Unresolved$/);
    assert.match(rows[1].querySelector('.qcard__status').textContent, /^Unanswered$/);
    assert.match(rows[2].querySelector('.qcard__status').textContent, /^Resolved/);
    assert.equal(view.host.querySelector('#explore-results').textContent, 'Unresolved questions');
    assert.match(view.host.textContent, /23 questions unresolved/);
    // Cards carry the answer count, the view count and the asker.
    assert.match(rows[0].querySelector('.qcard__meta').textContent, /2 answers/);
    assert.match(rows[0].querySelector('.qcard__meta').textContent, /Asked by Asha/);
    // Pagination still comes from the server's status filter; the client never filters a page.
    assert.match(view.host.querySelector('.pager').textContent, /Page 1 of 3/);
    const feed = view.requests.find(url => url.startsWith('/api/v1/doubts?'));
    assert.equal(new URL(feed, 'http://x').searchParams.get('status'), 'open');
  } finally { await view.cleanup(); }
});

test('subject chips keep the search, drop the page and toggle off when active', async () => {
  const view = await mount('/?search=normal&subject=Java&page=2');
  try {
    const chip = name => [...view.host.querySelectorAll('.dx-chip')].find(button => button.textContent === name);
    assert.deepEqual([...view.host.querySelectorAll('.dx-chip')].map(button => button.textContent), ['All', 'DBMS', 'Java']);
    assert.equal(chip('Java').getAttribute('aria-pressed'), 'true');
    assert.equal(chip('DBMS').getAttribute('aria-pressed'), 'false');
    await view.click(chip('DBMS'));
    const last = new URL(view.requests.filter(url => url.startsWith('/api/v1/doubts?')).at(-1), 'http://x').searchParams;
    assert.equal(last.get('subject'), 'DBMS'); assert.equal(last.get('search'), 'normal'); assert.equal(last.has('page'), false);
    await view.click(chip('DBMS'));
    const cleared = new URL(view.requests.filter(url => url.startsWith('/api/v1/doubts?')).at(-1), 'http://x').searchParams;
    assert.equal(cleared.has('subject'), false); assert.equal(cleared.get('search'), 'normal');
  } finally { await view.cleanup(); }
});

test('advanced filters sit behind a labelled toggle with an active count', async () => {
  const view = await mount('/?status=solved&academicSystem=semester&academicIndex=3');
  try {
    const toggle = view.host.querySelector('.explore__filters-toggle');
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.match(toggle.textContent, /Filters/);
    assert.equal(toggle.querySelector('.explore__chip-count').textContent, '2');
    assert.equal(view.host.querySelector('#explore-filters').hidden, true);
    await view.click(toggle);
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(view.host.querySelector('#explore-filters').hidden, false);
    assert.ok(view.host.querySelector('label[for="explore-status"]'));
    const chips = [...view.host.querySelectorAll('.dx-active__chip')].map(chip => chip.getAttribute('aria-label'));
    assert.deepEqual(chips, ['Remove filter Resolved', 'Remove filter Semester 3']);
  } finally { await view.cleanup(); }
});

test('save is a keyboard-operable toggle and the Saved view needs no feed request', async () => {
  const view = await mount('/');
  try {
    const button = view.host.querySelector('.qcard .save-button');
    assert.equal(button.tagName, 'BUTTON');
    assert.equal(button.getAttribute('type'), 'button');
    assert.equal(button.getAttribute('aria-pressed'), 'false');
    await view.click(button);
    assert.equal(view.host.querySelector('.qcard .save-button').getAttribute('aria-pressed'), 'true');
    assert.match(view.host.textContent, /Saved on this device/);
    assert.equal(JSON.parse(view.data.get('doubt-forum.saved.v1'))[0].id, 'd1');
  } finally { await view.cleanup(); }

  const saved = await mount('/?view=saved');
  try {
    assert.equal(saved.requests.some(url => url.startsWith('/api/v1/doubts')), false);
    assert.match(saved.host.textContent, /Stored on this device only/);
    assert.match(saved.host.textContent, /No saved questions yet/);
  } finally { await saved.cleanup(); }
});

test('blocked storage explains itself instead of failing silently', async () => {
  const view = await mount('/?view=saved', { storage: 'blocked' });
  try { assert.match(view.host.textContent, /Saving is unavailable in this browser/); } finally { await view.cleanup(); }
  const feed = await mount('/', { storage: 'blocked' });
  try {
    await feed.click(feed.host.querySelector('.qcard .save-button'));
    assert.equal(feed.host.querySelector('.qcard .save-button').getAttribute('aria-pressed'), 'false');
    assert.match(feed.host.textContent, /blocking site storage/);
  } finally { await feed.cleanup(); }
});

test('question detail separates question, accepted answer, other answers and composer', async () => {
  const answer = (id, isAccepted, votes) => ({ _id: id, body: `Answer ${id}`, author: { _id: 'u2', name: 'Ravi' }, createdAt: '2026-11-02T00:00:00Z', votes, myVote: 0, isAccepted, comments: [] });
  const view = await mount('/doubts/d9', { detail: { ...doubt('d9', 'solved', 3), answers: [answer('acc', true, 1), answer('o1', false, 9), answer('o2', false, 2)] } });
  try {
    const order = [...view.host.querySelectorAll('.qd__question, .qd__accepted, .qd__others, .qd__compose')].map(node => node.className);
    assert.deepEqual(order, ['qd__question', 'qd__accepted', 'qd__others', 'qd__compose']);
    assert.match(view.host.querySelector('.qd__accepted').textContent, /Answer acc/);
    assert.doesNotMatch(view.host.querySelector('.qd__others').textContent, /Answer acc/);
    assert.equal(view.host.querySelector('#others-heading').textContent, '2 other answers');
    assert.equal(view.host.querySelectorAll('.vote').length, 4);
    assert.ok(view.host.querySelector('.qd__question .save-button'));
    // Signed out: the composer offers sign-in and no reply form.
    assert.equal(view.host.querySelector('.qd__compose form'), null);
    assert.match(view.host.querySelector('.qd__compose').textContent, /Sign in to answer/);
  } finally { await view.cleanup(); }
});
