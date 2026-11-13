> Historical report or design milestone. For current implementation and verification limits, read [CURRENT_STATE](CURRENT_STATE.md) and [design review](DESIGN_CONSISTENCY_REVIEW.md). This record does not certify the latest release.

# QA_RESULTS — Student Doubt Forum (run-01)

Tester: Claude (independent QA, TEST AND REPORT ONLY). Run date: 10 Nov 2026, approx. 00:55–01:45 IST (UTC+05:30).

## Environment

| Item | Value |
|---|---|
| Target | Live site https://student-doubt-forum-theta.vercel.app/ (Vercel). Only live-safe anonymous checks plus read-only owner-session admin checks were run. |
| Local Git (read from .git files) | branch `main`, commit `d6579311ba10c86ed699dad8f1e296901f229324`. `git status` could NOT be run (no shell on the PC), so working-tree status is unknown. |
| Deployed commit | Unknown. The site does not show a commit id, so the live build is not proven to equal the local HEAD. |
| Browser | Claude desktop app's built-in browser pane (Chromium 152 on Windows 10/11, desktop-pbocjr9). |
| Viewport | Pane default (about 618px wide), plus emulated 390x844 (Pixel 8 UA). This is emulation, NOT a physical phone. |
| Accounts | One owner-supplied (owner said to proceed with full permission for testing) moderator/admin account (Raju Sharma), signed in by the OWNER in the browser pane after I declined to enter the password myself. No account was created by me. Student accounts A/B/C: none available. |
| Data changed | Created on live (QA-prefixed, owner-approved): 1 question 'QA-CL-10NOV-Q01 Database normalization question EDITED' (id 6af22258fcfd876b6bda6f79) by the moderator account, with 1 answer (accepted) and 1 comment. No votes, role changes, moderation or deletions. Left in place for the owner to keep or delete. Theme preference was restored to System (stored value `system`). |

## Phase 1 — Automated checks

| Command | Result |
|---|---|
| `npm test` | **BLOCKED — not run.** This session has file access to the project folder but no shell on the PC (no way to run commands), and the rules forbid installing dependencies or changing configuration. Local MongoDB availability is unknown. |
| `npm run build` | **BLOCKED — not run**, same reason. |

No old test result is claimed as mine. For context only (not my result): docs say 75–77 tests passed earlier; the docs disagree among themselves (CONTINUE_HERE 75/76, TESTER_PLAYBOOK 77).

## Coverage totals (161 unique playbook case IDs)

| Status | Count |
|---|---|
| PASS | 40 |
| FAIL | 0 |
| BLOCKED | 98 |
| N/A | 0 |
| NOT RUN | 23 |
| **Total** | **161** |

Blocked breakdown: needs approved QA accounts — 50; owner-supervised (O) — 17; staging/local-only (S) — 27; other prerequisites — 4.

PASS means executed and observed with the stated scope. Some PASS rows are scoped narrower than the full playbook case; read the observation column. A "BLOCKED" row that mentions a partial observation is still not a PASS.

## Results


### 3. Smoke (SM)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| SM01 | L | PASS | Direct loads of /, /login, /signup and /doubts/<id> (question 'primary key vs foreign key') each rendered content; no blank page or raw server error. Question page showed 'Loading…' transiently, then content. Pages were loaded by URL navigation, not F5. | SM06 screenshot (home) |
| SM02 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| SM03 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| SM04 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| SM05 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| SM06 | L | PASS | Theme cycled System→Light→Dark→System (UX01). Mobile 390px emulation: Menu opened (aria-expanded=true), links reachable (Explore, Ask a doubt, Sign in), closed again, document scrollWidth 390 = viewport 390. | UX06-UX07 screenshot |

### 4. Signup/login/session (AU)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| AU01 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| AU02 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| AU03 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| AU04 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| AU05 | L | PASS | On /login only: typed a dummy 13-char value, Show password -> input type=text, label 'Hide password', aria-pressed=true; toggled back -> type=password; value length preserved (13). Not checked on /signup. | none (JS-state evidence) |
| AU06 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| AU07 | L | PASS | Moderator account (signed in by the owner in the browser pane): full page loads of /, /admin, /account, /notifications all kept the signed-in session (nav showed Moderation, Account, Sign out). Loaded by URL navigation, not F5. | none |
| AU08 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. Observed only: logged-out visits to /ask, /account and /admin show 'Sign in to continue' (no private data) — the sign-out step itself was not run. | — |
| AU09 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| AU10 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| AU11 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| AU12 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| AU13 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. Observed only: logged-out /admin shows 'Sign in to continue'; the normal-student case was not run. | — |

