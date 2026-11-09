// Markdown rendering for question, answer and comment bodies.
// Stored content is the raw Markdown the student typed. Plain text is valid
// Markdown, so existing posts keep rendering as they did.
//
// Pipeline: marked -> KaTeX -> highlight.js -> DOMPurify. Sanitising last means
// nothing marked or KaTeX produce can introduce script content, regardless of
// what the student typed. The server's CSP (script-src 'self') is a second
// layer, not a substitute.
import { Marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import createDOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import csharp from 'highlight.js/lib/languages/csharp';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import plaintext from 'highlight.js/lib/languages/plaintext';

// Registered deliberately rather than importing every language, which would add
// roughly a megabyte to the bundle for languages this audience does not use.
export const codeLanguages = [
  ['plaintext', 'Plain text'], ['java', 'Java'], ['python', 'Python'], ['cpp', 'C++'], ['c', 'C'],
  ['csharp', 'C#'], ['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['sql', 'SQL'],
  ['xml', 'HTML / XML'], ['css', 'CSS'], ['json', 'JSON'], ['bash', 'Shell']
];
for (const [name, language] of Object.entries({ javascript, typescript, java, cpp, c, csharp, python, sql, xml, css, json, bash, plaintext })) {
  hljs.registerLanguage(name, language);
}

const escapeHtml = value => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

// Only the tags the restricted Markdown subset can produce, plus the span that
// KaTeX renders maths into. Anything else is dropped rather than escaped.
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'del', 'a', 'ul', 'ol', 'li', 'blockquote',
  'code', 'pre', 'span', 'h3', 'h4', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'];
const ALLOWED_ATTR = ['href', 'title', 'class', 'style', 'aria-hidden', 'colspan', 'rowspan', 'align', 'start'];

export function createMarkdownRenderer(windowRef = globalThis.window) {
  const purifier = createDOMPurify(windowRef);
  // Links are user-supplied, so they never get to control the opener window.
  purifier.addHook('afterSanitizeAttributes', node => {
    if (node.tagName === 'A' && node.getAttribute('href')) {
      node.setAttribute('rel', 'nofollow noopener noreferrer');
      node.setAttribute('target', '_blank');
    }
  });
  const marked = new Marked({
    gfm: true,
    // A single newline becomes a line break, matching how bodies read today
    // under `white-space: pre-wrap`.
    breaks: true,
    renderer: {
      code({ text, lang }) {
        const language = String(lang || '').trim().split(/\s+/)[0].toLowerCase();
        const known = language && hljs.getLanguage(language);
        const body = known ? hljs.highlight(text, { language, ignoreIllegals: true }).value : escapeHtml(text);
        return `<pre class="code-block"><code class="hljs${known ? ` language-${language}` : ''}">${body}</code></pre>\n`;
      },
      // Post bodies sit inside the page's own heading outline, so h1/h2 would
      // break the document structure. Everything is clamped to h3/h4.
      heading({ tokens, depth }) {
        const level = Math.min(Math.max(depth, 3), 4);
        return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
      }
    }
  });
  marked.use(markedKatex({ throwOnError: false, output: 'html', nonStandard: true }));
  return function render(source) {
    if (typeof source !== 'string' || !source.trim()) return '';
    const html = marked.parse(source, { async: false });
    return purifier.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false });
  };
}

let browserRenderer;
export function renderMarkdown(source) {
  browserRenderer ||= createMarkdownRenderer();
  return browserRenderer(source);
}
