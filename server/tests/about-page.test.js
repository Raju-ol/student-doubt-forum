// The About page must only point at pages that exist, and show a guide for every role.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import React from 'react';

const entry = fileURLToPath(new URL('../../client/src/about-page.jsx', import.meta.url));
const cache = fileURLToPath(new URL('../../node_modules/.cache/', import.meta.url));
await mkdir(cache, { recursive: true });
const directory = await mkdtemp(join(cache, 'forum-about-'));
const outfile = join(directory, 'about.mjs');
await build({
  entryPoints: [entry], outfile, bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', loader: { '.jsx': 'jsx' },
  external: ['react', 'react-dom', 'react-dom/*', 'react/*', 'react-router-dom'], logLevel: 'silent'
});
const bootstrap = new JSDOM('<!doctype html><body></body>');
globalThis.window = bootstrap.window; globalThis.document = bootstrap.window.document;
const { AboutPage, GUIDES, ROLES } = await import(pathToFileURL(outfile).href);
const { createRoot } = await import('react-dom/client');
const { MemoryRouter } = await import('react-router-dom');
test.after(() => rm(directory, { recursive: true, force: true }));

const main = await readFile(new URL('../../client/src/main.jsx', import.meta.url), 'utf8');
const routes = new Set([...main.matchAll(/path="([^"]+)"/g)].map(match => match[1]));

async function show(path) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const host = dom.window.document.getElementById('root');
  const root = createRoot(host);
  await React.act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(AboutPage))));
  return { host, root, dom };
}

test('every link on the About page leads to a real route', async () => {
  for (const [role] of ROLES) {
    const { host, root } = await show(`/about?role=${role}`);
    const links = [...host.querySelectorAll('a')].map(link => new URL(link.getAttribute('href'), 'http://x').pathname);
    assert.ok(links.length > 15);
    for (const pathname of links) assert.ok(routes.has(pathname), `${role}: ${pathname} is not a route`);
    await React.act(async () => root.unmount());
  }
});

test('each role has a guide, and the picker switches between them', async () => {
  for (const [role] of ROLES) { assert.ok(GUIDES[role].can.length >= 5); assert.ok(GUIDES[role].steps.length >= 2); }
  const { host, root } = await show('/about');
  assert.equal(host.querySelector('[aria-pressed="true"]').textContent.trim(), 'Student');
  assert.match(host.textContent, /Ask a good question/);
  const admin = [...host.querySelectorAll('.dx-chip')].find(chip => chip.textContent.includes('Admin'));
  await React.act(async () => admin.click());
  assert.match(host.textContent, /Handle a report/);
  assert.doesNotMatch(host.textContent, /Ask a good question/);
  assert.equal(host.querySelectorAll('h1').length, 1);
  await React.act(async () => root.unmount());
});
