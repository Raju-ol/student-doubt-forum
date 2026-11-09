import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { themePreference, resolvedTheme } from '../../client/src/theme.js';

test('theme preference follows system and tolerates invalid or blocked storage', async () => {
  assert.equal(themePreference('invalid'), 'system');
  assert.equal(resolvedTheme('system', true), 'dark');
  assert.equal(resolvedTheme('light', true), 'light');
  const script = await readFile(new URL('../../client/public/theme-init.js', import.meta.url), 'utf8');
  for (const [stored, systemDark, expected] of [['dark', false, 'dark'], ['light', true, 'light'], ['invalid', true, 'dark'], [null, false, 'light']]) {
    const document = { documentElement: { dataset: {} } };
    vm.runInNewContext(script, { document, localStorage: { getItem: () => stored }, matchMedia: () => ({ matches: systemDark }) });
    assert.equal(document.documentElement.dataset.theme, expected);
  }
  const document = { documentElement: { dataset: {} } };
  vm.runInNewContext(script, { document, localStorage: { getItem: () => { throw new Error(); } }, matchMedia: () => ({ matches: true }) });
  assert.equal(document.documentElement.dataset.theme, 'dark');
});

test('application colors are centralized and primary dark contrast exceeds 4.5:1', async () => {
  for (const name of ['styles.css', 'p0.css']) {
    const css = await readFile(new URL(`../../client/src/${name}`, import.meta.url), 'utf8');
    assert.doesNotMatch(css, /#[a-f0-9]{3,8}\b/i);
  }
  const css = await readFile(new URL('../../client/src/styles/variables.css', import.meta.url), 'utf8');
  const dark = css.match(/:root\[data-theme=dark\]\{([^}]+)/)[1];
  const values = Object.fromEntries([...dark.matchAll(/(--[\w-]+):([^;]+)/g)].map(match => [match[1], match[2]]));
  const luminance = color => {
    const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const contrast = (a, b) => { const x = luminance(values[a]), y = luminance(values[b]); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  for (const pair of [['--primary', '--card'], ['--on-primary', '--primary'], ['--text', '--card'], ['--muted', '--card']]) assert.ok(contrast(...pair) >= 4.5, pair.join(' / '));
});
