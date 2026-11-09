# Student Doubt Forum

9 November 2026: Owner explicitly authorized autonomous commits/pushes after checks (main deploys without waiting for CI). Reputation optimization implemented with lazy history-preserving initialization, atomic deltas/CAS mutations and explicit dry-run reconciliation. Full local suite 61 passes/build passed. Production writes/backfill unrun; see docs/REPUTATION_CHANGE_RECORD.md. Do not claim full global-roadmap completion.

## Markdown bodies (9 November 2026)
Implemented RECOMMENDATIONS.md §2: question and answer bodies are Markdown, rendered client-side through marked with highlight.js code blocks and KaTeX maths, sanitised with DOMPurify, with a toolbar and Write/Preview tabs. Stored content is unchanged, so old plain-text posts still render correctly. The renderer is a lazily loaded chunk, so the main bundle grew only 93.11 to 95.05 KB gzipped. 59 tests pass and the build passes. NOT opened in a browser yet: the visual result and the 390px layout of the toolbar are unconfirmed. See docs/MARKDOWN_CHANGE_RECORD.md.

## Phase 0 quick wins (9 November 2026)
Applied the Phase 0 items from RECOMMENDATIONS.md that the user selected: nine missing MongoDB indexes in server/src/models.js (§3.3) and a GitHub Actions CI workflow plus Dependabot config (§6.3). Build and 29 tests pass; index usage confirmed locally with explain(). Pushed as commit a8a9975 and GitHub Actions passed both jobs on the first run. Live Atlas index behaviour after the resulting Vercel deploy is still unobserved. The MIT LICENSE file is still pending: the user chose MIT but will give the copyright name later, so the repo remains all-rights-reserved for now. Then applied §3.1: decorateMany batches the per-item vote and answer-count queries, measured 28 → 6 queries on the feed and constant with page size, with the API response shape unchanged. Added the MIT LICENSE file (Copyright (c) 2026 UJA) on the user's instruction, so the repository is no longer all-rights-reserved. Full detail in docs/PHASE0_CHANGE_RECORD.md.

## Latest UI work
User approved P0 direction on 9 November 2026. Commit 938695a pushed: safe sign-in return routes, password visibility, My questions, mobile disclosure menu, search label/status semantics, browsing context, readability/touch-size CSS, retry controls and native unsaved-change guards. Build and 29 tests passed. Browser verified local Ask sign-in return, 360/390/768/1024/1440 feed overflow, menu Escape/focus return. See docs/P0_CHANGE_RECORD.md for implemented items and honest remaining checks; do not claim all P0 acceptance items passed. In particular Browser Back unsaved guarding and native confirmation cancel verification remain incomplete. Do not rerun scratch scripts/improve-p0.cjs; it was a one-time source transformation helper, not an application command.

## Resume checkpoint
User requested a break until the evening on 9 November 2026. Read RESUME_HERE.md for current deployment state and the exact Atlas dialog stopping point. Website is deployed but live database connection currently fails. Do not assume the latest suggested Atlas role changes were saved. No background work or reminder requested.

## User request
Build the complete application with the beginner user. Full scope confirmed: authentication, doubts, answers, search/filtering, voting, accepted answers, comments, profiles, teacher badges, image uploads and admin moderation. Target: live application by 12 November 2026 (interpreted from user's “12”).

## Technical direction
React/Vite, plain CSS, Express and MongoDB. Cloudinary uploads. Same-origin production: Express serves the compiled frontend, simplifying deployment. Bearer JWT authentication as described in supplied playbook. Historical reduced-scope plans are not the current scope.

## Progress
- 2026-11-09: Read supplied playbook and inspected workspace. No application code existed. Node 24.19.0, npm 11.17.0 and Git 2.55 are installed.
- Created isolated project and dependency manifests. Database connection is not verified. No application features or live deployment verified yet.

## Latest verified state
- Implemented React screens and Express/Mongoose API: auth, doubts, answers, comments, filters/search, voting, acceptance, reputation, profiles, upload ownership, admin roles/bans/reports.
- Dependencies installed with lockfile; installation audit reported zero vulnerabilities.
- Local MongoDB connected. Production build passed. Integration flow: 25 subtests plus parent, 26 reported passes.
- Browser verified two independent student sessions, signup, post, answer, acceptance, comment, search and reload session restoration. Admin Users/Reports views and profile read view verified.
- User explicitly approved promoting local demo account aarav-browser@example.test to admin; promotion completed. Earlier automatic rejection is resolved by that specific authorization. Do not infer permission for other persistent access changes.
- Cloudinary upload/deletion and public deployment remain pending. User has no service accounts yet and requested setup guidance. Next user action: create/verify GitHub account, then connect user-owned repository, Atlas, Cloudinary and hosting incrementally.
- Private local server/.env generated without printing secrets. Never include it in repository or ZIP. Local demo accounts/data must not be seeded into production.
- 390px mobile check is unverified: viewport override left actual viewport at 699px. Do not claim full mobile QA.
- docs/GO_LIVE_HINGLISH.md has the account/deployment guide. Start Application.cmd starts the local version. API and testing docs reflect implementation limits.

## External access eventually required
- GitHub upload verified on Raju-ol/student-doubt-forum, initial main commit bcee01ab9283e586d72dfd6d2102613cc965d654. Git credential manager authenticated Raju-ol through user-completed device login. Use credential.username=Raju-ol for Git network operations; other GitHub accounts are also configured.
- User created Atlas account, existing free Cluster0 and Node.js URI template. Actual password not supplied or configured. User logged into Vercel and chose it instead of Render. Prepared Vercel static frontend + API function configuration; live deployment remains unverified.
User signs into hosting/database/image accounts and enters secrets privately. Never paste credentials into chat. Do not promise deadline completion without verification.
