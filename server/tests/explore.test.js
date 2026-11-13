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
  stdin: { contents: "export { Feed, Detail } from './pages.jsx'; export { Provider } from './context.jsx'; export { SimilarWhileAsking } from './similar.jsx'; export { GrowthPanel } from './growth.jsx'; export { SiteBanner, DISMISSED_KEY } from './banner.jsx'; export { LibraryPage } from './library-page.jsx';", resolveDir: dirname(entry), sourcefile: 'qa-explore.jsx', loader: 'jsx' }, outfile, bundle: true, format: 'esm', platform: 'browser',
  jsx: 'automatic', loader: { '.jsx': 'jsx', '.css': 'empty' },
  external: ['react', 'react-dom', 'react-dom/*', 'react/*', 'react-router-dom'],
  define: { 'import.meta.env.VITE_API_URL': '""' }, logLevel: 'silent'
});
const { Feed, Detail, Provider, SimilarWhileAsking, GrowthPanel, SiteBanner, DISMISSED_KEY, LibraryPage } = await import(pathToFileURL(outfile).href);
const { createRoot } = await import('react-dom/client');
const { MemoryRouter, Routes, Route, useSearchParams } = await import('react-router-dom');
test.after(() => rm(directory, { recursive: true, force: true }));

const doubt = (id, status, answerCount, extra = {}) => ({ _id: id, title: `Title ${id}`, body: 'Body text', subject: 'DBMS', tags: [], votes: 0, myVote: 0, status, answerCount, author: { _id: 'u1', name: 'Asha' }, createdAt: '2026-11-01T00:00:00Z', images: [], ...extra });
const FEED = [doubt('d1', 'open', 2), doubt('d2', 'open', 0), doubt('d3', 'solved', 1)];

const SIMILAR = [{ _id: 's1', title: 'Garbage collection basics in Java', subject: 'Java', answerCount: 2, status: 'solved' }, { _id: 's2', title: 'Why finalizers are discouraged', subject: 'Java', answerCount: 1, status: 'open' }];
const resource = (id, title, fromTeacher) => ({ _id: id, title, description: '', category: 'notes', kind: 'link', size: 0, downloads: 0, createdAt: '2026-11-01T00:00:00Z', uploader: { _id: 'u1', name: 'Meera' }, fromTeacher });
const RESOURCES = [resource('r1', 'Normalisation notes', true), resource('r2', 'Student thread notes', false)];
const GROWTH = {
  stats: { questions: 2, answers: 3, accepted: 1, answerUpvotes: 2, sameDoubt: 1, endorsed: 0 },
  milestones: [
    { key: 'first-question', label: 'First question', hint: 'Ask your first doubt', target: 1, progress: 1, earned: true },
    { key: 'helper-10', label: '10 answers given', hint: 'Give 10 answers', target: 10, progress: 3, earned: false },
    { key: 'teacher-endorsed', label: 'Teacher endorsed', hint: 'Have a teacher endorse one of your answers', target: 1, progress: 0, earned: false }
  ]
};
function SimilarHarness() {
  const [params] = useSearchParams();
  return React.createElement(SimilarWhileAsking, { title: params.get('t') || '' });
}

