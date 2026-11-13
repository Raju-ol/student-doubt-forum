> Historical report or design milestone. For current implementation and verification limits, read [CURRENT_STATE](CURRENT_STATE.md) and [design review](DESIGN_CONSISTENCY_REVIEW.md). This record does not certify the latest release.

# QA_SUMMARY — Student Doubt Forum (run-01)

10 Nov 2026 (IST). Local commit `d6579311ba` on `main` (working-tree status unknown). Target: live Vercel site.

## Readiness recommendation: NOT READY TO CERTIFY (insufficient evidence)

I found no blocking defect in the part I tested, but that part is small: public logged-out pages, read-only admin checks and one QA question flow (post, edit, answer, accept, comment) in the owner's moderator session. The P0 flows (SM02–SM05: post, answer, accept, vote, notify, upload) were NOT executed, and automated tests/build could not be run. Per the playbook, a "ready" call needs P0 flows to pass first. After the owner actions below, a "Ready with known limits" call may be possible.

## What was actually tested

- Live, 161-case playbook (logged out + owner's moderator session, read-only): **40 PASS, 0 FAIL, 98 BLOCKED, 23 NOT RUN** (details in QA_RESULTS.md).
- Passed: public page loads (SM01), theme cycle by click and by Enter/Space with persisted state (UX01, UX02, SM06), password show/hide on login (AU05), search for a word, stemmed word, absent text and "[" (FE02–FE04), invalid-route handling (UX13), mobile 390px emulation without horizontal overflow and Menu open/close (UX06, UX07).
- Moderator session, QA content flow: posted, edited, answered, accepted and commented on one QA question (QU01, QU06, MD01, MD02, MD04, AN01, AN07, VO03, NO04 PASS; QU04, MD03, AN02, AN04, AN08 partial, left NOT RUN). All with one account, so cross-user flows (other-user answer, votes, accept by others, notifications to others, reputation) remain BLOCKED.
- Moderator session (read-only): session persists across page loads (AU07); admin Users/Reports tabs with keyboard arrows/Home (AD06); admin row has no Suspend/Make teacher (RO03); account page shows admin-deletion ownership restriction, nothing submitted (DA06). Admin Reports queue was empty; the moderator's notifications inbox shows 'No notifications yet' (not counted for NO11 because the account is not brand new).
- Also observed (not counted as PASS): logged-out /ask, /account and /admin show "Sign in to continue" with no private data; signup page shows optional academic level and optional, self-reported college wording; 30 subjects in the dropdown; Forgot-password link present on login.

## Automated results

`npm test` and `npm run build`: **BLOCKED / not run.** I had read access to the project folder but no way to run commands on your PC, and I was not allowed to install anything. Please run them yourself (or give me a command-execution connection) and I will record the exit codes and counts.

## Browser results

See above. Browser: the Claude desktop app's built-in browser. Mobile = viewport emulation only; no physical phone, no second desktop browser, no screen reader.

## Code-review-only findings

None. I read documentation (CONTINUE_HERE, TESTER_PLAYBOOK, TESTING, EMAIL/THEME records, README, package.json) and the Git branch/commit files. I did NOT read application source code, and I did not read any .env or secrets, so the "reconfirm configuration against code" step is not done. Live UI agreed with the documented configuration where visible (theme button, optional college wording).

## Bugs

- Critical/High: none confirmed.
- Suspected: SUSP-01 Mobile Menu ignores Escape (Low).
- Documentation: DOC-01 conflicting test counts; DOC-02 stale commit references. See QA_BUG_REPORT.md.

## Untested / blocked areas and why

- Needs approved disposable QA accounts (largest block): signup/login/session, questions, uploads, Markdown editor, answers, comments, votes, reputation, notifications, profile, academic levels, college scopes.
- Owner-supervised (O): deletions, role changes, moderation, export/deletion, owner password reset.
- Staging/local-only (S): API/security/failure/load checks (TE01–TE13), disguised uploads, forged roles, catalogue admin. Never run on live.
- Environment gaps: second college and more than 10 questions for scope/pagination tests; OS reduced-motion setting; screen reader; physical phone.

## Owner actions still required

1. Create disposable student QA accounts A, B, C yourself (I may not create accounts or enter passwords) and sign each in, in its own tab. Please also change the moderator password that was pasted in chat.
2. Run `npm test` and `npm run build` locally, or connect a command-execution tool, and share the result.
3. Approve any O tests with exact targets (a disposable teacher account, deletion targets, admin session).
4. Provide staging/local fixtures (two QA colleges, more than 10 questions) for S tests.
5. Check the Atlas temporary network rule expiry in the dashboard (I did not touch it).
6. Tell me which build is deployed (commit id) and fix the test-count mismatch in the docs.

## Cleanup

One QA question Q01 (with 1 answer and 1 comment) remains on live; delete it from the UI when no longer needed. A second QA question Q02 was created and deleted by me during delete-flow tests. No accounts were created. The moderator session in the browser pane is still signed in; sign out when finished. Theme was restored to System and the viewport emulation was cleared. Existing QA accounts seen in the admin list (QA Test Student A/B, QA Markdown Browser, QA Image Test, Aarav Demo, test_ac_1, a second 'Raju Sharma' student) were not touched.
