// Formatting tools for the Markdown editor. Kept free of JSX and of React so
// the text manipulation, which is the fiddly part, can be tested directly.

export const EDITOR_TOOLS = [
  { label: 'Bold', icon: 'B', before: '**', after: '**', sample: 'bold text' },
  { label: 'Italic', icon: 'I', before: '*', after: '*', sample: 'italic text' },
  { label: 'Inline code', icon: '<>', before: '`', after: '`', sample: 'variableName' },
  { label: 'Code block', icon: '{ }', before: '```java\n', after: '\n```', sample: 'System.out.println("hi");', block: true },
  { label: 'Maths', icon: '∑', before: '$', after: '$', sample: 'x^2 + y^2' },
  { label: 'Bulleted list', icon: '•', before: '- ', after: '', sample: 'first point', block: true },
  { label: 'Link', icon: '\u{1F517}', before: '[', after: '](https://)', sample: 'link text' },
  { label: 'Quote', icon: '❝', before: '> ', after: '', sample: 'quoted text', block: true }
];

// Returns the new body plus where the caret should land, so the student can
// immediately type over the inserted sample text.
export function applyTool(value = '', start = 0, end = 0, tool) {
  const text = typeof value === 'string' ? value : '';
  const from = Math.max(0, Math.min(start, text.length));
  const to = Math.max(from, Math.min(end, text.length));
  const selected = text.slice(from, to) || tool.sample;
  // A block tool needs to start its own line or the Markdown will not apply.
  const lead = tool.block && from > 0 && text[from - 1] !== '\n' ? '\n' : '';
  const insert = lead + tool.before + selected + tool.after;
  const caretStart = from + lead.length + tool.before.length;
  return { text: text.slice(0, from) + insert + text.slice(to), caretStart, caretEnd: caretStart + selected.length };
}

// Left/right arrow movement between the Write and Preview tabs.
export const EDITOR_TABS = ['write', 'preview'];
export function nextTab(current, key) {
  const index = EDITOR_TABS.indexOf(current);
  if (index === -1 || (key !== 'ArrowRight' && key !== 'ArrowLeft')) return null;
  const step = key === 'ArrowRight' ? 1 : EDITOR_TABS.length - 1;
  return EDITOR_TABS[(index + step) % EDITOR_TABS.length];
}
