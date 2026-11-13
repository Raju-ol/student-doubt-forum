<!-- consistency-review-2026-11-13 -->
> Current status, 13 November 2026 — See [current implementation and limits](CURRENT_STATE.md). The active design has Auto/Light/Dark themes and a separate community resource Library. Institution-scoped curriculum and publication review remain planned. Older counts, release IDs and provider checks below are dated evidence, not current certification.

# Student Doubt Forum — Complete Build-From-Scratch Playbook

> **Status update 13 November 2026.** This document describes the build at code reference `827e8df` and has not been rewritten line by line. Changes since then are listed in [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) (section "Update 13 November 2026"), the [API notes](API.md) and the [Design v3 change record](DESIGN_V3_CHANGE_RECORD.md). Where they differ, the newer records win. Features added since: resource Library, Trending Topics, Top Contributors, view counts, Light and Dark themes, header search that keeps filters, Python and C and C++ subjects.

**Version:** 1.0 · 10 November 2026
**Code reference:** `827e8df`
**Live site:** https://student-doubt-forum-theta.vercel.app/
**Repository:** https://github.com/Raju-ol/student-doubt-forum

## What this document is

This is the full engineering reproduction guide. If you have never seen this project before, you can read this document top to bottom and rebuild the same software — the same stack, the same folder layout, the same build order, the same provider setup, and the same fixes for the problems you will hit along the way.

It covers four things the shorter guides do not:

1. **Every file and what it is for** — not a summary, a complete inventory.
2. **The build order that actually worked** — thirteen phases, in sequence, each with the problem it solved, the files it touched, how it was verified, and the commit it landed in.
3. **Where to do what** — which dashboard, which screen, which button, which exact value, for all seven external services.
4. **Every failure we hit and the fix** — the GitHub 403, the silent CI false pass, the 503 that looked like a working deployment, the white Google button, the dark-mode dropdown, the aggregation that was slower than the thing it replaced.

Companion document: **FEATURE_SPECIFICATION.md** describes what the finished software *does*, feature by feature. This document describes how it was *made*.

**Security rule for this whole document:** every credential below is a placeholder. No real password, connection string, JWT secret, API key, app password or token appears here, and none should ever be added. If you take a screenshot for a report, cover the value fields.

---

## Contents

