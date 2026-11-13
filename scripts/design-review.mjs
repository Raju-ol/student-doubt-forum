// Local-only browser review. Optional tool: npm install --no-save --package-lock=false playwright
import { chromium } from 'playwright';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createApp } from '../server/src/app.js';
import { User, Doubt, Answer, Resource, Institution } from '../server/src/models.js';
import { tokenFor } from '../server/src/auth.js';
import assert from 'node:assert/strict';

const mongo = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017';
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(mongo)) throw new Error('Use a plain localhost test MongoDB URI.');
const dbName = `forum_design_review_${Date.now()}_${randomBytes(3).toString('hex')}`;
process.env.JWT_SECRET = randomBytes(48).toString('hex');
process.env.NODE_ENV = 'test';
const output = 'output/design-consistency';
await mkdir(output, { recursive: true });
await mongoose.connect(mongo, { dbName });
let server, browser;
const results = [], errors = [];
try {
  const institution = await Institution.create({ name: 'Review College', slug: 'review-college' });
  const [student, teacher, admin] = await User.create([
    { name: 'Review Student With A Long Display Name', email: 'student@example.test', role: 'student', reputation: 0, institution: institution._id },
    { name: 'Review Teacher', email: 'teacher@example.test', role: 'teacher', teacherSubjects: ['DBMS'], reputation: 0 },
    { name: 'Review Admin', email: 'admin@example.test', role: 'admin', reputation: 0 }
  ]);
  const question = await Doubt.create({ title: 'How do normalization and foreign keys work together in a relational database?', body: 'A local review fixture.\n\nHow should I organize my tables to avoid redundant data?', subject: 'DBMS', author: student._id, tags: ['database'], institution: institution._id });
  await Answer.create({ doubt: question._id, author: teacher._id, body: 'Use separate tables for entities and reference related rows using foreign keys.' });
  await Resource.create({ title: 'Database design notes with a deliberately long descriptive title for reviewing card wrapping', description: 'Review notes about normalization and relational design.', category: 'notes', kind: 'link', url: 'https://example.com/study-notes', uploader: teacher._id });
  server = createApp({ sendEmail: async () => {} }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const scenarios = [
    ['guest', null, ['/', '/library', '/about', '/login', '/signup', '/forgot-password', '/not-found']],
    ['student', student, ['/ask', `/doubts/${question._id}`, `/users/${student._id}`, '/account', '/notifications', '/library/share', '/?view=saved']],
    ['teacher', teacher, ['/teach', '/library?shelf=teacher']],
    ['admin', admin, ['/admin', '/admin/catalog']]
  ];
  for (const width of [320, 360, 768, 1440]) for (const theme of ['light', 'dark']) {
    for (const [role, user, routes] of scenarios) {
      const context = await browser.newContext({ viewport: { width, height: 960 } });
      await context.addInitScript(({ theme, token }) => {
        localStorage.setItem('forum-theme', theme);
        if (token) sessionStorage.setItem('forum-token', token);
      }, { theme, token: user ? tokenFor(user) : '' });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push({ role, width, theme, message: error.message }));
      for (const route of routes) {
        await page.goto(origin + route, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const state = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth,
          overflow: [...document.querySelectorAll('main *')].filter(e => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && r.right > innerWidth + 2 && getComputedStyle(e).position !== 'absolute' && !e.closest('.table-wrap,.about__table-wrap,.dx-chips');
          }).slice(0, 6).map(e => ({ tag: e.tagName, class: e.className, right: Math.round(e.getBoundingClientRect().right) })),
          unnamedButtons: [...document.querySelectorAll('button')].filter(e => e.checkVisibility() && !e.textContent.trim() && !e.getAttribute('aria-label') && !e.getAttribute('title')).map(e => e.className)
        }));
        const id = `${role}-${width}-${theme}-${route.replace(/[^a-z0-9]/gi, '-').slice(0, 65)}`;
        results.push({ role, width, theme, route, ...state });
        if (width !== 768 && (route === '/' || route === '/library' || route === '/about' || route === '/account')) await page.screenshot({ path: `${output}/${id}.png`, fullPage: true });
        if (role === 'student' && route === '/account' && width <= 360) {
          const bounds = await page.locator('.topbar__brand,.nav-toggle,.topbar__actions').evaluateAll(items => items.map(e => Math.round(e.getBoundingClientRect().top)));
          assert.ok(Math.max(...bounds) - Math.min(...bounds) < 15, 'Phone account controls must stay on the same row.');
          assert.equal(await page.evaluate(() => document.querySelector('.topbar__brand .brand').getBoundingClientRect().right <= document.querySelector('.topbar__actions').getBoundingClientRect().left - 4), true, 'Phone brand does not overlap account controls.');
          await page.locator('.account-menu summary').click();
          await page.getByRole('link', { name: 'Account settings', exact: true }).focus();
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('.account-menu').getAttribute('open'), null);
          assert.equal(await page.locator('.account-menu summary').evaluate(e => e === document.activeElement), true);
          await page.getByRole('button', { name: 'Menu', exact: true }).click();
          const before = await page.getByRole('button', { name: 'Menu', exact: true }).getAttribute('aria-expanded');
          await page.getByRole('button', { name: 'Dark', exact: true }).focus();
          await page.keyboard.press('Tab');
          assert.equal(await page.locator('.sidebar').evaluate(e => e.contains(document.activeElement)), true, 'Tab stays in the open phone navigation.');
          await page.locator('.sidebar__brand').focus();
          await page.keyboard.press('Shift+Tab');
          assert.equal(await page.getByRole('button', { name: 'Dark', exact: true }).evaluate(e => e === document.activeElement), true);
          await page.keyboard.press('Escape');
          results.push({ check: 'mobile-menu-escape', theme, opened: before, closed: await page.getByRole('button', { name: 'Menu', exact: true }).getAttribute('aria-expanded') });
        }
      }
      await context.close();
    }
  }
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.name !== dbName || !/^forum_design_review_/.test(dbName)) throw new Error('Unexpected review database.');
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
}
console.log(JSON.stringify({ pages: results.filter(r => r.route).length, issues: results.filter(r => r.scrollWidth > r.viewport + 2 || r.unnamedButtons?.length), errors }, null, 2));
assert.equal(errors.length, 0, 'No page runtime errors.');
assert.equal(results.filter(r => r.scrollWidth > r.viewport + 2 || r.unnamedButtons?.length).length, 0, 'No viewport overflow or unnamed visible buttons.');
