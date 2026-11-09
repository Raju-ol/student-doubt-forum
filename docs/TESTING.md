# Verification record

Date: 9 November 2026. Local Windows machine, Node 24.19.0, npm 11.17.0, local MongoDB.

## Passed

- Live Cloudinary verification after user-configured production variables and Vercel redeploy: upload accepted, returned image URL delivered HTTP 200 with image content type; unused-image removal succeeded; second removal returned 404; reupload attached to a question and was present in discussion data; attached image could not be removed through unused-upload route; deleting the temporary question successfully ran attached-image cleanup. One labeled QA image-test account remains. No user image or secret was used.

- Live Vercel production b6df8c6: database/API smoke passed on 9 November 2026 after Atlas network and database permission setup. Verified two signups, login/current user, anonymous write rejection, question and second-user answer, voting, acceptance, comments, keyword/subject search, reputation and non-admin moderation denial. Temporary discussion was removed; two labeled QA accounts remain. This verifies API behavior, not full live browser or image flows. Network access is temporary and will expire.

- Phase 0 index/CI change (9 November 2026): `npm run build` passed; `npm test` reported 29 passes and 0 failures. The nine new indexes were listed from a throwaway local database and `explain('queryPlanner')` showed IXSCAN for the subject, semester, tag, solved-status, profile-question, profile-answer, comment and moderation-queue queries. See docs/PHASE0_CHANGE_RECORD.md.

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
- Keyboard, assistive technology and all browser/device combinations: not fully audited.
- Persistence across full database/service restart and clean ZIP installation: not yet exercised.
- Concurrency, high load and cross-collection partial failures: not exhaustively tested.

Windows restricted execution blocked network/native build components; authorized normal execution completed package installation, build and database checks. No application success is inferred from a failed restricted attempt.
