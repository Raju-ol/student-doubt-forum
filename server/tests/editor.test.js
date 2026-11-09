import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { EDITOR_TOOLS, applyTool, EDITOR_TABS, nextTab } from '../../client/src/editor.js';
import { createMarkdownRenderer } from '../../client/src/markdown.js';

const tool = label => EDITOR_TOOLS.find(item => item.label === label);
const render = createMarkdownRenderer(new JSDOM('').window);

test('Markdown editor formatting tools', async t => {
  await t.test('every tool is labelled and produces valid Markdown', () => {
    for (const item of EDITOR_TOOLS) {
      assert.ok(item.label && item.icon, 'tool needs a label and an icon');
      assert.ok(item.sample, 'tool needs sample text for an empty selection');
      const { text } = applyTool('', 0, 0, item);
      assert.ok(text.includes(item.sample), `${item.label} lost its sample text`);
      assert.ok(render(text).length > 0, `${item.label} produced nothing renderable`);
    }
  });

  await t.test('with no selection the sample text is inserted and selected', () => {
    const { text, caretStart, caretEnd } = applyTool('', 0, 0, tool('Bold'));
    assert.equal(text, '**bold text**');
    assert.equal(text.slice(caretStart, caretEnd), 'bold text');
  });

  await t.test('an existing selection is wrapped, not replaced', () => {
    const value = 'the answer is here';
    const { text, caretStart, caretEnd } = applyTool(value, 4, 10, tool('Bold'));
    assert.equal(text, 'the **answer** is here');
    assert.equal(text.slice(caretStart, caretEnd), 'answer');
  });

  await t.test('inline code and maths wrap correctly', () => {
    assert.equal(applyTool('set x now', 4, 5, tool('Inline code')).text, 'set `x` now');
    assert.equal(applyTool('', 0, 0, tool('Maths')).text, '$x^2 + y^2$');
    assert.match(render(applyTool('', 0, 0, tool('Maths')).text), /class="katex/);
  });

  await t.test('a link keeps the selected words as the link text', () => {
    const { text } = applyTool('read the docs', 9, 13, tool('Link'));
    assert.equal(text, 'read the [docs](https://)');
  });

  await t.test('block tools start on their own line', () => {
    // Mid-line: a newline is added first, or the Markdown would not apply.
    assert.equal(applyTool('text', 4, 4, tool('Bulleted list')).text, 'text\n- first point');
    assert.equal(applyTool('text\n', 5, 5, tool('Bulleted list')).text, 'text\n- first point');
    assert.equal(applyTool('', 0, 0, tool('Bulleted list')).text, '- first point');
    assert.equal(applyTool('', 0, 0, tool('Quote')).text, '> quoted text');
  });

  await t.test('a code block round-trips through the renderer as code', () => {
    const { text } = applyTool('', 0, 0, tool('Code block'));
    assert.match(text, /^```java\n[\s\S]*\n```$/);
    const html = render(text);
    assert.match(html, /<pre class="code-block"><code class="hljs language-java"/);
    assert.ok(!html.includes('<script'));
  });

  await t.test('out-of-range or reversed selections do not corrupt the body', () => {
    assert.equal(applyTool('abc', 99, 150, tool('Bold')).text, 'abc**bold text**');
    assert.equal(applyTool('abc', -5, -1, tool('Bold')).text, '**bold text**abc');
    assert.equal(applyTool('abc', 3, 1, tool('Bold')).text, 'abc**bold text**');
    assert.equal(applyTool(undefined, 0, 0, tool('Bold')).text, '**bold text**');
  });

  await t.test('arrow keys move between the Write and Preview tabs', () => {
    assert.deepEqual(EDITOR_TABS, ['write', 'preview']);
    assert.equal(nextTab('write', 'ArrowRight'), 'preview');
    assert.equal(nextTab('preview', 'ArrowRight'), 'write');
    assert.equal(nextTab('write', 'ArrowLeft'), 'preview');
    assert.equal(nextTab('preview', 'ArrowLeft'), 'write');
    for (const key of ['Enter', ' ', 'Tab', 'ArrowUp', 'a']) assert.equal(nextTab('write', key), null);
    assert.equal(nextTab('nonsense', 'ArrowRight'), null);
  });
});
