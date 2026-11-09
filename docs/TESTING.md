# Verification record

## Latest verification — 9 November 2026

75 tests pass, production build passes, npm audit reports 0 vulnerabilities.
CI at final code commit c6e559a passed Node 22 and 24 plus audit: [run 42612388866](https://github.com/Raju-ol/student-doubt-forum/actions/runs/42612388866). Vercel deployment completed. Live Redis health/protected feed,
30-subject catalogue, empty institution catalogue, optional signup fields,
worldwide subject + legacy semester filtering and mobile width checked. Dark
persistence and Markdown maths/code preview verified. Additional regression
coverage includes failed email delivery's generic response, image-cleanup retry
and admin-account deletion block. No live deletion/recovery/admin mutations,
restored production-copy migration, full load or screen-reader audit. Current
limitations and owner steps: [CONTINUE_HERE.md](CONTINUE_HERE.md).


Text-search update: 62 local passes/0 failures. Tested stemming, deliberate partial-word nonmatch, tags, punctuation and combined filters. Production index creation/time and multilingual relevance are unverified.

Pool update: maxPoolSize=2, full local suite 62 passes/0 failures, production build passed. Live traffic/connection saturation not measured.

Session invalidation update, 9 November: 62 passes/0 failures and production build passed. Tests include legacy JWT compatibility, revocation of all old tokens and a working fresh login. Production/browser multi-device testing remains unrun.

## 9 November reputation update
Full suite: 61 passes, 0 failures; production build passed. Added history-preserving missing-counter initialization, concurrent initializer and deletion-credit reversal checks. Stored reputation matches aggregation reconciliation in the exercised flows. Production backfill/load testing is not run. See REPUTATION_CHANGE_RECORD.md.

Date: 9 November 2026. Local Windows machine, Node 24.19.0, npm 11.17.0, local MongoDB.

## Passed

- Live Cloudinary verification after user-configured production variables and Vercel redeploy: upload accepted, returned image URL delivered HTTP 200 with image content type; unused-image removal succeeded; second removal returned 404; reupload attached to a question and was present in discussion data; attached image could not be removed through unused-upload route; deleting the temporary question successfully ran attached-image cleanup. One labeled QA image-test account remains. No user image or secret was used.

- Live Vercel production b6df8c6: database/API smoke passed on 9 November 2026 after Atlas network and database permission setup. Verified two signups, login/current user, anonymous write rejection, question and second-user answer, voting, acceptance, comments, keyword/subject search, reputation and non-admin moderation denial. Temporary discussion was removed; two labeled QA accounts remain. This verifies API behavior, not full live browser or image flows. Network access is temporary and will expire.

- Phase 0 index/CI change (9 November 2026): `npm run build` passed; `npm test` reported 29 passes and 0 failures. The nine new indexes were listed from a throwaway local database and `explain('queryPlanner')` showed IXSCAN for the subject, semester, tag, solved-status, profile-question, profile-answer, comment and moderation-queue queries. See docs/PHASE0_CHANGE_RECORD.md.

- CI after the Markdown change: run 42601860245 on commit c262778 passed on Node 22 and Node 24 (latest patches) plus `npm audit`, with `pipefail` in force. The earlier green run on 17958ee was a false pass caused by piping into `tee` without `pipefail`, and should not be cited as evidence. The underlying failure was jsdom 31 requiring Node 22.22.2+ while CI pinned 22.12. Details are in docs/MARKDOWN_CHANGE_RECORD.md.

- Markdown bodies (§2), 9 November 2026: `npm test` reported 59 passes and 0 failures (30 new subtests across markdown, editor and component tests); `npm run build` passed. Thirteen XSS payloads were checked by parsing the sanitised output and asserting no element carries an event handler or a javascript:/data:text/html URL. The React components were bundled with esbuild and rendered under jsdom to confirm the toolbar, tablist ARIA and textarea attributes. The server CSP was checked to allow KaTeX inline styles and same-origin fonts while keeping script-src 'self'. NOT verified: nothing was opened in a real browser, so the visual result, the preview tab, code block appearance and the 390px layout of the new toolbar are unconfirmed. See docs/MARKDOWN_CHANGE_RECORD.md.

- Live check of commit 717b2fe on the public site: health connected; feed and detail routes returned votes, myVote, answerCount, status and answers with no missing fields; subject/semester/status/tag/search filters all returned 200. The live database holds one question with no answers, votes or comments, so the aggregation and comment-grouping paths were NOT exercised live. CI run 42598034270 passed both jobs.

- Feed batching change (§3.1): `npm run build` passed and `npm test` reported 29 passes, 0 failures. MongoDB command monitoring on a seeded local database measured GET /doubts 28 → 6 queries, GET /doubts/:id 13 → 10 and GET /users/:id 32 → 10, with the feed staying at 6 queries for limit 5, 10 and 30. Vote totals, signed-in and anonymous myVote, answerCount, status and per-answer comment grouping were compared against the previous behaviour and matched. Not verified in a browser and not measured on live Atlas.

- GitHub Actions CI, run 42596996998 on commit a8a9975: both jobs completed successfully. The `test` job ran `npm ci`, `npm run build` and `npm test` against a MongoDB 7 service container; the `audit` job ran `npm audit --audit-level=high`. Every step passed.

- `npm test`: 25 integration subtests and 1 enclosing test, 26 reported passes, zero failures. Uses an isolated temporary database.
- `npm run build`: successful production React/Vite build. React Router's `use client` directives were ignored by Vite; build completed.
- Local startup: MongoDB connected; Express serves the compiled frontend on port 5000.
- Browser: student A signup with semester, post question; student B signup in a separate tab/session, answer; student A reload/session restoration, accepted answer, comment; keyword search finds the solved discussion.
- Browser: authorized local demo account promoted to admin; Users table, empty Reports view and profile page loaded correctly. No live account role was changed.
- API checks cover normalized duplicate emails, bcrypt hashing, invalid passwords/tokens, author spoofing, permissions, validation, bounded search/filtering, vote toggle/switch, answer acceptance/reputation, teacher promotion, banning existing sessions, report dismiss/remove, cascading answer deletion, profile privacy and unowned upload IDs.
- Dependency install audit: zero reported vulnerabilities at install time.

## Pending or limited

Vercel preparation update: API handler tested locally against the shared MongoDB connection, including health, profile data and unknown API route behavior. Updated integration run reports 26 subtests plus parent (27 passes). Production frontend build passes. Actual Vercel routing, Atlas connectivity and public deployment remain pending until configured and deployed.

- Cloudinary upload/remote deletion end to end: credentials unavailable. File type/signature/size and ownership checks are implemented; remote service integration has not been verified.
- Live Atlas/hosting/deployment acceptance: accounts not configured.
- Full browser moderation mutations, edit/profile forms and error-state coverage: pending; automated checks do not establish every browser interaction.
- Mobile: responsive CSS exists. Browser viewport override did not change the observed 699px width, so 390px layout is NOT verified. Observed 699px view had document width equal to viewport width.
- Index behaviour on the live Atlas cluster has not been observed; re-check with explain() there after the deployment of commit a8a9975 settles.
- The new editor's keyboard behaviour is asserted structurally (roving tabindex, arrow-key handler) but was not exercised with a real keyboard or screen reader.
- Keyboard, assistive technology and all browser/device combinations: not fully audited.
- Persistence across full database/service restart and clean ZIP installation: not yet exercised.
- Concurrency, high load and cross-collection partial failures: not exhaustively tested.

Windows restricted execution blocked network/native build components; authorized normal execution completed package installation, build and database checks. No application success is inferred from a failed restricted attempt.

9 November 2026: shared Upstash rate limiting implemented; 65 tests pass/build succeeds. Live health reports Redis mode and protected feed HTTP 200. Cross-instance counters/email buckets, expiry/reload/outage validated using a REST contract fake; real production saturation not tested. See RATE_LIMIT_CHANGE_RECORD.md.


Email flows: 66 tests pass/build succeeds. Capturing email adapter verifies hashes, expiry/replay, posting verification and password reset revocation. Real provider/inbox and live activation pending; see EMAIL_CHANGE_RECORD.md.


Account data controls: 67 tests/build pass, including private export, anonymization, owned image cleanup via fake Cloudinary and session denial. Live deletion and large exports not tested; see ACCOUNT_DATA_CHANGE_RECORD.md.


Theme support: 69 tests/build pass, preference/storage fallback and selected dark contrast pairs verified. Local IAB connection timed out; live visual check pending. THEME_CHANGE_RECORD.md.


Notifications: 70 tests/build pass, private inbox and event flows verified locally. Live alert mutations not performed. See NOTIFICATION_CHANGE_RECORD.md.


Tabs: 72 tests/build pass; real DOM focus/selection checked. Theme: live dark feed/mobile overflow and reload persistence checked; full authenticated dark-screen audit pending.


Academic levels: 73 tests/build pass; mixed legacy/new fixture migration dry-run/apply/idempotence checked in disposable DB. No production migration/copy test. ACADEMIC_LEVEL_CHANGE_RECORD.md.


Subjects: 74 tests/build pass. Alias/collision permissions and guarded fixture migration verified; live admin mutation and production-data copy migration not tested. SUBJECT_CATALOG_CHANGE_RECORD.md.


Institutions: 75 tests/build pass, permission/scope/mapping tests in disposable DB. No live membership/college addition or migration performed. INSTITUTION_CHANGE_RECORD.md.

