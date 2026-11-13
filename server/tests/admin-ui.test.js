// Presentational admin screens, rendered to static HTML.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';

const src = fileURLToPath(new URL('../../client/src/', import.meta.url));
const cache = fileURLToPath(new URL('../../node_modules/.cache/', import.meta.url));
await mkdir(cache, { recursive: true });
const directory = await mkdtemp(join(cache, 'forum-admin-ui-'));
const outfile = join(directory, 'admin.mjs');
await build({
  stdin: { contents: "export * from './admin-extras.jsx';", resolveDir: src, sourcefile: 'qa-admin.jsx', loader: 'jsx' }, outfile, bundle: true, format: 'esm', platform: 'node',
  jsx: 'automatic', loader: { '.jsx': 'jsx', '.css': 'empty' },
  external: ['react', 'react-dom', 'react-dom/*', 'react/*', 'react-router-dom'],
  define: { 'import.meta.env.VITE_API_URL': '""' }, logLevel: 'silent'
});
const components = await import(pathToFileURL(outfile).href);
const { renderToStaticMarkup } = await import('react-dom/server');
const { StaticRouter } = await import('react-router-dom');
test.after(() => rm(directory, { recursive: true, force: true }));
const html = element => renderToStaticMarkup(React.createElement(StaticRouter, { location: '/admin' }, element));

test('the overview compares this week with last and links to what is waiting', () => {
  const data = {
    weeks: { questions: { thisWeek: 5, lastWeek: 2 }, answers: { thisWeek: 1, lastWeek: 4 }, signups: { thisWeek: 3, lastWeek: 3 } },
    waiting: { unanswered: 7, reports: 2, teacherRequests: 0 },
    totals: { users: 40, questions: 120, answers: 260, resources: 9, downloads: 311 }
  };
  const markup = html(React.createElement(components.Overview, { data, onOpen() {} }));
  assert.match(markup, /Questions asked<\/span><strong>5<\/strong><span class="overview__trend is-up">\+3 vs last week/);
  assert.match(markup, /Answers given<\/span><strong>1<\/strong><span class="overview__trend">−3 vs last week/);
  assert.match(markup, /New sign-ups<\/span><strong>3<\/strong><span class="overview__trend">same as last week/);
  assert.match(markup, /Unanswered questions<\/span><strong>7<\/strong><a class="text-button" href="\/\?scope=all&amp;status=open&amp;sort=unanswered"[^>]*>See them/);
  assert.match(markup, /Reports to review<\/span><strong>2<\/strong><button type="button" class="text-button">Open reports/);
  assert.match(markup, /Library downloads<\/dt><dd>311<\/dd>/);
  assert.equal(components.trend({ thisWeek: 0, lastWeek: 0 }), 'same as last week');
  assert.equal(html(React.createElement(components.Overview, { data: null })), '');
});

test('the audit list shows who did what, with the action, newest first as given', () => {
  const markup = html(React.createElement(components.AuditList, { items: [
    { _id: 'a2', action: 'user.role', summary: 'Changed Riya from student to teacher <b>x</b>', createdAt: '2026-11-13T10:30:00Z', actor: { name: 'Anita', role: 'admin' } },
    { _id: 'a1', action: 'report.remove', summary: 'Removed doubt “Spam”', createdAt: '2026-11-12T08:00:00Z', actor: null }
  ] }));
  assert.ok(markup.indexOf('Changed Riya') < markup.indexOf('Removed doubt'));
  assert.match(markup, /<strong>Anita<\/strong> <span class="muted">\(admin\)<\/span> · Changed Riya/);
  assert.match(markup, /Deleted user/);
  assert.match(markup, /class="badge audit__action">user\.role</);
  assert.ok(!markup.includes('<b>x</b>'), 'summaries are escaped');
  assert.match(html(React.createElement(components.AuditList, { items: [] })), /Nothing recorded yet/);
});
