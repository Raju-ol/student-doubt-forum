# Recommendations: from college project to a forum any student in the world can use

Written 9 November 2026, after reading the full codebase (`server/src`, `client/src`, `api/index.js`), the deployment state in `RESUME_HERE.md`, the verification record in `docs/TESTING.md`, and `docs/UI_UX_IMPROVEMENT_PLAN.md`.

This document is deliberately blunt about what is missing, because you asked for the best, not for reassurance. Nothing here says the current work is bad — the opposite. The security basics (bcrypt at cost 12, helmet, a real CSP, bearer JWT with a per-request account/ban check, file signature validation on uploads, ownership checks on every mutation, escaped search regex, bounded pagination) are better than most student projects and better than some shipped products. The gaps below are the gaps between "a working college project" and "software thousands of colleges run".

---

## Implementation status

Updated 9 November 2026. Only these items have been applied so far; everything else in this
document is still a proposal.

| Item | Status |
|---|---|
| §3.3 Missing indexes | **Done** — nine indexes added in `server/src/models.js`, verified locally with `explain()` |
| §6.3 CI | **Done** — `.github/workflows/ci.yml` and `.github/dependabot.yml` added; first GitHub Actions run passed both jobs |
| §7/§10 `LICENSE` | **Pending** — MIT chosen; waiting on the copyright holder name |
| Everything else | Not started |

Full detail, deviations and what was not verified: `docs/PHASE0_CHANGE_RECORD.md`.

---

## 0. The honest starting position

**What genuinely works today** (per `docs/TESTING.md`, which is refreshingly honest):

- Full Q&A loop: signup, ask, answer, vote, accept, comment, search, filter, profile, reputation.
- Teacher badges, admin user management, report queue with dismiss/remove and cascade cleanup.
- Cloudinary image upload/delete verified against the live site.
- 26 integration subtests passing; production build passing.
- Deployed at `https://student-doubt-forum-theta.vercel.app/`.

**What is explicitly unverified and must not be claimed:** 390px mobile layout, keyboard/assistive-technology audit, browser coverage of moderation mutations, restart/restore, concurrency and load. Keep that discipline — it is an asset.

**The one-sentence diagnosis:** the application is *functionally* complete for one college and *structurally* built for one college. Three hard-coded assumptions stand between it and worldwide use, and they are all in the data model, which is the expensive place to change things. Fix those first, before adding any feature.

---

## 1. The three assumptions that block worldwide use

These are the highest-priority items in the entire document. Everything else is improvement; these are blockers.

### 1.1 `semester: 1–8` is required for every account

`server/src/models.js`:

```js
semester: { type: Number, min: 1, max: 8, required: true }
```

This appears on both `userSchema` and `doubtSchema`, in signup, in the ask form, in profile editing, and in feed filtering. It encodes one specific academic structure: a four-year, eight-semester Indian undergraduate degree.

A student on quarters (Stanford, 12 quarters), trimesters, UK years 1–3, a US sophomore, a two-year associate degree, a five-year integrated masters, a PhD candidate, or anyone at an institution that simply says "Year 2" **cannot complete signup honestly**. They will pick a number at random, which poisons the filter for everyone.

**Recommended change** — replace the integer with a small structured field:

```js
// On User and Doubt
academicLevel: {
  system: { type: String, enum: ['semester', 'year', 'quarter', 'trimester', 'term', 'none'], default: 'none' },
  index:  { type: Number, min: 1, max: 24 },   // "semester 7", "year 2", "quarter 11"
  label:  { type: String, maxlength: 40 }       // display override: "Foundation Year", "MSc Part II"
}
```

Make the whole object optional. A student who does not want to say should not have to. The institution profile (§1.3) supplies the default `system` and the correct word for the UI, so an Indian user still sees exactly "Semester 1–8" and nothing about their experience changes.

Migration: existing documents map to `{ system: 'semester', index: <old value> }`. Write it as a one-off script in `server/src/`, run it once, keep it in the repo as a record.

### 1.2 The subject list is eight hard-coded CS subjects

`client/src/components.jsx`:

```js
export const subjects = ['Data Structures', 'DBMS', 'Java', 'Operating Systems',
  'Computer Networks', 'Mathematics', 'Web Development', 'Other'];
```

A medical student, a law student, a mechanical engineer, an architecture student, an economics student — all of them land on "Other". The subject filter, the sidebar "Explore subjects" cards, and the ask form all read this constant. Meanwhile `doubtSchema.subject` is a free `String`, so the server already accepts anything; only the UI is locked.

**Recommended change** — promote subjects to a collection:

```js
const subjectSchema = new Schema({
  slug: { type: String, unique: true, required: true },  // 'dbms'
  name: { type: String, required: true, maxlength: 80 }, // 'Database Management Systems'
  aliases: [{ type: String, maxlength: 80 }],            // 'DBMS', 'Databases', 'SGBD'
  field: { type: String, maxlength: 60 },                // 'Computer Science' — for grouping
  institution: ref('Institution', false),                // null = global catalogue
  questionCount: { type: Number, default: 0 }
}, options);
```