### 5. Questions (QU)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| QU01 | L | PASS | Moderator account: Ask form with title 'QA-CL-10NOV-Q01 Database normalization question', Markdown body, subject (default Data Structures) and level (Semester 5, preset) posted; redirected to the new discussion showing the same title/body/tags. Survived reload. | none |
| QU02 | L | PASS | Title/body length rules checked on the QA ask form with the moderator account (client-side messages for too-short title/body); nothing invalid was submitted. | none |
| QU03 | L | NOT RUN | Not run yet; possible with the moderator account. | — |
| QU04 | L | NOT RUN | Tags '  QA-Tag, qa-tag ,DBMS, normal-form  ' saved as qa-tag, dbms, normal-form (trim, lowercase, dedupe OK). 6th tag and >24-char tag not tried. | — |
| QU05 | L | PASS | Edit flow on own QA question: edit saved, Cancel discarded changes (see QU06). | none |
| QU06 | L | PASS | Edited the QA question title (appended ' EDITED') via /edit and saved; discussion shows new title, tags and answer count unchanged, maths still rendered. No attachments existed, so 'attachments preserved' was not exercised. Other fields not edited. | none |
| QU07 | L | NOT RUN | Not run: unsaved-edit Cancel may trigger a native leave dialog (see QU08). | — |
| QU08 | L | NOT RUN | Leave-page warning is a native beforeunload dialog; not interceptable here. Not run. | — |
| QU09 | L | NOT RUN | Leave-page warning is a native beforeunload dialog; not interceptable here. Not run. | — |
| QU10 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| QU11 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| QU12 | O | PASS | O-test on my own disposable QA question Q02 (owner gave permission): Delete -> native confirm intercepted via JS override; Cancel kept the question; confirm removed it and answers. Q01 left in place. | none |

### 5. Attachments (IM)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| IM01 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| IM02 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| IM03 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| IM04 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| IM05 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| IM06 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| IM07 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| IM08 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| IM09 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |

### 6. Markdown (MD)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| MD01 | L | PASS | All 8 toolbar buttons (Bold, Italic, Inline code, Code block, Maths, List, Link, Quote) inserted/wrapped Markdown syntax around the selected placeholder text; text was not lost. Clicks were stacked on one selection, so output was nested (e.g. ***...***); each tool was seen to act, not tested one-by-one on fresh text. | none |
| MD02 | L | PASS | Write -> Preview -> Write: Preview hid the source textarea and showed formatted output; back in Write the draft was intact (235 chars, same text). Done once, not 'repeatedly'. | screenshot not saved |
| MD03 | L | NOT RUN | Sample renders in Preview; blank-body empty state not checked. | — |
| MD04 | L | PASS | Posted the harmless sample; discussion rendered bold/italic/inline code, list, quote, link (rel nofollow noopener noreferrer, target _blank), JS code block, inline and block maths (2 KaTeX nodes). Matches the preview. No raw HTML payload was tried (S-level). | none |
| MD05 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. (The editor/toolbar is behind login.) | — |
| MD06 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. (The editor/toolbar is behind login.) | — |
| MD07 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. (The editor/toolbar is behind login.) | — |
| MD08 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |

### 7. Answers/comments (AN)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| AN01 | L | PASS | Posted a valid answer on the QA question with the same moderator account (no second student account). Author and body correct; answer count 0 -> 1; survived reload. 'Answer by B' wording not tested. | none |
| AN02 | L | NOT RUN | A 9-char answer was blocked by minlength 10; answer-edit Cancel and original-preserved not run. | — |
| AN03 | L | NOT RUN | Partially exercised in round 2 with the moderator account but not recorded in enough detail to claim PASS. | — |
| AN04 | L | NOT RUN | One answer was accepted ('Accepted by question author', 'Remove acceptance' shown). The two-answer ordering/exclusivity was not run. | — |
| AN05 | L | NOT RUN | Partially exercised in round 2 with the moderator account but not recorded in enough detail to claim PASS. | — |
| AN06 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| AN07 | L | PASS | Comment form on the answer: 1-char comment blocked by minlength 2; valid comment posted with correct author and date and survived reload. Empty-comment and 1,000-char boundary not tested. | none |
| AN08 | L | NOT RUN | Comment form Cancel and other-device read not run. | — |
| AN09 | O | PASS | O-test on own QA answers/comments: Delete confirm 'Delete this answer and its comments?' Cancel kept item; confirm deleted it (intercepted confirm, own disposable content only). | none |

### 7. Votes (VO)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| VO01 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| VO02 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| VO03 | L | PASS | On own question and own answer the Upvote/Downvote buttons are disabled (4/4); scores stayed 0. Only self-vote part observed; other accounts not available. | none |
| VO04 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |

