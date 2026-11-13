import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const css = (await readFile(new URL('../../client/src/design-v3.css', import.meta.url), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
const block = head => { const start = css.indexOf(head + '{'); assert.ok(start >= 0, head); return css.slice(start + head.length + 1, css.indexOf('\n}', start)); };
const tokens = body => Object.fromEntries([...body.matchAll(/(--v3-[\w-]+):([^;]+);/g)].map(match => [match[1], match[2].trim()]));
const light = tokens(block(':root'));
const dark = { ...light, ...tokens(block(':root[data-theme=dark]')) };
const hexes = value => [...value.matchAll(/#[0-9a-f]{6}\b/gi)].map(match => match[0]);
const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return r * .2126 + g * .7152 + b * .0722;
};
const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

// [text token, every background token it sits on]
const pairs = [
  ['--v3-text', ['--v3-surface', '--v3-hero', '--v3-soft']],
  ['--v3-muted', ['--v3-surface', '--v3-hero', '--v3-soft']],
  ['--v3-on-active', ['--v3-active']],
  ['--v3-accent', ['--v3-surface']],
  ['--v3-brand', ['--v3-surface']],
  ['--v3-ok', ['--v3-ok-bg']], ['--v3-bad', ['--v3-bad-bg']], ['--v3-warn', ['--v3-warn-bg']],
  ...[0, 1, 2, 3, 4, 5].map(n => [`--v3-t${n}`, [`--v3-t${n}-bg`]])
];

// File-type icons are graphics, not text, so 3:1 applies.
const icons = [['--v3-pdf', '--v3-pdf-bg'], ['--v3-doc', '--v3-doc-bg'], ['--v3-ppt', '--v3-ppt-bg'], ['--v3-link', '--v3-link-bg']];

for (const [name, theme] of [['light', light], ['dark', dark]]) {
  test(`v3 ${name} file-type icons reach 3:1`, () => {
    for (const [foreground, background] of icons) assert.ok(contrast(hexes(theme[foreground])[0], hexes(theme[background])[0]) >= 3, `${name}: ${foreground}`);
  });
  test(`v3 ${name} theme text colours reach 4.5:1 on every background`, () => {
    for (const [foreground, backgrounds] of pairs) for (const background of backgrounds) {
      for (const front of hexes(theme[foreground])) for (const back of hexes(theme[background])) {
        assert.ok(contrast(front, back) >= 4.5, `${name}: ${foreground} ${front} on ${background} ${back} = ${contrast(front, back).toFixed(2)}`);
      }
    }
  });
}
