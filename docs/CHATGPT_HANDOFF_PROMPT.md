# Handoff prompt — continue Student Doubt Forum development

**Current copyable prompt.** Use the [AI handoff](CONTINUE_HERE.md#copyable-ai-handoff) with [project context](../PROJECT_CONTEXT.md). The original prompt below remains as project history.

Copy everything below the line into ChatGPT.

---

You are taking over development of **Student Doubt Forum**, a college question-and-answer web app, from a previous AI assistant. Work with the project owner, who is a beginner programmer. Read this whole message before doing anything.

## How to work with the owner

- Explain every step in **simple Hinglish**, one small step at a time. The owner finds long multi-step instructions confusing. Give one step, wait for them to confirm, then the next.
- When they need to run something, give the **exact command** and say where to run it (which folder, which terminal).
- When you change code, give the **complete new content** of each changed function or file, not a vague description. Say exactly which file and where.
- If you have direct repository access (for example a coding agent with the repo checked out), make the changes yourself. If you do not, ask the owner to paste or upload the specific files you need. **Do not guess at file contents you have not seen.** The code style is dense, with long single lines; the exact text matters for edits.
- Recommend one option when there is a choice. Do not present long lists of alternatives.

## Hard rules

1. **Never ask for, print, or commit secrets.** That means `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_API_SECRET`, passwords or tokens. The owner enters secrets privately in `server/.env` (local) and in the Vercel dashboard (production). If something needs a secret, tell them where to put it, never ask them to paste it to you. `server/.env` must never be committed; only `server/.env.example` is tracked.
2. **Report verification honestly.** Say exactly what you tested and what you did not. Never say "works" for something that was not run. The project's existing docs are deliberately strict about this, and the owner relies on it.
3. **Preserve working features and unrelated changes.** Change only what the task needs.
4. **Run the checks** after each change: `npm test` and `npm run build`, from the project root. Report the actual pass and fail counts.
5. **Update the docs** after each completed change (see "Documentation" below).
6. **Commit only when the owner asks.** Pushing to `main` deploys straight to production on Vercel, **without waiting for CI**. Say this before any push.
7. **The current code is the authority.** Older plan documents sometimes describe things that were changed later.

## Project snapshot

- **Live site:** https://student-doubt-forum-theta.vercel.app/
- **GitHub:** https://github.com/Raju-ol/student-doubt-forum (branch `main`)
- **Licence:** MIT, `Copyright (c) 2026 UJA`
- **Local folder:** a Windows OneDrive path that contains Korean characters (`문서`). This matters in code: in Node, convert file URLs with `fileURLToPath()`, never `new URL(...).pathname`, which percent-encodes the path and breaks.
- **Node:** 22.12 or newer. The owner's laptop runs Node 24.19 on Windows 11. MongoDB runs locally on `127.0.0.1:27017` for tests.

### Files that exist only on the owner's laptop

`PLAYBOOK.md` and `RESUME_HERE.md` are **not on GitHub**; they are untracked. They hold the full build history and the deployment state. If you need them, ask the owner to upload them. Everything else below is committed.

Read these committed files first, in this order: `README.md`, `RECOMMENDATIONS.md` (the roadmap, with a status table at the top), `docs/TESTING.md`, `docs/PHASE0_CHANGE_RECORD.md`, `docs/MARKDOWN_CHANGE_RECORD.md`, `docs/API.md`, `PROJECT_CONTEXT.md`.

## How the system works

- **Frontend:** React 19 and Vite 7, plain CSS, in `client/src`. `pages.jsx` holds every page; `components.jsx` holds shared components. The JWT is kept in `sessionStorage` and sent as `Authorization: Bearer <token>`.
- **API:** one Express 5 app in `server/src/app.js`, with routes under `/api/v1`. Locally `server/src/server.js` runs it. On Vercel, `api/index.js` wraps it as a serverless function, and `vercel.json` rewrites `/api/*` to that function and everything else to `index.html`.
- **Database:** MongoDB Atlas free tier (M0), through Mongoose. The models are in `server/src/models.js`: User, Doubt (a question), Answer, Vote, Comment, Report, Upload. `server/src/database.js` reuses one connection per warm function instance and calls `model.init()` on connect, which builds indexes automatically.
- **Images:** Cloudinary. Uploads are checked by file signature (magic bytes), size and ownership. Each question allows up to 3 images.
- **Authentication:** bcrypt at cost 12, JWTs that last 7 days, and an account and ban check on every request in `identify` in `server/src/auth.js`. A ban takes effect immediately.
- **Roles:** `student`, `teacher` (shown as a badge) and `admin`. Public signup cannot create an admin; `server/src/make-admin.js` promotes an existing account.
- **Security already in place:** helmet with a real Content Security Policy (`script-src 'self'`), escaped search regex, bounded pagination and ownership checks on every mutation.

## What has already been done (do not redo it)

All of the following is on `main`, deployed, and recorded in the docs.

| Commit | Change |
|---|---|
| `a8a9975` | Nine MongoDB indexes for the feed filters, profiles, comments, the report queue and uploads (`RECOMMENDATIONS.md` §3.3) |
| `a8a9975` and later | GitHub Actions CI (`.github/workflows/ci.yml`): build, test against a MongoDB 7 service container, `npm audit`. Dependabot is also set up |
| `717b2fe` | Feed N+1 fix (§3.1). `decorateMany()` in `server/src/forum.js` batches vote totals and answer counts into two aggregations. The feed went from 28 queries to 6 and no longer grows with page size |
| `65a7317` | MIT `LICENSE` |
| `6bcd2ae` | Markdown bodies (§2): marked, then highlight.js and KaTeX, then DOMPurify, with a toolbar editor and Write/Preview tabs |

### Design decisions to keep

- **Keep the `{ createdAt: -1 }` index on Doubt.** `RECOMMENDATIONS.md` §3.3 says it becomes redundant. It does not, because the unfiltered feed sorts by `createdAt` with no filter, and no compound index can serve that query.
- **Use `decorateMany(docs, type, user)` for any list.** Never call `decorate()` inside a loop; that brings the N+1 problem back. `decorate()` exists only as a one-item wrapper.
- **`client/src/markdown.js` must stay importable from Node** because the tests import it. It must not import CSS. The KaTeX and highlight.js stylesheets live in `client/src/markdown-view.js`, which is the browser entry point.
- **The Markdown renderer is lazy-loaded** through `import('./markdown-view')` in `components.jsx`. This keeps about 130 KB gzipped out of the main bundle; the main bundle is 95 KB gzipped. Do not import `markdown.js` statically from anything the feed loads.
- **`client/src/excerpt.js` (`markdownToText`) has no dependencies** because the feed cards import it.
- **Sanitising happens last** in the Markdown pipeline, with an explicit tag allow-list. Images are not allowed inside bodies; screenshots go through the Cloudinary upload flow. Links get `rel="nofollow noopener noreferrer"`.
- **Never test sanitisation by string-matching for `javascript:`.** A blocked payload can survive as harmless text. `server/tests/markdown.test.js` parses the output and inspects the actual attributes. Follow that pattern.
- **The CI test step needs `shell: bash`.** The default `run` shell has no `pipefail`, so `npm test | tee file` would hide a failing suite. This happened once and produced a false green run.
- **CI tests on Node 22 and 24, at their latest patches.** jsdom 31, used by the client tests, needs Node 22.22.2+ or 24.15+. CI previously pinned 22.12 and all three jsdom test files failed there while passing on the owner's Node 24 laptop. The application itself still runs on 22.12+. Before adding any dependency, check its `engines.node` field against both lines.
- **`npm test` pins `--test-reporter=spec`.** Node 22 switches to TAP output when piped and Node 24 does not; the CI failure annotation searches for the spec reporter's "failing tests" summary.
- **GitHub Actions job logs need a token to read.** The workflow therefore raises failing-test output as an annotation, which is readable without one, and uploads `test-output.txt` as an artifact.

### Tests

`npm test` runs `node --test server/tests/*.test.js`. There were 59 passing at the last count:
- `forum.test.js` covers the API and database integration. It creates a uniquely named `forum_test_*` database and drops only that.
- `markdown.test.js`, `editor.test.js` and `components.test.js` cover the Markdown work. The last one bundles the JSX with esbuild into `node_modules/.cache/` so React resolves, and renders it under jsdom.
- `navigation.test.js` and `database-errors.test.js`.

Client JSX cannot be imported directly from Node. Put testable logic in plain `.js` modules, as `editor.js`, `excerpt.js` and `navigation.js` already do.

## Things that still need checking (ask the owner about these early)

1. **Atlas network access may be temporary.** The deployment notes record a temporary `0.0.0.0/0` Atlas allow-list entry with an expiry. If it lapses, the live site loses its database with no warning. Ask the owner to check, in Atlas under **Network Access**, whether that entry has an expiry date. If it does, help them decide on a durable setup, such as the Atlas–Vercel integration or a deliberate, documented permanent entry. This is the highest operational risk.
2. **The Markdown UI has never been opened in a real browser.** It renders correctly under jsdom, but how it looks, and whether the 8-button toolbar fits on a 390 px phone, is unconfirmed. Walk the owner through checking it on the live site from their phone.
3. **CI status:** the most recent commits fixed CI (commit `c262778` added the Node 22 and 24 matrix). Check that the latest run on `main` is green on **both** Node versions before you trust it. A run that passes while the Test step shows no test output is suspect.

## Remaining work, in recommended order

Do these **one at a time**. Each one ends with tests, a build, a docs update and an honest report. Full reasoning for each is in `RECOMMENDATIONS.md` under the section numbers given.

### Next: small and safe backend fixes

1. **§3.4 reputation counter.** `reputation()` in `forum.js` loads every vote on a user's answers into memory on each profile view. Add `reputation: { type: Number, default: 0 }` to User and `$inc` it in the vote handler (+10 for an upvote, −2 for a downvote, reversed when a vote is undone or switched) and in the accept handler (+15, reversed when acceptance is removed). Keep the old function as a reconciliation script. Write a one-off backfill script for existing users. Consider showing reputation floored at 0.
2. **§3.7 token invalidation.** Add `tokenVersion` to User, include it in the JWT, compare it in `identify`, and increment it on password change. There is no password-change route yet, so add a "sign out everywhere" route or bundle this with item 6 below.
3. **§6.2 connection pool.** Set `maxPoolSize` in `database.js` to 1 or 2 for serverless. Each Vercel instance has its own pool, and 5 per instance can exhaust Atlas M0 during a traffic spike.
4. **§3.2 text search.** Replace the unanchored regex search with a MongoDB text index over `title`, `body` and `tags` (weights 10, 1 and 5). Use `$text` and sort by `textScore`. This **changes search behaviour**: it matches stemmed words rather than substrings, so update the search tests deliberately and explain the difference to the owner.
5. **§3.5 rate limiter.** `express-rate-limit` uses an in-memory store, which does nothing useful across serverless instances, so login brute-force protection is much weaker than it looks. The fix needs a free Upstash Redis account, which the owner must create; they enter the URL and token in Vercel, never in chat. Also key the auth limiter on the submitted email as well as the IP.

### Then: user-facing improvements

6. **§3.8 email verification and password reset.** This needs a transactional email account (Resend or Postmark), which the owner must create. Store tokens hashed, make them single-use, and give them an expiry. Require verification before posting, not before reading.
7. **§3.6 account deletion and data export.** Legally required under GDPR and India's DPDP Act. Anonymise rather than hard-delete content that other people answered; the UI already renders "Deleted user". Add `DELETE /api/v1/users/me` with password confirmation and `GET /api/v1/users/me/export`.
8. **§5.1 dark mode.** First route every hard-coded hex colour in `styles.css` and `p0.css` through the custom properties in `client/src/styles/`, then add a `prefers-color-scheme` block and a system/light/dark toggle. Check the indigo primary colour for 4.5:1 contrast on the dark surface. Code blocks will also need a dark highlight.js theme.
9. **§4.1 notifications.** Start with an in-app bell, using a `Notification` collection indexed on `{ user: 1, createdAt: -1 }`.
10. **§5.3 accessible tabs.** The Profile and Admin pages still use `aria-pressed` buttons as tabs. The new Markdown editor in `components.jsx` already shows the correct pattern (`role="tablist"`, `aria-selected`, roving tabindex, arrow keys); reuse it.

### Later: the structural "every college" work

11. **§1.1 academic level.** Replace the required `semester: 1–8` with an optional `academicLevel { system, index, label }` object, with a migration script.
12. **§1.2 subject catalogue.** Replace the eight hard-coded subjects in `components.jsx` with a `Subject` collection that has aliases. Note that the subject icons are currently tied to array position and will break when the list changes.
13. **§1.3 institutions.** Add an `Institution` model and feed scopes: my college, my subject worldwide, and everything.

These three change the data model. Write each migration as a reviewable script, test it against a copy of the data first, and never run anything destructive against production without the owner's explicit approval.

## Documentation to update after each change

- `RECOMMENDATIONS.md`: the status table near the top. Mark the item Done and say what was verified.
- A change record in `docs/`, following the style of `docs/PHASE0_CHANGE_RECORD.md`: what changed and why, any deviation from the recommendation, what was verified, and a **"Not verified"** section.
- `docs/TESTING.md`: the new results, and any new limitation under "Pending or limited".
- `README.md` if setup, behaviour or limits changed. `docs/API.md` if a route changed.
- `PROJECT_CONTEXT.md`: one short dated paragraph at the top.

## Commit messages

Use conventional prefixes (`feat:`, `fix:`, `perf:`, `docs:`, `ci:`). Write a body that explains why the change was made and what was verified, including what was not. Stage specific files only, never `git add .`, because there are untracked local files that must not be committed by accident.

## Your first reply

Do not start coding yet. In simple Hinglish:
1. Confirm in a few lines what you understood about the project.
2. Ask the owner to check the Atlas network-access expiry (item 1 under "Things that still need checking"), with click-by-click steps.
3. Propose starting with **§3.4 reputation counter**, and ask which files you need them to share if you cannot read the repository yourself.