async function mount(path, { storage = 'memory', detail, similar = SIMILAR, feed = FEED, banner = { text: '', updatedAt: null }, preset = {} } = {}) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
  const data = new Map(Object.entries(preset));
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
      : String(url).startsWith('/api/v1/resources/popular') ? []
      : String(url).startsWith('/api/v1/resources?') ? { items: RESOURCES, total: RESOURCES.length, page: 1, pages: 1 }
      : String(url).startsWith('/api/v1/banner') ? banner
      : String(url).startsWith('/api/v1/doubts/similar') || String(url).endsWith('/related') ? similar
      : String(url).startsWith('/api/v1/doubts/') ? detail
      : { items: feed, total: 23, page: 1, pages: 3 };
    return { ok: true, json: async () => ({ success: true, data: body }) };
  };
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const host = dom.window.document.getElementById('root');
  const root = createRoot(host);
  await React.act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: [path] },
    React.createElement(Provider, null, React.createElement(Routes, null,
      React.createElement(Route, { path: '/', element: React.createElement(Feed) }),
      React.createElement(Route, { path: '/similar', element: React.createElement(SimilarHarness) }),
      React.createElement(Route, { path: '/growth', element: React.createElement(GrowthPanel, { growth: GROWTH }) }),
      React.createElement(Route, { path: '/banner', element: React.createElement(SiteBanner) }),
      React.createElement(Route, { path: '/library', element: React.createElement(LibraryPage) }),
      React.createElement(Route, { path: '/doubts/:id', element: React.createElement(Detail) }))))));
  await React.act(async () => new Promise(resolve => setTimeout(resolve, 20)));
  return {
    dom, host, data, requests,
    act: callback => React.act(callback),
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

test('the sort dropdown sets the sort, drops the page and does not count as a filter', async () => {
  const view = await mount('/?subject=Java&page=2&sort=answers');
  try {
    const select = view.host.querySelector('.dx-sort select');
    assert.equal(select.value, 'answers');
    assert.deepEqual([...select.options].map(option => option.value), ['newest', 'votes', 'answers', 'unanswered']);
    const choose = async value => {
      const setter = Object.getOwnPropertyDescriptor(view.dom.window.HTMLSelectElement.prototype, 'value').set;
      await view.act(async () => { setter.call(select, value); select.dispatchEvent(new view.dom.window.Event('change', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 10)); });
      return new URL(view.requests.filter(url => url.startsWith('/api/v1/doubts?')).at(-1), 'http://x').searchParams;
    };
    const votes = await choose('votes');
    assert.equal(votes.get('sort'), 'votes'); assert.equal(votes.get('subject'), 'Java'); assert.equal(votes.has('page'), false);
    const newest = await choose('newest');
    assert.equal(newest.has('sort'), false); assert.equal(newest.get('subject'), 'Java');
    // Sorting alone is not a filter: no filter chip and no "Clear all".
    assert.equal(view.host.querySelectorAll('.dx-active__chip').length, 0);
  } finally { await view.cleanup(); }
  const only = await mount('/?sort=votes');
  try { assert.equal(only.host.querySelector('.dx-active'), null); } finally { await only.cleanup(); }
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

test('Explore cards show a Same doubt pill instead of a plain vote count', async () => {
  const view = await mount('/', {});
  try {
    const pills = [...view.host.querySelectorAll('.qcard .same-doubt')];
    assert.equal(pills.length, 3);
    assert.equal(pills[0].getAttribute('aria-pressed'), 'false');
    assert.match(pills[0].textContent, /Same doubt/);
    assert.equal(view.host.querySelector('.qcard .qcard__meta .vote'), null);
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

test('a question page ends with Similar doubts, and shows nothing when there are none', async () => {
  const detail = { ...doubt('d9', 'open', 0), answers: [] };
  const view = await mount('/doubts/d9', { detail });
  try {
    const section = view.host.querySelector('.qd__related');
    assert.equal(section.querySelector('h2').textContent, 'Similar doubts');
    const links = [...section.querySelectorAll('a')];
    assert.deepEqual(links.map(link => link.getAttribute('href')), ['/doubts/s1', '/doubts/s2']);
    assert.match(section.textContent, /Java · 2 answers · Resolved ✓/);
    assert.match(section.textContent, /Java · 1 answer(?!s)/);
    assert.ok(view.requests.includes('/api/v1/doubts/d9/related'));
    assert.equal(links[0].getAttribute('target'), null);
  } finally { await view.cleanup(); }
  const none = await mount('/doubts/d9', { detail, similar: [] });
  try { assert.equal(none.host.querySelector('.qd__related'), null); } finally { await none.cleanup(); }
});

test('an anonymous question shows Anonymous in the feed and on its page, never a name or profile link', async () => {
  const anonymous = doubt('a1', 'open', 0, { isAnonymous: true, author: { name: 'Anonymous', role: 'student' } });
  const feed = await mount('/', { feed: [anonymous] });
  try {
    const row = feed.host.querySelector('.qcard');
    assert.match(row.querySelector('.qcard__by').textContent, /Asked by Anonymous/);
    assert.equal(row.querySelector('.avatar').textContent, '?');
    assert.doesNotMatch(row.textContent, /Asha/);
  } finally { await feed.cleanup(); }
  const page = await mount('/doubts/a1', { detail: { ...anonymous, answers: [] } });
  try {
    const byline = page.host.querySelector('.qd__byline .author');
    assert.equal(byline.querySelector('.author__anon').textContent, 'Anonymous');
    assert.equal(byline.querySelector('a'), null, 'no link to a profile');
    assert.doesNotMatch(byline.textContent, /visible to staff|only you/);
  } finally { await page.cleanup(); }
  // Staff and the asker receive the real author from the server and are told they are looking at it.
  const staff = await mount('/doubts/a1', { detail: { ...anonymous, author: { _id: 'u1', name: 'Asha', role: 'student' }, answers: [] } });
  try {
    const byline = staff.host.querySelector('.qd__byline .author');
    assert.match(byline.textContent, /Anonymous/);
    assert.match(byline.textContent, /Asha.*visible to staff/);
    assert.equal(byline.querySelector('a').getAttribute('href'), '/users/u1');
  } finally { await staff.cleanup(); }
});

test('an endorsed answer is labelled with the teacher who endorsed it, and nobody else gets a button when signed out', async () => {
  const answer = (id, endorsedBy) => ({ _id: id, body: `Answer ${id}`, author: { _id: 'u2', name: 'Ravi', role: 'student' }, createdAt: '2026-11-02T00:00:00Z', votes: 0, myVote: 0, isAccepted: false, comments: [], endorsedBy });
  const view = await mount('/doubts/d9', { detail: { ...doubt('d9', 'open', 2), answers: [answer('e1', { _id: 't1', name: 'Prof. Meera' }), answer('e2', null)] } });
  try {
    const labels = [...view.host.querySelectorAll('.endorsed-label')];
    assert.equal(labels.length, 1);
    assert.equal(labels[0].textContent, '✓ Teacher endorsed · Prof. Meera');
    assert.doesNotMatch(view.host.textContent, /Endorse(?!d)/);
  } finally { await view.cleanup(); }
});

test('the growth panel lists the counts, earned milestones, and progress towards the next ones', async () => {
  const view = await mount('/growth');
  try {
    const tiles = Object.fromEntries([...view.host.querySelectorAll('.growth__stats > div')].map(tile => [tile.querySelector('dt').textContent, tile.querySelector('dd').textContent]));
    assert.deepEqual(tiles, { 'Questions asked': '2', 'Answers given': '3', 'Accepted answers': '1', 'Answer upvotes': '2', 'Same-doubt presses': '1', 'Teacher endorsements': '0' });
    assert.match(view.host.querySelector('.growth__sub').textContent, /Milestones\s*1 of 3/);
    const items = [...view.host.querySelectorAll('.growth__milestones li')];
    assert.deepEqual(items.map(item => item.classList.contains('is-earned')), [true, false, false]);
    assert.match(items[0].textContent, /First question.*\(earned\)/);
    assert.match(items[1].textContent, /Give 10 answers · 3 of 10/);
    // A one-step milestone shows no "0 of 1" counter, only the hint.
    assert.equal(items[2].querySelector('small').textContent, 'Have a teacher endorse one of your answers');
  } finally { await view.cleanup(); }
});

test('the announcement banner shows its text as plain text and stays dismissed until the text changes', async () => {
  const live = { text: 'Exam week: <b>extra</b> teachers online Thursday', updatedAt: '2026-11-13T09:00:00.000Z' };
  const none = await mount('/banner');
  try { assert.equal(none.host.querySelector('.site-banner'), null, 'no banner when there is no text'); } finally { await none.cleanup(); }

  const view = await mount('/banner', { banner: live });
  try {
    const box = view.host.querySelector('.site-banner');
    assert.equal(box.querySelector('span').textContent, live.text);
    assert.equal(box.querySelector('b'), null, 'text is not interpreted as HTML');
    await view.click(box.querySelector('button'));
    assert.equal(view.host.querySelector('.site-banner'), null);
    assert.equal(view.data.get(DISMISSED_KEY), live.updatedAt);
  } finally { await view.cleanup(); }

  const same = await mount('/banner', { banner: live, preset: { [DISMISSED_KEY]: live.updatedAt } });
  try { assert.equal(same.host.querySelector('.site-banner'), null, 'dismissed on this device'); } finally { await same.cleanup(); }
  const changed = await mount('/banner', { banner: { ...live, updatedAt: '2026-11-14T09:00:00.000Z' }, preset: { [DISMISSED_KEY]: live.updatedAt } });
  try { assert.ok(changed.host.querySelector('.site-banner'), 'a new announcement shows again'); } finally { await changed.cleanup(); }

  // Blocked storage: dismissing still hides it for this visit and nothing throws.
  const blocked = await mount('/banner', { banner: live, storage: 'blocked' });
  try {
    await blocked.click(blocked.host.querySelector('.site-banner button'));
    assert.equal(blocked.host.querySelector('.site-banner'), null);
  } finally { await blocked.cleanup(); }
});

test('the Library labels teacher uploads and filters to the Teacher recommended shelf', async () => {
  const view = await mount('/library?category=notes&page=3');
  try {
    const cards = [...view.host.querySelectorAll('.rcard')];
    assert.deepEqual(cards.map(card => !!card.querySelector('.rcard__teacher')), [true, false]);
    assert.equal(cards[0].querySelector('.rcard__teacher').textContent, '✓ Teacher');
    const chip = () => [...view.host.querySelectorAll('.dx-chip')].find(button => /Teacher recommended/.test(button.textContent));
    assert.equal(chip().getAttribute('aria-pressed'), 'false');
    await view.click(chip());
    const last = new URL(view.requests.filter(url => url.startsWith('/api/v1/resources?')).at(-1), 'http://x').searchParams;
    assert.equal(last.get('shelf'), 'teacher'); assert.equal(last.get('category'), 'notes'); assert.equal(last.get('page'), '1');
    assert.equal(chip().getAttribute('aria-pressed'), 'true');
    await view.click(chip());
    const cleared = new URL(view.requests.filter(url => url.startsWith('/api/v1/resources?')).at(-1), 'http://x').searchParams;
    assert.equal(cleared.has('shelf'), false); assert.equal(cleared.get('category'), 'notes');
    assert.equal(chip().getAttribute('aria-pressed'), 'false');
  } finally { await view.cleanup(); }
});

test('Share uses the share sheet when there is one, otherwise copies the link, otherwise shows it', async () => {
  const detail = { ...doubt('d9', 'open', 0), answers: [] };
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const withNavigator = value => Object.defineProperty(globalThis, 'navigator', { value, configurable: true });
  const view = await mount('/doubts/d9', { detail });
  try {
    const share = () => [...view.host.querySelectorAll('.qd__byline .save-button')].find(button => /Share/.test(button.textContent));
    assert.ok(share(), 'a Share button sits beside Save');
    const copied = [];
    withNavigator({ clipboard: { writeText: async text => { copied.push(text); } } });
    await view.click(share());
    assert.deepEqual(copied, ['http://localhost/doubts/d9']);
    assert.match(view.host.textContent, /Link copied/);
    const shared = [];
    withNavigator({ share: async data => { shared.push(data); } });
    await view.click(share());
    assert.deepEqual(shared, [{ title: 'Title d9', url: 'http://localhost/doubts/d9' }]);
    withNavigator({ clipboard: { writeText: async () => { throw new Error('blocked'); } } });
    await view.click(share());
    assert.match(view.host.textContent, /Copy this link: http:\/\/localhost\/doubts\/d9/);
    // Dismissing the share sheet is not an error and shows no message.
    withNavigator({ share: async () => { throw Object.assign(new Error('cancelled'), { name: 'AbortError' }); }, clipboard: { writeText: async () => { throw new Error('must not be used'); } } });
    view.host.querySelector('.toast button')?.click();
    await view.click(share());
    assert.doesNotMatch(view.host.textContent, /Copy this link|Link copied/);
  } finally {
    if (original) Object.defineProperty(globalThis, 'navigator', original); else delete globalThis.navigator;
    await view.cleanup();
  }
});

test('the duplicate check waits for a real title, debounces, and opens links in a new tab', async () => {
  const short = await mount('/similar?t=How%20do');
  try {
    await React.act(async () => new Promise(resolve => setTimeout(resolve, 650)));
    assert.equal(short.requests.some(url => url.includes('/similar')), false);
    assert.equal(short.host.querySelector('.similar'), null);
  } finally { await short.cleanup(); }
  const long = await mount('/similar?t=How%20does%20garbage%20collection%20work');
  try {
    assert.equal(long.requests.some(url => url.includes('/similar')), false, 'not before the debounce delay');
    await React.act(async () => new Promise(resolve => setTimeout(resolve, 650)));
    const asked = long.requests.filter(url => url.includes('/similar'));
    assert.equal(asked.length, 1);
    assert.equal(new URL(asked[0], 'http://x').searchParams.get('title'), 'How does garbage collection work');
    const box = long.host.querySelector('.similar');
    assert.match(box.textContent, /Is yours already answered/);
    const links = [...box.querySelectorAll('a')];
    assert.equal(links.length, 2);
    assert.ok(links.every(link => link.getAttribute('target') === '_blank' && /noreferrer/.test(link.getAttribute('rel'))));
  } finally { await long.cleanup(); }
  const quiet = await mount('/similar?t=A%20very%20unusual%20headline%20here', { similar: [] });
  try {
    await React.act(async () => new Promise(resolve => setTimeout(resolve, 650)));
    assert.equal(quiet.host.querySelector('.similar'), null);
  } finally { await quiet.cleanup(); }
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
    // Answers keep their up/down arrows; the question has only the small "Same doubt" pill.
    assert.equal(view.host.querySelectorAll('.vote').length, 3);
    assert.equal(view.host.querySelector('.qd__question .vote'), null);
    assert.match(view.host.querySelector('.qd__question .same-doubt').textContent, /Same doubt/);
    assert.ok(view.host.querySelector('.qd__question .save-button'));
    // Signed out: the composer offers sign-in and no reply form.
    assert.equal(view.host.querySelector('.qd__compose form'), null);
    assert.match(view.host.querySelector('.qd__compose').textContent, /Sign in to answer/);
  } finally { await view.cleanup(); }
});
