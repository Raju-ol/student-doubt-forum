import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { CRAWLER, summarize } from '../src/share.js';
import { Doubt, User } from '../src/models.js';

const CRAWLERS = ['WhatsApp/2.23.20.0 A', 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', 'Twitterbot/1.0', 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', 'TelegramBot (like TwitterBot)', 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)', 'LinkedInBot/1.0 (compatible; Mozilla/5.0)', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36 Facebot'];
const BROWSERS = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile Safari/604.1', 'curl/8.5.0', ''];

test('Vercel sends only link-preview crawlers to the share page, and the server agrees', () => {
  const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
  const index = config.rewrites.findIndex(rule => rule.source === '/doubts/:id');
  assert.ok(index > -1, 'a /doubts/:id rewrite exists');
  assert.ok(index < config.rewrites.findIndex(rule => rule.source === '/:path*'), 'it comes before the catch-all so crawlers reach it');
  const rule = config.rewrites[index];
  assert.equal(rule.destination, '/api');
  assert.equal(rule.has.length, 1);
  assert.equal(rule.has[0].type, 'header'); assert.equal(rule.has[0].key, 'user-agent');
  const vercel = new RegExp(`^${rule.has[0].value}$`);
  for (const agent of CRAWLERS) { assert.ok(vercel.test(agent), `Vercel matches ${agent}`); assert.ok(CRAWLER.test(agent), `server matches ${agent}`); }
  for (const agent of BROWSERS) { assert.ok(!vercel.test(agent), `Vercel ignores ${agent}`); assert.ok(!CRAWLER.test(agent), `server ignores ${agent}`); }
});

test('summarize turns Markdown into one short plain line', () => {
  assert.equal(summarize('## Why?\n\nUse `a < b` and **bold** with [a link](http://x.test) and ![img](http://x.test/i.png).\n\n```js\nconsole.log(1)\n```\nDone'), 'Why? Use a < b and bold with a link and . Done');
  assert.equal(summarize('x'.repeat(300)).length, 180);
  assert.ok(summarize('x'.repeat(300)).endsWith('…'));
  assert.equal(summarize(undefined), '');
});

test('crawlers get a share page with preview tags; everyone else gets the app', async t => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const dbName = `forum_test_${Date.now()}_${randomBytes(3).toString('hex')}`;
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017', { dbName });
  const server = createApp({ serveClient: false }).listen(0, '127.0.0.1');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    assert.equal(mongoose.connection.name, dbName);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
  const get = (path, agent) => fetch(`http://127.0.0.1:${server.address().port}${path}`, { headers: agent ? { 'User-Agent': agent } : {} });
  const author = await User.create({ name: 'Asha', email: 'asha@example.test', reputation: 0 });
  const plain = await Doubt.create({ title: 'Why does "a < b" fail? <script>alert(1)</script> & more', body: 'I tried **bold** things and `code` here, and still the compare fails in my loop.', subject: 'Java', author: author._id });
  const withImage = await Doubt.create({ title: 'What does this diagram show?', body: 'See the attached picture for the full setup of the circuit.', subject: 'Physics', author: author._id, images: [{ url: 'https://res.cloudinary.com/demo/image/upload/circuit.png', publicId: 'circuit' }] });

  const page = await get(`/doubts/${plain._id}`, 'WhatsApp/2.23.20.0 A');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  const html = await page.text();
  assert.ok(html.includes(`<meta property="og:url" content="http://127.0.0.1:${server.address().port}/doubts/${plain._id}"/>`));
  assert.ok(html.includes('<meta property="og:title" content="Why does &quot;a &lt; b&quot; fail? &lt;script&gt;alert(1)&lt;/script&gt; &amp; more · Doubt Forum"/>'));
  assert.ok(!html.includes('<script>'), 'user text is escaped');
  assert.match(html, /<meta property="og:description" content="I tried bold things and code here, and still the compare fails in my loop\."\/>/);
  assert.match(html, /<meta property="og:image" content="http:\/\/127\.0\.0\.1:\d+\/illustrations\/hero-explore\.png"\/>/);
  assert.match(html, /<meta name="twitter:card" content="summary"\/>/);
  assert.match(html, /<meta property="og:type" content="article"\/>/);

  const photo = await (await get(`/doubts/${withImage._id}`, 'facebookexternalhit/1.1')).text();
  assert.ok(photo.includes('<meta property="og:image" content="https://res.cloudinary.com/demo/image/upload/circuit.png"/>'));
  assert.match(photo, /<meta name="twitter:card" content="summary_large_image"\/>/);

  // A normal browser is never served the share page.
  const browser = await get(`/doubts/${plain._id}`, BROWSERS[0]);
  assert.equal(browser.status, 404);
  assert.ok(!(await browser.text()).includes('og:title'));
  // Missing or malformed ids give crawlers a 404 and leak nothing.
  assert.equal((await get('/doubts/000000000000000000000000', 'Twitterbot/1.0')).status, 404);
  assert.equal((await get('/doubts/not-an-id', 'Twitterbot/1.0')).status, 404);
});
