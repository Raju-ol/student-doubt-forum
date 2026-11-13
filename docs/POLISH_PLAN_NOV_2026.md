<!-- consistency-review-2026-11-13 -->
> Current status, 13 November 2026 — See [current implementation and limits](CURRENT_STATE.md). The active design has Auto/Light/Dark themes and a separate community resource Library. Institution-scoped curriculum and publication review remain planned. Older counts, release IDs and provider checks below are dated evidence, not current certification.

# Polish Plan — November 2026 review

> **Status update 13 November 2026.**
>
> | Item | Status |
> | --- | --- |
> | 0.1 Study Library empty on production | Done and live (recovery path, 200 questions published) |
> | 0.2 Test questions fill the feed | Done and live (three test questions removed; library hidden from the default feed) |
> | 0.3 `##daitm` tag | Done and live (tags normalised; existing tag fixed) |
> | 1.1 Light and dark are two brands | Done on `feat/design-v3` (not merged) |
> | 1.2 to 1.4 Skeleton loaders, cold start, small details | Not started |
> | 2.1 to 2.7 Related questions, duplicate check, sorting, notification polish, profile, editor, accessibility pass | Not started, except an accessibility sweep and contrast tests on `fix/review-bugs` |
> | 3.1 Seed real questions | Draft written ([SEED_QUESTIONS_DRAFT.md](SEED_QUESTIONS_DRAFT.md)); nothing posted |
> | 3.2 to 3.6 Growth rituals | Not started (owner actions) |
>
> Added beyond this plan: Trending Topics, Top Contributors, view counts and a flat resource Library (see [Design v3 change record](DESIGN_V3_CHANGE_RECORD.md)).

**Who this is for:** future Claude sessions (and Raju). This is an instruction document: each item says what to change, why, and how to verify it. Work top to bottom — the phases are ordered by impact for a teacher demo and for building a loyal audience.

**How this review was done:** read the full client and server source, read `RECOMMENDATIONS.md` / `PROJECT_CONTEXT.md` / `README.md`, browsed the live production site at desktop and 375px mobile width in both themes, and queried the production API directly. Date: 13 November 2026.

**Verdict first:** the foundation is genuinely strong — security, tests, accessibility work, the mobile bottom nav, and a distinctive "sticky-note" visual identity most student projects never reach. What stands between this and a project a teacher remembers is not more features. It is (1) two production bugs visible on the first page, (2) an empty-looking site, and (3) finishing the polish of what already exists. Do not add major new features before Phase 1–2 are done.

---

## Phase 0 — Production bugs visible right now (fix first, ~1 day)

These are on the live homepage today. A teacher opening the site sees them in the first minute.

### 0.1 The Study Library is EMPTY on production (critical)

The README's second link, the homepage sidebar card, and the mobile bottom-nav "Library" tab all point to `/?scope=all&tag=study-library`. On production that query returns `{"items":[],"total":0}` — verified directly against the API on 13 Nov. The headline feature of the whole project shows "No matching questions".

**Instruction for Claude:** the 200 demo questions exist in `server/src/demo-questions.json` / `demo-answers.json` and are published through the admin-only insert in `server/src/study-library.js` (admin UI: `client/src/study-library-admin.jsx`). Either the publication was never run against the production database or it was run against a different database. Walk the owner through running the admin publication against production, then verify `GET /api/v1/doubts?tag=study-library&scope=all` returns `total: 200`. Until the data is live, nothing else in this document matters as much.

### 0.2 Test questions are the entire visible feed (critical, 15 minutes)

The production feed has exactly 4 questions: "What is the full form of HTTP?", "what is the full form of php?", "what is outer space?" (body: "what is beyond space", −1 votes), and one real, excellent question about Floyd's cycle detection. Three of four are throwaway tests, two with lowercase unedited titles.

**Instruction for Claude:** have the owner delete the three test questions (or rewrite them into real, well-formatted questions with real answers). Then seed the community feed properly — see Phase 3.1.

### 0.3 The `##daitm` double-hash tag bug (small but on every card)

Users typed `#daitm` as a tag; the tag is stored with the `#` included, and the UI prepends another `#`, so every question card shows `##daitm`. Verified in the API: `"tags":["#daitm"]`.

**Instruction for Claude:** in the server tag normalisation (`tags()` in `server/src/validation.js` or wherever tags are cleaned), strip leading `#` characters before storing. Add a one-off cleanup of existing documents, and a test. Also consider rejecting/collapsing internal whitespace variants while there (`#outer space` is stored with a space).

