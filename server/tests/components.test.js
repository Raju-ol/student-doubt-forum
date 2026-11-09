// Renders the Markdown components to confirm the React wiring works, not just
// the helper functions. The client is JSX, which Node cannot parse, so esbuild
// bundles it first with React left external.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const entry = fileURLToPath(new URL('../../client/src/components.jsx', import.meta.url));
// Inside node_modules so that `react`, left external by the bundle, still
// resolves from the bundled file, and so the output is already git-ignored.
const cache = fileURLToPath(new URL('../../node_modules/.cache/', import.meta.url));
await mkdir(cache, { recursive: true });
const directory = await mkdtemp(join(cache, 'forum-components-'));
const outfile = join(directory, 'components.mjs');
await build({
  entryPoints: [entry], outfile, bundle: true, format: 'esm', platform: 'browser',
  jsx: 'automatic', loader: { '.jsx': 'jsx', '.css': 'empty' },
  external: ['react', 'react-dom', 'react-dom/*', 'react/*', 'react-router-dom'],
  define: { 'import.meta.env.VITE_API_URL': '""' }, logLevel: 'silent'
});
const { Markdown, MarkdownEditor, TabList } = await import(pathToFileURL(outfile).href);
test.after(() => rm(directory, { recursive: true, force: true }));

// The renderer is loaded lazily in the browser, so static rendering shows the
// plain-text fallback. Mount into jsdom when the rendered HTML is what matters.
const dom = new JSDOM('<!doctype html><div id="root"></div>');
const markup = node => renderToStaticMarkup(node);

test('tabs move focus and selected panel association with the keyboard', async () => {
  const { createRoot } = await import('react-dom/client');
  const previousWindow = globalThis.window, previousDocument = globalThis.document;
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const host = dom.window.document.createElement('div'); dom.window.document.body.append(host);
  const root = createRoot(host);
  function Harness() {
    const [value, setValue] = React.useState('users');
    return React.createElement(TabList, { id: 'test-tabs', label: 'Sections', value, onChange: setValue, items: [{ value: 'users', label: 'Users' }, { value: 'reports', label: 'Reports' }] });
  }
  try {
    await React.act(async () => root.render(React.createElement(Harness)));
    const buttons = host.querySelectorAll('[role=tab]'); buttons[0].focus();
    assert.equal(buttons[0].tabIndex, 0); assert.equal(buttons[1].tabIndex, -1);
    await React.act(async () => buttons[0].dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    assert.equal(dom.window.document.activeElement, buttons[1]); assert.equal(buttons[1].getAttribute('aria-selected'), 'true'); assert.equal(buttons[0].tabIndex, -1);
    assert.equal(buttons[1].getAttribute('aria-controls'), 'test-tabs-panel');
    await React.act(async () => buttons[1].dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true })));
    assert.equal(dom.window.document.activeElement, buttons[0]); assert.equal(buttons[0].getAttribute('aria-selected'), 'true');
  } finally { await React.act(async () => root.unmount()); host.remove(); globalThis.window = previousWindow; globalThis.document = previousDocument; delete globalThis.IS_REACT_ACT_ENVIRONMENT; }
});

test('Markdown components render', async t => {
  await t.test('a body renders as readable text before the renderer loads', () => {
    const html = markup(React.createElement(Markdown, { source: 'hello **there**' }));
    assert.match(html, /hello/);
    assert.ok(!html.includes('<script'));
  });

  await t.test('an empty body renders nothing at all', () => {
    for (const source of ['', '   ', null, undefined]) {
      assert.equal(markup(React.createElement(Markdown, { source })), '');
    }
  });

  await t.test('the fallback escapes HTML rather than trusting it', () => {
    const html = markup(React.createElement(Markdown, { source: '<img src=x onerror=alert(1)>' }));
    assert.ok(!/<img/i.test(html));
    assert.match(html, /&lt;img/);
  });

  await t.test('the editor renders a labelled toolbar and a tab set', () => {
    const html = markup(React.createElement(MarkdownEditor, { id: 'test', value: 'draft body', onChange() {}, rows: 6 }));
    dom.window.document.getElementById('root').innerHTML = html;
    const { document } = dom.window;

    const tools = [...document.querySelectorAll('.editor__tool')];
    assert.equal(tools.length, 8, 'expected every formatting tool to render');
    for (const button of tools) {
      assert.equal(button.getAttribute('type'), 'button', 'a toolbar button must not submit the form');
      assert.ok(button.getAttribute('aria-label'), 'every toolbar button needs an accessible name');
    }

    const tablist = document.querySelector('[role="tablist"]');
    assert.ok(tablist, 'expected a tablist, not plain toggle buttons');
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    assert.equal(tabs.length, 2);
    assert.equal(tabs[0].getAttribute('aria-selected'), 'true', 'Write is selected first');
    assert.equal(tabs[1].getAttribute('aria-selected'), 'false');
    // Roving tabindex: one stop in the tab order, arrow keys move within.
    assert.deepEqual(tabs.map(tab => tab.getAttribute('tabindex')), ['0', '-1']);
    for (const tab of tabs) assert.ok(document.getElementById(tab.getAttribute('aria-controls')), 'aria-controls must point at the panel');

    const panel = document.querySelector('[role="tabpanel"]');
    assert.ok(document.getElementById(panel.getAttribute('aria-labelledby')), 'the panel must name its tab');

    const textarea = document.querySelector('textarea');
    assert.ok(textarea, 'the textarea must still exist');
    assert.equal(textarea.textContent, 'draft body');
    assert.ok(!textarea.hasAttribute('hidden'), 'the textarea is visible on the Write tab');
  });

  await t.test('editor validation attributes reach the textarea', () => {
    const html = markup(React.createElement(MarkdownEditor, { id: 'v', value: '', onChange() {}, required: true, minLength: 20, maxLength: 12000 }));
    dom.window.document.getElementById('root').innerHTML = html;
    const textarea = dom.window.document.querySelector('textarea');
    assert.equal(textarea.getAttribute('required'), '');
    assert.equal(textarea.getAttribute('minlength'), '20');
    assert.equal(textarea.getAttribute('maxlength'), '12000');
  });
});