### 7. Reputation (REP)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| REP01 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| REP02 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| REP03 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| REP04 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |

### 8. Notifications (NO)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| NO01 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| NO02 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| NO03 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| NO04 | L | PASS | Single-account variant: answering own question, accepting own answer and commenting on own answer produced no notification; /notifications shows 'No notifications yet'. The 'B comments on own answer' wording was not run. | none |
| NO05 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| NO06 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| NO07 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| NO08 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| NO09 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| NO10 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| NO11 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| NO12 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| NO13 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |

### 9. Feed (FE)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| FE01 | L | NOT RUN | Anonymous browse + opening a question observed; signed-in browsing and 'Back to results' not run. | — |
| FE02 | L | PASS | Typed 'salty' in search box + Enter -> URL ?search=salty, 1 question (airplane food). Refresh/preserved-URL part checked by loading ?search= URLs directly. | none |
| FE03 | L | PASS | ?search=keys returned the 'primary key vs foreign key' question (stemming key/keys works). Partial-substring non-match was not separately tested (not required). | none |
| FE04 | L | PASS | ?search=zzzabsentqq and ?search=[ (%5B) both gave '0 questions' + 'No matching questions — Try a different search or clear your filters.'; no crash. | none |
| FE05 | L | PASS | Combined filters via URL params (scope, subject, status, academicSystem) returned results consistent with each filter; checked on a small data set. | none |
| FE06 | L | NOT RUN | Tag links exist and ?tag=dbms works; clicking a tag from a card not run. | — |
| FE07 | L | BLOCKED | Needs >10 matching questions; live feed currently has 2 (observed). Owner must seed staging. | — |
| FE08 | L | PASS | Filter state is in the URL query string; Back/Forward and direct loading of filtered URLs restored the filters. | none |

### 9. Subjects (SU)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| SU01 | L | NOT RUN | Dropdown lists 30 subjects (matches handoff); icon association not inspected. | — |
| SU02 | L | NOT RUN | Alias search not run. | — |
| SU03 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. (Needs login to open the edit form.) | — |

### 9. Academic levels (AC)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| AC01 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| AC02 | L | NOT RUN | Partially exercised in round 2 with the moderator account but not recorded in enough detail to claim PASS. | — |
| AC03 | L | NOT RUN | Partially exercised in round 2 with the moderator account but not recorded in enough detail to claim PASS. | — |
| AC04 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| AC05 | L | NOT RUN | Partially exercised in round 2 with the moderator account but not recorded in enough detail to claim PASS. | — |

### 10. College (CO)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| CO01 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| CO02 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. Also: only one college (DAITM) appears in the live signup dropdown, so the two-college cases need staging fixtures. | — |
| CO03 | L | PASS | Feed scope options (My college / Selected subject worldwide / Everything) changed the result set via the scope param on the moderator account. | none |
| CO04 | L | PASS | Scope 'college' vs 'all' compared with the moderator account; the single college (DAITM) means cross-college separation is not proven. | none |
| CO05 | L | PASS | Selected-subject-worldwide scope with subject param observed; limited by one college. | none |
| CO06 | L | PASS | Anonymous tab (no forum-token): scope control defaults to 'Everything' (all 3 live questions shown); options My college / Selected subject worldwide / Everything exist. Signed-in 'My college' default was seen earlier with the moderator account. | none |
| CO07 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. Two-college cases also need a second QA college. | — |
| CO08 | L | PASS | Scope selection persisted in the URL on reload. | none |
| CO09 | L | NOT RUN | Not run. | — |
| CO10 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |

### 11. Profile (PR)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| PR01 | L | PASS | Public profile of another user (test_ac_1) shows no email, no Edit profile and no Sign out everywhere buttons. | none |
| PR02 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| PR03 | L | PASS | Own profile tablist: focus on 'Recent questions'; ArrowRight -> 'Recent answers' selected+focused with its panel; Home -> first tab; End -> last tab (aria-selected followed focus each time). | none |
| PR04 | L | PASS | Own profile (Raju Sharma, Admin) shows Edit profile and Sign out everywhere, reputation 15, and tabs with counts (1 question, 1 answer). | none |

### 11. Roles (RO)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| RO01 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| RO02 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| RO03 | O | PASS | Read-only inspection: in the Users table the admin account row has NO Suspend / Make teacher buttons; student rows do. Not tested: server-side rejection of such actions (S-level). | none |
| RO04 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |

### 12. Admin (AD)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| AD01 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| AD02 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| AD03 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| AD04 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| AD05 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| AD06 | O | PASS | Owner-signed-in moderator session: /admin shows Users and Reports tablist. ArrowRight on Users moved focus + selection to Reports (roving tabindex 0/-1), Home returned to Users. Users table lists 8 accounts; Reports shows 'All caught up — no pending reports'. Pagination not exercised (too little data). Read-only; nothing clicked in the table. | none (emails not captured) |
| AD07 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| AD08 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| AD09 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |

### 13. Data export/deletion (DA)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| DA01 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| DA02 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| DA03 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| DA04 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| DA05 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| DA06 | O | PASS | Account page shows 'Transfer administrator ownership through the project owner before deleting your account.' next to Export my data / Delete account. Nothing submitted. | none |
| DA07 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |

### 13. Email/recovery (EM)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| EM01 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| EM02 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| EM03 | O | BLOCKED | O-test: needs explicit owner approval for the exact disposable target. Not given. | — |
| EM04 | L | BLOCKED | Needs a controlled non-allowlisted test email address from the owner, and permission to submit the forgot-password form on live. | — |
| EM05 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| EM06 | L | BLOCKED | Needs disposable student QA accounts (A/B/C) or a second signed-in user. Only the owner's moderator account is available; I may not create accounts or enter passwords. | — |
| EM07 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |

### 14. Theme/mobile/usability (UX)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| UX01 | L | PASS | Button label/aria-label and stored value agreed in each state: 'System. Switch to Light' (stored system) -> 'Light. Switch to Dark' (stored light, body bg rgb(250,249,252)) -> 'Dark. Switch to System' (stored dark, bg rgb(20,18,27)) -> back to System. Sliding-indicator position only seen in screenshots (Light visible on mobile). | UX06-UX07 screenshot |
| UX02 | L | PASS | Focused the theme button, Enter: Dark->System; Space: System->Light. Native button, no dropdown. (Visible focus ring not inspected.) | none |
| UX03 | L | PASS | With theme 'System', emulated OS dark -> data-theme=dark, body bg rgb(20,18,27), no reload needed; emulated OS light -> data-theme=light, bg rgb(250,249,252). Stored pref stayed 'system'. | none |
| UX04 | L | BLOCKED | Needs the OS reduced-motion setting; changing system settings is not allowed for this run. | — |
| UX05 | L | NOT RUN | Light and Dark seen on home, question and profile pages; not every screen. | — |
| UX06 | L | PASS | Scope: viewport EMULATION (Pixel 8 UA, 390x844 portrait) only; public pages /, /login, /signup, /doubts/<id> all had scrollWidth = 390. Round 2 (public pages, logged out): 320x640 -> /, /login, /signup scrollWidth 320; landscape 844x390 -> /signup scrollWidth 829 <= 844. Not tested: 375px, authenticated pages, a physical phone. | UX06-UX07 screenshot |
| UX07 | L | PASS | Menu button toggles aria-expanded true/false; closes after clicking the 'Sign in' link (navigated to /login, expanded=false). Escape did NOT close the menu (2/2 attempts) — see SUSP-01 (the playbook's expected result does not explicitly require Escape). | UX06-UX07 screenshot |
| UX08 | L | NOT RUN | Only skip link and first Tab stop checked; full keyboard order not run. | — |
| UX09 | L | PASS | First Tab from page top focuses 'Skip to content' (#main); Enter moved to #main; next Tab landed on 'Search questions' input inside <main>. Home page only; 200% zoom not tested. | none |
| UX10 | L | NOT RUN | Empty and error states seen; loading/validation partially seen. | — |
| UX11 | L | BLOCKED | No screen reader available to this run. | — |
| UX12 | L | NOT RUN | Partially exercised in round 2 with the moderator account but not recorded in enough detail to claim PASS. | — |
| UX13 | L | PASS | /no-such-page -> 'Page not found' + 'Back to questions'. /doubts/not-a-valid-id -> 'Invalid record ID. Try again'. /doubts/000…000 -> 'This content could not be found. Try again'. /users/000…000 -> 'This content could not be found.' No crash. | none |

### 15. Advanced technical (TE)

| ID | Env | Result | Actual observation / reason | Evidence |
|---|---|---|---|---|
| TE01 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| TE02 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| TE03 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| TE04 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| TE05 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| TE06 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| TE07 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| TE08 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| TE09 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| TE10 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| TE11 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| TE12 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |
| TE13 | S | BLOCKED | S-test: staging/local-only; never run on live. No approved staging/local environment or device shell available to this run. | — |


## Evidence files (docs/qa-evidence/run-01/)

- SM06-home-dark-desktop-pane.jpg — home feed, dark/System theme, public data only.
- UX06-UX07-mobile-390-menu-open.jpg — 390px emulated viewport, Menu open, Light theme.

Most observations were read from page text/DOM state (no screenshot). The screenshots show only public content.
