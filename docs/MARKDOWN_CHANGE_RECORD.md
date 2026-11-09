# Change record — Markdown bodies with code blocks and mathematics

Date: 9 November 2026. Source: `RECOMMENDATIONS.md` §2, named there as the highest-value
single feature and one of the three items in §10.

## The problem this solves

Every question, answer and comment rendered as plain text through
`<p className="prose">{doubt.body}</p>` with `white-space: pre-wrap`. For an audience of
engineering, computer science and mathematics students that meant a Java snippet lost its
indentation and colour, a relational-algebra expression could not be written, and no
equation could be typed. Students worked around it by photographing their code and
uploading it as an image, which costs Cloudinary credits, is unsearchable and is invisible
to screen readers.

## What changed

Nothing was migrated. Bodies are still stored exactly as the student typed them; plain text
is valid Markdown, so every existing post renders as it did before.

**`client/src/markdown.js`** — the renderer. Pipeline: `marked` → KaTeX → highlight.js →
DOMPurify. Sanitising last means nothing earlier in the chain can introduce script content.

- `gfm: true` and `breaks: true`, so a single newline stays a line break exactly as
  `pre-wrap` gave before.
- Headings are clamped to `h3`/`h4`. Post bodies sit inside the page's own heading outline,
  so an `h1` in a body would break the document structure.
- Fenced code blocks are highlighted by highlight.js. Thirteen languages are registered by
  hand (Java, Python, C, C++, C#, JavaScript, TypeScript, SQL, HTML/XML, CSS, JSON, Shell,
  plain text) rather than importing all of them, which would add roughly a megabyte.
  An unknown language is HTML-escaped rather than dropped.
- `$...$` and `$$...$$` render through KaTeX, chosen over MathJax for size and synchronous
  rendering. Invalid maths does not throw; the post still renders.
- DOMPurify runs with an explicit tag allow-list. Images are **not** allowed in bodies:
  screenshots go through the existing Cloudinary upload flow, which checks ownership and
  file signatures, and arbitrary remote images do not.
- Surviving links get `rel="nofollow noopener noreferrer"` and `target="_blank"`.

**`client/src/excerpt.js`** — `markdownToText` for card and profile previews, so Markdown
characters do not leak into excerpts. Deliberately dependency free, because the feed imports
it and must not pull in the renderer.

**`client/src/editor.js`** — the eight formatting tools and the tab-key handling, kept free
of JSX and React so the text manipulation can be tested directly.

**`client/src/components.jsx`** — a `Markdown` component and a `MarkdownEditor` with a
toolbar (bold, italic, inline code, code block, maths, list, link, quote) and Write/Preview
tabs. The tabs use `role="tablist"`/`role="tab"` with `aria-selected`, `aria-controls` and a
roving tabindex with arrow-key movement, which is what §5.3 asks for; the existing Profile
and Admin tabs still use `aria-pressed` and were not touched.

**`client/src/pages.jsx`** — question and answer bodies render as Markdown. The ask form,
the answer form and the answer edit form use the editor. The profile excerpt and the
moderator-facing report reason stay plain text.

### Bundle size

marked, KaTeX and highlight.js are about 130 KB gzipped. Loading them in the main bundle
took it from 93.11 KB to 226.10 KB gzipped, which matters for students on poor mobile data.
The renderer is therefore imported dynamically through `markdown-view.js`, which also
carries the KaTeX and highlight.js stylesheets:

| Chunk | gzipped |
|---|---|
| Main bundle, before | 93.11 KB |
| Main bundle, after | 95.05 KB |
| Markdown chunk, loaded on demand | 130.61 KB |

The feed and the sign-in screens never load it. On a question page the body shows as plain
escaped text for the moment before the chunk arrives, so a slow connection still gets a
readable post and never an unsafe one.

## Verification

- `npm test`: 59 passes, 0 failures (29 existing, plus 30 new across three files).
- `npm run build`: passes.
- `server/tests/markdown.test.js` (14 subtests): plain text still renders with line breaks;
  formatting, code blocks, tables and KaTeX render; headings clamp to h3/h4; previews strip
  Markdown. Thirteen injection payloads — `<script>`, `onerror`, `<svg/onload>`, `<iframe>`,
  `javascript:` links, `<form>`/`<input>`, `<style>`, `<object>`, a MathML-wrapped script and
  a base64 `data:text/html` link — are checked by parsing the sanitised output and asserting
  that no element ends up with an event-handler attribute or a `javascript:`/`data:text/html`
  URL, rather than by string matching, which would have failed on inert text.
- `server/tests/editor.test.js` (10 subtests): each tool produces renderable Markdown;
  selections are wrapped rather than replaced; block tools start their own line; reversed and
  out-of-range selections do not corrupt the body; arrow keys move between tabs.
- `server/tests/components.test.js` (6 subtests): the React components are bundled with
  esbuild and rendered, confirming eight labelled `type="button"` toolbar buttons, a real
  tablist with `aria-selected`, `aria-controls` and a roving tabindex, the validation
  attributes reaching the textarea, and the pre-load fallback escaping HTML.
- Content Security Policy checked against a running server: `style-src` includes
  `'unsafe-inline'` and `font-src` includes `'self'`, so KaTeX's inline styles and bundled
  fonts are not blocked, while `script-src` stays `'self'`.

## CI follow-up

The first CI run on `6bcd2ae` failed on Linux although every test passed locally. The cause was
jsdom 31, which requires Node 22.22.2+ or 24.15+, while CI pinned Node 22.12; all three
jsdom-based test files failed there. The owner's laptop runs Node 24.19, which is why the
failure did not reproduce locally.

Diagnosing it took four further commits, and two of those introduced problems of their own:

- `ac5749b` tried to surface failures as annotations, because job logs need a token to read.
  A literal newline slipped into a quoted shell string and made the workflow invalid YAML, so
  no jobs ran at all.
- `17958ee` fixed the YAML but piped `npm test` into `tee` without `pipefail`, which the
  default `run` shell does not set. That run reported green while the suite was still failing.
  It was a **false pass**.
- `aff0686` declared `shell: bash` to restore `pipefail`; the run then failed honestly.
- `c262778` fixed the cause: CI now tests on the latest Node 22 and Node 24 in a matrix, and
  `npm test` pins `--test-reporter=spec`, because Node 22 switches to TAP output when piped,
  which had left the failure annotation empty.

Run 42601860245 on `c262778` passed `test (22)`, `test (24)` and `audit`. The README now states
the Node requirement for running the suite; the application itself still runs on 22.12+.

## Not verified

- **No browser check.** Nothing here has been opened in a real browser. The components
  render correctly under jsdom and the HTML is asserted, but how the toolbar, the preview
  tab, code blocks and equations actually *look* — and whether they fit at 390 px — is
  unconfirmed. This is the main thing to check next.
- Keyboard behaviour is asserted structurally (roving tabindex, arrow-key handler) but was
  not exercised with a real keyboard or a screen reader.
- Deployed to production by the push of `6bcd2ae`. The live site serves the new main bundle and the lazily loaded `markdown-view` chunk returns HTTP 200; that confirms delivery, not appearance.
- The server still accepts any text in `body`; no server-side Markdown validation was added,
  and none is needed, because rendering and sanitising happen in the browser and the stored
  value is plain text.
- Comments still render as plain text. Extending the renderer to comments was out of scope
  for this change.
