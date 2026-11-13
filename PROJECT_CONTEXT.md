<!-- consistency-review-2026-11-13 -->
> Current status, 13 November 2026 — See [current implementation and limits](docs/CURRENT_STATE.md). The active design has Auto/Light/Dark themes and a separate community resource Library. Institution-scoped curriculum and publication review remain planned. Older counts, release IDs and provider checks below are dated evidence, not current certification.

# Project context for maintainers and AI assistants

Reviewed 10 November 2026 against code commit 827e8df. Confirm the current Git and Vercel state before editing or deploying.

- [Source repository](https://github.com/Raju-ol/student-doubt-forum)
- [Production](https://student-doubt-forum-theta.vercel.app/)
- [Release verification](https://github.com/Raju-ol/student-doubt-forum/actions/runs/42812978312)
- [A–Z playbook](docs/DOUBT_FORUM_A_TO_Z_PLAYBOOK.md)
- [Handoff](docs/CONTINUE_HERE.md)

## Architecture and source map

| Layer | Source and behavior |
| --- | --- |
| Browser | React/Vite under client/src. Handles login, sanitized Markdown with code and maths, theme, profile, catalogue filters, notifications and moderation. |
| Vercel | vercel.json serves client/dist, routes API traffic to api/index.js, and supports refreshing client routes. Browser calls same-origin /api/v1. |
| API | server/src/app.js wires Express routes. Related modules under server/src own auth, account actions, email, catalogues, moderation and persistence. |
| Data | MongoDB Atlas. Application database is student_doubt_forum. User, doubt, answer, comment, vote, upload, report and notification records have linked IDs. |
| External services | Cloudinary for screenshots, Upstash REST Redis for shared rate limits, Google Identity Services for sign-in, Gmail SMTP for password recovery. |
| Study Library | server/src/demo-questions.json and demo-answers.json feed server/src/study-library.js. The client admin panel is client/src/study-library-admin.jsx. |

## Behavior to preserve

- Signup grants student only. The browser uses bearer JWTs and the server checks current account/role/ban state. Sign out everywhere and a successful password reset revoke old sessions.
- Google ID tokens are verified against the configured client ID. Existing password accounts explicitly link matching Google credentials from Account settings. A Google-only account uses Google sign-in.
- An account's college selection changes feed defaults. Questions are still publicly readable. Keep legacy semester and free-text subject records compatible.
- Public Study Library is a fixed batch of 200 labeled demo questions, 20 per subject for ten subjects, each with an AI-generated explanation. Admin-only publication is insert-only and records completion. Regular community questions stay separate. There is no live AI request.
- Keep same-origin routes and existing API response shapes. Catalogue uses /catalog, with /subjects and /institutions retained. API responses are no-store.
- Recovery can be enabled independently of mandatory email verification. Gmail SMTP uses the configured sender's app password. Existing provider values belong in Vercel, never in code or docs.

## Evidence and open work

The owner confirmed Google sign-in, in-app notifications and Gmail password recovery during live walkthroughs. Latest checks found Atlas connected, 30 subjects, one college and 200 Study Library entries. Full local suite passed 90 tests before the final feed query adjustment. Final focused run passed 38 tests and final CI passed. Two manual QA student logins were verified. Full cross-role testing remains open.

Warm filtered feed and catalogue measured about 1.1–1.3 seconds. One cold sample recorded 6.7 seconds for database readiness and about 9.4 seconds wall time. Confirm provider regions before relocating anything. The previous feed query is deployed after an aggregation experiment measured slower. Dark native select option colors and the combined catalogue request are retained.

Before general launch, review Atlas access expiry and least privilege, rehearse backup/restore against a separate database, separate Preview from Production, and finish cross-role QA. See [owner checklist](docs/OWNER_NEXT_STEPS_HINGLISH.md).


## Update 13 November 2026

This section supersedes older statements above where they differ. Confirm the current Git and Vercel state before editing or deploying.

**Branches.** `main` (`d56cec9`) is deployed. `feat/design-v3` and `fix/review-bugs` are pushed and unmerged; the second contains the first. Merge in that order, or merge `fix/review-bugs` alone.

**What changed in the code (on the branches)**

| Area | Change |
| --- | --- |
| Shell | `Navbar` in `client/src/components.jsx` renders a top bar and a sidebar (drawer below 1024 px). Styles are in `client/src/design-v3.css`, loaded last. Pure formatters are in `client/src/format.js`. |
| Themes | Light (peach), Dark (purple) and Auto. Sticker, Chalkboard and Bento are retired; a stored `bento` choice falls back to Auto. |
| Explore | `client/src/pages.jsx` `Feed`: hero, subject chips, Filters popover, question cards, Trending Topics, Quick Links. Status wording is Resolved, Unresolved or Unanswered. |
| Library | `client/src/library-page.jsx` and `server/src/resources.js`: flat list of shared files and https links with Download or Open. It is **not** the planned institution-based library. |
| API | `Resource` model, `Doubt.views`, `POST /doubts/:id/view`, `GET /tags/trending`, `GET /contributors`. See [API notes](docs/API.md). |
| Subjects | Python and C and C++ added to the default catalogue (inserted on the first request after deploy). |

**Behaviour to preserve (additions)**

- Header search keeps the current filters on Explore, Worked Q&A, Library and Saved, and resets only the page.
- A moderation report can be resolved once.
- Views are counted by an explicit `POST`, never by a page re-fetch.
- File uploads need Cloudinary and are limited to 4 MB for resources and 3 MB for images. Links need nothing extra.
- The 200 sample questions are called Worked Q&A and stay reachable at `/?scope=all&tag=study-library`; they are excluded from the unfiltered feed.

**Evidence.** On `fix/review-bugs`: build passes and 120 of 120 tests pass. The latest review verified the local database directly and the production database and Redis limiter indirectly through the live health endpoint. Cloudinary, Gmail recovery and Google sign-in were **not** re-verified because their variables are absent from the local configuration. See [Bug fix report](docs/BUG_FIX_REPORT.md).

**Open work.** Decide the fate of the interim `/library` page before building the institution library; add real notes or links to the Library and real questions to the forum before demoing; re-run live checks for uploads, recovery and Google sign-in after merging; the older open items (Atlas access expiry, restore drill, Preview/Production split) are unchanged.