**Part I — Understand before you build**
1. [What the product is](#1-what-the-product-is)
2. [The complete technology stack](#2-the-complete-technology-stack)
3. [Architecture: how the pieces talk](#3-architecture-how-the-pieces-talk)
4. [The ten design decisions that shaped everything](#4-the-ten-design-decisions-that-shaped-everything)

**Part II — Set up the workbench**
5. [Machine prerequisites](#5-machine-prerequisites)
6. [Accounts and services you must create](#6-accounts-and-services-you-must-create)
7. [Repository skeleton: every file and its job](#7-repository-skeleton-every-file-and-its-job)
8. [Workspace wiring: the three package.json files](#8-workspace-wiring-the-three-packagejson-files)
9. [First local run](#9-first-local-run)

**Part III — Build the software**
10. [The build order that worked: thirteen phases](#10-the-build-order-that-worked-thirteen-phases)
11. [The data model in full](#11-the-data-model-in-full)
12. [Indexes: all nineteen, and why each exists](#12-indexes-all-nineteen-and-why-each-exists)
13. [The request pipeline, middleware by middleware](#13-the-request-pipeline-middleware-by-middleware)
14. [Server module map: what to put where](#14-server-module-map-what-to-put-where)
15. [Client module map: what to put where](#15-client-module-map-what-to-put-where)
16. [The repeatable recipe for adding any feature](#16-the-repeatable-recipe-for-adding-any-feature)
17. [How the test harness works and how to write tests](#17-how-the-test-harness-works-and-how-to-write-tests)

**Part IV — Ship it**
18. [Git and GitHub, including the push that failed](#18-git-and-github-including-the-push-that-failed)
19. [MongoDB Atlas, click by click](#19-mongodb-atlas-click-by-click)
20. [Vercel, click by click](#20-vercel-click-by-click)
21. [`vercel.json` explained line by line](#21-verceljson-explained-line-by-line)
22. [Cloudinary](#22-cloudinary)
23. [Upstash Redis](#23-upstash-redis)
24. [Google sign-in](#24-google-sign-in)
25. [Email: Gmail SMTP and Resend](#25-email-gmail-smtp-and-resend)
26. [Environment variable master reference](#26-environment-variable-master-reference)
27. [CI/CD and dependency updates](#27-cicd-and-dependency-updates)
28. [Creating the first administrator](#28-creating-the-first-administrator)
29. [Publishing the Study Library](#29-publishing-the-study-library)

**Part V — Run it**
30. [Release procedure](#30-release-procedure)
31. [Rollback](#31-rollback)
32. [Backup and restore drill](#32-backup-and-restore-drill)
33. [Monitoring and timing headers](#33-monitoring-and-timing-headers)
34. [Migration scripts and their safety rails](#34-migration-scripts-and-their-safety-rails)

**Part VI — Everything that went wrong**
35. [Complete failure catalogue with fixes](#35-complete-failure-catalogue-with-fixes)
36. [Troubleshooting matrix](#36-troubleshooting-matrix)
37. [The secret exposure incident and the response](#37-the-secret-exposure-incident-and-the-response)

**Part VII — Reuse**
38. [Security decision catalogue](#38-security-decision-catalogue)
39. [Performance decision catalogue with measurements](#39-performance-decision-catalogue-with-measurements)
40. [Free-tier limits and cost](#40-free-tier-limits-and-cost)
41. [Adapting this codebase to a different product](#41-adapting-this-codebase-to-a-different-product)
42. [What is still open](#42-what-is-still-open)
43. [Reusable AI-assistant prompts](#43-reusable-ai-assistant-prompts)
44. [Reference links](#44-reference-links)

---

# Part I — Understand before you build

## 1 What the product is

A question-and-answer forum for college students. A student posts a doubt — with formatted text, code, mathematics and up to three screenshots. Other students and teachers answer. The person who asked picks one answer as accepted. Votes and accepted answers build reputation. Everything is searchable and filterable by subject, academic level, college and solved status.

**The nine things a student can do**

| | Action |
|---|---|
| 1 | Create an account with an email and password, or with Google |
| 2 | Ask a question with Markdown, code blocks, LaTeX maths and screenshots |
| 3 | Browse and search a feed, filtered by subject, academic level, college and status |
| 4 | Answer someone else's question |
| 5 | Comment under an answer |
| 6 | Upvote or downvote questions and answers |
| 7 | Accept one answer on their own question |
| 8 | Receive in-app notifications when someone answers, comments or accepts |
| 9 | Export or delete their own account data |

**What an admin can additionally do:** review reports, remove content, suspend accounts, promote students to teachers, add subjects and colleges to the catalogues, and publish the Study Library.

**What is deliberately not in it:** live AI answers, realtime chat, private messaging, email digests, mentions, push notifications, file attachments other than images, audit history, and verified college membership.

## 2 The complete technology stack

Every dependency, the exact version range the project pins, and the reason it is there rather than an alternative.

### Runtime

| | Value |
|---|---|
| Node.js | `>=22.12.0` declared in `engines`. CI tests Node 22 and 24 at latest patch. The development laptop ran 24.19.0 |
| npm | npm workspaces; the laptop ran 11.17.0 |
| Module system | ESM throughout (`"type": "module"` in all three package files). No CommonJS, no transpiler on the server |

**Why the Node floor moved.** The app itself runs on 22.12. But `jsdom@31`, used by the component tests, requires Node 22.22.2+ or 24.15+. So the *test suite* needs a newer patch than the *application*. CI pins the matrix to `['22', '24']` — latest patch of each — rather than an exact version, which is what finally made CI agree with the laptop.

### Server dependencies

| Package | Version | Role | Why this one |
|---|---|---|---|
| `express` | `^5.1.0` | HTTP framework | Express 5 — async error propagation without a wrapper library, and it is what Vercel's Node runtime documents |
| `mongoose` | `^8.19.0` | MongoDB ODM | Schema validation, population, index declaration next to the field, and a connection manager we can control |
| `bcryptjs` | `^3.0.2` | Password hashing | Pure JS — no native build step, which matters because a restricted Windows execution environment blocked native compilation during setup |
| `jsonwebtoken` | `^9.0.2` | Session tokens | HS256 bearer tokens, 7-day expiry |
| `helmet` | `^8.1.0` | Security headers | CSP, nosniff, frame options, referrer policy on API responses |
| `cors` | `^2.8.5` | Cross-origin policy | Single configured origin from `CLIENT_URL` |
| `express-rate-limit` | `^8.1.0` | Throttling | `standardHeaders: 'draft-7'`, pluggable store, IPv6 subnet grouping via `ipKeyGenerator` |
| `rate-limit-redis` | `^6.0.2` | Shared limiter store | Atomic Lua increment + expiry, with NOSCRIPT reload support |
| `multer` | `^2.0.2` | Multipart intake | Memory storage, so the buffer can be signature-checked before it goes anywhere |
| `cloudinary` | `^2.7.0` | Image hosting SDK | `upload_stream` accepts the in-memory buffer directly |
| `nodemailer` | `^10.4.0` | SMTP client | Gmail SMTP on 465/TLS for the beta recovery sender |
| `google-auth-library` | `^11.3.4` | Google ID token verification | `verifyIdToken` checks signature, audience and expiry against Google's keys |
| `dotenv` | `^17.2.0` | Local env loading | Only used by `server.js` and the CLI scripts; Vercel injects variables directly |

### Client dependencies

| Package | Version | Role | Why this one |
|---|---|---|---|
| `react` / `react-dom` | `^19.1.0` | UI | — |
| `react-router-dom` | `^7.9.0` | Routing | `BrowserRouter`, `useSearchParams` for URL-driven filters |
| `marked` | `^18.1.3` | Markdown → HTML | Small, synchronous, and its renderer hooks let us override `html`, `code` and `heading` |
| `marked-katex-extension` | `^5.1.13` | `$…$` and `$$…$$` | Plugs KaTeX into marked's token stream |
| `katex` | `^0.18.10` | Maths rendering | Chosen over MathJax for bundle size and synchronous render |
| `highlight.js` | `^11.12.0` | Code highlighting | Imported as `lib/core` plus thirteen hand-registered languages — importing all of them adds roughly a megabyte |
| `dompurify` | `^3.4.17` | HTML sanitising | Runs **last** in the pipeline, with an explicit tag allow-list |
| `vite` | `^7.1.0` (dev) | Dev server and bundler | Dev proxy to Express, code splitting for the Markdown chunk |

### Root dev dependencies

| Package | Version | Role |
|---|---|---|
| `esbuild` | `^0.28.2` | Bundles JSX inside the test process so React components can be rendered in Node |
| `jsdom` | `^31.0.0` | DOM for component and theme tests |

No Jest, no Vitest, no Mocha. Tests run on **`node --test`**, the built-in runner.

### Hosted services

| Service | Role | Plan used |
|---|---|---|
| GitHub | Source, CI, Dependabot | Free, private repo |
| Vercel | Frontend hosting + serverless Express | Hobby |
| MongoDB Atlas | Application database | Free tier, existing `Cluster0`, AWS Mumbai |
| Cloudinary | Image storage and CDN delivery | Free |
| Upstash | Redis over REST, for shared rate limits | Free, Singapore |
| Google Cloud | Identity Services web client | Free |
| Gmail | SMTP sender for password recovery | Free, with an App Password |
| Resend | Alternative email provider, kept configurable | Free |

## 3 Architecture: how the pieces talk

```
                          ┌──────────────────────┐
  Developer laptop        │   GitHub main        │
  ───────────────   push  │   + Actions CI       │
  code, tests, docs ─────▶│                      │
                          └──────────┬───────────┘
                                     │ auto-deploy
                                     ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                      VERCEL (one origin)                     │
  │                                                              │
  │  GET /anything   ─▶  client/dist  (static Vite bundle)       │
  │  GET /api/*      ─▶  api/index.js ─▶ createApp() Express     │
  └───────────┬──────────────────────────────────────────────────┘
              │
    ┌─────────┼──────────┬────────────┬─────────────┬────────────┐
    ▼         ▼          ▼            ▼             ▼            ▼
 MongoDB  Cloudinary  Upstash    Google       Gmail SMTP    (browser)
  Atlas    (images)    Redis     Identity     or Resend    Google GSI
 (data)               (limits)  (verify ID)    (email)       script
```

**Three facts that explain most of the design:**

1. **One origin.** The React app and the API are served from the same hostname. The browser calls `/api/v1/...` with no absolute URL anywhere in the frontend. This removes a whole class of CORS and cookie problems, and means the only CORS configuration is a safety net.

2. **The API is a serverless function.** `api/index.js` is not a server — it is a handler that Vercel invokes. It must assume a cold start: no connection is guaranteed to exist, and no in-process state survives reliably. That single fact dictates the connection manager (§13) and the Redis rate limiter (§23).

3. **MongoDB never stores image bytes.** It stores a Cloudinary `publicId`, a URL, and who owns it. Cloudinary stores the file. Deleting a question therefore has to delete in two places, in a specific order (§22).

### The three lifecycles

**Posting a question with a screenshot**

```
1. Browser POSTs the file to /api/v1/uploads (multipart)
2. Server: rate limit by account → multer parses to memory
3. Server: checks MIME type, then the actual file signature bytes
            (JPEG FF D8 FF / PNG 89 50 4E 47 0D 0A 1A 0A / RIFF…WEBP)
4. Server: refuses if the account already has 9 unattached uploads
5. Server: cloudinary.upload_stream(buffer) with a 1800×1800 limit transform
6. Server: creates an Upload record {publicId, url, owner, doubt: null}
7. Browser gets back the publicId and shows a preview
8. Browser POSTs /api/v1/doubts with {…fields, imageIds: [publicId, …]}
9. Server: verifies every publicId is owned by this user AND unattached
10. Server: creates the Doubt, copying {url, publicId} onto it
11. Server: stamps doubt onto those Upload records — they are now attached
             and can no longer be removed via DELETE /uploads
```

**Signing in**

```
Password path:   bcrypt.compare(input, stored hash at cost 12)
Google path:     google-auth-library verifyIdToken(credential, audience=GOOGLE_CLIENT_ID)
                 → requires claims.email_verified === true
Both paths then: jwt.sign({ver: user.tokenVersion}, JWT_SECRET,
                          {subject: userId, expiresIn: '7d', algorithm: 'HS256'})
Browser stores the token in sessionStorage (per-tab, cleared on tab close)
Every protected call: identify() verifies the signature, re-loads the user from
                      MongoDB, and rejects if banned, deleted, or if the token's
                      `ver` claim no longer matches the stored tokenVersion
```

**Answering**

```
1. POST /api/v1/doubts/:id/answers → Answer created
2. notifyUser({user: doubt.author, actor: me, type: 'question_answered',
                target: doubt._id, eventKey: `answer:${answer._id}`})
   — skipped if author === actor
   — skipped if recipient is banned or deleted
   — upserted on the unique eventKey, so it can never duplicate
3. Reading the thread: one query for answers, one $in query for ALL their
   comments, two aggregations for votes and counts. Accepted answer sorts
   first, then by score.
```

## 4 The ten design decisions that shaped everything

If you copy nothing else, copy these. Each one came from a real problem.

| # | Decision | Problem it solves |
|---|---|---|
| 1 | **Sanitise last.** The Markdown pipeline is marked → KaTeX → highlight.js → DOMPurify, with an explicit tag allow-list. | Nothing earlier in the chain can smuggle script content through, whatever the student typed. CSP is a second layer, not a substitute |
| 2 | **Author identity comes from the token, never the request body.** | A client sending `author: <someone else>` is simply ignored |
| 3 | **Token version in the JWT.** `tokenVersion` on the user, `ver` in the claim, compared on every request. | Lets "sign out everywhere" and a password reset actually revoke copied tokens — a stateless JWT otherwise cannot be revoked |
| 4 | **Cache only the in-flight connection attempt, never a resolved one.** | In a warm serverless instance, a resolved promise would mask a later disconnect and every request would fail against a dead handle |
| 5 | **The rate limiter fails closed in production.** If Redis is unreachable, requests get a 503. | Falling back to per-instance memory counters silently removes the protection across a dozen function instances |
| 6 | **Batch per page, not per item.** `decorateMany()` does two aggregations for a whole page. | A 30-item feed went from roughly 60 round trips to 6, and that number no longer grows with page size |
| 7 | **Store reputation, reconcile it separately.** `User.reputation` with `$inc`, plus a dry-run-by-default reconciliation script. | Computing it on every profile view meant loading every vote into Node memory |
| 8 | **`null` as an explicit backfill marker.** A legacy user's `reputation` is `null`, initialised lazily on first read or change. | No forced migration at deploy time, and no silent zeroing of existing scores |
| 9 | **Every destructive script is dry-run by default** and needs `--apply --confirm-backup --confirm-writes-paused` plus an explicit `--database=`. | Makes it structurally hard to run a migration against the wrong database by accident |
| 10 | **Keep the legacy field alongside the new one.** `semester` survived next to `academicLevel`; free-text `subject` survived next to `subjectId`. | Old records keep working and old clients keep filtering, with no migration on the critical path |

---

# Part II — Set up the workbench

## 5 Machine prerequisites

Check before installing. The setup for this project started by inspecting what was already present rather than reinstalling.

```powershell
node --version    # need v22.12.0 or newer; v24.x recommended for the test suite
npm --version
git --version
mongod --version  # or confirm the MongoDB service is running
```

| Tool | Minimum | Notes |
|---|---|---|
| Node.js | 22.12 to run the app; 22.22.2+ or 24.15+ to run the tests | The jsdom floor, not the app floor |
| npm | Ships with Node | Workspaces are used, so npm 7+ |
| Git | Any current version | Git Credential Manager helps on Windows |
| MongoDB | 7.x local server on `127.0.0.1:27017` | CI uses the `mongo:7` container |

**MongoDB Compass is a viewer, not a server.** Installing Compass does not give you a running database. You need the MongoDB Community Server service, or Atlas.

**Windows note.** A restricted execution policy blocked both network access and a native build component during setup. Running the same commands in an ordinary authorized shell completed fine. Do not disable endpoint protection to work around this — switch shells.

## 6 Accounts and services you must create

Create these in this order. Each row is the minimum you need before the step that uses it.

| Order | Service | What you create | Needed by |
|---|---|---|---|
| 1 | GitHub | A repository, private is fine. No README/licence/gitignore — the local files already exist | §18 |
| 2 | MongoDB Atlas | A free cluster, a database user scoped `readWrite` on `student_doubt_forum`, a network access rule | §19 |
| 3 | Vercel | A project imported from the GitHub repo | §20 |
| 4 | Cloudinary | Cloud name + API key + API secret | §22 |
| 5 | Upstash | A Redis database; copy the REST URL and REST token | §23 |
| 6 | Google Cloud | An OAuth **Web application** client; copy the Client ID | §24 |
| 7 | Gmail (dedicated inbox) | 2-Step Verification on, then a 16-character App Password | §25 |
| 8 | Resend (optional) | API key, and a verified sending domain if you want all-user email | §25 |

**Three different kinds of "admin" exist in this system. Do not confuse them:**

| | What it controls |
|---|---|
| Atlas account login | Who can change cluster settings in the Atlas dashboard |
| Atlas **database user** | What the application's connection is allowed to read and write |
| Forum `role: 'admin'` | Who sees the Moderation screens inside the website |

Granting one never grants another.

## 7 Repository skeleton: every file and its job

This is the complete tree at `827e8df`, excluding `node_modules`, `dist`, and `.git`.

```
student-doubt-forum/
│
├── package.json                  Workspace root: scripts, engines, dev deps
├── package-lock.json             Locked tree — commit this, install with `npm ci`
├── .gitignore                    node_modules, dist, .env* (except .env.example), logs, .vercel
├── LICENSE                       MIT
├── vercel.json                   Build settings, rewrites, security headers, function config
├── render.yaml                   An alternative host blueprint, kept but not deployed
├── Start Application.cmd         Windows double-click launcher
│
├── README.md                     Entry point and run instructions
├── PROJECT_CONTEXT.md            Architecture + "behaviour to preserve" for the next maintainer
├── PLAYBOOK.md                   The original build/deploy narrative
├── RECOMMENDATIONS.md            The audit that drove phases 3–13
├── RESUME_HERE.md                Dated session checkpoints
│
├── api/
│   └── index.js                  Vercel handler: ensure DB, add no-store, delegate to Express
│
├── client/
│   ├── index.html               Shell. Loads /theme-init.js before paint
│   ├── vite.config.js           Dev proxy: /api → http://127.0.0.1:5000
│   ├── package.json             Client deps and vite scripts
│   ├── public/
│   │   └── theme-init.js        Self-hosted pre-paint theme resolver (avoids an inline-script CSP hole)
│   └── src/
│       ├── main.jsx             createRoot, ErrorBoundary, BrowserRouter, every <Route>
│       ├── context.jsx          Auth + catalogue provider, toast notices
│       ├── api.js               The single fetch wrapper. Every call goes through it
│       ├── session.js           sessionStorage read/write that survives blocked storage
│       ├── navigation.js        safeReturn() — open-redirect protection on returnTo
│       │
│       ├── pages.jsx            Feed · AuthPage · Ask · Detail · Profile · Admin
│       ├── components.jsx       Navbar, DoubtCard, VoteButtons, Markdown, MarkdownEditor, Pager, states
│       ├── account-pages.jsx    EmailAction (forgot/reset/verify) · AccountSettings
│       ├── notifications.jsx    NotificationBell · NotificationsPage
│       ├── catalog-page.jsx     Admin subject + college catalogue screens
│       ├── study-library-admin.jsx  Admin Study Library publish panel
│       ├── google-button.jsx    Loads Google GSI, renders the official button, re-renders on resize/theme
│       │
│       ├── markdown.js          The render pipeline. Importable from Node (no CSS import)
│       ├── markdown-view.js     Browser entry for the lazy chunk; carries the KaTeX/hljs CSS
│       ├── excerpt.js           markdownToText() for cards. Dependency-free on purpose
│       ├── editor.js            The 8 toolbar tools + applyTool() + tab key handling. No JSX
│       │
│       ├── theme.js             THEMES, nextTheme(), resolvedTheme() — pure functions
│       ├── theme-control.jsx    The click-to-cycle button with sliding indicator
│       ├── tabs.js              tabDestination() — arrow/Home/End key maths
│       ├── tab-list.jsx         Accessible <TabList> with roving tabindex
│       ├── academics.js         levelOf() / levelLabel() with legacy semester fallback
│       ├── academic-fields.jsx  <AcademicFields> form control + <AcademicFilter>
│       ├── institution-select.jsx  College dropdown
│       ├── useUnsavedChanges.js    beforeunload + link-click interception
│       │
│       ├── styles.css           Layout and components
│       ├── p0.css               The P0 usability pass overrides
│       └── styles/variables.css All colour tokens, light + dark + system fallback
│
├── server/
│   ├── package.json             Server deps, `dev` = node --watch
│   ├── .env.example             Documented template. The only env file that is committed
│   ├── .env                     PRIVATE. Git-ignored. Never packaged
│   │
│   ├── src/
│   │   ├── server.js            Local/standalone entry: connect, listen, graceful SIGTERM/SIGINT
│   │   ├── app.js               createApp(). All route wiring, middleware order, error handler
│   │   ├── database.js          connectionManager, validateConfiguration, connectionErrorCode
│   │   ├── models.js            Every Mongoose schema and index
│   │   ├── auth.js              safeUser, tokenFor, identify, requireUser, requireAdmin, owns
│   │   ├── validation.js        fail() + bounded text/email/password/tags/semester/pagination
│   │   ├── forum.js             findDoc, decorateMany, toggleVote, toggleAcceptance, removeAnswer/Doubt
│   │   ├── reputation.js        voteCredit, calculateReputation, ensureReputation, addReputation
│   │   ├── account.js           Data export (NDJSON stream) and account deletion/tombstoning
│   │   ├── email.js             Token issue/consume, Gmail + Resend transports, requireVerified
│   │   ├── email-policy.js      The two feature flags, in one place
│   │   ├── google-auth.js       verifyGoogleIdentity + /auth/google and /auth/google/link
│   │   ├── notifications.js     notifyUser + the inbox routes
│   │   ├── rate-limits.js       redisCommand, ProtectedRedisStore, createLimiterFactory
│   │   ├── subjects.js          Seeds, normalisation keys, resolve/filter, admin route, migration
│   │   ├── institutions.js      Catalogue, validation, admin route, migration
│   │   ├── academics.js         academicFields() parsing + effectiveLevel()
│   │   ├── academic-migration.js  Backfill academicLevel from legacy semester
│   │   ├── study-library.js     Deterministic-ID import of the 200-question demo batch
│   │   ├── demo-questions.json  200 prompts: {id, title, subject, question}
│   │   ├── demo-answers.json    200 answers, keyed by question id
│   │   │
│   │   ├── make-admin.js              CLI: promote a registered email to admin
│   │   ├── reconcile-reputation.js    CLI: dry-run reputation audit, --apply to fix
│   │   ├── migrate-subjects.js        CLI: backfill subjectId
│   │   ├── migrate-institutions.js    CLI: assign a college to an explicit user-ID list
│   │   └── migrate-academic-levels.js CLI: backfill academicLevel
│   │
│   └── tests/                   18 files, all `node --test`
│       ├── forum.test.js                 Core API: auth, CRUD, votes, accept, permissions
│       ├── account.test.js               Export allow-list, deletion, tombstone
│       ├── academics.test.js             Level parsing, filters, legacy compatibility, migration
│       ├── components.test.js            React under jsdom: toolbar, tablist ARIA, validation attrs
│       ├── database-errors.test.js       connectionErrorCode categorisation
│       ├── editor.test.js                applyTool selection maths, block tools, tab keys
│       ├── email.test.js                 Token hash/expiry/replay, generic responses, test-recipient mode
│       ├── google-auth.test.js           Token verification, linking, collision handling
│       ├── institutions.test.js          Catalogue permissions, scopes, forged input, migration
│       ├── markdown.test.js              Rendering + 13 XSS payloads parsed and asserted
│       ├── navigation.test.js            safeReturn open-redirect cases
│       ├── notifications.test.js         Events, self-suppression, idempotency, privacy
│       ├── production-hardening.test.js  Headers, no-store, invalid JSON, auth errors
│       ├── rate-limits.test.js           Transport, shared counters, 429, buckets, outage 503
│       ├── study-library.test.js         Deterministic import, idempotency
│       ├── subjects.test.js              Seeding, aliases, canonical resolution
│       ├── tabs.test.js                  Key destination maths
│       └── theme.test.js                 Preference resolution, blocked storage, contrast pairs
│
├── scripts/
│   ├── setup-local.js           Creates server/.env with a random 48-byte secret, if absent
│   ├── check-production.js      Read-only live probe: 4 paths, headers, health payload
│   ├── live-smoke.js            Full write flow against an authorised deployment
│   ├── live-upload-smoke.js     Real Cloudinary upload/delete/attach/cleanup flow
│   ├── package-source.js        Builds a clean source ZIP, excluding secrets and build output
│   └── improve-p0.cjs           One-off codemod used during the P0 usability pass
│
├── .github/
│   ├── workflows/ci.yml         Test matrix (Node 22/24 + mongo:7 service) and audit job
│   └── dependabot.yml           Weekly grouped npm, monthly actions
│
└── docs/
    ├── DOUBT_FORUM_A_TO_Z_PLAYBOOK.md   The user/operator guide
    ├── BUILD_FROM_SCRATCH_PLAYBOOK.md   ← this document
    ├── FEATURE_SPECIFICATION.md         ← the companion
    ├── API.md                           Endpoint reference
    ├── TESTING.md                       Dated verification record
    ├── TESTER_PLAYBOOK.md               161-case manual QA checklist
    ├── PRODUCTION_READINESS_REVIEW.md   Launch gates
    ├── CONTINUE_HERE.md                 Current handoff
    ├── UI_UX_IMPROVEMENT_PLAN.md        The UX audit
    ├── QA_RESULTS.md / QA_SUMMARY.md / QA_BUG_REPORT.md / QA_REVIEW_RUN01.md
    ├── GO_LIVE_HINGLISH.md / VERCEL_HINGLISH.md / ADMIN_HINGLISH.md / OWNER_NEXT_STEPS_HINGLISH.md
    └── *_CHANGE_RECORD.md               One per feature: what changed, how verified, what is NOT verified
```

### The change-record convention — copy this

Every non-trivial feature got a `docs/<FEATURE>_CHANGE_RECORD.md` with four fixed sections:

1. **The problem this solves** — in user terms, not technical terms
2. **What changed** — file by file, with the reasoning for non-obvious choices
3. **Verification** — the exact test count, what the new tests actually assert, what was measured
4. **Not verified** — written as plainly as the successes

That fourth section is the reason the project's claims are trustworthy. It is where "nothing here has been opened in a real browser" and "this is a REST contract fake, not a real Redis concurrency test" live. Without it, a green test run quietly becomes a claim of working software.

## 8 Workspace wiring: the three package.json files

**Root** — the only place you run commands from.

```json
{
  "name": "student-doubt-forum",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "workspaces": ["client", "server"],
  "scripts": {
    "dev:client": "npm run dev --workspace client",
    "dev:server": "npm run dev --workspace server",
    "build": "npm run build --workspace client",
    "start": "npm start --workspace server",
    "test": "node --test --test-reporter=spec server/tests/*.test.js",
    "check:production": "node scripts/check-production.js"
  },
  "devDependencies": { "esbuild": "^0.28.2", "jsdom": "^31.0.0" }
}
```

Two details that matter:

- `--test-reporter=spec` is not cosmetic. Node 22 switches to TAP output when its stdout is piped, which left the CI failure annotation empty. Pinning the reporter fixed it.
- One `package-lock.json` at the root covers all three workspaces. `npm ci` installs the exact locked tree; `npm install` may not.

**`server/package.json`** — `dev` is `node --watch src/server.js`. No nodemon needed.

**`client/package.json`** — `dev` is `vite --host 127.0.0.1`. Binding to the loopback address explicitly, rather than `localhost`, avoids IPv4/IPv6 resolution surprises on Windows.

## 9 First local run

```powershell
git clone https://github.com/Raju-ol/student-doubt-forum.git
cd student-doubt-forum
npm ci
node scripts/setup-local.js
```

`setup-local.js` is eight lines and does exactly one careful thing:

```js
if (!existsSync('server/.env')) {
  writeFileSync('server/.env',
    `PORT=5000\nMONGO_URI=mongodb://127.0.0.1:27017/student_doubt_forum\n` +
    `JWT_SECRET=${randomBytes(48).toString('hex')}\nCLIENT_URL=http://127.0.0.1:5173\n`);
  console.log('Created private local configuration. Existing MongoDB service must be running.');
} else console.log('Existing private configuration preserved.');
```

It generates the secret without printing it, and it never overwrites an existing file. If you write your own, keep both properties.

To generate a secret by hand:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

**Development mode** — two terminals, from the root:

```powershell
npm run dev:server    # Express on 5000, node --watch
npm run dev:client    # Vite on 5173, proxying /api to 5000
```

Open `http://127.0.0.1:5173`.

**Built demo mode** — one terminal:

```powershell
npm run build
npm start
```

Open `http://127.0.0.1:5000`. Here Express itself serves `client/dist`, because `createApp()` defaults to `serveClient: true` and the dist folder exists. This is the mode `Start Application.cmd` uses, and the mode `render.yaml` would use.

**Verification:**

```powershell
npm test                 # needs local MongoDB; creates and drops its own forum_test_* database
npm run build
npm audit --omit=dev
```

**Local data and live data are completely separate.** A local admin promotion does not make you an admin on the website. Local MongoDB and Atlas are different databases. Setting a variable in Vercel does not change your laptop's `.env`, and vice versa.

---

# Part III — Build the software

## 10 The build order that worked: thirteen phases

This is the real sequence, with the commit references that make it traceable. If you are building this from scratch, build in this order — each phase depends on the ones before it, and several phases exist only because an earlier phase was measured and found wanting.

---

### Phase 1 — Base forum · `bcee01a`

**Goal:** a working forum with no external services except MongoDB.

**Build, in this order:**

1. `server/src/validation.js` — write this *first*. Every route depends on it, and it is the only place a length or range limit should appear.
2. `server/src/models.js` — User, Doubt, Answer, Vote, Comment, Report, Upload.
3. `server/src/database.js` — connect + config validation.
4. `server/src/auth.js` — `tokenFor`, `identify`, `requireUser`, `requireAdmin`, `owns`, `safeUser`.
5. `server/src/forum.js` — `findDoc`, `decorate`, `toggleVote`, `toggleAcceptance`, `removeAnswer`, `removeDoubt`.
6. `server/src/app.js` — wire routes in the order given in §13.
7. `client/src/api.js`, `context.jsx`, then `components.jsx`, then `pages.jsx`.
8. `server/tests/forum.test.js` — the single most valuable file in the repo.

**What this phase gets right from the start:** `safeUser()` as the *only* way a user object is serialised to a client. `passwordHash` is `select: false` on the schema, and `safeUser` has an explicit field list. Two independent layers, so forgetting one does not leak a hash.

**Verified:** 26 integration subtests passing against an isolated database; production build passing; browser walkthrough with two separate student sessions.

---

### Phase 2 — Deploy to Vercel · `be4ca52`, `0a4eccc`, `b6df8c6`

**Goal:** one public HTTPS origin serving both the app and the API.

**Steps:** write `api/index.js` and `vercel.json` (§20–21), import the repo into Vercel, set `MONGO_URI` and `JWT_SECRET`, redeploy.

**What went wrong, and this is the most instructive failure in the project:** the deployment went **Ready**, the frontend rendered perfectly, and `/api/v1/health` returned **HTTP 503**. Later, health intermittently returned 200 while `/api/v1/doubts` returned 500.

**The three fixes:**

- `0a4eccc` added `connectionErrorCode()` — a categoriser that maps a driver error to one of seven safe codes (`DATABASE_AUTH_FAILED`, `DATABASE_PERMISSION_DENIED`, `DATABASE_NETWORK_UNAVAILABLE`, …) with no credentials in the response. Without this you are guessing.
- `b6df8c6` set `dbName: 'student_doubt_forum'` explicitly in the connect options, because a copied Atlas URI ending in `/` selects the default database — which the scoped `readWrite` grant does not cover.
- The same commit made the connection manager **disconnect and reset on initialisation failure**, so a half-initialised connection can never be mistaken for a working one.

**The lesson, stated plainly:** a Ready build proves the build succeeded. It proves nothing about the application. Always have a health endpoint and always check it.

---

### Phase 3 — Indexes, CI and feed batching · `a8a9975`, `717b2fe`, `938695a`

Driven by an audit (`RECOMMENDATIONS.md`) that found the feed issued roughly 60 database queries per page load.

**Nine indexes added** to `models.js` — see §12 for the full table. They build automatically via the existing `model.init()` call in `database.js`; no migration script.

**One deviation from the audit, worth understanding:** the audit said the plain `{createdAt: -1}` index on Doubt had become redundant now that compound indexes existed. It has not. The unfiltered feed sorts by `createdAt` with *no filter field*, and a compound index whose first key is `subject` cannot serve that query. It was kept, with a comment explaining why. **Check an audit's reasoning against the actual query, every time.**

**`decorateMany()`** replaced per-item queries with two grouped aggregations. The trick that makes it work:

```js
const mine = user?._id
  ? { $sum: { $cond: [{ $eq: ['$user', user._id] }, '$value', 0] } }
  : { $sum: 0 };
```

The unique index on `{targetType, target, user}` guarantees at most one vote per user per target — so *summing* the viewer's own value yields exactly their single vote, in the same aggregation that computes the total. No second query.

**Measured, with MongoDB command monitoring on a seeded local database:**

| Route | Before | After |
|---|---|---|
| `GET /doubts?limit=12` | 28 | 6 |
| `GET /doubts/:id` (2 answers) | 13 | 10 |
| `GET /users/:id` | 32 | 10 |

And the number stopped growing with page size: 6 queries at `limit=5`, `limit=10` and `limit=30` alike, where the old code would have issued about 64 at `limit=30`.

**CI added** in the same phase: `.github/workflows/ci.yml` with a `mongo:7` service container, plus `.github/dependabot.yml`. Verified with `explain('queryPlanner')` showing `IXSCAN` rather than `COLLSCAN` for all eight target queries.

---

### Phase 4 — Markdown, code and maths · `6bcd2ae` … `c2c1884`

The audit's "highest-value single feature". Before this, every body rendered as `<p className="prose">{body}</p>` with `white-space: pre-wrap`. For engineering students that meant a Java snippet lost its indentation, no equation could be typed at all, and students photographed their code and uploaded it as an image — costing Cloudinary credits, unsearchable, invisible to screen readers.

**Nothing was migrated.** Bodies are still stored exactly as typed. Plain text is valid Markdown, so every existing post renders as it did.

**The pipeline, and the order is the security property:**

```
marked (gfm, breaks) → KaTeX → highlight.js → DOMPurify (allow-list)
```

**Six specific decisions inside it:**

| Decision | Reason |
|---|---|
| `breaks: true` | A single newline stays a line break — exactly what `pre-wrap` gave before, so no post changes appearance |
| Headings clamped to `h3`/`h4` | A body sits inside the page's own heading outline; an `h1` in a post breaks the document structure |
| Thirteen languages hand-registered | Importing all of highlight.js adds roughly a megabyte for languages this audience never uses. An unknown language is HTML-escaped, not dropped |
| KaTeX over MathJax | Size, and synchronous rendering. `throwOnError: false` so bad maths does not break the post |
| `<img>` **not** in the allow-list | Screenshots go through the Cloudinary flow, which checks ownership and file signatures. Arbitrary remote images do not |
| The `html()` renderer escapes raw HTML | A user's raw HTML must not inherit the inline styles KaTeX needs; a positioned span could otherwise cover the app's own controls |

Surviving links get `rel="nofollow noopener noreferrer"` and `target="_blank"` via a DOMPurify `afterSanitizeAttributes` hook.

**The bundle problem and its fix.** marked + KaTeX + highlight.js is about 130 KB gzipped. Putting them in the main bundle took it from 93.11 KB to 226.10 KB gzipped — unacceptable for students on poor mobile data. So the renderer is dynamically imported through `markdown-view.js`, which also carries the KaTeX and highlight.js stylesheets (kept out of `markdown.js` so that file stays importable from Node for the tests, where a CSS import would throw).

| Chunk | gzipped |
|---|---|
| Main bundle, before | 93.11 KB |
| Main bundle, after | 95.05 KB |
| Markdown chunk, on demand | 130.61 KB |

The feed and sign-in screens never load it. While the chunk is in flight the body renders as plain React-escaped text — readable on a slow connection, never unsafe.

**The CI saga, which is worth reading twice.** The first run on `6bcd2ae` failed on Linux while every test passed on the laptop. Diagnosing it took four more commits, and two of those made things worse:

| Commit | What happened |
|---|---|
| `ac5749b` | Tried to surface failures as GitHub annotations. A literal newline slipped into a quoted shell string, making the workflow invalid YAML — **no jobs ran at all** |
| `17958ee` | Fixed the YAML, but piped `npm test` into `tee` without `pipefail`, which the default `run` shell does not set. The run reported **green while the suite was failing**. A false pass |
| `aff0686` | Added `shell: bash` to restore `pipefail`. The run then failed honestly |
| `c262778` | Fixed the actual cause: jsdom 31 requires Node 22.22.2+, CI pinned 22.12. Switched to a `['22','24']` latest-patch matrix and pinned `--test-reporter=spec` |

**Two permanent lessons:** a green CI run is only evidence if the pipeline cannot swallow a failure — add `shell: bash` wherever you pipe. And a test that passes locally and fails in CI is usually an environment floor, not a flaky test.

**Verified:** 59 passes. `markdown.test.js` checks thirteen injection payloads — `<script>`, `onerror`, `<svg/onload>`, `<iframe>`, `javascript:` links, `<form>`/`<input>`, `<style>`, `<object>`, a MathML-wrapped script, a base64 `data:text/html` link — by **parsing the sanitised output** and asserting no element carries an event-handler attribute or a dangerous URL. String matching would have produced false failures on inert text.

**One browser bug this phase produced:** a global `textarea` display rule overrode the browser's `hidden` attribute, so Preview showed the rendered output *and* the source editor. Fixed with an explicit `textarea[hidden]` rule, keeping the draft mounted so switching tabs never loses the caret.

---

### Phase 5 — Reputation, sessions, search, pooling · `f38928b`, `338dd21`, `805aac1`, `eba77a5`

Four independent correctness and cost fixes.

**Materialised reputation.** Profiles read a stored `User.reputation` instead of pulling every answer vote into Node. Signup sets it to `0`. Legacy accounts use `null`/missing as an explicit backfill marker and initialise lazily on first read or change, which preserves existing points without any deployment-time migration. Vote add/remove/switch applies the *difference* in credits with an atomic `$inc`. Compare-and-set vote updates reject conflicts rather than awarding credit for a mutation that did not happen:

```js
const result = nextValue === 0
  ? await Vote.deleteOne({ _id: previous._id, value: previous.value })
  : await Vote.updateOne({ _id: previous._id, value: previous.value }, { value: nextValue });
if (!(result.deletedCount || result.modifiedCount)) fail(409, 'Your vote changed in another request. Please retry.');
```

Answer deletion reverses credits **only for the request that actually removes the answer** (`findOneAndDelete` returning a document is the proof).

**Session revocation.** `User.tokenVersion`, a `ver` claim in the JWT, compared on every request. `POST /auth/logout-all` increments it. Copied current tokens and legacy tokens with no `ver` both stop working — legacy tokens are compatible at version zero only. No migration needed, because a missing field reads as zero.

**Indexed text search.** Replaced a bounded case-insensitive regex — which cannot use an index and collapses at scale — with a weighted MongoDB text index: title 10, tags 5, body 1. Ordered by `textScore`, with `createdAt` and `_id` tie-breaks.

> **This is a behaviour change you must tell users about.** Words and English stemmed forms match; partial substrings no longer necessarily do. `normalize` and `normalizing` match each other; `normali` matches neither. MongoDB text grammar applies — quoted phrases, excluded terms. English stop words may return nothing. Tags became searchable. The UI gained the line: *"Search whole words in questions and tags. Related English word forms can also match."*

**Connection pool.** `maxPoolSize` from 5 to 2. Each warm serverless instance opens at most two pooled connections, reducing per-instance pressure on an Atlas free tier. This caps connections *per instance*, not the number of instances.

---

### Phase 6 — Shared rate limiting · `cc6e722`

Per-process memory counters are meaningless across a dozen serverless instances. Upstash Redis over REST became the shared store.

**The bucket design:**

| Scope | Limit | Keyed by |
|---|---|---|
| `api` | 600 / 15 min | IP subnet |
| `auth` | 30 / 15 min | IP subnet |
| `auth-email` | 30 / 15 min | Normalised email |
| `content-write` | 120 / 15 min | Account |
| `content-create` | 60 / 60 min | Account |
| `upload` | 15 / 60 min | Account |
| `email-action-ip` | 10 / 60 min | IP |
| `email-action-address` | 3 / 60 min | Normalised email |
| `verification-user` | 3 / 60 min | Account |
| `export` | 3 / 60 min | Account |
| `account-delete` | 5 / 60 min | Account |
| `study-library-import` | 5 / 15 min | Account |

**Three implementation details worth stealing:**

1. **Keys are HMAC-SHA256 of the identity, using the app's signing secret.** No raw IP, email address or token ever becomes a Redis key name. These are pseudonymous counters — not anonymised data, but a real reduction in what a Redis dump exposes.

2. **The REST transport is locked down before it is used.** `redisCommand()` rejects the endpoint unless it is `https:`, with no username, password, query string, fragment, or path other than `/`. Requests use a bearer header, a 3-second `AbortSignal.timeout`, and `redirect: 'error'`.

3. **It fails closed.** `ProtectedRedisStore` wraps `increment()` and converts any error to a 503. `passOnStoreError: false`. If Redis is configured-but-broken, or deployed-but-unconfigured, protected routes return 503 rather than silently running unprotected. `factory.mode` reports `redis`, `memory` or `unavailable`, and `/health` surfaces it.

**One subtlety:** all limiter scopes load the same Lua scripts. Simultaneous `SCRIPT LOAD` calls are deduplicated through a `Map`, and a genuine `NOSCRIPT` reply is re-thrown unchanged so the library's own reload-and-retry can fire. Everything else becomes the safe 503.

**Verified:** 65 passes, including two app instances sharing a counter, 429 with `Retry-After`, separate buckets, expiry, NOSCRIPT reload, outage 503, and mode selection. Stated limit in the change record: *"Shared-counter tests use a REST contract fake; they are not a real Redis concurrency/load test."*

---

### Phase 7 — Email tokens and account data rights · `777e754`, `df619e1`

**Email tokens.** 32 random bytes, hex, stored **only** as a SHA-256 hash in `select: false` user fields. Verification expires in 24 hours, reset in 30 minutes. Reissuing replaces the previous link. A successful reset increments `tokenVersion`, revoking every session.

**Four decisions in the token design:**

| Decision | Reason |
|---|---|
| The token travels in the URL **fragment** (`link.hash = token`) | A fragment is not sent to the server in a normal navigation and does not appear in referrer headers |
| Links are built from an operator-controlled `APP_URL`, never an incoming `Host` header | A Host-header-derived link is a password-reset poisoning vector |
| Consumption requires a button press, not page load | Corporate link scanners and mail previews would otherwise burn the one-time token |
| The UI clears the fragment from history after success | `window.history.replaceState(null, '', location.pathname)` |

`/auth/forgot-password` returns **the same generic body** for a valid account, an unknown address, a banned user, a Google-only account and a delivery failure. The change record is honest about the limit: *"Generic response bodies do not guarantee constant timing."*

**Two flags, not one** (`email-policy.js`):

```js
export const verificationRequired = () =>
  process.env.EMAIL_ENABLED === '1' || process.env.EMAIL_VERIFICATION_REQUIRED === '1';
export const recoveryEnabled = () =>
  verificationRequired() || process.env.EMAIL_RECOVERY_ENABLED === '1';
```

This exists so password recovery can launch *without* making verification mandatory for every existing student's next post. The legacy `EMAIL_ENABLED` still turns on both. **Shipping a feature flag that can be half-enabled is often the difference between a usable rollout and stranding your users.**

**Account export.** `GET /users/me/export` streams NDJSON with an **explicit allow-list** — never a `.toObject()` dump. No password hash, no token version, no recovery hashes. It uses MongoDB cursors with real backpressure handling:

```js
if (!res.write(JSON.stringify({ type, data }) + '\n'))
  await new Promise(resolve => {
    const done = () => { res.off('drain', done); res.off('close', done); resolve(); };
    res.once('drain', done); res.once('close', done);
  });
```

**Account deletion.** Requires the current password (or a matching linked Google credential) *and* the literal string `DELETE`. Then, in this order:

1. Delete every owned Cloudinary image, pulling its reference out of any question. A provider failure **stops here with a 503** and leaves the account usable so the user can retry.
2. One atomic `findOneAndUpdate` replaces name and email with anonymous unusable values, writes an unusable random password hash, clears recovery fields and the Google link, bans access, and increments `tokenVersion`.

This is an **anonymous tombstone, not a row deletion**. Questions, answers, comments and votes stay attached to "Deleted user" so other people's threads and reputation are not corrupted. The UI says exactly that, and tells the user to edit personal details out of their post text first.

---

### Phase 8 — Usability, catalogues, notifications, theme · `5ba002f` … `bc1733d`

The largest phase. Five features, driven by the UX audit.

**In-app notifications.** Three event types; the unique `eventKey` is the whole design:

```js
await Notification.updateOne({ eventKey },
  { $setOnInsert: { user, actor, type, target, eventKey } }, { upsert: true });
```

`answer:<id>`, `comment:<id>`, `accepted:<id>` — so re-accepting the same answer cannot notify twice. Self-actions are skipped; banned and deleted recipients are skipped. The actor projection is `'name'` only, never email. The bell polls once a minute **while the page is visible**, on navigation, and after any read-state change.

**Optional academic levels.** `{system, index, label}` where system is `semester|year|grade|other`, numbered systems take 1–30, `other` takes a 1–60 character label. The server derives numbered labels, ignores unknown nested fields, and accepts explicit `null` to clear. Crucially, a `semester` system with index ≤ 8 **also mirrors the legacy `semester` field**, so old filters keep working:

```js
return { academicLevel: level,
         semester: level.system === 'semester' && level.index <= 8 ? level.index : undefined };
```

**Subject catalogue.** Thirty subjects moved out of a hard-coded client array into a `Subject` collection, seeded idempotently with `$setOnInsert` on first catalogue use. Names and aliases normalise through:

```js
const subjectKey = value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
```

…into a unique multikey `keys` index, so an alias cannot be claimed by two subjects. Unknown free-text subjects from older posts stay readable and filterable.

**Colleges and feed scopes.** Three scopes: `college` (default for members with a selection), `subject` (worldwide, requires a subject), `all` (default for anonymous). A question inherits the poster's college unless `institution: null` is sent explicitly. **Scopes are discovery filters, not access controls** — every post is public by direct link, and the code and the UI both say so. `isVerified` is always `false` on creation and a client-supplied flag is ignored.

**Theme.** All 104 hard-coded colour usages were centralised into `styles/variables.css` with surface/ink/edge/shadow roles that have separate dark values — so that, for instance, white button text does not become a dark background colour. A self-hosted `public/theme-init.js` resolves the theme before first paint without needing an inline-script CSP exception, and a CSS `prefers-color-scheme` block covers the case where that script does not run. On 10 November the dropdown was replaced with one click-to-cycle button (System → Light → Dark) with a sliding indicator; the accessible name reports both the current and the next mode, and the animation respects `prefers-reduced-motion`.

**Accessible tabs.** `tabs.js` holds the pure key maths; `tab-list.jsx` holds the roving-tabindex component. Profile and Admin both use it. Arrow keys wrap, Home/End jump, `aria-selected` drives the styling rather than `aria-pressed`. The Markdown editor keeps its own tab implementation.

---

### Phase 9 — Production hardening · `e90eb0b`, `3af40f0`

Five fixes from a security and reliability review.

| Fix | Why |
|---|---|
| CSP and security headers in `vercel.json` | Helmet only covers responses Express produces. Vercel serves the static HTML directly, which was therefore header-less |
| `Cache-Control: private, no-store, max-age=0` on every `/api` response | Set in Express middleware *and* in `vercel.json`, so it holds on both paths |
| Raw HTML in post bodies escaped | A positioned span with KaTeX's inline styles could cover the application's own controls |
| Connection manager caches only the in-flight attempt | A resolved promise masked a later disconnect in a warm instance |
| Transient auth-lookup errors return 503, not 401 | Telling a user "please sign in again" because the database blinked is wrong and loses their session |

**The CI catch worth noting:** the first `e90eb0b` CI run failed because the `vercel.json` that had been tested locally was never staged into the commit. CI caught a file left out of a commit — which is one of the quieter reasons to have CI at all.

---

### Phase 10 — Google sign-in · `b661c04`, `a2ef2e7`, `63dfc3d`

**The server side** verifies the ID token with `google-auth-library` against `GOOGLE_CLIENT_ID` as the audience, and then requires `claims.email_verified === true`. It computes `authoritativeEmail` — true for `@gmail.com` addresses and for anything with a Workspace `hd` claim — and only then marks the forum email verified.

**Account collision is handled explicitly, not magically.** A Google sign-in for an email that already has a password account does **not** silently merge. It returns:

> *An account already uses this email. Sign in with your password and link Google from Account settings.*

Linking requires the current forum password **and** a Google credential whose email matches. The link write is a conditional `findOneAndUpdate` that will not fire if the account changed underneath, and an 11000 duplicate key is translated to a clear 409.

**Concurrent Google signups** are handled by catching 11000 and re-reading by `googleSubject`, because two simultaneous first-time sign-ins can race.

**Two UI bugs this phase produced, both instructive:**

| Bug | Cause | Fix |
|---|---|---|
| `origin_mismatch` | Google's Authorized JavaScript origins had the stable `-theta.vercel.app` domain, but testing used Vercel's long per-deployment URL — a different origin | Always test Google sign-in on the stable production domain |
| A white button frame on a dark background | Google's iframe renders its own canvas | A `MutationObserver` on `document.documentElement`'s `data-theme` re-renders the button with Google's `outline_dark` theme, and a `ResizeObserver` re-renders it at the right width. Both only re-render when width or theme actually changed |

The GSI script loader has a 10-second timeout, removes the script element on failure, and clears the cached promise so a retry can work.

---

### Phase 11 — Gmail rollout · `08e6d81`, `7200686`, `119ed4f`

Resend's onboarding sender (`onboarding@resend.dev`) can only deliver to the email on the Resend account. Fine for an owner-only test, useless for friends. Without a purchased domain, Gmail SMTP became the beta path.

`sendTransactionalEmail` became provider-switched on `EMAIL_PROVIDER`:

- **gmail** — `smtp.gmail.com:465`, `secure: true`, the 16-character App Password with grouping spaces stripped, and all four nodemailer timeouts set (dns/connection/greeting 5 s, socket 10 s). Error codes map to specific diagnostics: `EAUTH` → `gmail_auth_rejected`; `ETIMEDOUT`/`ECONNECTION`/`ESOCKET`/`EDNS`/`ECONNREFUSED`/`ENOTFOUND` → `gmail_connection_failed`.
- **resend** — HTTPS POST to a fixed endpoint, bearer header, 8-second timeout, `redirect: 'error'`.

**The diagnostic-code pattern is the useful part here.** The HTTP response stays generic, but the server logs a short safe code. The operator reads it from Vercel's logs and knows exactly what to fix — without any inbox screenshot, env value or raw log being shared:

| Code | Meaning |
|---|---|
| `recipient_not_enabled` | Single-recipient test mode is on and this address differs |
| `no_password_account` | No eligible password account for that address |
| `gmail_config_missing_or_invalid` | Sender or App Password missing, or not 16 chars after stripping spaces |
| `gmail_auth_rejected` | Gmail refused SMTP sign-in |
| `gmail_connection_failed` | Network, DNS or timeout |
| `gmail_send_failed` | Transport failed mid-send |
| `app_url_invalid` | Link base invalid, or not HTTPS in production |
| `provider_accepted` | The provider accepted it. Inbox placement can still differ |

Logs in this phase also exposed a real Redis startup error, which is what prompted the shared `SCRIPT LOAD` deduplication, and a proxy-trust correction in the Vercel adapter.

---

### Phase 12 — Study Library · `517e378`

The demo needed enough content to exercise discovery across subjects. 200 distinct prompts were written, and a separate AI agent wrote 200 explanations. The import publishes them once, as a labelled batch.

**The whole design is "safe to run twice":**

```js
const idFor = key => new mongoose.Types.ObjectId(
  createHash('sha256').update(`${batch}:${key}`).digest('hex').slice(0, 24));
```

Deterministic ObjectIds from a hash of `study-library-v1:<key>`. Every write is `$setOnInsert` + `upsert`. So an interrupted or concurrent import inserts the missing rows and touches nothing else. A completion record in a `study_library_imports` collection makes the status readable without counting documents.

**Four more guardrails:**

- **Answers are seeded before their questions.** No visitor can ever see a library question with no answer.
- Two demo authors — "Study Library (Demo)" and "AI Study Assistant (Demo)" — are created with `isBanned: true` and `@doubt-forum.invalid` emails, so they cannot sign in.
- Every question body ends with a labelled blockquote: *"This is a sample question from the Doubt Forum study library."* Every answer ends with: *"AI-generated study example. Verify important details with your course material."*
- `libraryItems()` validates every row on load — duplicate ids, duplicate titles, length bounds, and a question/answer count mismatch all throw before anything is written.

The route requires `confirm: 'study-library-v1'` in the body. There is **no live AI request** anywhere in the running application.

---

### Phase 13 — Explore performance and theme polish · `b58acb2`, `827e8df`

**Native dropdown options rendered white on dark.** Fixed by applying the theme's surface and text colours to `option` elements, verified against live computed styles.

**Two catalogue requests became one.** `GET /catalog` returns subjects and institutions together; `/subjects` and `/institutions` are retained for targeted refreshes and existing clients. The client caches the in-flight promise in a `useRef` so React StrictMode's double-invoke does not double-fetch.

**The reverted optimisation, and this is the most valuable paragraph in this section.** A feed aggregation was written to replace the existing `find` + `countDocuments` pair. It benchmarked **slower** on the live deployment and was rolled back to the previous query.

`Server-Timing` headers were then added to find out where the time actually went:

```
db-ready;dur=…      database initialisation
rate-limit;dur=…    limiter round trip
feed-db;dur=…       the feed query itself
```

One measured cold request: **6.7 s in `db-ready`**, 0.6 s in `feed-db`, ~9.4 s wall. Warm catalogue and filtered feed: **1.1–1.3 s** end to end. Requests entered via Mumbai while the function executed in Virginia.

**The query was never the bottleneck.** MongoDB *readiness* was. Measure before optimising, and be willing to revert an optimisation that benchmarks worse in the place that matters.

---

## 11 The data model in full

Eleven collections. Every one has `timestamps: true`. Mongoose pluralises: `users`, `doubts`, `answers`, `votes`, `comments`, `reports`, `uploads`, `notifications`, `subjects`, `institutions`, plus the plain `study_library_imports` collection written directly through the driver.

Two shared sub-schemas:

```js
const image = new Schema({ url: String, publicId: String }, { _id: false });

const academicLevel = new Schema({
  system: { type: String, enum: ['semester','year','grade','other'], required: true },
  index:  { type: Number, min: 1, max: 30 },
  label:  { type: String, maxlength: 60, required: true }
}, { _id: false });
```

### `users`

| Field | Type | Notes |
|---|---|---|
| `name` | String, required, max 60 | |
| `email` | String, required, unique, lowercase | |
| `passwordHash` | String, **`select: false`** | Absent for Google-only accounts |
| `googleSubject` | String, unique, sparse, **`select: false`** | Google's stable `sub` claim |
| `role` | `student` \| `teacher` \| `admin`, default `student` | Public signup can only ever create `student` |
| `semester` | Number 1–8 | Legacy. Mirrored from `academicLevel` when applicable |
| `academicLevel` | sub-schema, `default: undefined` | `undefined` means "never set"; `null` means "explicitly cleared" |
| `institution` | ref Institution, optional | Self-reported |
| `reputation` | Number, **default `null`** | `null` is the lazy-backfill marker |
| `tokenVersion` | Number, default 0, min 0 | Session revocation |
| `emailVerifiedAt` | Date, default null | |
| `verificationHash` / `verificationExpires` | String / Date, `select: false` | SHA-256 of the token |
| `resetHash` / `resetExpires` | String / Date, `select: false` | SHA-256 of the token |
| `isBanned` | Boolean, default false | |
| `isDeleted` / `deletedAt` | Boolean / Date | Tombstone marker |

### `doubts`

| Field | Type | Notes |
|---|---|---|
| `title` | String, required, max 160 | Validated 10–160 |
| `body` | String, required, max 12000 | Raw Markdown, validated 20–12000 |
| `subject` | String, required, max 60 | Canonical **name**, kept for legacy readability |
| `subjectId` | ref Subject, optional | Set when the name resolves to the catalogue |
| `institution` | ref Institution, optional | Inherited from author at creation; preserved on edit |
| `semester` | Number 1–8 | Legacy mirror |
| `academicLevel` | sub-schema | |
| `tags` | [String max 24] | Max 5, lowercased, de-duplicated |
| `images` | [image] | Max 3, denormalised from Upload |
| `author` | ref User, required | |
| `acceptedAnswer` | ref Answer, optional | **One** pointer — this is what makes "one accepted answer" structural |

### The rest

| Collection | Fields |
|---|---|
| `answers` | `doubt` ref, `body` (10–12000), `author` ref |
| `comments` | `answer` ref, `body` (2–1000), `author` ref |
| `votes` | `targetType` (`doubt`\|`answer`), `target` ObjectId, `user` ref, `value` (`-1`\|`1`) |
| `reports` | `targetType`, `target`, `reason` (5–1000), `reporter` ref, `status` (`pending`\|`dismissed`\|`removed`) |
| `uploads` | `publicId` unique required, `url` required, `owner` ref, `doubt` ref optional — `null` means unattached |
| `notifications` | `user`, `actor`, `type` (`question_answered`\|`answer_accepted`\|`answer_commented`), `target` ref Doubt, `readAt`, **`eventKey` required unique** |
| `subjects` | `name`, `slug` unique, `aliases[]`, **`keys[]` unique multikey**, `field`, `icon` (max 8 chars) |
| `institutions` | `name` (max 140), `slug` unique, `country` (2 chars), `isVerified` default false |

### Four modelling choices to understand

**1. `undefined` and `null` mean different things.** `academicLevel: { default: undefined }` lets the code distinguish "never set" from "the user explicitly cleared it", and `academicFields()` honours both. The same pattern on `reputation: { default: null }` is what makes lazy backfill possible without a migration.

**2. Vote totals are not stored.** They are aggregated on read. The unique vote index is the integrity guarantee, so the aggregate cannot drift. Reputation *is* stored, because it is read on pages that do not already have the votes to hand — and a reconciliation script exists precisely because stored derived values can drift.

**3. `subject` and `subjectId` both exist.** The string is the display value and the legacy path; the reference is the canonical link. A filter query matches either:

```js
{ $or: [ { subjectId: found._id },
         { subject: { $in: [found.name, ...found.aliases]
                        .map(v => new RegExp(`^${escapeRegex(v)}$`, 'i')) } } ] }
```

Note `escapeRegex` — a subject name goes into a regex, so it must be escaped. Forgetting this is a denial-of-service vector.

**4. Images are denormalised onto the Doubt.** The `Upload` record is the lifecycle and ownership record; the copy on the Doubt is what renders. One query serves the thread.

## 12 Indexes: all nineteen, and why each exists

| Collection | Index | Serves |
|---|---|---|
| doubts | `{createdAt: -1}` | The **unfiltered** feed. Not redundant — a compound index cannot serve a sort with no filter field |
| doubts | `{subject: 1, createdAt: -1}` | Subject filter |
| doubts | `{subjectId: 1, createdAt: -1}` | Canonical subject filter |
| doubts | `{institution: 1, createdAt: -1}` | College scope |
| doubts | `{semester: 1, createdAt: -1}` | Legacy semester filter |
| doubts | `{'academicLevel.system': 1, 'academicLevel.index': 1, createdAt: -1}` | Academic level filter |
| doubts | `{tags: 1, createdAt: -1}` | Tag filter |
| doubts | `{acceptedAnswer: 1, createdAt: -1}` | Solved/open filter |
| doubts | `{author: 1, createdAt: -1}` | Profile question list |
| doubts | **text** `{title, body, tags}` weights 10/5/1, name `doubt_search` | Search |
| answers | `{doubt: 1, createdAt: 1}` | Thread load |
| answers | `{author: 1, createdAt: -1}` | Profile answer list |
| comments | `{answer: 1, createdAt: 1}` | Comment load — this collection previously had **no index at all** |
| votes | `{targetType: 1, target: 1, user: 1}` **unique** | One vote per user per target. The integrity guarantee the aggregation relies on |
| reports | `{status: 1, createdAt: -1}` | Moderation queue |
| uploads | `{owner: 1, doubt: 1}` | Unused-upload count and attached-image cleanup |
| notifications | `{user: 1, createdAt: -1}` | Inbox |
| notifications | `{user: 1, readAt: 1, createdAt: -1}` | Unread count |
| subjects | `{keys: 1}` **unique**, multikey | Name-or-alias lookup, and the guarantee that two subjects cannot claim the same alias |

Plus the field-level unique indexes Mongoose creates from the schema: `users.email`, `users.googleSubject` (sparse), `uploads.publicId`, `notifications.eventKey`, `subjects.slug` and `institutions.slug`.

**The pattern:** every filterable field gets a compound index **ending in the sort key**. That is what lets one index serve both the filter and the ordering.

**How they get built.** `connectDatabase()` passes an initialiser that calls `model.init()` on every registered model:

```js
const connect = connectionManager(mongoose, () =>
  Promise.all(Object.values(mongoose.models).map(model => model.init())));
```

So indexes build on the first connection after deploy. No migration script. On a small dataset this is near-instant. **On a large production collection, build indexes explicitly in a maintenance window instead** — `model.init()` at connect time is fine here only because the data volume is small.

**One caution recorded in the change record:** a pre-existing incompatible text index is *not* dropped automatically. If a deployment already has one, inspect the index definitions before scheduling any migration.

## 13 The request pipeline, middleware by middleware

The order in `createApp()` is load-bearing. Each line is placed where it is for a reason.

```js
export function createApp({
  serveClient = true,
  sendEmail = sendTransactionalEmail,      // injectable for tests
  googleIdentity = verifyGoogleIdentity,   // injectable for tests
  trustProxy = process.env.TRUST_PROXY === '1' || process.env.VERCEL === '1'
} = {}) {
```

Those three injectable defaults are why the email and Google tests need no network and no mocking library.

| # | Middleware | Why here |
|---|---|---|
| 1 | `app.disable('x-powered-by')` | Before anything can respond |
| 2 | `if (trustProxy) app.set('trust proxy', 1)` | **Before** the limiter, which needs a correct `req.ip`. Exactly one hop — Vercel's. Trusting more hops lets a client forge its own address |
| 3 | `helmet({...})` with the CSP directives | Before routes, so every Express response carries headers |
| 4 | `cors({ origin: CLIENT_URL \|\| 'http://127.0.0.1:5173' })` | Same-origin in production makes this a safety net, not the main defence |
| 5 | `/api` → `Cache-Control: private, no-store, max-age=0` | Before handlers, so it cannot be forgotten on a route |
| 6 | `express.json({ limit: '100kb' })` | Body size cap before parsing |
| 7 | A JSON-shape guard | Rejects an array or a non-object body on write methods. Prevents prototype-shaped and array-shaped payloads reaching validators |
| 8 | `cloudinary.config(...)` | Once per app instance |
| 9 | `GET /health` — **before the limiter** | Health must answer during an outage, and must not consume quota |
| 10 | `apiLimit` (600/15min, IP) + `Server-Timing: rate-limit` | Before `identify`, so an unauthenticated flood never reaches a database lookup |
| 11 | `wrap(identify)` | Attaches `req.user` if a valid token is present. Not a gate — public routes still work |
| 12 | Content-write limiters, path-matched | Only for `POST/PUT/PATCH/DELETE` on `/doubts`, `/answers`, `/reports`, `/uploads`, `/users/me`, and only when `req.user` exists. Creation routes additionally pass `contentCreateLimit` |
| 13 | Route handlers, each wrapped in `wrap()` | `wrap = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next)` |
| 14 | `app.use('/api', …)` → 404 JSON | An unknown API path must not fall through to the SPA and return HTML |
| 15 | Static client + SPA fallback, **only if** `serveClient && existsSync(clientDist)` | Off on Vercel, where the platform serves static files |
| 16 | The error handler | Last, as Express requires |

### The error handler, and why it is shaped this way

```js
app.use((err, req, res, next) => {
  let status = err.status || 500;
  let message = status < 500 || err.expose ? err.message : 'Something went wrong. Please try again.';
  if (err.code === 11000) { status = 409; message = 'This record already exists. For signup, try a different email.'; }
  if (['CastError','ValidationError','MulterError'].includes(err.name)) {
    status = 400;
    message = err.name === 'MulterError'
      ? 'Choose one JPG, PNG or WebP image up to 3 MB.'
      : 'Please check the information you entered.';
  }
  if (err instanceof SyntaxError && 'body' in err) { status = 400; message = 'Invalid JSON request.'; }
  if (status >= 500) console.error('Request failed:', err.name, err.code || 'server_error');
  res.status(status).json({ success: false, message });
});
```

Three properties:

1. **A 5xx message is never the raw error.** Only deliberate `fail()` errors — which set `expose: true` — or 4xx statuses show their own text. Driver messages can contain connection details.
2. **Database-level errors are translated to user language.** An 11000 becomes "try a different email", not "E11000 duplicate key error collection".
3. **Logs carry the name and code, never the message or stack.** A stack can contain a query, which can contain user data.

### The response envelope

```
Success:  { success: true, data: <payload>, message: "<human sentence>" }
Error:    { success: false, message: "<human sentence>" }
```

Produced by `ok(res, data, message, status)` and consumed by exactly one client function — `api()` in `client/src/api.js`, which throws an `Error` carrying `message` and `status`. That means **every error message any user ever sees was written as a sentence by a human, on the server, in one place.** There is no `catch` block anywhere in the client inventing its own copy.

The two documented exceptions: `/users/me/export` streams NDJSON with a `Content-Disposition` header, and `/uploads` takes multipart.

## 14 Server module map: what to put where

When you add something, this table tells you which file it belongs in. Keeping to it is what stops `app.js` becoming the whole application.

| File | Owns | Add here when… |
|---|---|---|
| `validation.js` | `fail()` and every bounded primitive validator | You need a new input type or a new length rule. **Never inline a limit in a route** |
| `models.js` | Every schema, every index | You add a field or a query pattern that needs an index |
| `database.js` | Connection lifecycle, config validation, error categorisation | You add a required env var, or meet a new class of connection failure |
| `auth.js` | Token issue/verify, role guards, ownership, `safeUser` | You add a role, a guard, or a field that should be visible to clients |
| `app.js` | Route wiring, middleware order, limiter placement, error handling | You add an endpoint whose logic lives elsewhere |
| `forum.js` | Thread operations: find, decorate, vote, accept, cascade delete | You change how a post is read or removed |
| `reputation.js` | Credit values and the arithmetic | You change the scoring rules |
| `<feature>.js` | One feature: its routes, validation, helpers, migration | **Anything substantial.** Follow `notifications.js` / `subjects.js` / `institutions.js` / `study-library.js` |

### The `mount*Routes` convention

Every feature module exports a mounting function taking its dependencies as an argument:

```js
export function mountNotificationRoutes(api, { wrap, ok }) { /* … */ }
export function mountStudyLibraryRoutes(admin, { wrap, ok, limiter }) { /* … */ }
export function mountAccountRoutes(api, { limiter, wrap, ok, cloudinary, googleIdentity }) { /* … */ }
```

`app.js` then reads as a table of contents:

```js
mountEmailRoutes(api, { limiter, wrap, ok, sendEmail });
mountGoogleRoutes(api, { authLimit, wrap, ok, googleIdentity });
mountAccountRoutes(api, { limiter, wrap, ok, cloudinary, googleIdentity });
mountNotificationRoutes(api, { wrap, ok });
mountSubjectRoutes(api, { wrap, ok });
mountInstitutionRoutes(api, { wrap, ok });
```

Three benefits: the module cannot reach for a global; a test can supply a fake `ok` or a capturing `sendEmail`; and admin-only features get the already-guarded `admin` router (`api.use('/admin', requireUser, requireAdmin, admin)`) so they cannot accidentally be public.

## 15 Client module map: what to put where

| File | Owns |
|---|---|
| `api.js` | The only `fetch` in the app for API calls. Token header, JSON encode, envelope unwrap, error translation |
| `context.jsx` | Auth state, token, catalogues, the toast notice queue |
| `session.js` | Storage access that tolerates being blocked |
| `navigation.js` | `safeReturn()` — open-redirect protection |
| `main.jsx` | Routes and the error boundary |
| `pages.jsx` | Route-level screens |
| `components.jsx` | Anything reused by more than one page |
| `<feature>.jsx` | A self-contained feature screen plus its own widget |
| `<pure>.js` | Logic with **no JSX and no React** — `editor.js`, `tabs.js`, `theme.js`, `excerpt.js`, `academics.js`, `markdown.js` |

### The pure-module pattern, and why it matters most

The fiddly parts of this UI are not the components. They are the caret arithmetic when you wrap a selection in `**`, the index wrap-around when Arrow-Right is pressed on the last tab, and the three-state theme cycle. All of that lives in plain `.js` files with no React import:

```js
// editor.js
export function applyTool(value = '', start = 0, end = 0, tool) {
  const text = typeof value === 'string' ? value : '';
  const from = Math.max(0, Math.min(start, text.length));
  const to   = Math.max(from, Math.min(end, text.length));
  const selected = text.slice(from, to) || tool.sample;
  const lead = tool.block && from > 0 && text[from - 1] !== '\n' ? '\n' : '';
  const insert = lead + tool.before + selected + tool.after;
  const caretStart = from + lead.length + tool.before.length;
  return { text: text.slice(0, from) + insert + text.slice(to),
           caretStart, caretEnd: caretStart + selected.length };
}
```

That function is tested directly in Node, with no DOM and no renderer — including reversed selections, out-of-range offsets, and block tools that must start their own line. The component around it stays thin enough to be obviously correct.

### Three client patterns worth copying

**`useResource(route)`** — one hook for every read, with proper cancellation on *both* paths:

```js
useEffect(() => {
  const controller = new AbortController();
  setLoading(true); setError('');
  api(route, { token, signal: controller.signal })
    .then(result => { if (!controller.signal.aborted) setData(result); })
    .catch(err => { if (err.name !== 'AbortError') setError(err.message); })
    .finally(() => { if (!controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
}, [route, token, version]);
```

The `if (!controller.signal.aborted)` guard on the **success** branch is the part people miss. Without it, a slow response from a stale filter overwrites fresh data.

**URL as filter state.** The feed keeps every filter and the page number in `useSearchParams`. Filters are shareable, the back button works, and `useResource('/doubts?' + params.toString())` re-fetches automatically because the route string changed. No filter state in React at all.

**Lazy renderer with a safe fallback:**

```js
if (!render) return <p className="prose">{source}</p>;   // React escapes it
return <div className="prose markdown" dangerouslySetInnerHTML={{ __html: render(source) }} />;
```

While the 130 KB chunk is loading, the body is readable and escaped. It is never both unrendered and unsafe.

## 16 The repeatable recipe for adding any feature

This is the actual checklist used for each phase above. Work in this order; the order is what keeps the layers honest.

**1. Write the problem down in user terms.** Start the change record *before* the code. One paragraph: what a student cannot do today, and what they should be able to do. If you cannot write it, you do not understand the feature yet.

**2. Decide what is new data and what is derived.** Stored data needs a schema field and probably an index. Derived data needs a query. Do not store what you can aggregate cheaply; do not aggregate what you read on every page.

**3. Model it, with the legacy path intact.** Add the field. Choose `undefined` versus `null` deliberately. Add the compound index ending in your sort key. If you are replacing a field, keep the old one and mirror it (`semester` / `academicLevel`).

**4. Validate it in `validation.js`.** A new bounded type goes here, not in the route. The error message is a complete sentence the user can act on.

**5. Write the module.** `server/src/<feature>.js` with a `mount<Feature>Routes(router, deps)` export. Take `wrap`, `ok` and `limiter` as dependencies. If it needs an external provider, take the client as a dependency so tests can pass a fake.

**6. Mount it in `app.js`.** One line. Use the `admin` router if it is admin-only. Choose the limiter bucket.

**7. Add the client.** Pure logic into a `.js` file first, then the component. Read through `useResource`, write through `api()`. Never catch an error just to replace its message.

**8. Write the tests, three layers:**
- pure logic, called directly in Node;
- the API, against a real throwaway MongoDB;
- the component, via esbuild + jsdom, if there is non-trivial ARIA or keyboard behaviour.

**9. Run the whole suite and the build.** `npm test && npm run build`. Not just your new file — the point is to catch what you broke.

**10. Write the change record,** with the "Not verified" section filled in honestly.

**11. If existing data needs changing, write a migration script** with the §34 safety rails. Dry-run by default.

**12. Commit, push, watch CI, then verify live.** Record the commit, the CI run and the live check in `TESTING.md`. A Ready deploy is not a verification.

**13. Update the affected guide** and the owner checklist.

## 17 How the test harness works and how to write tests

```json
"test": "node --test --test-reporter=spec server/tests/*.test.js"
```

No framework. 18 files, three distinct styles.

### Style 1 — API integration against a real database

Tests connect to `MONGO_TEST_URI` (default `mongodb://127.0.0.1:27017`) and create a **uniquely named** `forum_test_<random>` database. At the end they assert the cleanup target name matches that pattern before dropping it.

> **This guard is the point.** A test that drops a database it did not name is one bad merge away from dropping yours. Assert the name, then drop.

These tests call `createApp()` directly and drive it over HTTP, so the real middleware stack, limiters and error handler all run. They cover hashing, normalised duplicate emails, invalid passwords and tokens, author spoofing, every permission boundary, vote transitions, acceptance, reputation arithmetic, bans against live sessions, report moderation, cascading deletes, and upload ownership.

### Style 2 — Pure unit tests

`navigation.test.js`, `tabs.test.js`, `editor.test.js`, `theme.test.js`, `database-errors.test.js`. Import the function, call it, assert. No database, no DOM. These run in milliseconds and catch the subtle bugs.

### Style 3 — React components under jsdom

`components.test.js` bundles the JSX with **esbuild inside the test process**, then renders it into jsdom. This is how the project tests ARIA and keyboard behaviour without Playwright:

- eight labelled `type="button"` toolbar buttons exist;
- the tablist has `aria-selected`, `aria-controls` and exactly one `tabIndex={0}`;
- `required` / `minLength` / `maxLength` actually reach the `<textarea>`;
- the pre-load fallback escapes HTML;
- a real `click` sequence cycles System → Light → Dark and persists;
- `Escape` on the mobile menu closes it and returns focus to the trigger.

That last one is notable: the test was written to **fail first**, against the reported bug, and then pass after the fix.

### Injecting fakes without a mocking library

`createApp()` accepts `sendEmail` and `googleIdentity`. Tests pass a capturing function, assert on what it was called with, and need no network:

```js
const sent = [];
const app = createApp({ sendEmail: async msg => { sent.push(msg); } });
// …then assert on sent[0].to and the token inside sent[0].text
```

The Redis tests do the same with a `fetchImpl` injected into `createLimiterFactory`, implementing the Upstash REST contract. The change record states the limit: *this is a contract fake, not a real concurrency test.*

### Test count history

| Milestone | Passing |
|---|---|
| Base forum | 26 |
| Vercel adapter | 27 |
| Phase 0 (indexes, CI, batching) | 29 |
| Markdown | 59 |
| Reputation | 61 |
| Search / pool / sessions | 62 |
| Rate limiting | 65 |
| Email | 66 |
| Account data | 67 |
| Notifications | 70 |
| Tabs | 72 |
| Academic levels | 73 |
| Subjects | 74 |
| Institutions / final regressions | 75 |
| Mobile Escape fix | 78 |
| Theme cycle | 77 |
| Production hardening | 86 |
| Current (10 Nov, before the final feed adjustment) | **90** |

The final focused run after the feed adjustment recorded **38** passing, and CI passed.

### Live verification scripts

Three, in increasing invasiveness. Point them only at a deployment you own.

| Script | What it does |
|---|---|
| `check-production.js` | **Read-only.** Four paths; checks status, `nosniff`, `script-src 'self'` in CSP, referrer policy, API `no-store`, and that `/health` reports `database: connected` and `rateLimitStore: redis` |
| `live-smoke.js` | Creates two labelled QA accounts; checks health, signup/login/me, anonymous-write rejection, question, second-user answer, vote, acceptance, comment, search, reputation, non-admin denial. Deletes the test discussion afterwards. Passwords are generated in memory and never printed |
| `live-upload-smoke.js` | Real Cloudinary round trip with a tiny synthetic PNG: upload, HTTP delivery, unused deletion, attachment linkage, protection of an attached image, and question deletion with remote cleanup |

**None of these is browser evidence.** They test the API. The manual checklist in `docs/TESTER_PLAYBOOK.md` covers the browser.

---

# Part IV — Ship it

## 18 Git and GitHub, including the push that failed

Create the repository on GitHub with **no** README, licence or `.gitignore` — those files already exist locally and GitHub's versions will only cause a conflict.

```powershell
git init -b main
git add .
git diff --cached --name-only      # READ THIS LIST
git check-ignore server/.env       # must print the path, proving it is ignored
git diff --cached --check           # whitespace and conflict markers
git commit -m "feat: build student doubt forum with authentication and moderation"
git remote add origin https://github.com/<owner>/student-doubt-forum.git
```

**Run `git check-ignore server/.env` every single time before a first commit.** A committed `.env` is in your history forever, and rotating every credential is the only real fix.

### The 403, and how it was actually resolved

The first push returned **403 permission denied**. The connected GitHub service account and the laptop's stored Git credential both differed from the intended repository owner.

What was *not* done: pushing to the wrong account, or deleting unrelated stored credentials.

What was done — Git Credential Manager's device flow:

```powershell
git credential-manager github login --username <owner> --device --no-ui
```

This prints a URL and a short code. Open the URL in a browser signed into the **correct** GitHub account, enter the code, authorise GCM.

> That device code is **not** an SMS OTP. It is displayed in your terminal, it is short-lived, and an expired one must be regenerated rather than retried.

Then push with the identity pinned explicitly, and verify:

```powershell
git -c credential.username=<owner> -c credential.interactive=false push -u origin main
git -c credential.username=<owner> -c credential.interactive=false ls-remote origin refs/heads/main
git rev-parse HEAD
```

Matching remote and local commit IDs is the proof the upload landed. "No error" is not proof.

### Commit reference map

| Commit | What landed |
|---|---|
| `bcee01a` | Initial working forum |
| `be4ca52` | Vercel frontend + API configuration |
| `0a4eccc` | Safe database diagnostic codes |
| `b6df8c6` | Explicit app database + initialisation retry fix |
| `938695a`, `a8a9975`, `717b2fe` | Navigation, nine indexes, CI, batched feed decoration |
| `6bcd2ae`, `ac5749b`, `17958ee`, `aff0686`, `c262778`, `c2c1884` | Markdown, and the CI repair sequence |
| `f38928b`, `338dd21`, `805aac1`, `eba77a5` | Reputation, session revocation, text search, pool size |
| `cc6e722` | Upstash shared rate limiting |
| `777e754`, `df619e1` | Email tokens, account export and deletion |
| `5ba002f`, `aaec75b`, `a161c6f`, `f50d427`, `6894467`, `bc1733d` | Notifications, academic levels, catalogues, scopes, theme cycle, mobile Escape fix |
| `e90eb0b`, `3af40f0` | Production hardening and the config follow-up |
| `b661c04`, `a2ef2e7`, `63dfc3d` | Google sign-in, stable origin, dark button |
| `08e6d81`, `7200686`, `119ed4f` | Gmail SMTP, diagnostics, Redis script dedup |
| `517e378` | Study Library |
| `b58acb2`, `827e8df` | Dropdown theming, combined catalogue, feed query restored |

## 19 MongoDB Atlas, click by click

### Cluster

Sign in → **Create** → **Free (M0)**.

> **If Free is greyed out,** the project's free-cluster allowance is already used. Check the Clusters list — there is probably an existing `Cluster0`. **Reuse it.** Do not pay, do not delete data, do not create duplicate infrastructure. That is exactly what happened here; the existing AWS Mumbai `Cluster0` was reused.

### Database user

**Database & Network Access → Database Users → Edit**.

The original user in this project had a broad `atlasAdmin` role. It was narrowed to:

| Setting | Value |
|---|---|
| Specific privilege | `readWrite` |
| Database | `student_doubt_forum` |
| Collection | *leave blank* — means all collections in that database |
| Built-in Atlas admin role | **Removed** |

Click **Update User**. The Built-in Role count should read **0 selected**.

> This is why `dbName: 'student_doubt_forum'` is hard-coded in `connectDatabase()`. A URI ending in `/` selects the default database, which this grant does **not** cover — and the result is a `DATABASE_PERMISSION_DENIED` that looks like a code bug.

### Connection string

`Cluster0` → **Connect** → **Drivers and Client Libraries** → **JavaScript / Node.js**. Copy it privately.

```
mongodb+srv://DB_USERNAME:DB_PASSWORD@CLUSTER_HOST/student_doubt_forum
```

Four rules:
- `DB_PASSWORD` is the **database user's** password, not your Atlas dashboard login.
- Keep whatever query parameters Atlas supplies.
- Percent-encode reserved characters in the credentials, using a trusted local method. **Never paste a password into an unknown online encoder.**
- Never paste the completed URI into a chat, a document, a commit or a screenshot.

### Network access

**Network Access → IP Access List**.

Initially only the laptop's IP was allowed, which is why Vercel could not connect at all. After the exposure was explained and permission given, a temporary entry was added:

| Field | Value |
|---|---|
| Access List Entry | `0.0.0.0/0` |
| Comment | `Temporary Vercel testing` |
| Temporary | **ON** |
| Duration | 6 hours initially, later 1 week for friend testing |

**What this actually means.** Any IP may *attempt* authentication. A valid database password is still required. It is not a private network, and it is not a hardened production setup.

**Three rules:**
1. Preserve the existing laptop entry; do not replace it.
2. Record the exact expiry Atlas displays, and check it before any demo. When the entry lapses, **new** connections fail — a warm existing connection does not make expiry harmless.
3. Never silently convert a temporary entry into a permanent one. Decide the long-term path explicitly. Vercel's static-IP feature or a different hosting arrangement are the alternatives to evaluate.

Friends visiting the website need no Atlas entry of their own — their browser talks to Vercel, and Vercel talks to Atlas.

## 20 Vercel, click by click

### Import

Sign in to Vercel **with the intended GitHub owner**. Import the repository.

| Setting | Value |
|---|---|
| Root Directory | `./` — the repository root |
| Framework Preset | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `client/dist` |
| Backend | `api/index.js`, detected as a Node function |

**Do not import only `client`.** After the first success Vercel suggested deploying `./client` and `./server` as separate projects. Those extra projects were not needed and were not created — the whole point of this configuration is one origin.

### Environment variables

**Project → Settings → Environment Variables.** Full table in §26.

> **The wrong page costs people an hour.** There is a separate **Environments** page for creating deployment environments, and it may show a Pro upgrade prompt. That is not where keys go. Cancel it. No paid plan is needed to add variables.

Two more gotchas:
- Key and Value are separate boxes. The key is `JWT_SECRET` — no `=`, no quotes. The value is only the secret.
- `MONGO_URI` is the **entire** URI, not just the password.
- Never prefix a server secret with `VITE_`. Anything named `VITE_*` is compiled into the public browser bundle.
- Never set `VITE_API_URL` to a localhost address in production.

### Apply with a redeploy

**Saving a variable does not change the running deployment.**

**Deployments** → the current Production row → **⋯** → **Redeploy**. Keep **Production** selected. In this project's recorded run, *Use existing Build Cache* was left unchecked. Wait for **Building** to become **Ready**.

A deployment list is a list of *versions of one project*, not separate applications. The row labelled **Production** is what the public domain serves. And **Ready** proves the build succeeded — nothing more. Run `npm run check:production` to find out whether the application works.

## 21 `vercel.json` explained line by line

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "functions": { "api/index.js": { "maxDuration": 60 } },
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; img-src 'self' data: blob: https://res.cloudinary.com; font-src 'self' data:; connect-src 'self' https://accounts.google.com/gsi/; frame-src https://accounts.google.com/gsi/; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Cross-Origin-Opener-Policy", "value": "same-origin-allow-popups" }
    ]},
    { "source": "/api/(.*)", "headers": [
      { "key": "Cache-Control", "value": "private, no-store, max-age=0" }
    ]}
  ],
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api" },
    { "source": "/:path*",     "destination": "/index.html" }
  ]
}
```

| Line | Why |
|---|---|
| `maxDuration: 60` | A cold start can spend seconds reaching MongoDB. One measured cold request took ~9.4 s wall |
| The `headers` block | **This is why it exists at all:** Helmet runs inside Express, so it only protects responses Express produces. Vercel serves `index.html` and the static assets directly, bypassing Express entirely. Without this block, the actual HTML page has no CSP |
| `script-src 'self' https://accounts.google.com/gsi/client` | No `'unsafe-inline'`. This is why `theme-init.js` is a **self-hosted external file** rather than an inline script |
| `style-src … 'unsafe-inline'` | KaTeX emits inline styles for maths positioning. This is an accepted, documented trade-off |
| `img-src 'self' data: blob: https://res.cloudinary.com` | `blob:` for local upload previews; Cloudinary for delivery. **No wildcard** — and `<img>` is not in DOMPurify's allow-list either |
| `frame-src https://accounts.google.com/gsi/` | Google's button renders in an iframe |
| `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'` | Plugin execution, clickjacking, base-tag injection, form hijacking |
| `Cross-Origin-Opener-Policy: same-origin-allow-popups` | Strict `same-origin` breaks Google's popup. This is the exact value needed, not a blanket relaxation |
| `no-store` on `/api/(.*)` | Set here **and** in Express, so neither path can leak a cached authenticated response |
| Rewrite 1 | Everything under `/api/` goes to the one function, which hands off to the Express router |
| Rewrite 2 | SPA fallback. **Order matters** — if this came first it would swallow the API |

`render.yaml` remains in the repository as an alternative blueprint for a long-running host. It is not the deployed configuration. Note that it sets `TRUST_PROXY=1`; **do not copy proxy settings between platforms** without reviewing the actual proxy chain, because trusting one hop too many lets a client forge `req.ip` and defeat the rate limiter.

## 22 Cloudinary

Sign in → **Settings → API Keys**. Copy three values.

Add them to Vercel Production **independently**:

```
CLOUDINARY_CLOUD_NAME   the cloud name only
CLOUDINARY_API_KEY      the full key
CLOUDINARY_API_SECRET   the real secret — not the asterisks shown on screen
```

> The dashboard may show a sample `CLOUDINARY_URL=...` combined value. This application reads the **three separate variables**. Copying the combined URL instead will not work.

Use the dashboard's copy control rather than revealing the secret on screen.

Then **redeploy**. In this project, upload and deletion tests passed immediately after that redeploy.

### The upload lifecycle, and the two-system deletion problem

```
1. Signed-in browser POSTs multipart `image` to /uploads
2. Rate limit: 15 per account per hour — BEFORE multipart parsing
3. 503 early if CLOUDINARY_API_SECRET is unset:
   "Image uploads are not configured yet. You can still post a text doubt."
4. multer: memory storage, fileSize 3 MB, files 1,
   fileFilter restricted to image/jpeg, image/png, image/webp
5. Signature check on the actual bytes — a renamed .exe fails here:
     JPEG  FF D8 FF
     PNG   89 50 4E 47 0D 0A 1A 0A
     WEBP  'RIFF' at 0..4 and 'WEBP' at 8..12
6. Refuse if the account already holds 9 unattached uploads
7. cloudinary.upload_stream, folder 'student-doubt-forum',
   allowed_formats [jpg,png,webp], transformation width/height 1800 crop limit
8. Create Upload {publicId, url, owner, doubt: null}
```

Attachment happens at question creation. `DELETE /uploads` only finds records with `doubt: null`, so **an attached image cannot be removed through the unused-upload route** — verified live.

Deleting a question has to delete in two systems, and the order is deliberate:

```js
for (const image of images) {
  await cloudinary.uploader.destroy(image.publicId);
  await image.deleteOne();
}
```

Remote first, then the local record. If the remote call fails, the record survives and the operation can be retried. The reverse order would orphan the file in Cloudinary with nothing left pointing at it.

**Honest limits:** no transaction spans the two systems. There is no automatic expiry job for abandoned unused uploads — the 9-upload ceiling is the only pressure valve. And a CDN may serve a cached copy briefly after deletion; a cached response is not proof that origin deletion failed.

## 23 Upstash Redis

Create a free Redis database. Copy the **REST URL** and the **REST token** — the read/write token, not the read-only one. This project used Singapore.

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel for Production (and Preview, if you use it), then redeploy.

**Four operational facts:**

1. **Production fails closed.** `NODE_ENV=production` or `VERCEL=1` means a shared store is *expected*. Missing or invalid configuration makes protected routes return 503 — it does not fall back to memory. Local development without Redis keeps the memory store, which is correct for one process.

2. **Keys are namespaced** `forum:rl:v1:<environment>:<scope>:` using `VERCEL_ENV`. Production and Preview do not share counters. Preview branches within the same environment intentionally do.

3. **Rotating `JWT_SECRET` resets every rate-limit identity**, because keys are HMACed with it. Keep it consistent across production instances. A rotation is a planned sign-out event *and* a limiter reset.

4. **`/health` reports the mode, not connectivity.** `rateLimitStore: 'redis'` means it is configured. A successful protected API call is what proves Redis is actually reachable. A healthy database and a dead Redis can coexist.

Free quota exhaustion or an Upstash outage can temporarily block the API. Monitor command usage. And be clear about what this is: **request throttling, not DDoS protection.**

## 24 Google sign-in

### Google Cloud Console

1. **Google Auth Platform → Get started.** App name `Doubt Forum`, support and contact email, user type **External** for users outside your organisation. Review the policy and finish.
2. **Clients → Create client → Web application.** Name it, e.g. `Doubt Forum Web`.
3. **Authorized JavaScript origins:** add the exact stable origin.

   ```
   https://student-doubt-forum-theta.vercel.app
   ```

   An origin is scheme + hostname. **No path.** Not `/login`.

4. **Leave Authorized redirect URIs empty.** This integration uses the GSI popup with a JavaScript callback, so there is no redirect. **No client secret is needed either** — the browser receives an ID token and the server verifies it.
5. Copy the **Client ID** into Vercel's Production `GOOGLE_CLIENT_ID`, then **redeploy**.

> **`origin_mismatch` is the error everyone hits.** Vercel's long per-deployment URL (`student-doubt-forum-abc123-xyz.vercel.app`) is a *different origin* from the stable `-theta` domain. Register the stable one and test on the stable one.

The Client ID is public by design — it ships in the bundle. The app exposes it at `GET /auth/google/config`, and the button simply does not render when it is blank, so an unconfigured deployment degrades cleanly instead of showing a broken control.

### Testing it

Test new Google signup and existing-account linking **separately**. They are different code paths with different failure modes. An existing password user links from Account settings using their current password plus a Google account with the matching email.

Moving to a custom domain means updating four things **together**: Google's authorised origins, the Vercel domain assignment, `CLIENT_URL`, and `APP_URL`.

## 25 Email: Gmail SMTP and Resend

### Gmail (the beta path, no domain needed)

1. Use a **dedicated** Gmail inbox you control. Enable 2-Step Verification, then create an **App Password** named `Doubt Forum SMTP`. Copy the 16-character code while the popup is open — it is shown once.
2. In Vercel: `EMAIL_PROVIDER=gmail`, `GMAIL_SMTP_USER=<the address>` as config, and `GMAIL_APP_PASSWORD` as a **Secret**. Paste only the generated code; the app strips the grouping spaces and connects to `smtp.gmail.com:465` over TLS.
3. Confirm `APP_URL` is the stable HTTPS origin — it is what builds the links in the email.
4. **Roll out in this order.** Start with `EMAIL_TEST_RECIPIENT` set to one address you own, and recovery off. Redeploy. Test with a real password account: check inbox *and* spam, use the link, sign in with the new password.
5. Only then set `EMAIL_RECOVERY_ENABLED=1` and redeploy. Confirm with a second password account. Keep `EMAIL_VERIFICATION_REQUIRED` off until its separate rollout is ready.

**Why that order.** Enabling recovery before delivery works strands every user who clicks "Forgot password" and gets nothing. The single-recipient test mode exists precisely so you can prove delivery before promising it.

Gmail's sending limits make this a beta arrangement. The website domain and the email sender domain are independent choices.

### Resend (the alternative)

`EMAIL_PROVIDER=resend` plus `RESEND_API_KEY` and `EMAIL_FROM`.

> **Do not set `EMAIL_ENABLED=1` while using `onboarding@resend.dev`.** That sender can only deliver to the email on the Resend account. Every other user would silently get nothing. Verify an owned sending domain first.

### The test-recipient mode, in detail

With `EMAIL_TEST_RECIPIENT` set and the public recovery flag off:

- Only that one normalised address can receive a reset link.
- `/auth/forgot-password` still returns the identical generic response to everyone.
- `/auth/reset-password` additionally constrains its atomic update to that email, so an older token belonging to another user cannot be used during restricted mode.
- The mail adapter enforces the recipient rule independently of the route — two layers.
- No signup verification mail is sent in this mode.
- Removing the variable stops the trial.

## 26 Environment variable master reference

| Variable | Where | Required | What breaks without it |
|---|---|---|---|
| `PORT` | Local | No | Defaults to 5000 |
| `MONGO_URI` | Local + Vercel | **Yes** | `MONGO_URI_MISSING`; nothing works |
| `JWT_SECRET` | Local + Vercel | **Yes**, ≥32 chars | `JWT_SECRET_INVALID`; no sign-in |
| `CLIENT_URL` | Vercel | Recommended | CORS falls back to `http://127.0.0.1:5173` |
| `APP_URL` | Vercel | For email | Email links point at the local default; must be HTTPS in production or `app_url_invalid` |
| `NODE_ENV` | Vercel | Recommended `production` | Changes CSP upgrade-insecure-requests and the limiter's fail-closed behaviour |
| `TRUST_PROXY` | Non-Vercel hosts | Platform-specific | `req.ip` is the proxy's, so limiters bucket everyone together. Vercel is auto-detected via `VERCEL=1` |
| `CLOUDINARY_CLOUD_NAME` | Vercel | For images | — |
| `CLOUDINARY_API_KEY` | Vercel | For images | — |
| `CLOUDINARY_API_SECRET` | Vercel, **Secret** | For images | Uploads return 503 with a clear message; text questions still work |
| `UPSTASH_REDIS_REST_URL` | Vercel | In production | Protected routes 503 |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel, **Secret** | In production | Protected routes 503 |
| `GOOGLE_CLIENT_ID` | Vercel | For Google | Button simply does not render. **Public value** |
| `EMAIL_PROVIDER` | Vercel | For email | Defaults to `resend` |
| `GMAIL_SMTP_USER` | Vercel | For Gmail | `gmail_config_missing_or_invalid` |
| `GMAIL_APP_PASSWORD` | Vercel, **Secret** | For Gmail | Same; must be 16 chars after stripping spaces |
| `RESEND_API_KEY` | Vercel, **Secret** | For Resend | `resend_config_missing` |
| `EMAIL_FROM` | Vercel | For Resend | Same |
| `EMAIL_TEST_RECIPIENT` | Vercel | Optional | Without it, restricted test mode is off |
| `EMAIL_RECOVERY_ENABLED` | Vercel | Optional, `1` | Forgot-password returns 503 with a clear message |
| `EMAIL_VERIFICATION_REQUIRED` | Vercel | Optional, `1` | Verification is not enforced for posting |
| `EMAIL_ENABLED` | Vercel | Legacy | `1` turns on **both** recovery and mandatory verification |
| `MONGO_TEST_URI` | CI / local tests | For tests | Defaults to `mongodb://127.0.0.1:27017` |
| `VITE_API_URL` | Client build | No | Defaults to `/api/v1`. **Never point this at localhost in production** |

**Three rules, repeated because they each cost real time here:**
1. Saving a variable does **not** update the running deployment. Redeploy.
2. Changing local `.env` does **not** touch Vercel, and vice versa.
3. Anything named `VITE_*` is compiled into the public bundle. Never put a secret there.

## 27 CI/CD and dependency updates

`.github/workflows/ci.yml` — two jobs.

**`test`** — matrix `['22','24']`, `fail-fast: false`, with a `mongo:7` service container and a `mongosh` ping health check. Steps: checkout → setup-node with npm cache → `npm ci` → `npm run build` → `npm test`.

Three details that were each learned the hard way:

```yaml
- name: Test
  shell: bash          # NOT cosmetic. The default run shell lacks pipefail,
  run: npm test 2>&1 | tee test-output.txt   # so `| tee` would report tee's
                                              # exit code and hide a failure
  env:
    MONGO_TEST_URI: mongodb://127.0.0.1:27017
    JWT_SECRET: ci-only-secret-at-least-thirty-two-characters-long
```

```yaml
- name: Report failing tests
  if: failure()
  run: |
    echo "::error::$(grep -a -A4 'failing tests' test-output.txt | head -c 2000 | tr -d '\r' | tr '\n' ' ' | sed 's/::/;;/g')"
- name: Upload test output
  if: failure()
  uses: actions/upload-artifact@v4
```

Job logs need a token to read. Raising the failure as an **annotation** and keeping it as an **artifact** makes it readable without one — which matters when you are asking someone else for help.

The workflow's `JWT_SECRET` is a throwaway literal for the test database only. It is not a credential and is used by no deployment.

**`audit`** — `npm ci` then `npm audit --audit-level=high`. Zero known vulnerabilities at the last run; that is a snapshot, not a certification.

**`.github/dependabot.yml`** — weekly npm updates grouped into a single PR (max 5 open), monthly GitHub Actions updates.

> **A deployment gap you must know about:** a push to `main` can trigger Vercel Production **independently of CI**. Vercel does not wait for GitHub Actions. For this project that is accepted, with tests run locally before every push. For a real public launch, use a protected branch with required checks and a staging-to-production promotion.

## 28 Creating the first administrator

### The intended route — through Atlas

1. Have the person **register normally** on the website.
2. Atlas → `Cluster0` → **Browse Collections**.
3. Select `student_doubt_forum` → `users`.
4. Filter by the exact registered email:

   ```json
   { "email": "registered-person@example.com" }
   ```

5. **Verify exactly one account matched** before editing anything.
6. Edit **only** `role`, from `student` or `teacher` to `admin`.
7. **Update**.
8. Refresh the website. "Moderation" should appear.

Never change `_id`, `email` or `passwordHash`. **Never screenshot a full user record** — it contains the password hash. To revoke, set `role` back to `student`. Always keep at least one intended administrator.

### The CLI route

```powershell
cd server
node src/make-admin.js registered-person@example.com
```

It uses **its own configured `MONGO_URI`** — which is your local database unless you deliberately point it elsewhere. It refuses if the account does not exist, because it will not invent a user. Never pass credentials as command-line arguments; they land in shell history.

### Why the website cannot do this

`PATCH /admin/users/:id/role` accepts only `student` and `teacher`, and refuses any request whose target is already an admin:

```js
if (user.role === 'admin' || !['student','teacher'].includes(req.body.role))
  fail(403, 'Only student and teacher roles can be changed here.');
```

`PATCH /admin/users/:id/ban` protects admins the same way. **A compromised admin account cannot create another admin, demote a co-admin, or lock everyone else out.** Admin creation requires database access, which is a deliberately higher bar. Account deletion is also blocked for admins until ownership is transferred.

## 29 Publishing the Study Library

Sign in as an admin → **Moderation → Manage subject catalogue** → the **Study library** panel.

It shows the question count and the subject list, and either a publish button or a link to browse the published batch. Publishing asks for confirmation, then POSTs `{ "confirm": "study-library-v1" }`.

What the import does, in order: validate all 200 rows; ensure subjects exist; create the two banned demo author accounts; insert the 200 answers; insert the 200 questions; write the completion record.

Public browsing: `/?scope=all&tag=study-library`.

**Test the first publication and a repeat request on a staging database.** The deterministic IDs and insert-only writes make a second run a no-op by design — but verify that yourself rather than taking it on faith.

---

# Part V — Run it

## 30 Release procedure

1. Write down the issue and the expected behaviour.
2. `git status --short`. Preserve work other people are mid-way through.
3. Make the smallest change in the right module. Run the relevant tests, then the full suite and build if shared behaviour is touched.
4. `git diff --check` and `git diff`. Review **staged filenames** before committing. Include related deployment config in the same commit — that is the lesson of `e90eb0b`.
5. Push. Watch Vercel; confirm the new deployment carries the **Production** label.
6. `npm run check:production`. Use a disposable account for any authenticated check.
7. Record the commit, the CI run and the live result in `docs/TESTING.md`.

Never force-push history to fix a normal setup mistake. Never reset unrelated work.

## 31 Rollback

Find a known-good deployment in Vercel and use **Instant Rollback** / Redeploy.

**What rollback does not do:** reverse data. Code rollback leaves every write in place. Assess three things separately — the code, the environment variables, and the records already written. A schema change that a rolled-back version cannot read is the dangerous case; design migrations to be backward-compatible (see the `semester`/`academicLevel` pattern) so a rollback stays safe.

## 32 Backup and restore drill

1. Record the cluster tier, database name, environment, date and retention plan. Check which backup tools your tier offers — the options differ by tier and change over time.
2. Choose a private, encrypted location with owner-only access. **A dump contains account data and authentication metadata.**
3. Use managed backups where available, or MongoDB Database Tools for a scoped logical dump. A logical dump spans changing data, so pick a low-write window. Keep the password out of the command — use the tool's prompt.

```powershell
mongodump  --uri "mongodb+srv://<source-cluster>/" --username "<backup-user>" --authenticationDatabase admin --db student_doubt_forum --archive="<private-folder>/forum-backup.archive.gz" --gzip
mongorestore --uri "mongodb+srv://<isolated-restore-cluster>/" --username "<restore-user>" --authenticationDatabase admin --archive="<private-folder>/forum-backup.archive.gz" --gzip --nsInclude "student_doubt_forum.*"
```

4. **Restore into an empty, separate cluster.** Verify the destination before pressing enter. Because the app hard-codes `student_doubt_forum`, keeping that name on a separate server makes an app-level restore drill straightforward. Keep live mail and live Cloudinary credentials out of the restored environment.
5. Verify: compare collection counts, open a sample thread with its answers and comments, check the indexes, and sign in with an approved test account.
6. **A Mongo dump restores Cloudinary *references*, not image bytes.** Plan media backup separately.
7. Record backup date, restore date, outcome, owner and archive location. Decide your acceptable data loss and recovery time. **A tested restore is the only evidence that counts.**

This drill has **not** yet been performed on this project. It is a named launch gate.

## 33 Monitoring and timing headers

There is no monitoring service. What exists:

| Signal | Where | What it tells you |
|---|---|---|
| `GET /api/v1/health` | Public | `database: connected` and `rateLimitStore: redis\|memory\|unavailable` |
| `Server-Timing: db-ready` | Vercel adapter | Milliseconds spent getting MongoDB ready |
| `Server-Timing: rate-limit` | API middleware | Limiter round trip |
| `Server-Timing: feed-db` | Feed route | The feed query itself |
| Vercel Runtime Logs | Dashboard | Safe diagnostic codes, never secrets |
| `npm run check:production` | CLI | Four read-only paths, headers and health payload |

**How to use the timing headers.** Open DevTools → Network, click the feed request, read `Server-Timing`. Compare a first request against a repeat from the same network. This is exactly how the project learned that the slow part was `db-ready`, not the query — and it is why a feed aggregation rewrite was reverted rather than shipped.

Named gaps: no uptime alerting, no error aggregation, no agreed responder for an Atlas, Upstash, Cloudinary or mail incident.

## 34 Migration scripts and their safety rails

Four scripts. All four share the same guard pattern, and the pattern is worth copying verbatim.

| Script | Does |
|---|---|
| `migrate-academic-levels.js` | Fills missing `academicLevel` from legacy `semester` |
| `migrate-subjects.js` | Fills missing `subjectId`, reports unmatched names |
| `migrate-institutions.js` | Assigns one college to an **explicit JSON list of user IDs** |
| `reconcile-reputation.js` | Recomputes reputation and reports or fixes differences |

### The six rails

```js
// 1. The database must be named explicitly. It is never inferred from .env.
const name = args.find(v => v.startsWith('--database='))?.slice(11);
if (!name || !/^[A-Za-z0-9_-]{1,64}$/.test(name) || ['admin','local','config'].includes(name))
  throw new Error('Supply --database=INTENDED_DATABASE.');

// 2. Dry run is the default. Writing requires --apply.
const apply = args.includes('--apply');

// 3. Applying requires explicit human confirmations.
if (apply && !(args.includes('--confirm-backup') && args.includes('--confirm-writes-paused')))
  throw new Error('Test a copy, back up and pause writes before applying.');

// 4. Errors log a category, never a credential or an ID.
catch { console.error('Migration failed. Review private configuration. No credentials logged.');
        process.exitCode = 1; }

// 5. Always disconnect.
finally { await mongoose.disconnect(); }
```

**6. Every update is conditional on the field still being missing**, which makes reruns idempotent and partial runs resumable:

```js
await Model.updateOne({ _id: doc._id, academicLevel: { $exists: false } },
                      { $set: { academicLevel: { … } } });
```

They never overwrite an explicit `null`, never delete the legacy field, and never guess. `migrate-institutions.js` in particular requires a file of specifically chosen user IDs — it will not assign all users, and it will not infer affiliation from email domains.

Usage:

```powershell
cd server
node src/reconcile-reputation.js --database=student_doubt_forum
# then, only after a backup and with writes paused:
node src/reconcile-reputation.js --database=student_doubt_forum --apply --confirm-writes-paused
```

**No production migration has been run on this project.** The compatibility design means none is required.

---

# Part VI — Everything that went wrong

## 35 Complete failure catalogue with fixes

Thirteen real failures, in the order they happened.

### 1. Atlas "Free" greyed out
**Saw:** Free tier unselectable; Atlas mentioned payment.
**Was:** The project's free-cluster allowance was already used by an existing `Cluster0`.
**Fix:** Reuse the existing cluster. Do not pay, do not delete data, do not create duplicates.
**Lesson:** A disabled option usually means an existing resource, not a missing payment.

### 2. GitHub push 403
**Saw:** `permission denied` on first push.
**Was:** The stored Git credential and the connected service account were both a different user from the repository owner.
**Fix:** `git credential-manager github login --username <owner> --device --no-ui`, authorise in a browser signed into the right account, then push with `-c credential.username=<owner>`.
**Lesson:** Verify the upload by comparing `ls-remote` to `rev-parse HEAD`. Absence of an error is not confirmation.

### 3. Deployment Ready, API 503
**Saw:** Perfect frontend. `/api/v1/health` → 503. Later: health 200, `/doubts` 500.
**Was:** Several things at once — Atlas allowlist only had the laptop IP; the database user's grant did not cover the database the URI selected; a half-initialised connection was being reused.
**Fix:** `0a4eccc` added safe categorised diagnostics. `b6df8c6` set `dbName` explicitly and made the connection manager disconnect and reset on initialisation failure.
**Lesson:** **The single most important lesson in this document.** A Ready build says nothing about the application. Add a health endpoint and a diagnostic categoriser before you need them.

### 4. Credentials in a screenshot
**Saw:** A shared screenshot included a database password and the JWT secret.
**Fix:** Treated as fully exposed. Database password changed; a new JWT secret generated locally without printing it; Vercel updated; redeployed. See §37.
**Lesson:** Rotate, do not assess. And expect JWT rotation to sign everyone out.

### 5. Wrong Vercel settings page
**Saw:** Creating an "Environment" showed a Pro upgrade prompt.
**Was:** The **Environments** page creates deployment environments. Variables live under **Environment Variables**.
**Fix:** Cancel; use the right page. No paid plan needed.

### 6. Saved variable had no effect
**Was:** Saving does not rebuild a running deployment.
**Fix:** Deployments → current Production → ⋯ → Redeploy.

### 7. CI invalid YAML — no jobs ran (`ac5749b`)
**Was:** A literal newline inside a quoted shell string in the annotation step.
**Fix:** Rewrote the step. **Lesson:** "No jobs ran" is a workflow syntax error, not a test failure.

### 8. CI false pass (`17958ee`)
**Saw:** CI green while the suite was failing.
**Was:** `npm test | tee` without `pipefail`. The default `run` shell does not set it, so the exit code came from `tee`.
**Fix:** `shell: bash`.
**Lesson:** **Anywhere you pipe in CI, set `shell: bash`.** A pipeline that cannot report failure is worse than no pipeline.

### 9. CI failed, laptop passed (`c262778`)
**Was:** jsdom 31 requires Node 22.22.2+ or 24.15+; CI pinned 22.12. The laptop ran 24.19.
**Fix:** Matrix `['22','24']` at latest patch, plus `--test-reporter=spec` because Node 22 emits TAP when piped and left the annotation empty.
**Lesson:** Local-pass/CI-fail is usually an environment floor.

### 10. Markdown preview showed both panes
**Was:** A global `textarea` display rule overrode the browser's `hidden` attribute.
**Fix:** Explicit `textarea[hidden]` rule, keeping the textarea mounted so the draft and caret survive.
**Lesson:** Only a browser finds this. The jsdom test asserted the attribute and was right — the CSS was wrong.

### 11. Google `origin_mismatch`
**Was:** Testing on Vercel's long per-deployment URL, which is a different origin from the registered stable domain.
**Fix:** Register and test the stable `-theta.vercel.app` origin.

### 12. White Google button on dark background
**Was:** Google's button renders in its own iframe canvas.
**Fix:** A `MutationObserver` on `data-theme` re-renders with `outline_dark`; a `ResizeObserver` handles width. Both guard against redundant re-renders.

### 13. The aggregation that was slower
**Saw:** A feed aggregation written to replace `find` + `countDocuments` benchmarked **slower** live.
**Fix:** Reverted to the previous query. Added `Server-Timing` headers, which showed 6.7 s in `db-ready` versus 0.6 s in `feed-db` on a cold request.
**Lesson:** Measure first. Revert an optimisation that loses. The bottleneck was connection readiness, not the query.

### Also recorded
- **Windows restricted execution** blocked network access and a native build component. Fixed by running in an ordinary authorised shell — **not** by disabling endpoint protection.
- **Gmail recovery failed on first attempt**, with Vercel logs showing both a credential/config problem and a Redis startup error. Fixed by correcting the Vercel Secret and redeploying, and by deduplicating simultaneous Redis `SCRIPT LOAD` calls.
- **`e90eb0b` CI failed** because the locally tested `vercel.json` was never staged into the commit. CI caught the omission; `3af40f0` included it.

## 36 Troubleshooting matrix

| Symptom | Check |
|---|---|
| Ready deploy, API says database unavailable | Atlas rule expiry; database-user grant; URI; the `DATABASE_…` diagnostic code. Runtime database name is `student_doubt_forum` |
| Health 200 but queries 500 | Index initialisation authorisation; whether the new code is actually the Production deployment |
| `MONGO_URI_MISSING` | The variable exists in the **Production** environment and a redeploy has happened |
| `JWT_SECRET_INVALID` | Present and ≥32 characters |
| `DATABASE_AUTH_FAILED` | Correct database user, current password, correct percent-encoding |
| `DATABASE_PERMISSION_DENIED` | The `readWrite` grant covers the database the app selects |
| `DATABASE_URI_INVALID` | URI syntax; placeholder actually replaced |
| `DATABASE_NETWORK_UNAVAILABLE` | Atlas entry active and unexpired; DNS; cluster reachable |
| Google button missing | `GOOGLE_CLIENT_ID` in the active deployment; `/auth/google/config`; browser or network blocking Google's script; redeploy after saving |
| Google `origin_mismatch` | Use the stable production origin; check the exact registered JavaScript origin |
| "An account already uses this email" | Expected. Sign in by password, then link Google from Account settings |
| Google button white on dark | Latest frontend bundle loaded |
| Forgot-password gives a generic success, no mail | The address belongs to a **password** account; check spam; read the `password_reset:` code in Vercel logs; if test mode is on, use the allowed recipient |
| 429 Too many requests | Wait out the window. Recovery is 3 per address and 10 email actions per IP per hour; one network can hit the IP limit across several addresses |
| API 503 with store errors | Upstash REST URL and token; Upstash dashboard; quota. The production limiter fails closed on purpose |
| Upload rejected | JPG/PNG/WebP, ≤3 MB, one file, real format matching the extension, valid session; wait for the upload to finish before posting |
| Image service not configured | All three Cloudinary variables in Production, then redeploy |
| Deleted image still visible | CDN cache. A cached response alone is not proof origin deletion failed |
| Question missing from a feed | Switch scope to Everything; clear filters; try a **whole word**; open the direct link |
| Search finds nothing for a partial word | Expected since the text-index change. `normali` does not match `normalize` |
| Dropdown options unreadable | Load the latest deployment. Options use the active theme's surface and text colours |
| Explore slow | Compare cold against repeat timing; read `db-ready` **before** changing any query |
| No notification | Use two accounts; self-actions are skipped; refresh; a deleted target may no longer open |
| Moderation menu missing | The user's current database `role` and account status; refresh or sign in again. A Teacher badge grants no admin access |
| Cannot create an admin in the dashboard | By design. Use Atlas or `make-admin.js` (§28) |
| Local admin missing online | Local and Atlas are separate databases |
| `npm test` fails before tests run | Current Node 22 or 24 patch; local MongoDB running; read the first failing test |
| Website breaks after a week of testing | The temporary Atlas access entry expired |

## 37 The secret exposure incident and the response

**What happened.** During setup a shared screenshot showed a database password and the JWT signing key.

**The response, in order:**

1. Treated both as fully compromised. No assessment of "probably nobody saw it".
2. The owner changed the Atlas **database user** password.
3. A new `JWT_SECRET` was generated locally and **never printed** to any terminal, chat or file.
4. The owner updated Vercel's Production variables.
5. Redeployed.
6. Neither value appears in any document, including this one.

**Two consequences to expect.** Rotating `JWT_SECRET` invalidates every existing session — users must sign in again. It also resets every rate-limit identity, because keys are HMACed with that secret.

**For a Cloudinary or Upstash leak:** rotate the credential in the provider's dashboard, update the private hosting variable, redeploy. Preserve evidence of the incident **without copying the secret into an issue, a log, or a report**.

**Prevention, now built into the project:** `.gitignore` excludes all `.env*` except `.env.example`; `setup-local.js` generates the secret without printing it; secrets are never passed as command-line arguments; logging prints error names and codes, never messages or stacks; `package-source.js` excludes `.env` from any archive; and `git check-ignore server/.env` is a step in the commit routine.

---

# Part VII — Reuse

## 38 Security decision catalogue

| Area | Decision |
|---|---|
| Passwords | bcrypt cost 12. 8 characters minimum, 72 **bytes** maximum — bcrypt's real limit, not a character count |
| Hash storage | `select: false` on the schema **and** an explicit field list in `safeUser()` |
| Sessions | HS256 JWT, 7 days, in `sessionStorage` (per tab). Not a cookie, so no CSRF surface |
| Revocation | `tokenVersion` compared on every request. Covers logout-all and password reset |
| Authorisation | Re-read the user from the database on every protected request. Role and ban state are never trusted from the token |
| Privilege escalation | Public signup can only create `student`. The admin API cannot create or demote admins |
| Ownership | `owns(user, author)` — author or admin, nothing else |
| Self-voting | Blocked server-side, and the button is disabled client-side |
| Input | Every field bounded in `validation.js`. IDs validated with `isObjectIdOrHexString` before any query |
| Injection | `escapeRegex()` on any user value entering a regex |
| XSS | marked → KaTeX → hljs → DOMPurify with an explicit allow-list, **plus** `script-src 'self'` as an independent layer |
| Open redirect | `safeReturn()` rejects anything not starting with a single `/`, anything containing a backslash or control character, and `/login`/`/signup` loops |
| Link safety | `rel="nofollow noopener noreferrer"` and `target="_blank"` on every rendered link |
| Uploads | MIME type **and** magic-byte signature; 3 MB; one file; 9-unattached ceiling; ownership checked at attach time |
| Image sources | CSP `img-src` has no wildcard; `<img>` is not in the Markdown allow-list |
| Rate limits | Twelve buckets across IP, email and account. HMACed keys. Fails closed in production |
| Email tokens | 32 random bytes; stored as SHA-256 only; 24 h / 30 min expiry; single use; delivered in the URL fragment; links built from an operator-controlled `APP_URL` |
| Enumeration | Identical generic response for every forgot-password outcome |
| Google | Signature + audience + `email_verified` verified server-side. Account collision requires explicit password-authenticated linking |
| Error responses | 5xx never echoes the underlying error. Driver codes translated to user language |
| Logging | Error name and code only. Never a message, a stack, a token or a credential |
| Headers | CSP, nosniff, DENY, referrer policy, COOP — on both Express **and** static responses |
| Caching | `private, no-store, max-age=0` on every API response, from two independent places |
| Deletion | Tombstone with an unusable password, banned, token version bumped. Other users' content and reputation preserved |
| Scope honesty | Feed scopes are documented in code and UI as **discovery filters, not access controls** |

## 39 Performance decision catalogue with measurements

| Change | Measured result |
|---|---|
| `decorateMany()` batching | `/doubts?limit=12` 28 → 6 queries; `/doubts/:id` 13 → 10; `/users/:id` 32 → 10. Constant at 6 for limit 5, 10 and 30 |
| Grouped comment load | One `$in` query for the whole thread instead of one per answer |
| Nine compound indexes | `explain('queryPlanner')` confirmed `IXSCAN` on all eight target queries |
| Weighted text index | Replaced an unindexable regex scan. Trade-off: whole-word and stemmed matching only |
| Stored reputation | Profile views no longer load every vote into Node |
| `maxPoolSize: 2` | Lower per-instance connection pressure on an Atlas free tier |
| Lazy Markdown chunk | Main bundle 93.11 → 95.05 KB gz instead of 226.10 KB. The 130.61 KB chunk loads only on a question page |
| Thirteen hand-registered languages | Avoided roughly a megabyte of unused highlight.js grammars |
| Combined `/catalog` | Two catalogue requests became one |
| Feed aggregation | **Reverted** — benchmarked slower live |
| `Server-Timing` headers | Cold: `db-ready` 6.7 s, `feed-db` 0.6 s, ~9.4 s wall. Warm: 1.1–1.3 s end to end |

**The headline finding:** cold-start database readiness dominates everything else by an order of magnitude. Requests entered via Mumbai while the function executed in Virginia. Before moving a function region, check the Atlas and Upstash regions and benchmark cold *and* warm requests either side of the change.

## 40 Free-tier limits and cost

Everything here runs on free tiers. Zero spend. The constraints you will meet first:

| Service | Free-tier pressure |
|---|---|
| MongoDB Atlas M0 | Storage and connection ceilings. Snapshot/backup options differ by tier. One free cluster per project |
| Vercel Hobby | Function execution limits; cold starts; no static outbound IP |
| Cloudinary | Storage, transformations and bandwidth quotas |
| Upstash | Monthly command quota. **Exhaustion blocks the API, because the limiter fails closed** |
| Gmail SMTP | Daily sending limits. Beta-grade only |
| Resend | Without a verified domain, the onboarding sender reaches only the account owner |

**What to watch:** Atlas storage and the access-entry expiry; Upstash command usage; Cloudinary storage and abandoned unattached uploads; retained QA accounts; Gmail send volume.

**Where the first paid upgrade would go.** Based on the measurements in §39, an Atlas tier with better cold-connection behaviour buys more than anything else — `db-ready` is the dominant cost. A verified sending domain is the second, because it is what unblocks email for all users rather than one.

## 41 Adapting this codebase to a different product

The forum shape — ask, answer, vote, accept, moderate — fits many things. What to change, in order:

**1. Rename the domain object.** `Doubt` is the only domain-specific model name. It appears in `models.js`, `forum.js`, `app.js`, `study-library.js` and the client. The API path `/doubts` and the route `/doubts/:id` go with it.

**2. Replace the classification axes.** Three exist, and they are independent:
- `subject` / `subjectId` → the catalogue axis (`subjects.js`, with seeds)
- `academicLevel` → the "stage" axis (`academics.js`)
- `institution` → the "organisation" axis (`institutions.js`)

Each is a self-contained module with its own catalogue, validation, admin route, feed filter and migration. Delete one, or replace its seeds, without touching the rest.

**3. Re-tune the limits.** Every one lives in `validation.js` or in the schema. Title 10–160, body 20–12000, comment 2–1000, 5 tags, 3 images, 3 MB.

**4. Re-tune reputation.** Three constants in `reputation.js`: `+10` upvote, `-2` downvote, `+15` accepted. Change them, then run `reconcile-reputation.js` as a dry run to see the effect before applying.

**5. Choose the roles.** `['student','teacher','admin']` is a schema enum plus `requireAdmin` plus the badge component. The pattern to keep: **the privileged role cannot be granted through the application.**

**6. Swap the Study Library data.** `demo-questions.json` and `demo-answers.json` with the same shape. The deterministic-ID importer works unchanged — change the `batch` constant to force a fresh import.

**What to keep unchanged, because it is the valuable part:**

- `validation.js` — the `fail()` + bounded-primitive pattern
- `auth.js` — `safeUser`, token version, role guards, `owns`
- `database.js` — the connection manager and the error categoriser
- `rate-limits.js` — HMACed keys and failing closed
- `markdown.js` — the sanitise-last pipeline
- `forum.js` `decorateMany` — batch per page, not per item
- `account.js` — allow-list export and tombstone deletion
- The migration safety rails in §34
- The change-record convention, including the "Not verified" section
- The middleware order in §13

## 42 What is still open

Stated plainly, because a document that only lists successes is not useful.

### Launch gates
1. **Durable network access.** The Atlas `0.0.0.0/0` entry is temporary. A permanent path must be chosen deliberately — static IPs, a different host, or an accepted documented risk.
2. **A tested backup and restore.** The procedure is written. It has never been run.
3. **Staging separated from production.** A Preview deployment on the same Atlas cluster can still reach the production database, because the database name is fixed in code. Staging needs its own cluster, its own Redis namespace, its own asset isolation, restricted email recipients and its own approved Google origin. Verify by creating a staging-only record and confirming its absence in production.
4. **Full cross-role manual QA.** The historical external run reported 40 PASS, 98 BLOCKED, 23 NOT RUN across 161 cases, and several of those passes need better evidence. `TESTER_PLAYBOOK.md` is the current plan.
5. **All-user email.** A verified sending domain, replacing the Gmail beta arrangement.
6. **A release process with required checks.** Today a push to `main` can deploy without waiting for CI.

### Known technical limits
- **No multi-document transactions.** A crash between a content mutation and a reputation increment causes drift. The reconciliation script repairs it. Account deletion, question deletion and migrations all span collections without a transaction.
- **Notification delivery is best-effort.** Awaited, but with no outbox or retry worker. A database interruption can lose an alert without losing the post.
- **No cleanup job for abandoned uploads.** The 9-unattached ceiling is the only pressure valve.
- **Search is English-only.** MongoDB text indexing with English stemming. Multilingual means Atlas Search.
- **No load or concurrency testing.** No measured traffic ceiling anywhere.
- **No monitoring or alerting.** No agreed incident responder.
- **Accessibility is partially verified.** Selected contrast pairs measured, ARIA asserted structurally. No screen-reader audit, no complete keyboard journey.
- **Index behaviour on live Atlas unobserved.** `explain()` was run locally; the live plan cache and data distribution differ.

### Not features, and deliberately so
AI answers, realtime chat, private messaging, email digests, mentions, push notifications, duplicate detection, related questions, bookmarks, following, course and professor pages, audit history, verified college membership.

## 43 Reusable AI-assistant prompts

This project was built with an AI coding assistant doing the file edits and test runs, and a human owner handling every dashboard, credential and authorisation. These prompts generalise that working loop. They are written fresh, not transcribed.

**Inspect and continue**
> Read `README.md`, `PROJECT_CONTEXT.md`, `docs/BUILD_FROM_SCRATCH_PLAYBOOK.md` and `docs/CONTINUE_HERE.md`. Inspect the actual current state before changing anything. Preserve unrelated files and any work in progress. Tell me the next bounded task. Never print or ask for a secret value.

**Reproduce locally**
> Help me run this repository from scratch. Check Node, Git and MongoDB versions first. Use the lockfile, preserve any existing private configuration, then verify health plus a two-student question-and-answer flow. Report anything that failed or was not run, honestly.

**Add a feature**
> I want [feature] so that a student can [outcome]. Follow the recipe in §16 of the build playbook: model, validate, a `server/src/<feature>.js` module with a `mount` export, client, then tests at all three layers. Keep the legacy path working. Write the change record including the "Not verified" section. Do not touch unrelated files.

**Fix a bug**
> I did [action]. I expected [result] and got [actual]. Inspect the relevant code and the sanitised error, identify the root cause, and make the smallest useful fix. Add a test that fails before the fix and passes after. Update `docs/TESTING.md`. Do not expose `.env` or clear application data.

**Deploy a change**
> Prepare this change for deployment. Run the full suite and the build. Check that staged files exclude every secret and include any related deployment config. Push using the intended account, then verify the deployed behaviour — not just that the build is Ready. I will enter credentials privately.

**Investigate a performance problem**
> [Page] feels slow. Read the `Server-Timing` headers before changing any query. Compare a cold request with a warm one. Tell me where the time actually goes, and do not optimise anything until we have a measurement. If a change does not benchmark better in production, revert it.

**Add an administrator**
> Help me promote this specific registered account to admin. Verify the exact account and the intended database before changing the role. Do not confuse the forum role with an Atlas database-user permission. Preserve `passwordHash` and every unrelated field. Verify access afterwards.

**Resume later**
> Save what changed, the actual test results, unresolved issues, the latest deployment and the exact next action into the handoff file. Do not copy any secret. When I return, continue from the saved state rather than rebuilding.

### What made this collaboration work

- **The assistant inspected before acting.** Not once — before every change.
- **The human kept every credential.** The assistant never saw a password, a connection string or an API key, and never asked.
- **One bounded change at a time,** then a test, then a save point.
- **A successful build was never treated as a working application.** That distinction is the single most valuable habit in this entire record.
- **Failures were written down as carefully as successes,** which is what makes the record usable a month later.
- **"Not verified" was always stated,** rather than implied by omission.

## 44 Reference links

Vendor interfaces, labels and plan limits change. These informed the setup; the test outputs and change records in this repository are what establish what actually happened.

**Build tools**
- Vite — https://vite.dev/guide/
- Express — https://expressjs.com/en/starter/installing.html
- Node test runner — https://nodejs.org/api/test.html

**Database**
- Atlas free cluster — https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/
- Atlas connection — https://www.mongodb.com/docs/atlas/connect-to-database-deployment/
- Atlas IP access list — https://www.mongodb.com/docs/atlas/security/ip-access-list/
- Atlas document editing — https://www.mongodb.com/docs/atlas/atlas-ui/documents/
- Atlas query filters — https://www.mongodb.com/docs/atlas/atlas-ui/query/filter/
- Cloud backup — https://www.mongodb.com/docs/atlas/backup/cloud-backup/overview/
- mongodump — https://www.mongodb.com/docs/database-tools/mongodump/
- mongorestore — https://www.mongodb.com/docs/database-tools/mongorestore/

**Hosting**
- Vite on Vercel — https://vercel.com/docs/frameworks/frontend/vite
- Express on Vercel — https://vercel.com/docs/frameworks/backend/express
- Rewrites — https://vercel.com/docs/rewrites
- Environment variables — https://vercel.com/docs/environment-variables
- Runtime logs — https://vercel.com/docs/logs/runtime
- Instant rollback — https://vercel.com/docs/deployments/instant-rollback
- Function region — https://vercel.com/docs/functions/configuring-functions/region
- Static IPs — https://vercel.com/docs/networking/static-ips
- GitHub integration — https://vercel.com/docs/git/vercel-for-github
- Request headers — https://vercel.com/docs/headers/request-headers
- Serverless functions and SMTP — https://vercel.com/kb/guide/serverless-functions-and-smtp
- Pricing — https://vercel.com/pricing

**Services**
- Cloudinary credentials — https://cloudinary.com/documentation/developer_onboarding_faq_find_credentials
- Upstash REST API — https://upstash.com/docs/redis/features/restapi
- rate-limit-redis — https://github.com/express-rate-limit/rate-limit-redis
- Google Identity Services setup — https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
- Verify a Google ID token — https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- Google App Passwords — https://support.google.com/accounts/answer/185833
- Gmail sending limits — https://support.google.com/mail/answer/22839
- Resend domains — https://resend.com/docs/dashboard/domains/introduction

**In this repository**
- `docs/FEATURE_SPECIFICATION.md` — what the software does, feature by feature
- `docs/DOUBT_FORUM_A_TO_Z_PLAYBOOK.md` — the student, admin and operator guide
- `docs/API.md` — endpoint reference
- `docs/TESTING.md` — dated verification record
- `docs/TESTER_PLAYBOOK.md` — the 161-case manual checklist
- `docs/PRODUCTION_READINESS_REVIEW.md` — launch gates
- `docs/*_CHANGE_RECORD.md` — one per feature, each with its "Not verified" section
- `RECOMMENDATIONS.md` — the audit that drove phases 3 through 13

---

*Read the change records chronologically. An older pending note is not the latest verified result.*
