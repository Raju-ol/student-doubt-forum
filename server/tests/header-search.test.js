// The header search must keep the current place (Explore filters, Library category, Saved view)
// and only change the search text. Rendered in jsdom against the real Navbar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import React from 'react';

const entry = fileURLToPath(new URL('../../client/src/components.jsx', import.meta.url));
const cache = fileURLToPath(new URL('../../node_modules/.cache/', import.meta.url));
await mkdir(cache, { recursive: true });
const directory = await mkdtemp(join(cache, 'forum-search-'));
const outfile = join(directory, 'components.mjs');
await build({
  stdin: { contents: "export * from './components.jsx'; export { Provider } from './context.jsx';", resolveDir: dirname(entry), sourcefile: 'qa-search.jsx', loader: 'jsx' }, outfile, bundle: true, format: 'esm', platform: 'node',
  jsx: 'automatic', loader: { '.jsx': 'jsx', '.css': 'empty' },
  external: ['react', 'react-dom', 'react-dom/*', 'react/*', 'react-router-dom'],
  define: { 'import.meta.env.VITE_API_URL': '""' }, logLevel: 'silent'
});
// React decides at import time whether the browser fires input events, so a DOM must exist first.
const bootstrap = new JSDOM('<!doctype html><body></body>');
globalThis.window = bootstrap.window; globalThis.document = bootstrap.window.document;
const { Navbar, Provider } = await import(pathToFileURL(outfile).href);
const { createRoot } = await import('react-dom/client');
const { MemoryRouter, useLocation } = await import('react-router-dom');
test.after(() => rm(directory, { recursive: true, force: true }));

async function searchFrom(path, text) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
  const keys = ['window', 'document', 'sessionStorage', 'localStorage', 'fetch', 'IS_REACT_ACT_ENVIRONMENT'];
  const previous = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  globalThis.sessionStorage = globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: { subjects: [], institutions: [] } }) });
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const host = dom.window.document.getElementById('root');
  const root = createRoot(host);
  let where = '';
  const Probe = () => { const location = useLocation(); where = location.pathname + location.search; return null; };
  try {
    await React.act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Provider, null, React.createElement(Navbar), React.createElement(Probe)))));
        const input = host.querySelector('#header-search');
    const placeholder = input.getAttribute('placeholder');
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, text);
      input.dispatchEvent(new dom.window.InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
    });
    await React.act(async () => host.querySelector('form[role=search]').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
        return { where, placeholder };
  } finally {
    await React.act(async () => root.unmount());
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
}

test('searching from Explore keeps filters and resets only the page', async () => {
  const result = await searchFrom('/?subject=DBMS&status=open&page=3', 'normal forms');
  const url = new URL(result.where, 'http://x');
  assert.equal(url.pathname, '/');
  assert.equal(url.searchParams.get('search'), 'normal forms');
  assert.equal(url.searchParams.get('subject'), 'DBMS');
  assert.equal(url.searchParams.get('status'), 'open');
  assert.equal(url.searchParams.has('page'), false);
});

test('searching inside Worked Q&A, Saved and Library stays in that place', async () => {
  const worked = new URL((await searchFrom('/?scope=all&tag=study-library&page=2', 'deadlock')).where, 'http://x');
  assert.equal(worked.searchParams.get('tag'), 'study-library'); assert.equal(worked.searchParams.get('scope'), 'all'); assert.equal(worked.searchParams.get('search'), 'deadlock');
  const saved = await searchFrom('/?view=saved', 'sql');
  assert.equal(new URL(saved.where, 'http://x').searchParams.get('view'), 'saved');
  assert.equal(saved.placeholder, 'Search saved questions…');
  const library = await searchFrom('/library?category=notes&page=2', 'dbms');
  const url = new URL(library.where, 'http://x');
  assert.equal(url.pathname, '/library'); assert.equal(url.searchParams.get('category'), 'notes'); assert.equal(url.searchParams.get('search'), 'dbms'); assert.equal(url.searchParams.has('page'), false);
  assert.equal(library.placeholder, 'Search study materials…');
});

test('searching from another page starts a fresh question search, and clearing keeps the filters', async () => {
  const detail = new URL((await searchFrom('/doubts/abc?x=1', 'trees')).where, 'http://x');
  assert.equal(detail.pathname, '/'); assert.equal(detail.search, '?search=trees');
  const cleared = new URL((await searchFrom('/?search=old&subject=Java', '')).where, 'http://x');
  assert.equal(cleared.searchParams.has('search'), false); assert.equal(cleared.searchParams.get('subject'), 'Java');
});