---

## Phase 1 — Theme and visual polish (what the viewer feels, ~2–4 days)

The dark sticker theme (dark olive + yellow/pink/mint sticky notes + Caveat Brush handwriting) is the project's personality and it is good. Protect it and make it consistent.

### 1.1 Light and dark themes are two different brands

Dark mode: olive green, yellow accent, handwritten hero in Caveat Brush. Light mode: cream, **purple** accent (`#6c5ce7`-ish), and the hero loses the handwriting font entirely ("stuck on something?" renders in the plain sans). A viewer switching themes experiences two different websites.

**Instruction for Claude:** pick one accent story. Recommended: keep the yellow-highlighter identity in both themes (yellow `mark` highlight works on cream too), use purple only as a secondary accent or drop it, and make the hero use the same display font in both themes. All colours already live in `client/src/styles/variables.css` — do the alignment there, then screenshot both themes side by side at desktop and 375px and compare every page (feed, detail, ask, auth, profile, admin).

### 1.2 Replace the full-page "Loading…" spinner with skeletons

Every navigation currently blanks the page to a centered spinner — and cold starts take up to ~9s, so this is the single worst-feeling moment of the site. Skeleton cards (grey sticker-shaped placeholders where the question rows will be) keep the layout stable and feel dramatically faster, for free.

**Instruction for Claude:** add a `Skeleton` component styled like `QuestionRow` / the detail layout; show 5 skeleton rows in the feed and a skeleton question on the detail page while `loading`. Respect `prefers-reduced-motion` on the shimmer. Keep the existing `Loading` for small embedded spots.

### 1.3 Soften the cold start

A first visitor at a demo may stare at the skeleton for 6–9 seconds (measured cold samples in `PROJECT_CONTEXT.md`).

**Instruction for Claude:** three cheap mitigations, in order: (a) have the client fire a `fetch('/api/v1/health')` warm-up ping as soon as the shell loads, before React finishes mounting; (b) show a friendly one-time note if the first feed request exceeds ~4s ("Waking the server up — first load can take a few seconds"); (c) before the demo day itself, tell the owner to open the site once five minutes earlier. Do not relocate providers without measuring regions first.

### 1.4 Small visual details worth an afternoon

- **Empty states should sell, not apologise.** "No matching questions" is fine mid-filter, but the Saved tab, a fresh profile, and an empty subject should each show a sticker-style illustration + a next action (illustrations already exist in `client/public/illustrations/`).
- **Relative time.** "12 Nov 2026" on a live feed reads cold; show "2 hours ago" for anything under 7 days (`Intl.RelativeTimeFormat`, browser locale, keep absolute date in `title=`).
- **Footer.** Currently one line. Add: About / how it works, community guidelines, GitHub link, "Built by…" credit. Teachers look at footers; it signals completeness.
- **Favicon + social preview.** Verify a proper favicon set and add Open Graph / Twitter meta tags (title, description, a 1200×630 image of the sticker hero) so a shared link in WhatsApp shows a rich card — this matters for Phase 3 sharing.
- **A real 404 page** in the site's voice ("This doubt wandered off…") with a link back to the feed.

---

## Phase 2 — Feature polish (finish what exists before adding anything, ~1 week)

Each item makes an existing feature feel complete.

### 2.1 Question detail: add "Related questions"

Already specified in the old UI plan; still missing. After the answers list, show up to 5 questions in the same subject (text-index search on the title, exclude current id). Turns one visit into a session. ~2 hours with the existing search index.

### 2.2 Ask form: duplicate check while typing the title

Debounced search against existing questions as the title is typed; show "Is your doubt one of these?" with answer counts. Prevents the feed filling with near-identical "full form of X" questions, and often answers the student instantly. Build on the same search endpoint.

### 2.3 Sorting the feed

The feed is newest-only. Add a sort select: Newest / Most votes / Unanswered first. Vote score needs to exist on the document to sort by (the denormalised `voteScore` counter from `RECOMMENDATIONS.md` §3.1 Option B) — if that counter is not yet implemented, do it now; it also removes per-row vote queries.

### 2.4 Notifications: mark-all-read and a badge cap

Verify the bell shows "9+" rather than a huge number, has a "Mark all as read" action, and that clicking a notification lands on the exact answer (anchor scroll to `#answer-<id>`). Small, but notifications are the retention feature — they must feel flawless.

### 2.5 Profile: make it something students want to show