Seed the global catalogue with a few hundred subjects across engineering, medicine, law, commerce, arts and sciences — this is a one-afternoon data task with outsized payoff. Let an institution add its own. Let the ask form offer a type-ahead over the catalogue with "can't find it? add it" as the last resort, instead of a dropdown that ends in a dead end.

The `aliases` field is what stops "DBMS", "dbms" and "Database Management Systems" becoming three separate silos — which is exactly what will otherwise happen on day one of international use.

### 1.3 There is no institution at all

This is the deepest issue. Every question lives in one undifferentiated global feed. Today that is correct, because there is one college. With 500 colleges, a first-year student in Pune opens the homepage and sees a graduate thermodynamics question from Munich, a UK law tutorial problem, and a question about a professor they have never heard of. The feed stops being "my campus knowledge community" — the exact promise in the hero copy of `pages.jsx` — and becomes noise.

**Recommended change** — add an `Institution` and scope the feed by default:

```js
const institutionSchema = new Schema({
  slug:    { type: String, unique: true, required: true },  // 'iit-bombay'
  name:    { type: String, required: true, maxlength: 140 },
  country: { type: String, maxlength: 2 },                  // ISO 3166-1 alpha-2
  emailDomains: [{ type: String, maxlength: 100 }],         // ['iitb.ac.in'] — auto-join + verification
  locale:  { type: String, default: 'en' },
  academicSystem: { type: String, default: 'semester' },
  termCount: { type: Number, default: 8 },
  moderators: [ref('User', false)],
  isVerified: { type: Boolean, default: false }
}, options);
```

Then add `institution: ref('Institution', false)` to `User` and `Doubt`, and give the feed three scopes the user can switch between:

| Scope | What it shows | Why it matters |
|---|---|---|
| **My college** | Same institution only | Course codes, local professors, local exam patterns. The default. |
| **My subject, worldwide** | Same subject, any institution | A linked-list question is a linked-list question anywhere. This is where the global value is. |
| **Everything** | Unfiltered | Discovery and browsing. |

This single change is what converts the project from "a tool my college uses" into "a tool every college uses, that gets better as more join" — because the worldwide-subject scope means a question answered in Lagos helps a student in Lima, while the college scope keeps local relevance intact. That compounding is the whole reason to go global rather than just letting each college run its own copy.

`emailDomains` additionally gives you institution verification for free: a `@iitb.ac.in` signup auto-joins IIT Bombay with a verified badge, which is far stronger trust signalling than the current honour-system `role` field.

---

## 2. The highest-value single feature: real content formatting

Right now, every question, answer and comment renders as plain text:

```jsx
<p className="prose">{doubt.body}</p>
```

with `.prose { white-space: pre-wrap; }` in `styles.css` doing all the work. That is the entire formatting system.

Your core audience is engineering, computer science and mathematics students. For them, a Q&A platform without **code blocks and mathematical notation is close to unusable**:

- A 20-line Java snippet loses its indentation visually, has no syntax colour, and cannot be copied cleanly.
- A DBMS student cannot write a relational-algebra expression.
- Nobody can write `∫₀^∞ e^(-x²) dx` or a matrix or a summation.
- No numbered steps, no bold on the key insight, no inline `code` for a variable name.

Compare this to the screenshot flow you already built: students are currently forced to photograph their code and upload it as an image, because text cannot express it. That is a workaround for a missing feature, and it costs you Cloudinary credits, makes content unsearchable, and makes it inaccessible to screen readers.

**Recommended implementation** (roughly a day of work, highest return of anything in this document):

1. Store the raw Markdown in `body` exactly as now — no migration needed, plain text is valid Markdown.
2. Render with `marked` (or `markdown-it`), restricted to a safe subset: paragraphs, bold, italic, lists, links, blockquotes, inline code, fenced code blocks, tables, headings h3–h4 only.
3. Sanitise the rendered HTML with `DOMPurify` before insertion. Never trust server-side-stored user HTML. Your CSP in `app.js` already sets `script-src 'self'`, which is a good second layer, but sanitise anyway.
4. Add `highlight.js` for fenced code blocks, with a language picker or auto-detect.
5. Add `KaTeX` for `$...$` and `$$...$$` math. KaTeX over MathJax: smaller, faster, synchronous rendering.
6. Give the ask/answer textareas a minimal toolbar (bold, italic, code, code block, link, list) and a live preview tab. Students will not learn Markdown syntax from a hint; they will click buttons.

Keep images. They remain the right tool for a photographed textbook diagram or a circuit sketch. They are the wrong tool for code.

---

## 3. Correctness and scaling defects in the current code

These are specific, confirmed by reading the source, and ordered by when they will bite.

### 3.1 The feed issues roughly 60 database queries per page load (critical)

`server/src/forum.js`:

```js
export async function decorate(doc, type, user) {
  const votes = await Vote.find({ targetType: type, target: doc._id }).lean();   // 1 query per item
  ...
  result.answerCount = await Answer.countDocuments({ doubt: doc._id });          // 1 more per item
}
```

and in `app.js`:

