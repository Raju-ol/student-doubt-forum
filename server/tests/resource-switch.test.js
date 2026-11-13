import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import React from 'react';

const cache = fileURLToPath(new URL('../../node_modules/.cache/', import.meta.url));
await mkdir(cache, { recursive: true });
const dir = await mkdtemp(join(cache, 'resource-switch-'));
const outfile = join(dir, 'hook.mjs');
await build({ stdin: { contents: "export { useResource } from './pages.jsx'; export { Provider } from './context.jsx';", resolveDir: fileURLToPath(new URL('../../client/src/', import.meta.url)), loader: 'jsx' }, outfile, bundle: true, format: 'esm', platform: 'browser', loader: { '.jsx': 'jsx', '.css': 'empty' }, external: ['react', 'react/*', 'react-dom', 'react-dom/*', 'react-router-dom'], define: { 'import.meta.env.VITE_API_URL': '""' }, logLevel: 'silent' });
const { useResource, Provider } = await import(pathToFileURL(outfile).href);
test.after(() => rm(dir, { recursive: true, force: true }));

test('switching resource routes never renders a previous tab payload, including the render before effects', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const keys = ['window', 'document', 'fetch', 'sessionStorage', 'localStorage', 'IS_REACT_ACT_ENVIRONMENT'];
  const previous = Object.fromEntries(keys.map(k => [k, globalThis[k]]));
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, sessionStorage: { getItem: () => null }, localStorage: { getItem: () => null }, IS_REACT_ACT_ENVIRONMENT: true });
  const pending = new Map();
  globalThis.fetch = async (url, options) => {
    if (url === '/api/v1/catalog') return { ok: true, json: async () => ({ success: true, data: { subjects: [], institutions: [] } }) };
    return new Promise(resolve => pending.set(url, { resolve: data => resolve({ ok: true, json: async () => ({ success: true, data }) }), signal: options.signal }));
  };
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  function Harness() {
    const [route, setRoute] = React.useState('/admin/overview');
    const resource = useResource(route);
    return React.createElement('div', null,
      React.createElement('button', { onClick: () => setRoute('/admin/users') }, 'Users'),
      React.createElement('button', { onClick: () => setRoute('/admin/reports') }, 'Reports'),
      React.createElement('button', { onClick: () => setRoute(null) }, 'Disable'),
      React.createElement('output', null, !route ? String(resource.data) : resource.loading ? 'Loading' : route === '/admin/overview' ? String(resource.data.total) : resource.data.items.map(item => item.name).join(',')));
  }
  try {
    await React.act(async () => root.render(React.createElement(Provider, null, React.createElement(Harness))));
    await React.act(async () => pending.get('/api/v1/admin/overview').resolve({ total: 5 }));
    assert.equal(document.querySelector('output').textContent, '5');
    await React.act(async () => document.querySelectorAll('button')[0].click());
    assert.equal(document.querySelector('output').textContent, 'Loading');
    await React.act(async () => document.querySelectorAll('button')[1].click());
    assert.equal(pending.get('/api/v1/admin/users').signal.aborted, true);
    await React.act(async () => pending.get('/api/v1/admin/users').resolve({ items: [{ name: 'Stale user' }] }));
    assert.equal(document.querySelector('output').textContent, 'Loading');
    await React.act(async () => pending.get('/api/v1/admin/reports').resolve({ items: [{ name: 'Current report' }] }));
    assert.equal(document.querySelector('output').textContent, 'Current report');
    await React.act(async () => document.querySelectorAll('button')[2].click());
    assert.equal(document.querySelector('output').textContent, 'null');
  } finally {
    await React.act(async () => root.unmount());
    for (const [key, value] of Object.entries(previous)) if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    dom.window.close();
  }
});
