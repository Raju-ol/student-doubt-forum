// Browser entry point for the lazily loaded Markdown chunk. The stylesheets
// live here rather than in markdown.js so that markdown.js stays importable
// from Node for the tests, where a CSS import would throw.
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';
export { renderMarkdown } from './markdown';