```js
ok(res, { items: await Promise.all(docs.map(d => decorate(d, 'doubt', req.user))), ... });
```

With `limit` up to 30, one feed request fires up to 60 extra round trips. On a MongoDB Atlas M0 free tier from a Vercel serverless function in a different region, each round trip is 10–40 ms. That is a 1–2 second feed, and it gets worse, not better, as the content grows — and it also multiplies your Atlas connection pressure (see §6.2).

**Fix — two options.** Do the first now, the second when you have real traffic:

*Option A, one aggregation (an hour's work):*

```js
const ids = docs.map(d => d._id);
const [voteRows, answerRows] = await Promise.all([
  Vote.aggregate([
    { $match: { targetType: 'doubt', target: { $in: ids } } },
    { $group: { _id: '$target',
                score: { $sum: '$value' },
                mine:  { $sum: { $cond: [{ $eq: ['$user', userId] }, '$value', 0] } } } }
  ]),
  Answer.aggregate([
    { $match: { doubt: { $in: ids } } },
    { $group: { _id: '$doubt', count: { $sum: 1 } } }
  ])
]);
```

Two queries instead of sixty. Build lookup maps and decorate in memory.

*Option B, denormalised counters (the real answer at scale):* store `voteScore` and `answerCount` directly on the `Doubt` document and maintain them with `$inc` inside the vote and answer handlers. The feed then needs **zero** extra queries, and — importantly — you can finally sort by score, which you cannot do today because the score does not exist in the database. Keep a periodic reconciliation job to repair drift.

Option B also unlocks the single most requested missing sort: "top questions this week".

### 3.2 Search cannot use an index and will collapse (critical)

`server/src/app.js`:

```js
const search = new RegExp(escapeRegex(text(req.query.search, 'Search', 1, 120)), 'i');
filter.$or = [{ title: search }, { body: search }];
```

The escaping is correct and prevents regex injection — good. But an unanchored case-insensitive regex **cannot use an index**. Every search is a full collection scan reading every `body` field, and bodies are up to 12,000 characters. At a few thousand questions this is slow; at a hundred thousand it times out, and on a shared free tier it will affect every other query too.

**Fix:**

```js
doubtSchema.index(
  { title: 'text', body: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, body: 1 }, name: 'doubt_search' }
);
```

then `filter.$text = { $search: query }` and sort by `{ score: { $meta: 'textScore' } }`.

This also gives you relevance ranking, stemming, and stop words, so searching "sorting algorithm" finds "algorithms for sorting" — which the current substring match does not. One caveat: MongoDB text indexes are single-language per index. Set `default_language` from the institution locale, or move to **Atlas Search** (free tier includes it) when you need genuine multilingual search. For a worldwide platform, plan on Atlas Search.

### 3.3 Missing indexes on every field the feed filters by (high)

`doubtSchema` has exactly one index: `{ createdAt: -1 }`. But the feed filters on `subject`, `semester`, `tags` and `acceptedAnswer`, and always sorts by `createdAt`. Every filtered view is a scan.

**Add:**

```js
doubtSchema.index({ subject: 1, createdAt: -1 });
doubtSchema.index({ semester: 1, createdAt: -1 });
doubtSchema.index({ tags: 1, createdAt: -1 });
doubtSchema.index({ acceptedAnswer: 1, createdAt: -1 });
doubtSchema.index({ author: 1, createdAt: -1 });        // profile page
// after §1.3:
doubtSchema.index({ institution: 1, createdAt: -1 });

answerSchema.index({ author: 1, createdAt: -1 });        // profile page, currently unindexed
commentSchema.index({ answer: 1, createdAt: 1 });        // currently NO index at all
reportSchema.index({ status: 1, createdAt: -1 });        // the moderation queue
uploadSchema.index({ owner: 1, doubt: 1 });              // the unused-upload count check
```

`commentSchema` having no index is the clearest one: `Comment.find({ answer })` runs once per answer on every question detail view, so a popular question with 15 answers triggers 15 unindexed scans.

Note that compound index order matters and the single `{ createdAt: -1 }` index becomes redundant once these exist. Verify with `.explain('executionStats')` rather than assuming.

### 3.4 Reputation is computed by loading everything into Node memory (high)

```js
export async function reputation(userId) {
  const answers = await Answer.find({ author: userId }).select('_id').lean();
  const ids = answers.map(a => a._id);
  const [votes, accepted] = await Promise.all([
    Vote.find({ targetType: 'answer', target: { $in: ids } }).lean(), ...
  ]);
  return votes.reduce(...) + accepted * 15;
}
```

For a prolific answerer with 2,000 answers and 20,000 votes, this pulls 20,000 documents into a serverless function with a 1 GB memory cap, on every single profile view. And `{ $in: ids }` with 2,000 ids is itself a large query document.

**Fix:** store `reputation` as a counter on `User`, `$inc` it in the vote and accept handlers (`+10` upvote, `-2` downvote, `+15` accepted, reversed on undo), and keep this function only as a nightly reconciliation job. If you want it computed live for now, at least do it as a `$group` aggregation so the 20,000 documents never leave the database.

Separately: consider whether `-2` per downvote is right. Stack Overflow uses `-2` for the *voter* too, specifically to make downvoting costly. More importantly, a new user who gets one downvote sees negative reputation and often never returns. Floor displayed reputation at 0, or follow the common approach of not letting answer downvotes alone push a user negative.

### 3.5 The rate limiter does not work in production (high — security)

`app.js` uses `express-rate-limit` with no `store` option, so it uses the default **in-memory** store. On Vercel, your API runs as serverless functions: each concurrent instance has its own memory, and instances are created and destroyed constantly.

The practical effect: `authLimit` of 30 requests per 15 minutes, and the 15-uploads-per-hour cap, are enforced *per instance*, not per user. An attacker making parallel requests gets a fresh counter on each new instance. Your brute-force protection on `/auth/login` is substantially weaker than it appears.

**Fix:** use a shared store. `rate-limit-redis` with an Upstash Redis instance (free tier is ample) is the standard answer and works on serverless. Vercel also offers a managed rate-limit primitive. Either way, also key the auth limiter on the submitted email address in addition to IP, so one attacker cannot lock out an entire university NAT, and so attacks distributed across IPs against one account are still caught.

While you are there: `TRUST_PROXY === '1'` is correct for Vercel, but if it is ever unset in production, every request appears to come from the proxy IP and the limiter throttles all users as one. Assert it at startup in production.

### 3.6 Account deletion does not exist (high — legal, not just nice-to-have)

There is no route for a user to delete their own account. `safeUser`, the profile route and the admin routes can ban but never erase.

Under GDPR Article 17, and India's DPDP Act 2023, and CCPA, a user has an enforceable right to erasure. The moment one EU student signs up, this stops being a feature request. You also have no data-export route (GDPR Article 15/20).

**Fix:**

- `DELETE /api/v1/users/me` with password re-confirmation.
- Decide the content policy deliberately: hard-deleting a question that has 40 answers destroys other people's work. The standard and defensible approach is to **anonymise** — strip name, email and password hash, set a `isDeleted` flag, reattribute content to "Deleted user" (your UI already renders this string, so the frontend is ready), and hard-delete uploads and votes.
- `GET /api/v1/users/me/export` returning the user's own JSON.
- A short privacy notice saying what you store and for how long. For a student project this can be one honest page; it cannot be nothing.

### 3.7 Password change does not invalidate existing sessions (medium)

`tokenFor` signs `{}` with only `subject` and `expiresIn: '7d'`. `identify` reloads the user and checks `isBanned` on every request — genuinely good design, and it means bans take effect immediately. But there is nothing that invalidates a *stolen* token. If a student's token leaks, it is valid for seven days and changing the password does not help.

**Fix:** add `tokenVersion: { type: Number, default: 0 }` to `User`, include it in the JWT claims, compare in `identify`, and `$inc` it on password change and on explicit "sign out everywhere". Four lines, closes the gap.

### 3.8 No password reset and no email verification (high)

Neither exists. For one college where you know everyone, that is survivable. Worldwide it is not:

- A typo in the signup email creates a permanently unrecoverable account, and you will get these requests daily.
- Nothing stops unlimited throwaway-email accounts, which is the entry point for every spam and vote-manipulation problem you will have.
- `emailDomains` institution verification (§1.3) is meaningless unless the address is proven.

**Fix:** a transactional email provider (Resend or Postmark; both have usable free tiers), single-use time-limited tokens stored hashed, verification required before posting (not before reading). This also gives you the delivery channel for notifications (§4.1).

### 3.9 Multi-document operations have no transactions (medium — already known)

`README.md` names this honestly. `removeDoubt` deletes Cloudinary images in a sequential loop, then answers, then votes, then the doubt. A timeout halfway through leaves a question whose images are gone. `removeAnswer` can unset `acceptedAnswer` and then fail before deleting.

For a worldwide service, the standard fix is **soft delete plus a cleanup worker**: set `deletedAt`, return success immediately, and let a scheduled job do the cascade idempotently with retries. That is also much better for the serverless model, where a 60-second function limit makes long cascades risky. Vercel Cron can run the worker. Atlas replica sets do support multi-document transactions if you prefer that route, but soft-delete is more robust and gives you accidental-deletion recovery as a bonus.

### 3.10 Smaller items

- **`Vote.findOneAndUpdate` upsert races.** Two simultaneous votes hit the unique index on `{ targetType, target, user }` and one surfaces as the generic 409 `"This record already exists. For signup, try a different email."` — a confusing message on a vote. Catch `11000` locally in `toggleVote` and retry, and make that global 409 message context-aware rather than mentioning signup.
- **Answer sort order is fixed.** `result.sort(...)` in the detail route orders by accepted-then-votes with no alternative. Offer "newest" too; on an old question the best answer is often a later one.
- **Comments exist only on answers.** `commentSchema` references `answer` only. Students routinely need to ask "which textbook edition?" on the *question*. Generalise to `{ targetType, target }` like `Vote` and `Report` already do.
- **Tags are uncontrolled.** `tags()` lowercases and dedupes but nothing else, so `dbms`, `data-base` and `databases` fragment immediately. Reuse the `aliases` mechanism from §1.2 for a tag synonym registry.
- **No view counter.** `views` on `Doubt`, `$inc` on detail load. It is the cheapest possible signal for "this question matters" and drives both sorting and author motivation.
- **No edit history.** `PUT /doubts/:id` overwrites `body` in place. Someone can post a question, receive answers, then rewrite it into something else. Store revisions, show "edited <date>".
- **`escapeRegex` is still needed** after the move to `$text`, for the subject and tag exact matches — keep it.
- **`positiveInt` requires a string**, which is correct for query parameters but will silently fall back if ever called with a parsed number. Worth a comment so a future change does not break it quietly.

---

## 4. Features that make it genuinely more useful

Ordered by value per unit of effort.

### 4.1 Notifications — the single biggest retention lever

Today, a student asks a question and must manually return to the site to discover whether anyone answered. Most will not come back. This is the number-one reason small Q&A sites feel dead even when they have content.

Implement, in order:
1. **In-app notification bell**: your question was answered, your answer was accepted, someone commented, you were mentioned.
2. **Email digest**, default on for "your question was answered", default off for everything else, with a one-click unsubscribe. Needs §3.8.
3. **Web Push** later, once you have a PWA (§5.5).

A `Notification` collection with `{ user, type, actor, target, targetType, readAt }` and an index on `{ user: 1, createdAt: -1 }` covers all of it.

### 4.2 Duplicate detection before posting

With worldwide reach, "What is the difference between a process and a thread?" — literally the placeholder in your own ask form — will be asked thousands of times. Unmanaged, your search results fill with near-identical questions and the good answers get buried.

As the student types the title, query the text index (§3.2) and show "Is your question one of these?" with three to five candidates and their answer counts. This is cheap to build on top of the search index and is the main thing that keeps content quality from degrading as volume grows. It also often satisfies the student instantly, which is the best possible outcome.

### 4.3 Related questions on the detail page

`UI_UX_IMPROVEMENT_PLAN.md` §13 already specifies this. Build it: `$text` search on the current title, filtered to the same subject, excluding the current id. It turns a single-answer visit into a browsing session and raises the value of every existing question.

### 4.4 Bookmarks and following

A `Save` on a question, and a "following" relationship on subjects and tags, so the feed can offer "questions in subjects I follow". Small schema, large effect on repeat visits.

### 4.5 Course and professor pages (your real differentiator against Stack Overflow)

Stack Overflow is better than you will be at generic programming questions, and that is fine. What it cannot do is "CS-204 at my college, Professor Rao's problem set 3, the 2026 exam pattern". Lean into that:

- `Course` entity scoped to an institution, with a code (`CS-204`) and a name.
- Tag questions with a course.
- A course page: all questions, most-accepted answerers, a pinned "start here" section.
- Per-term archives so next year's cohort inherits this year's answers.

That compounding institutional memory is the thing students will tell each other about, and it is the reason a college adopts your platform rather than a WhatsApp group.

### 4.6 Answer quality signals

- Mark teacher-verified answers distinctly from merely accepted ones. You already have the `teacher` role; use it as a quality signal, not just a badge.
- Let the question author leave a short "this helped because…" note on acceptance.
- Show "answered in 4 minutes" on fast answers. Visible responsiveness recruits askers.

### 4.7 Academic integrity, stated explicitly

A worldwide doubt forum is, structurally, also a homework-answer service. Decide your position deliberately rather than by default, because colleges will ask before they adopt:

- A visible norm: **explain the method, do not just post the answer**. Put it in the answer form's placeholder, which currently says "Walk them through the concept…" — that is already the right instinct, make it policy.
- A "this looks like a graded assignment" report reason.
- Optionally, let an institution's moderators mark exam windows during which new questions in a subject are held for review.

Getting this right is a selling point to faculty, and faculty are who approve adoption. Getting it wrong gets you blocked at the institutional firewall.

---

## 5. Accessibility, interface and internationalisation

The visual design in `styles.css` and `p0.css` is genuinely good — the hero, the card anatomy, the sidebar, the indigo accent. These are concrete gaps, not a redesign request.

### 5.1 There is no dark mode at all

`grep prefers-color-scheme` across both stylesheets returns zero matches. Students study at night. This is the most-requested feature on every study platform, and because `styles/variables.css` already centralises every colour as a custom property, it costs very little:

```css
:root { --page:#faf9fc; --card:#fff; --border:#e7e3ed; --text:#30283f; --muted:#8b8098; }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --page:#141218; --card:#1d1a22; --border:#302b38; --text:#ece8f1; --muted:#a69db3;
  }
}
:root[data-theme="dark"] { /* same block, for the manual toggle */ }
```

The blocker is that `styles.css` contains hard-coded colours that bypass the variables — `.prose { color:#595164 }` is one. Audit for literal hex values outside `variables.css` and route them all through tokens first. Then add a three-way toggle (system / light / dark) persisted in `localStorage`. Also check the indigo `--primary:#4f46e5` against the dark surface for 4.5:1 contrast; it will likely need lightening in the dark theme.

### 5.2 Type is too small and does not scale

```css
.prose { font-size: 14px; }
@media (max-width:639px) { .prose { font-size: 13px; } }
```

13px body text on a phone, for reading a long technical explanation, is too small — and because it is specified in `px`, a user who has set a larger default font size in their browser gets no benefit. That breaks a basic accessibility expectation and it matters disproportionately for low-vision users and for anyone reading code.

Move to `rem` with a 16px base for body copy, and *increase* rather than decrease size on mobile. The current direction is backwards: small screens need equal or larger text, not smaller.

### 5.3 Tabs are not tabs

`Profile` and `Admin` use `aria-pressed` on plain buttons:

```jsx
<button aria-pressed={tab === 'doubts'} onClick={...}>Recent questions</button>
```

A screen reader announces these as toggle buttons, not as a tab set, so there is no "tab 1 of 2" context and no arrow-key navigation. Use `role="tablist"` / `role="tab"` with `aria-selected` and `aria-controls`, and implement left/right arrow movement. Same pattern applies in both places.

### 5.4 Other specific accessibility items

- **Disabled vote buttons give no reason.** `disabled={busy || item.author?._id === user?._id}` silently disables upvote on your own content. A screen-reader user gets a dead control with no explanation. Add `title` and `aria-describedby` text: "You cannot vote on your own content."
- **`window.confirm` for all destructive actions** (delete doubt, delete answer, suspend user, remove reported content). It cannot be translated, styled or made consistent, and it is poor on mobile. Replace with a focus-trapped dialog using the native `<dialog>` element. For irreversible deletions, require typing a confirmation rather than a single click.
- **Icons carry meaning without text.** `▲`/`▼` for votes have `aria-label`, good. But `⌕` for search, `✦`, `✧`, `♡`, `↗`, `{}`, `▤`, `∑` in the subject list are decorative glyphs; make sure every one is either `aria-hidden` or labelled. The `{}`/`▤`/`∑` subject icons in particular are positional — `['{}','▤','J','⌘','◎','∑'][i]` indexes into the subject array, so it silently breaks the moment the subject list changes (and it will, per §1.2). Attach icons to subject records, not to array positions.
- **390px is unverified.** `docs/TESTING.md` is explicit that the viewport override failed and only 699px was observed. Verify at 360px and 390px on a real device. With only two breakpoints (1023px, 639px) there is a real chance the filter row and the admin table overflow. Also check the `<table>` in `Admin` — tables are the most common cause of horizontal scroll on phones.
- **Reduced motion is partially handled.** `p0.css` has one `prefers-reduced-motion` block; `styles.css` has none, and that is where `.art-orbit` and the hero animation live. Cover all of it.
- **Focus-visible.** Not mentioned in the test record. Tab through every page and confirm a visible ring on every interactive element, including the custom vote buttons and the upload drop zone.

### 5.5 Make it a PWA

Students have unreliable mobile data and limited storage. A service worker that caches the shell and recently viewed questions makes the app usable on a train and installable from the browser, and it is the prerequisite for Web Push (§4.1). `vite-plugin-pwa` handles most of it. Add a web app manifest and proper icons — `index.html` currently has only `theme-color`.

### 5.6 Internationalisation

- **The date formatter is hard-coded to one locale.** `components.jsx`: `new Date(value).toLocaleDateString('en-IN', …)`. Pass `undefined` to use the browser locale, and prefer relative time (`Intl.RelativeTimeFormat`) for anything under a week — "2 hours ago" is more useful than "9 Nov 2026" on a live feed.
- **All UI strings are inline in JSX.** Extract to a message catalogue (`react-i18next` or a simple `t()` with JSON files). Do this *before* the string count grows; retrofitting i18n is one of the most tedious refactors in frontend work. Start with English, then let contributors add languages — translation is the easiest way for non-coders to contribute to an open-source project, which matters for §7.
- **Right-to-left.** If Arabic, Hebrew, Urdu or Persian are ever in scope, use CSS logical properties (`margin-inline-start`, not `margin-left`) now. Cheap today, expensive later.
- **The hero copy is charming and very idiomatic.** "Big questions. Better answers, together.", "A little curiosity. A lot of learning." These are good, and they will translate badly. Keep them, but write the catalogue so translators can adapt rather than translate literally.

### 5.7 Keep the Hinglish documentation, and add English

`docs/GO_LIVE_HINGLISH.md`, `docs/ADMIN_HINGLISH.md` and `docs/VERCEL_HINGLISH.md` are the right call for the primary user and genuinely thoughtful. For worldwide adoption, add English equivalents alongside them — do not replace them. Name them `GO_LIVE.md` / `GO_LIVE.hi.md` and let the index link both.

---

## 6. Operations, cost and reliability

### 6.1 There is no monitoring

`app.js` logs `console.error('Request failed:', err.name, err.code || 'server_error')` — deliberately minimal to avoid leaking data, which is correct instinct, but it means you will learn about outages from users. The `ErrorBoundary` in `main.jsx` catches frontend crashes and reports nothing at all.

Add Sentry (free tier covers a project this size) on both client and server, an uptime check hitting `/api/v1/health` every five minutes, and alerting to an address you actually read. Your `connectionErrorCode` function in `database.js` is already excellent groundwork — it classifies failures into `DATABASE_AUTH_FAILED`, `DATABASE_PERMISSION_DENIED`, `DATABASE_NETWORK_UNAVAILABLE` and so on. Feed those codes into monitoring as tags and you will diagnose production issues in seconds instead of hours.

### 6.2 The free tier will be the first thing to break

Three specific limits, in the order you will hit them:

**Atlas M0 connections.** `database.js` sets `maxPoolSize: 5`. M0 allows about 500 connections but throttles well before that. Vercel can spin up many concurrent function instances, each opening its own pool of 5. Under a traffic spike — the evening before an exam, which is exactly when you need the site up — you exhaust the pool and every request fails. Mitigate: `maxPoolSize: 1` or 2 for serverless (a single function handles one request at a time, so a large pool buys nothing), and reduce the query count per request (§3.1), which is the real fix.

**Atlas M0 storage: 512 MB.** Text questions are small; the collection that will grow fastest is `Vote`, one document per vote with full timestamps. Plan the move to M10 and know what it costs before you need it.

**Cloudinary free tier: 25 credits/month.** Images are your first hard cost wall, and it arrives sooner than you expect because students currently photograph code (§2). Shipping Markdown code blocks is therefore also a cost-control measure. Additionally: set `fetch_format: auto` and `quality: auto` on delivery, and serve responsive sizes — right now `transformation: [{ width: 1800, height: 1800, crop: 'limit' }]` stores a large image and the detail page serves that full-size file into a small thumbnail slot.

**Also resolve the Atlas network access properly.** `RESUME_HERE.md` records a temporary `0.0.0.0/0` entry with an expiry. When it lapses, the site goes down with no warning and the error will look mysterious. Either move to the Atlas–Vercel integration, or make a deliberate documented decision about a permanent allowlist entry — relying on an expiring temporary rule in production is an outage waiting for a date.

### 6.3 There is no CI

`npm test` passes 26 subtests and `npm run build` passes, but nothing runs them automatically. The most likely way this project breaks is a push that fails to build, deployed straight to production by Vercel.

A GitHub Actions workflow is about twenty lines:

```yaml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongo:
        image: mongo:7
        ports: ['27017:27017']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - run: npm test
        env:
          MONGO_TEST_URI: mongodb://127.0.0.1:27017
          JWT_SECRET: ci-only-secret-at-least-thirty-two-characters-long
```

Your test suite already supports `MONGO_TEST_URI` and creates a uniquely named throwaway database, so this works as written. Add `npm audit --audit-level=high` and Dependabot while you are there.

### 6.4 Testing gaps that matter most

The integration suite is good and covers authorisation thoroughly. Three additions, in priority order:

1. **End-to-end browser tests.** Playwright, covering the four journeys in `UI_UX_IMPROVEMENT_PLAN.md` §3: signup→ask, answer→accept, search→filter, moderate. This directly closes the "full browser moderation mutations pending" gap in `docs/TESTING.md`, and running at a 390px viewport closes the mobile gap honestly rather than by assertion.
2. **Accessibility assertions.** `@axe-core/playwright` on each page catches the contrast and labelling regressions that will otherwise creep in with every CSS change.
3. **A load test.** Even a crude one (`autocannon` against the feed) will immediately demonstrate the §3.1 and §3.2 problems as numbers rather than as claims in a document, which makes them much easier to prioritise.

### 6.5 Backups

Atlas M0 has no backups. If the cluster is lost, everything is lost. A scheduled `mongodump` to object storage, and one tested restore, before you have users whose data you would feel bad about losing.

---

## 7. If you want every college to use it, open-source it properly

This is the part that most directly answers "best for all, not only for my college". There are two distinct strategies and you should pick one consciously:

**Strategy A — one hosted platform for the world.** You run it. Needs §1.3 institution scoping, real moderation tooling, and a cost model. Highest ceiling (network effects across institutions), highest operational burden, and you personally become responsible for data from many countries.

**Strategy B — software every college self-hosts.** They run it. Needs excellent packaging and configuration. Zero network effects between colleges, but near-zero operating cost and no cross-border data liability.

**Recommended: both, in that order.** Build the configurability that Strategy B requires, because it is the *same work* as the institution scoping Strategy A requires. Run a hosted instance yourself for colleges that cannot self-host. This is how Discourse, Mastodon and GitLab all work, and it is the realistic path for one developer.

What is needed either way:

- **A `LICENSE` file. There is none.** Right now, no other college can legally use, modify or deploy your code — default copyright reserves all rights. This is a one-file change that is currently the single largest barrier to the stated goal. MIT if you want maximum adoption; AGPL-3.0 if you want hosted forks to publish their changes back.
- **`docker-compose.yml`** so `docker compose up` gives a working instance with MongoDB included. Right now setup requires Node 22+, a local MongoDB, manual `.env` creation and a `make-admin` script run — fine for you, a wall for a sysadmin evaluating it in fifteen minutes.
- **A seed script** producing a realistic demo instance, so an evaluator sees a populated forum instead of an empty one. First impressions of empty software are fatal.
- **A single configuration file** (the institution profile from §1.3) controlling name, logo, colours, academic system, subject catalogue, locale and feature flags — so a new college onboards by editing config, never by editing code. This is the architectural test of whether the project is really general: *if adding a college requires a code change, it is still a one-college app.*
- **`CONTRIBUTING.md`, `SECURITY.md`, a code of conduct, issue templates.** Low effort, and their absence makes a project look unmaintained to anyone considering depending on it.
- **A public roadmap and a changelog.** Colleges adopt software they believe will still exist next year.
- **Split `pages.jsx`.** At 28 KB in one file with several components and some lines over 2,000 characters, it is readable to you and formidable to a first-time contributor. The dense single-line style throughout the codebase is consistent and clearly intentional, but it is the main practical obstacle to outside contribution. One file per page, and let Prettier wrap lines. This costs you nothing functionally and is the difference between a project people read and a project people contribute to.
- **`docs/API.md` as OpenAPI.** You have the endpoint documentation already; a machine-readable spec lets other people build mobile apps and integrations against it.

---

## 8. Suggested sequence

Deliberately ordered so each phase is shippable on its own and nothing is wasted.

**Phase 0 — finish what is in flight (this week).** Complete the live acceptance run already underway in `RESUME_HERE.md`: resolve the Atlas network access permanently rather than on a temporary rule, verify the browser flows on a real phone at 390px, and update `docs/TESTING.md`. Then add CI (§6.3) and the `LICENSE` file (§7). Do not start anything new until the thing you have is reliably live, because a half-finished migration on top of an unverified deployment is the worst of both.

**Phase 1 — do not fall over (1–2 weeks).** The indexes (§3.3), the feed aggregation (§3.1), the text index for search (§3.2), the reputation counter (§3.4), and a working distributed rate limiter (§3.5). All backend, all invisible to users, and all much cheaper to do now than after the data grows. Confirm each with `explain()` before and after.

**Phase 2 — make it genuinely better to use (2–4 weeks).** Markdown with code blocks and math (§2) — this is the one users will notice most. Then dark mode (§5.1), the type-scale fix (§5.2), notifications (§4.1), email verification and password reset (§3.8), and account deletion and export (§3.6).

**Phase 3 — make it worldwide (4–8 weeks).** The academic-level refactor (§1.1), the subject catalogue (§1.2), institutions and feed scoping (§1.3), i18n extraction (§5.6). Sequence the migrations carefully and write each one as a reviewable script; this phase touches the data model, so it is where real care is needed.

**Phase 4 — make it adoptable (ongoing).** Docker packaging, seed data, configuration-driven institution profiles, contributor documentation, the split of `pages.jsx`, duplicate detection (§4.2), related questions (§4.3), course pages (§4.5).

---

## 9. What not to build

Saying no is how the good version survives. Specifically resist:

- **Real-time chat.** WhatsApp already won this, your users are already there, and answers in chat are unsearchable — which destroys the one advantage a forum has.
- **Video answers.** Storage and bandwidth costs that scale badly, nothing is searchable, and moderation becomes far harder.
- **An AI answer bot, at least not yet.** It will answer faster than any student, which kills the community you are trying to build, and when it is confidently wrong on a graded assignment you own that. A much better use of AI here: duplicate detection (§4.2), tag suggestion, and flagging likely-toxic content for human moderators. Assist the humans; do not replace them.
- **Gamification beyond reputation.** Badges, streaks and leaderboards reliably produce volume, and volume is not the goal — a forum optimised for engagement fills with low-effort questions.
- **A native mobile app.** A PWA (§5.5) gets you ninety percent of the value at five percent of the cost, with no app-store review and no second codebase.
- **Private messaging.** It is a harassment vector requiring moderation tooling you do not have, and it moves knowledge out of the public record.

---

## 10. The three things that matter most

If you do nothing else from this document:

1. **Add a `LICENSE` file.** Without it, "for all colleges across the world" is legally impossible. One file, five minutes, and it is currently the single largest gap between where you are and what you said you want.

2. **Ship Markdown with code blocks and math (§2).** Your users are engineering and science students. Right now they photograph their code because the platform cannot display it. This is the largest gap between the product and its audience, and it is roughly a day's work.

3. **Make the data model stop assuming one college (§1).** Semester 1–8, eight CS subjects, and a single undifferentiated feed are three decisions that each independently exclude most students in the world. They are also the cheapest to change now and the most expensive to change later — every week of new content makes the migration bigger.

The foundation here is better than most of what gets built in a term. The security instincts are sound, the honesty in `docs/TESTING.md` about what is unverified is a real engineering virtue and rarer than good code, and the interface has genuine care in it. The work ahead is mostly generalisation, not repair.
