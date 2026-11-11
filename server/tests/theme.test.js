import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { themePreference, resolvedTheme, nextTheme } from '../../client/src/theme.js';

test('theme preference follows system and tolerates invalid or blocked storage', async () => {
  assert.equal(themePreference('invalid'), 'system');
  assert.equal(resolvedTheme('system', true), 'dark');
  assert.equal(resolvedTheme('light', true), 'light');
  assert.equal(nextTheme('system'), 'light'); assert.equal(nextTheme('light'), 'dark'); assert.equal(nextTheme('dark'), 'bento'); assert.equal(nextTheme('bento'), 'system');
  assert.equal(resolvedTheme('bento', true), 'bento');
  const script = await readFile(new URL('../../client/public/theme-init.js', import.meta.url), 'utf8');
  for (const [stored, systemDark, expected] of [['dark', false, 'dark'], ['light', true, 'light'], ['bento', true, 'bento'], ['invalid', true, 'dark'], [null, false, 'light']]) {
    const document = { documentElement: { dataset: {} } };
    vm.runInNewContext(script, { document, localStorage: { getItem: () => stored }, matchMedia: () => ({ matches: systemDark }) });
    assert.equal(document.documentElement.dataset.theme, expected);
  }
  const document = { documentElement: { dataset: {} } };
  vm.runInNewContext(script, { document, localStorage: { getItem: () => { throw new Error(); } }, matchMedia: () => ({ matches: true }) });
  assert.equal(document.documentElement.dataset.theme, 'dark');
});

test('application colors are centralized and every theme meets 4.5:1 text contrast', async () => {
  for (const name of ['styles.css', 'p0.css', 'genz.css', 'explore.css', 'question-detail.css']) {
    const css = await readFile(new URL(`../../client/src/${name}`, import.meta.url), 'utf8');
    assert.doesNotMatch(css, /#[a-f0-9]{3,8}\b/i, name);
  }
  const css = await readFile(new URL('../../client/src/styles/variables.css', import.meta.url), 'utf8');
  // Later blocks override earlier ones, as in the browser.
  const theme = selector => {
    const values = {};
    for (const block of css.replace(/\/\*[\s\S]*?\*\//g, '').split('}')) {
      const [head, body] = block.split('{').slice(-2);
      if (!body || !selector(head.trim())) continue;
      for (const match of body.matchAll(/(--[\w-]+):([^;]+)/g)) values[match[1]] = match[2].trim();
    }
    return values;
  };
  const light = theme(head => head === ':root');
  const themes = { light, dark: { ...light, ...theme(head => head === ':root[data-theme=dark]') }, bento: { ...light, ...theme(head => head === ':root[data-theme=bento]') } };
  const luminance = value => {
    assert.ok(value, 'missing colour token');
    const color = value.length === 4 ? '#' + [...value.slice(1)].map(c => c + c).join('') : value;
    const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const pairs = [['--primary', '--card'], ['--on-primary', '--primary'], ['--text', '--card'], ['--muted', '--card'], ['--text', '--page'], ['--muted', '--page'], ['--muted', '--card-2'], ['--text', '--card-2'],
    ['--solved-ink', '--solved-bg'], ['--zero-ink', '--zero-bg'], ['--hot-ink', '--hot-bg'], ['--accent-ink', '--accent-1'], ['--accent-ink', '--accent-2'], ['--accent-ink', '--accent-3'], ['--accent-ink', '--accent-4'],
    ['--page', '--text'], ['--danger', '--card'], ['--solved', '--card'], ['--primary', '--card-2']];
  for (const [name, values] of Object.entries(themes)) {
    for (const pair of pairs) for (const key of pair) assert.ok(values[key], `${name}: ${key} missing`);
    const contrast = (a, b) => { const x = luminance(values[a]), y = luminance(values[b]); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    for (const pair of pairs) assert.ok(contrast(...pair) >= 4.5, `${name}: ${pair.join(' / ')} = ${contrast(...pair).toFixed(2)}`);
  }
});

test('chalk-dust texture is limited to Chalkboard; Sticker and Bento stay plain', async () => {
  const css = await readFile(new URL('../../client/src/genz.css', import.meta.url), 'utf8');
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{[^{}]*radial-gradient\(var\(--dot\)[^{}]*\}/g)].map(match => match[1].trim());
  assert.ok(rules.length >= 1, 'texture rule missing');
  for (const selector of rules) assert.match(selector, /^:root\[data-theme=dark\] body$|^:root:not\(\[data-theme\]\) body$/, selector);
  const variables = await readFile(new URL('../../client/src/styles/variables.css', import.meta.url), 'utf8');
  for (const block of variables.split('}')) if (/(^|\n)\s*:root\{|:root\[data-theme=bento\]\{/.test(block)) assert.doesNotMatch(block, /--dot:/);
});
