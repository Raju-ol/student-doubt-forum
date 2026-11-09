import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createMarkdownRenderer } from '../../client/src/markdown.js';
import { markdownToText } from '../../client/src/excerpt.js';

const render = createMarkdownRenderer(new JSDOM('').window);

test('Markdown rendering is safe and preserves existing plain text', async t => {
  await t.test('plain text posted before Markdown still reads correctly', () => {
    const html = render('I tried a loop but it crashed.\nWhat am I missing?');
    assert.match(html, /I tried a loop but it crashed\./);
    // A single newline stays a line break, as `white-space: pre-wrap` gave before.
    assert.match(html, /<br\s*\/?>/);
    assert.ok(!html.includes('<script'));
  });

  await t.test('empty and non-string bodies render nothing', () => {
    for (const value of ['', '   ', null, undefined, 42, {}]) assert.equal(render(value), '');
  });

  await t.test('basic formatting renders', () => {
    assert.match(render('**bold**'), /<strong>bold<\/strong>/);
    assert.match(render('*italic*'), /<em>italic<\/em>/);
    assert.match(render('use `printf` here'), /<code>printf<\/code>/);
    assert.match(render('- one\n- two'), /<ul>[\s\S]*<li>one<\/li>/);
    assert.match(render('1. first\n2. second'), /<ol[\s\S]*<li>first<\/li>/);
    assert.match(render('> quoted'), /<blockquote>/);
    assert.match(render('| a | b |\n| --- | --- |\n| 1 | 2 |'), /<table>/);
  });

  await t.test('fenced code blocks are highlighted and never execute', () => {
    const html = render('```java\nSystem.out.println("hi");\n```');
    assert.match(html, /<pre class="code-block"><code class="hljs language-java"/);
    assert.match(html, /hljs-string/, 'expected syntax highlighting spans');
    assert.ok(!html.includes('<script'));
  });

  await t.test('an unknown code language is escaped rather than dropped', () => {
    const html = render('```notalanguage\n<script>alert(1)</script>\n```');
    assert.ok(!html.includes('<script>'));
    assert.match(html, /&lt;script&gt;/);
  });

  await t.test('code block content is never interpreted as HTML', () => {
    const html = render('```html\n<img src=x onerror=alert(1)>\n```');
    assert.ok(!/onerror=alert/.test(html.replace(/&quot;|&#39;/g, '')) || !html.includes('<img'));
    assert.ok(!html.includes('<img src=x'));
  });

  await t.test('mathematical notation renders through KaTeX', () => {
    const inline = render('the sum $x^2 + y^2$ here');
    assert.match(inline, /class="katex/);
    const block = render('$$\\int_0^\\infty e^{-x^2} dx$$');
    assert.match(block, /class="katex/);
    assert.ok(!block.includes('<script'));
  });

  await t.test('invalid maths does not throw or break the post', () => {
    const html = render('$\\frac{1}{$');
    assert.equal(typeof html, 'string');
    assert.ok(!html.includes('<script'));
  });

  await t.test('headings are clamped to h3 and h4', () => {
    assert.match(render('# Top'), /<h3>Top<\/h3>/);
    assert.match(render('## Second'), /<h3>Second<\/h3>/);
    assert.match(render('### Third'), /<h3>Third<\/h3>/);
    assert.match(render('#### Fourth'), /<h4>Fourth<\/h4>/);
    assert.match(render('###### Sixth'), /<h4>Sixth<\/h4>/);
    for (const level of ['h1', 'h2', 'h5', 'h6']) assert.ok(!render('# x\n## y\n###### z').includes(`<${level}>`));
  });

  await t.test('script injection attempts are removed', () => {
    const attacks = [
      '<script>alert(1)</script>',
      '<img src=x onerror="alert(1)">',
      '<svg/onload=alert(1)>',
      '<iframe src="https://evil.test"></iframe>',
      '<a href="javascript:alert(1)">click</a>',
      '<body onload=alert(1)>',
      '<form action="https://evil.test"><input name="password"></form>',
      '<style>body{display:none}</style>',
      '<object data="evil.swf"></object>',
      '<math><mtext><script>alert(1)</script></mtext></math>',
      '[link](javascript:alert(1))',
      '[link](\u0001javascript:alert(1))',
      '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>'
    ];
    for (const attack of attacks) {
      const html = render(attack);
      assert.ok(!/<script/i.test(html), `script survived: ${attack}`);
      assert.ok(!/<iframe/i.test(html), `iframe survived: ${attack}`);
      assert.ok(!/<object|<embed|<form|<input|<style/i.test(html), `dangerous tag survived: ${attack}`);
      assert.ok(!/\son\w+\s*=/i.test(html), `event handler survived: ${attack}`);
      // Inspect the parsed result rather than the string: a blocked payload may
      // survive as inert text, which is harmless, but no element may end up
      // with an attribute that actually navigates or executes.
      const { document } = new JSDOM(`<div id="root">${html}</div>`).window;
      for (const element of document.querySelectorAll('*')) {
        for (const { name, value } of element.attributes) {
          assert.ok(!/^on/i.test(name), `event handler attribute survived: ${attack}`);
          const scheme = value.replace(/[\s\u0000-\u001f]/g, '').toLowerCase();
          assert.ok(!scheme.startsWith('javascript:'), `javascript: URL survived: ${attack}`);
          assert.ok(!scheme.startsWith('data:text/html'), `data: HTML URL survived: ${attack}`);
        }
      }
    }
  });

  await t.test('links that survive cannot control the opener window', () => {
    const html = render('[docs](https://example.test/guide)');
    assert.match(html, /href="https:\/\/example\.test\/guide"/);
    assert.match(html, /rel="nofollow noopener noreferrer"/);
    assert.match(html, /target="_blank"/);
  });

  await t.test('images are not allowed in post bodies', () => {
    // Screenshots go through the existing Cloudinary upload flow, which checks
    // ownership and file signatures; arbitrary remote images do not.
    assert.ok(!render('![x](https://evil.test/track.png)').includes('<img'));
  });

  await t.test('previews strip Markdown syntax to plain text', () => {
    assert.equal(markdownToText('**bold** and `code`'), 'bold and code');
    assert.equal(markdownToText('# Heading\n\n- item one\n- item two'), 'Heading item one item two');
    assert.equal(markdownToText('see [the docs](https://example.test)'), 'see the docs');
    assert.equal(markdownToText('```js\nconst a = 1;\n```'), 'code');
    assert.equal(markdownToText('> quoted line'), 'quoted line');
    assert.equal(markdownToText(null), '');
    assert.ok(!markdownToText('**x**').includes('*'));
  });
});