- Show counts that already exist (questions, answers, accepted answers) as three sticker-style stat chips.
- "Member for N months" instead of raw join date.
- An optional one-line bio (maxlength ~160, same sanitisation as everything else).

### 2.6 Markdown editor: confirm the toolbar basics on mobile

The editor + preview exists. Verify at 375px: toolbar buttons reachable, preview toggle obvious, code blocks scroll horizontally inside the card instead of breaking layout. Fix whatever fails; record it in `docs/TESTING.md`.

### 2.7 Accessibility regression pass (keep the existing discipline)

Run through once: focus ring visible on every control in both themes, the vote buttons announce their disabled reason, dialogs for destructive actions (the codebase still uses `window.confirm` in `pages.jsx` — replace with a focus-trapped `<dialog>`, at minimum for delete-question and remove-content), contrast of yellow-on-cream chips in light mode checked at 4.5:1.

---

## Phase 3 — Loyal audience (the growth plan, ongoing)

Research on student Q&A communities is consistent on a few points: communities die when posts get no reply; the founder must be the most visible member at the start; fear of looking stupid suppresses posting; and one well-tended space beats many empty ones. Applied here:

### 3.1 Seed 30–50 real questions before inviting anyone

An empty forum kills itself — nobody posts first. Before any invite wave, the owner (plus 2–3 friends) should post 30–50 genuine questions from actual coursework across the subjects their college takes, each with at least one good answer, written in the question style of the Floyd's-algorithm question (which is the quality bar). The Study Library (once published, §0.1) handles breadth; the community feed must show local, current, real questions.

**Instruction for Claude:** offer to help draft these — take the owner's syllabus topics and generate well-structured question + answer drafts for the owner to review, personalise and post from real accounts. Never auto-post.

### 3.2 The 24-hour answer guarantee (the founder ritual)

For the first two months, every question gets an answer or a helpful comment within 24 hours, even if it is the owner writing "Here's how I'd start…". A student whose first question gets a reply comes back; one who gets silence never does. This is a human commitment, not a feature — but add a tiny admin view "Unanswered > 12h" so it takes 5 minutes a day.

### 3.3 Reduce the fear of asking

- Add an **"Ask anonymously"** checkbox: stores the author privately (moderation still sees them), displays "Anonymous student". Research on CS course forums shows anonymity measurably increases posting. Medium effort, high cultural value.
- Keep the warm copy ("no doubt is too small") — it is the right instinct; anonymity makes it true.

### 3.4 Make sharing effortless

A WhatsApp-able share button on every question (native `navigator.share` on mobile, copy-link fallback). Student communities grow through class group chats, not search engines. The Open Graph card from §1.4 makes those shares look good.

### 3.5 A weekly rhythm

One pinned "Doubt of the week" (hardest/most interesting question, picked by hand) gives returning visitors something new on a schedule. Implement as a simple `isPinned` flag an admin can set; the feed shows the pinned question in a special sticker card at top.

### 3.6 Measure three numbers only

Weekly: new questions, % of questions answered within 24h, and returning sign-ins. If those three move, the community is alive. Don't build a dashboard; a tiny admin stats endpoint and a table is enough.

---

## What NOT to do (unchanged from RECOMMENDATIONS.md §9, still correct)

No real-time chat, no video answers, no AI auto-answer bot, no badges/streak gamification, no native app, no private messaging. Each one either kills the public-knowledge value or adds moderation/cost burden the project cannot carry. The one AI use that helps: drafting seed content for human review (§3.1).

## For the teacher demo specifically

1. Fix Phase 0 the week before. Open the site once 5 minutes before presenting (cold start).
2. Demo path: homepage feed (real questions) → search → Floyd question detail (markdown, votes, accepted answer) → ask a question live with an image → show the notification arrive on a second account → Study Library → admin report queue → toggle dark/light → show it on a phone.
3. Have `docs/TESTING.md` and the CI run open in tabs — the honest verification record is the most impressive artifact to an examiner.

## Standing instructions for any Claude session working on this repo

- Read `PROJECT_CONTEXT.md` first; preserve everything under "Behavior to preserve".
- Keep API response shapes and same-origin routes stable; every change lands with tests (`npm test`) and a build (`npm run build`) passing.
- Never claim something verified that wasn't; update `docs/TESTING.md` honestly, in the project's existing style.
- Secrets live only in Vercel env vars — never in code, docs, or chat.
- After any visual change: screenshot desktop + 375px, dark + light, before calling it done.
