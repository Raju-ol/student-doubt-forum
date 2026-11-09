# Student Doubt Forum — Complete Manual Testing Playbook

Version 1.1 · Updated 10 November 2026 · Share this file with the tester

**Website:** https://student-doubt-forum-theta.vercel.app/

**Goal:** Poora application test karna, reproducible bugs report karna, aur har test ka actual result record karna. Coding knowledge normal UI tests ke liye required nahi hai.

This checklist is a test plan, **not a claim that these tests have passed**. Every case below starts as NOT RUN. Developer automated checks last passed at 78 tests (QA Escape fix); those do not replace browser testing. Recheck the release deployed when testing begins.

## 1. Read this first

- Use the main website above, not a random preview deployment URL.
- Real users ke posts, accounts, roles, reports ya files ko change/delete mat karna.
- Test content ko `QA-<your initials>-<date>-<case ID>` prefix do. Example: `QA-RS-10NOV-Q01 — Database normalization question`.
- Owner ke admin password, MongoDB/Cloudinary/Redis/Resend credentials ya keys nahi chahiye. Kabhi maangna ya report mein paste mat karna.
- Test accounts apne control wale email addresses se banao. Passwords privately rakho; results sheet mein mat likho.
- Admin tests owner apne session mein kare, ya owner separately approved test access provide kare. Checklist khud admin access dene ki permission nahi hai.
- Permanent deletion, account deletion, role/ban changes, destructive moderation and catalogue additions ke liye owner-approved test targets required hain. Cancel first, then perform only on those targets.
- Live website par load test, brute-force, mass signup/upload, rate-limit exhaustion, XSS payloads, outage simulation ya migrations mat chalao. Advanced cases staging/local only hain.
- Stop immediately if another user's private data becomes visible, a real record changes unexpectedly, or the application causes broad failures. Save redacted evidence and notify the owner.

### Test environment labels

| Label | Meaning |
|---|---|
| L | Live-safe at normal human pace, using only your approved QA accounts/content |
| O | Owner-supervised / explicitly approved targets; may alter permissions, account or data permanently |
| S | Staging/local disposable environment only; developer assistance may be needed |

### Current expected behavior — important

| Feature | What to expect in this release |
|---|---|
| Email verification | All-user verification is OFF; unverified friends can sign up/post |
| Password recovery | Owner-only test mode; only the configured Resend-account email receives reset mail. Owner performs that test privately |
| Other addresses on Forgot password | Same generic confirmation, but no email; this alone is not a defect in this configuration |
| Notifications | In-app bell/inbox for replies, comments and first acceptance; can take about 60 seconds on a visible idle page |
| Email notifications / phone push / mentions | Not implemented; do not mark missing behavior as a regression |
| System theme | Follows device/OS preference; System and Dark may look identical on a dark OS |
| Theme control | One button cycles System → Light → Dark → System; icons are not three separate direct-selection buttons |
| College | Optional/self-reported public discovery metadata, not verified membership or private college access |
| College feeds | Existing unassigned legacy posts may only appear in Everything/subject-worldwide; no automatic production backfill |
| Search | Whole/stemmed English words, not arbitrary partial substrings |
| Attachments | JPG/JPEG, PNG, WebP; up to 3 MiB each (3 × 1024 × 1024 bytes), 3 per question |
| Editing question attachments | Existing images are preserved; attachment replacement/removal during question editing is not implemented |
| Comments | Add/read comments on answers; question-level comments and comment edit/delete are not implemented |
| Drafts | Not auto-saved. Write/Preview should preserve the current draft. Leaving/reloading can discard it after the applicable warning |
| Backend outages | Safe error/retry messages are expected; never change live provider configuration to trigger them |
| Atlas access | Temporary network rule remains an owner operational follow-up; do not modify or extend it |

## 2. Test setup and accounts

Use a normal browser window and an Incognito/private window for separate sessions. Never use browser profiles holding another person's saved credentials.

| Account | Purpose | Setup |
|---|---|---|
| A | Student asking questions | Controlled test email, no elevated role |
| B | Student answering/commenting | Different controlled test email |
| C | Third-party voter and permission checks | Different controlled test email; useful for voting without self-votes |
| T | Teacher badge checks | Owner may promote a named disposable account, then restore it |
| D | Account deletion only | Separate disposable account; owner must approve deletion; never A/B/owner/admin |
| Admin | Moderation/catalogue tests | Owner-operated session or separately authorized limited test arrangement |

For college scope tests, owner supplies two existing QA colleges, College 1 and College 2, or prepares them on staging. Do not invent real affiliations or add throwaway catalogue records on live without approval; there is no catalogue deletion UI.

Prepare: one small JPG, PNG and WebP; a >3 MiB image; an unsupported PDF/text file; harmless screenshots without personal data. Use fake/renamed image payloads only in the staging advanced section.

### Run information — fill before testing

```text
Tester:
Start/end date and time (timezone):
Website/environment:
Deployment/commit (owner supplies if available):
Desktop browser/version and OS:
Phone/browser/version and OS:
Viewport / screen dimensions:
Account labels used (no passwords):
Owner-approved O tests and exact disposable targets:
Known configuration / unavailable prerequisites:
```

### Result rules

Replace `NOT RUN` with `PASS`, `FAIL`, `BLOCKED` or `N/A` in the last column.

- PASS: you actually ran the steps and observed the expected result.
- FAIL: attach a bug ID and observed behavior.
- BLOCKED: prerequisite/environment/access unavailable; name what is missing.
- N/A: owner confirms feature is disabled/outside this release; explain why.
- A section is not complete while any required case is unexplained NOT RUN/BLOCKED.
- Owner's earlier informal checks are useful context, but tester must not pre-mark cases PASS.

## 3. Quick smoke test — run first (P0, L)

| ID | Steps | Expected result | Result |
|---|---|---|---|
| SM01 | Open home, login, signup, a question direct link; refresh each | No blank page, broken route or raw server error | NOT RUN |
| SM02 | Login A; create one QA question; B answers | Saved question/answer survive refresh and appear under correct authors | NOT RUN |
| SM03 | A accepts B's answer; C upvotes it | Accepted state and score visible; no duplicate mutation | NOT RUN |
| SM04 | Check A/B notification inboxes; mark one read | Correct recipient/event; read state and badge update | NOT RUN |
| SM05 | Upload one small screenshot to a QA question | Preview and posted attachment render on desktop/phone | NOT RUN |
| SM06 | Cycle theme and test mobile Menu | All modes work; menu/buttons reachable without page overflow | NOT RUN |

If login/posting is broadly unavailable, report a blocker before creating more data.

## 4. Signup, login and session handling (P0/P1, L unless stated)

| ID | Steps | Expected result | Result |
|---|---|---|---|
| AU01 | Create A with valid name/email/password, no academic level or college | Signup works; fields are optional; correct account displayed | NOT RUN |
| AU02 | Try blank fields, invalid email, 1-character name, <8-character password | Clear validation; no invalid account created | NOT RUN |
| AU03 | Test valid password near 72-byte limit on staging, including multibyte characters | Backend enforces 72 bytes, not just characters; safe validation | NOT RUN |
| AU04 | Attempt an existing controlled email, including casing/outer whitespace | Duplicate normalized email rejected; no second account | NOT RUN |
| AU05 | Toggle Show/Hide password | Input visibility and accessible label/state agree; entered value preserved | NOT RUN |
| AU06 | Try incorrect password / unknown controlled address, then valid login | Generic invalid-credentials error; successful retry works | NOT RUN |
| AU07 | Refresh current signed-in tab | Same session restored; no unnecessary sign-out | NOT RUN |
| AU08 | Sign out; revisit Ask/Account/Admin/direct write-related pages | Protected pages require login; private account content not visible | NOT RUN |
| AU09 | From logged-out question, select answer/vote/Ask login prompt; sign in | Return to intended internal page where supported | NOT RUN |
| AU10 | Open fresh independent Incognito window | Separate session; do not expect automatic cross-window login (sessionStorage design) | NOT RUN |
| AU11 | Login same disposable account in two independent sessions; use Sign out everywhere | Confirm dialog; both old sessions rejected on next API action; fresh login works | NOT RUN |
| AU12 | Cancel Sign out everywhere | Both sessions remain usable | NOT RUN |
| AU13 | Visit /admin as a normal student | Access denied; no users/report list exposed | NOT RUN |

Boundary detail: names 2–60 characters; email max 254; password at least 8 characters and at most 72 UTF-8 bytes. Browser wording can differ; backend must enforce the constraint.

## 5. Questions and attachments (P0/P1)

| ID | Env | Steps | Expected result | Result |
|---|---|---|---|---|
| QU01 | L | Create QA question: title ≥10, body ≥20, subject, optional tags/level | Correct values saved; redirected to new discussion | NOT RUN |
| QU02 | L | Try empty, too-short and whitespace-only title/body | Rejected without publishing empty content | NOT RUN |
| QU03 | L | Test 160-character title, 12,000-character body; one over boundary where UI permits | Limits enforced without crash/truncation surprise | NOT RUN |
| QU04 | L | Enter 5 tags with spaces/casing/duplicates; attempt 6 or tag >24 chars | Trim/lowercase/deduplication; excess invalid input rejected | NOT RUN |
| QU05 | L | Post with no tags and no images | Valid text-only question works | NOT RUN |
| QU06 | L | Edit A's title/body/subject/tags/academic level; save and refresh | Only intended QA question changes; attachments preserved | NOT RUN |
| QU07 | L | Edit then Cancel | Original persisted values remain | NOT RUN |
| QU08 | L | Change draft; follow a normal internal link, cancel leave warning; then confirm leave | Warning protects that link navigation; cancel preserves draft; confirming may discard | NOT RUN |
| QU09 | L | Type draft then refresh/close (test dummy text only) | Browser warning where supported after user interaction; no claim of auto-save | NOT RUN |
| QU10 | L | Observe Back/Forward and draft behavior | No crash; record unexpected data loss. Back-navigation protection is not guaranteed by current guard | NOT RUN |
| QU11 | L | B views A's question | No unauthorized Edit/Delete controls; public content readable | NOT RUN |
| QU12 | O | On a marked disposable question with B's test answer/comment, cancel Delete; later approve deletion | Cancel changes nothing; confirmed deletion removes that question and dependent test content; direct old link safe unavailable | NOT RUN |
| IM01 | L | Upload small JPG, PNG and WebP across approved QA drafts | Supported images accepted; previews visible | NOT RUN |
| IM02 | L | Attach 3 images; attempt a fourth | Three-image maximum enforced | NOT RUN |
| IM03 | L | Try >3 MiB image and unsupported PDF/text | Clear rejection; no broken permanent attachment | NOT RUN |
| IM04 | L | Remove an unused preview image before posting | It disappears; remaining images still post correctly | NOT RUN |
| IM05 | L | Post attached image; refresh; open discussion in other browser/phone | Correct image persists; aspect ratio/readability acceptable | NOT RUN |
| IM06 | L | Edit image-bearing question | Existing attachment remains; do not expect replacement controls in this release | NOT RUN |
| IM07 | S | Upload a text file disguised as JPG using controlled API test | Signature validation rejects it; no execution or stored bogus image | NOT RUN |
| IM08 | S | Attempt to attach/delete another QA user's image ID | Permission/ownership rejection; other user's image intact | NOT RUN |
| IM09 | S | Reach unused upload cap with controlled fixture | 9 unused uploads cap enforced; owner can remove unused uploads; no live upload flooding | NOT RUN |

## 6. Markdown, code and maths (P1, L; malicious payloads S only)

Use this harmless sample in a QA question or answer:

````text
**Bold** and *italic*, `inline code`.

- First item
- Second item

> A quoted explanation

[Documentation](https://developer.mozilla.org/)

```js
const result = 2 + 2;
console.log(result);
```

Inline maths: $x^2 + y^2$.

$$E = mc^2$$
````

| ID | Steps | Expected result | Result |
|---|---|---|---|
| MD01 | Try each toolbar tool: Bold, Italic, Inline code, Code block, Maths, List, Link, Quote | Inserts/wraps usable Markdown; selected text not lost | NOT RUN |
| MD02 | Switch Write → Preview → Write repeatedly | Draft preserved; Preview hides source textarea and shows formatted output | NOT RUN |
| MD03 | Preview blank body and sample above | Helpful empty state; formatting/code/maths render without crash | NOT RUN |
| MD04 | Post sample and reopen discussion | Stored body matches preview; no raw HTML execution | NOT RUN |
| MD05 | Long code line, unknown code language, malformed maths | Readable fallback; code/math may scroll internally; whole page does not overflow | NOT RUN |
| MD06 | Read an old plain-text question and feed excerpt | Readable text; no unexpected markup loss; feed preview is plain text | NOT RUN |
| MD07 | Keyboard through toolbar/Write/Preview tabs; arrows/Home/End where supported | Focus visible, controls labelled, tab selection works | NOT RUN |
| MD08 | On staging only, developer checks HTML/script/unsafe-link payloads | Payload inert; unsafe elements/attributes absent; no alerts/execution/navigation | NOT RUN |

Do not click a suspicious payload to prove it is unsafe; developer inspects sanitized DOM in staging.

## 7. Answers, comments, votes, acceptance and reputation (P0/P1)

Use A as question author, B as answer author, C as independent voter. Record B's reputation baseline **R** before REP cases and avoid unrelated votes on B during them.

| ID | Env | Steps | Expected result | Result |
|---|---|---|---|---|
| AN01 | L | B posts a valid answer (10–12,000 chars) | Correct author/body, answer count increases, survives refresh | NOT RUN |
| AN02 | L | Try empty/short answer; cancel answer editing | Invalid save blocked; original answer preserved on cancel | NOT RUN |
| AN03 | L | B edits own answer; A/C inspect it | B can save; unrelated students cannot edit/delete it | NOT RUN |
| AN04 | L | Add two answers and accept one | Only one answer accepted; accepted answer displayed first | NOT RUN |
| AN05 | L | A removes acceptance, then accepts a different answer | Solved/open labels and accepted ordering/counts update consistently | NOT RUN |
| AN06 | L | B/C try accepting A's question's answer | Only question author can accept; no unauthorized effect | NOT RUN |
| AN07 | L | Add a 2–1,000 char comment; test invalid short/empty comment | Comment saved with right author; invalid input rejected | NOT RUN |
| AN08 | L | A comment form Cancel; read comments on another device | Cancel posts nothing; stored comments readable | NOT RUN |
| VO01 | L | C upvotes question, clicks upvote again, downvotes, switches to upvote | Score +1, back to baseline, -1, then +1; selected state matches | NOT RUN |
| VO02 | L | Repeat vote sequence on B's answer | One vote per account/target; undo and switching work | NOT RUN |
| VO03 | L | A tries own-question vote; B tries own-answer vote | Self-voting blocked/disabled; score unchanged | NOT RUN |
| VO04 | L | Refresh after each vote; view as another account | Shared score persists, personal selected vote remains account-specific | NOT RUN |
| REP01 | L | C upvotes B's previously unvoted answer | B reputation R +10; question-author reputation not incorrectly awarded | NOT RUN |
| REP02 | L | C undoes upvote; downvotes; then switches downvote to upvote | Reputation R; R −2; then R +10 (switch delta +12) | NOT RUN |
| REP03 | L | Undo vote; A accepts B's answer, removes acceptance | R +15 on acceptance, back to R on removal | NOT RUN |
| REP04 | O | Delete B's disposable answer with known vote/acceptance state | Removed answer's vote/accept credits reversed once; question reopens if necessary | NOT RUN |
| AN09 | O | Cancel and then confirm deletion of a disposable answer with comments | Cancel keeps it; confirm removes answer/comments; old UI refreshes safely | NOT RUN |

Question votes do not award answer reputation. Negative reputation is allowed; do not assume a zero floor. Report mismatched arithmetic, but do not run production reconciliation yourself.

## 8. Notifications — full live flow (P0/P1, L)

Keep A/B in separate sessions. For idle updates, allow about 60 seconds while the page is visible; navigation/reopening the inbox can update sooner. A hidden background tab is not expected to poll continually.

| ID | Steps | Expected result | Result |
|---|---|---|---|
| NO01 | B answers A's question; A opens bell/inbox | A receives “answered your question”, correct actor/discussion and unread count | NOT RUN |
| NO02 | A accepts B's answer; B opens inbox | B receives “accepted your answer” | NOT RUN |
| NO03 | A comments on B's answer; B opens inbox | B receives “commented on your answer” | NOT RUN |
| NO04 | B comments on own answer; A answers own question on a separate QA thread | No self-notification for each action | NOT RUN |
| NO05 | Mark one notification as read | New label removed, unread count decreases, refresh preserves state | NOT RUN |
| NO06 | Produce 2 unread events; Mark all as read | All own New labels clear and bell count clears; other account unread items unchanged | NOT RUN |
| NO07 | Open discussion from unread notification | Correct discussion opens and that item becomes read | NOT RUN |
| NO08 | A removes/re-adds acceptance to the same answer | No repeated acceptance spam; only first acceptance per answer currently notifies | NOT RUN |
| NO09 | View inbox A then B/C | Each sees only own items; actor email not exposed in the notification | NOT RUN |
| NO10 | Owner removes a disposable target discussion that has a notification | Item handles removed discussion safely instead of crashing | NOT RUN |
| NO11 | Check brand-new account's empty inbox | Clear empty state; no error or other users' notifications | NOT RUN |
| NO12 | On staging with >25 seeded notifications, paginate and mark items read | Correct pages/counts; no cross-user items or duplicate rows | NOT RUN |
| NO13 | Observe brief offline inbox load, then reconnect and retry | Helpful error/retry; no fabricated read state or false success | NOT RUN |

Owner informally reported answer/acceptance/comment live flows working on 10 November. Tester should still rerun these independently. Push notifications, mentions and email digests are out of scope.

## 9. Feed, search, subjects and academic levels (P1, L unless stated)

| ID | Steps | Expected result | Result |
|---|---|---|---|
| FE01 | Browse anonymously and signed in; open question and Back to results | Public discussions readable; filters/navigation sensible | NOT RUN |
| FE02 | Search a known distinctive word in your QA title/body | Expected matching question found; refresh preserves URL search | NOT RUN |
| FE03 | Search related English forms, e.g. normalize/normalizing on suitable test text | Word stemming works; arbitrary `normali` substring is not required to match | NOT RUN |
| FE04 | Search absent text and punctuation `[` | Safe no-results/empty state, no regex/server crash | NOT RUN |
| FE05 | Combine subject, academic system/number, tag, open/accepted status and search | Results satisfy combined filters; clear filters resets them | NOT RUN |
| FE06 | Click a tag from a card/detail | Correct tag-filtered feed opens | NOT RUN |
| FE07 | If >10 matching questions exist, use pagination; otherwise owner seeds staging | Correct next/previous state, no missing/duplicate rows on unchanged dataset | NOT RUN |
| FE08 | Refresh a filtered URL and use browser Back/Forward | Controls and results reflect URL; changing a filter resets pagination | NOT RUN |
| SU01 | Inspect subject dropdown/sidebar | Catalogue loads across fields; icons remain associated with subject, not position | NOT RUN |
| SU02 | Search/filter using canonical subject and known alias, e.g. DBMS/Databases | Same subject scope; new known-alias API input canonicalizes (developer case if no UI alias input) | NOT RUN |
| SU03 | Open/edit a legacy question whose subject is not in catalogue | Existing subject remains readable/editable; no silent loss | NOT RUN |
| AC01 | Signup/profile/question with no academic level | Valid; clear unspecified label rather than `undefined`/broken text | NOT RUN |
| AC02 | Use Semester, Year and Grade with level 1/30 | Saved label and matching filter work | NOT RUN |
| AC03 | Try 0, 31 and nonnumeric level; empty/overlong Other label | Rejected; Other label valid at 1–60 characters | NOT RUN |
| AC04 | Save Other → change to Year → clear optional level | No stale semester label/field; correct saved display after refresh | NOT RUN |
| AC05 | Read/filter legacy Semester 1–8 question | Continues working without requiring a migration | NOT RUN |

Search relevance may change order; do not expect newest-first for a text search. Profile lists show recent contributions (currently up to 50), not a full historical export.

## 10. College selection and public feed scopes (P1)

| ID | Env | Steps | Expected result | Result |
|---|---|---|---|---|
| CO01 | L | Signup/profile without a college | Valid independent learner; default Everything | NOT RUN |
| CO02 | L | A selects supplied College 1, B selects supplied College 2 | Selection persists; clearly self-reported, no verified badge implied | NOT RUN |
| CO03 | L | A/B create separate QA questions after selection | Each new question belongs to poster's selected college | NOT RUN |
| CO04 | L | Open My college as A/B | Shows matching college; excludes other/unassigned college records | NOT RUN |
| CO05 | L | Select Everything; then a subject + Selected subject worldwide | Can discover public questions across colleges within selected subject | NOT RUN |
| CO06 | L | Anonymous/no-college user inspects My college control/direct URL | Disabled or clear login/selection error; no crash | NOT RUN |
| CO07 | L | Change A's selected college; review old/new posts | Default feed/future posts follow new selection; old posts are not silently reassigned | NOT RUN |
| CO08 | L | Clear subject while using subject-worldwide scope | Falls back to usable Everything scope, not a broken filter | NOT RUN |
| CO09 | L | Open another college's question direct public link | It is public; this is expected, not an authorization leak | NOT RUN |
| CO10 | S | Submit question with a different college ID using controlled API | Cannot forge another college; explicit null creates worldwide-only question | NOT RUN |

If only one college is available, mark the two-college cases BLOCKED pending staging fixtures. Never move production users in bulk or infer affiliation from email.

## 11. Profile and teacher/admin permissions (P1)

| ID | Env | Steps | Expected result | Result |
|---|---|---|---|---|
| PR01 | L | View own and another QA profile | Correct public name/role/reputation/recent posts; other user's email/private data absent | NOT RUN |
| PR02 | L | Change own name, optional academic level and college; cancel/save/reload | Cancel preserves old data; save updates only own profile | NOT RUN |
| PR03 | L | Switch Recent questions/Recent answers with mouse and keyboard arrows/Home/End | Correct panel; visible focus and one selected tab | NOT RUN |
| PR04 | L | Inspect another user's profile | No unauthorized Edit profile or Sign out everywhere action | NOT RUN |
| RO01 | O | Owner promotes named T account to teacher, then restores student | Teacher badge appears/disappears in appropriate posts/profile after refresh; no admin privilege granted | NOT RUN |
| RO02 | O | Owner suspends only named disposable account with active session | Existing session action/login rejected; restore makes valid login possible | NOT RUN |
| RO03 | O | Inspect admin account controls | Admin accounts cannot be casually suspended/demoted/deleted through these user actions | NOT RUN |
| RO04 | S | Controlled API sends forged role/reputation/tokenVersion on public signup/profile update | Privilege escalation ignored/rejected; no admin granted or score overwritten | NOT RUN |

## 12. Reports, moderation and catalogue administration (P1, O unless stated)

| ID | Steps | Expected result | Result |
|---|---|---|---|
| AD01 | Student reports a disposable question and an answer with valid reason | Confirmation; each appears in owner admin report queue | NOT RUN |
| AD02 | Cancel report; try reason <5/>1,000 chars; duplicate pending report | Cancel creates nothing; validation/deduplication clear | NOT RUN |
| AD03 | Owner dismisses only a QA report | Report leaves pending queue; content remains | NOT RUN |
| AD04 | Owner cancels Remove content, then confirms on designated disposable answer | Cancel no effect; confirmed answer/comments removed safely | NOT RUN |
| AD05 | Owner removes designated QA question with dependent content/images | Cascade cleanup; old links unavailable; unrelated content preserved | NOT RUN |
| AD06 | Owner uses Users/Reports tabs and keyboard; pagination if data permits | Correct panel/list, page resets on tab change; no blank admin page | NOT RUN |
| AD07 | On staging, owner creates QA subject with alias; duplicate canonical/alias slug attempted | Subject appears; conflicting alias/name/slug rejected; normal students cannot administer | NOT RUN |
| AD08 | On staging, owner creates QA college; invalid country/duplicate slug tested | Valid record visible, format/duplicate rejected; no unearned verification flag | NOT RUN |
| AD09 | Refresh after catalogue addition | Relevant selectors update; existing posts/subjects retain meaning | NOT RUN |

On live, use existing real approved catalogue entries; adding throwaway records requires explicit owner agreement because there is no remove/edit catalogue workflow yet. Redact unrelated admin-list names/emails in screenshots.

## 13. Account data export, deletion and recovery

### Export and deletion — owner-approved disposable targets only

| ID | Env | Steps | Expected result | Result |
|---|---|---|---|---|
| DA01 | O | D creates QA contributions, then Account → Export my data | Private NDJSON download opens as one JSON object per line; own account/contributions present | NOT RUN |
| DA02 | O | Inspect export locally (do not publish file) | No password/recovery hashes, bearer token or unrelated users' private details | NOT RUN |
| DA03 | O | For D only, try incorrect password/confirmation; cancel final deletion dialog | Account/content remains; clear rejection; no accidental image deletion | NOT RUN |
| DA04 | O | With owner approval, D types DELETE/current password and confirms | Sign-in access revoked; name/email anonymized; uploaded images removed; discussions retained under Deleted user | NOT RUN |
| DA05 | O | Try old D session/login/profile link; view retained test discussion as A | Old session/login rejected; profile unavailable; discussion does not crash | NOT RUN |
| DA06 | O | Inspect own admin deletion section without submitting | Ownership-transfer restriction shown; do not attempt deleting owner/admin | NOT RUN |
| DA07 | S | Developer simulates image-provider failure on disposable deletion | Safe failure; account remains accessible for retry; no other user's images removed | NOT RUN |

Deletion is irreversible through the UI. Discussion text/comments/votes and moderation records can remain; remove personal information from test text first. This flow is not a guarantee of complete erasure or legal compliance. Never delete A/B/C before finishing dependent tests.

### Current owner-only recovery configuration

| ID | Env | Steps | Expected result | Result |
|---|---|---|---|---|
| EM01 | O | Owner privately requests reset for configured Resend-account email | Generic confirmation; actual mail in Inbox/Spam with correct website link | NOT RUN |
| EM02 | O | Owner opens link and sets a new password privately, then logs in | New login works; old password/old sessions rejected | NOT RUN |
| EM03 | O | Owner reopens the consumed reset link | Reuse rejected safely | NOT RUN |
| EM04 | L | Request reset once for a controlled non-allowlisted test email | Generic response but no mail in this configuration; no leak of allowlist/account existence | NOT RUN |
| EM05 | S | Developer tests expired link, invalid token, too-short/over-72-byte password and older other-user token | Safe rejection; no unintended password update | NOT RUN |
| EM06 | L | New unverified student signs up/posts | Posting remains possible while EMAIL_ENABLED is off | NOT RUN |
| EM07 | S | Owner/developer configures full verification with a suitable test mail adapter | One-use verification links, unverified posting block, verified posting success, resend limits and expiry | NOT RUN |

Full verification/all-user email is **not active** until an owned sender domain is verified. Tester must not enable EMAIL_ENABLED, change Resend settings, receive the owner's reset link or choose the owner's password. Owner already informally reported real recovery/login working; a formal rerun needs owner participation.

## 14. Theme, mobile, keyboard and usability (P1, L)

Test at least desktop Chrome plus one other desktop browser, Android Chrome if available, and Safari/iPhone if available. Unavailable platforms must be BLOCKED/N/A with explanation, never assumed PASS.

| ID | Steps | Expected result | Result |
|---|---|---|---|
| UX01 | Click theme button through 3 modes | System → Light → Dark → System; indicator position, visible name and colors agree | NOT RUN |
| UX02 | Activate theme with Tab + Enter/Space | Native button works; focus visible; no dropdown appears | NOT RUN |
| UX03 | Reload after Light/Dark; change OS theme while System selected | Saved preference restored; only System follows OS | NOT RUN |
| UX04 | Enable OS reduced-motion setting | Theme indicator does not require animation; control still works | NOT RUN |
| UX05 | Review feed, detail, editor preview, profile, account, inbox, admin in Light/Dark | Readable text/badges/errors/code/maths; no invisible labels or white-on-white controls | NOT RUN |
| UX06 | Phone portrait/landscape, 320/375/390px widths where possible | No whole-page horizontal overflow; menus/forms/actions reachable; code/table may scroll internally | NOT RUN |
| UX07 | Open/close mobile Menu; Escape; navigate from it | Expanded state matches; closes on navigation; keyboard focus usable | NOT RUN |
| UX08 | Tab through forms, toolbar, tabs, vote buttons, dialogs and notification controls | Logical focus order, visible focus, usable labels; no keyboard trap | NOT RUN |
| UX09 | Use Skip to content and 200% browser zoom | Main content reachable; content/actions not lost or obscured | NOT RUN |
| UX10 | Inspect loading, empty and validation/error states | Meaningful messages; retry possible where offered; no indefinite spinner or duplicate success | NOT RUN |
| UX11 | Use screen reader if available | Theme current/next mode, tabs/selected panel, menu state and alerts understandable | NOT RUN |
| UX12 | Slowly double-click a save/post action and observe busy state | Action cannot accidentally produce duplicates during in-flight request; record observed behavior | NOT RUN |
| UX13 | Open invalid route, malformed/missing discussion/profile link | Safe not-found/error screen; navigation back still usable | NOT RUN |

Do not claim WCAG compliance from this checklist alone. Report contrast, focus and screen-reader problems with exact element/screen.

## 15. Failure handling and advanced technical checks (S, developer-assisted)

These are deliberately separate from live manual testing. Do not disable real providers, alter real tokens, erase databases or flood the public API.

| ID | Check | Expected result | Result |
|---|---|---|---|
| TE01 | Anonymous/other-user API writes, export, notification read mutation and admin routes | Correct 401/403/404; no private data or mutation | NOT RUN |
| TE02 | Unsafe JSON, invalid IDs, oversized payloads, unsupported image signature | Safe 4xx response without stack trace/connection string/secret | NOT RUN |
| TE03 | Stored Markdown XSS/unsafe links and literal HTML/code | Sanitized/inert; code never executes; links safe | NOT RUN |
| TE04 | Expired/revoked/tampered JWT, ban/unban and token-version reset | Old/invalid session denied; valid new session allowed | NOT RUN |
| TE05 | Redis counters across 2 controlled instances | API 600/IP/15min; auth 30/IP + normalized email/15min; upload 15/account/hour; 429 + retry/reset info | NOT RUN |
| TE06 | Redis missing credentials/network/malformed response in production-like staging | Safe 503; no silent per-instance fallback; health configuration mode alone is not proof of connectivity | NOT RUN |
| TE07 | Mail throttles/expiry/replay/provider failure | No recipient/account enumeration in response body; no token leak; single-use preserved | NOT RUN |
| TE08 | Simulate offline/network/server failure then reconnect | Useful error; retry works; no false saved/read state | NOT RUN |
| TE09 | Concurrent same vote/accept/delete and interrupted cleanup | No unexplained duplicate credit; conflicts safe; document multi-document partial-state limitations | NOT RUN |
| TE10 | Legacy reputation reconciliation, academic/subject/institution migration on restored disposable copy | Dry-run no user/post mutation; apply idempotent; explicit mappings/new values preserved | NOT RUN |
| TE11 | Inspect logs, responses and client bundle/environment names | No private credentials/reset tokens/password hashes; server secrets not VITE_-exposed | NOT RUN |
| TE12 | Measure feed with 1 vs 30 items and representative filters/search | No restored per-item vote/count N+1; catalogue/filter lookups accounted for; record measurements | NOT RUN |
| TE13 | Owner-authorized staging concurrency/load/backup-restore exercise | Record actual latency/errors and restored data checks; do not claim enterprise readiness | NOT RUN |

Operational note: multi-document cleanup/reputation/notification writes do not have complete transaction/outbox recovery. Capture failures accurately rather than hiding them. The owner decides production migration/network actions separately.

Optional developer baseline from repository root, with a local disposable MongoDB test environment configured:

```powershell
npm test
npm run build
npm audit --audit-level=high
```

Tests use uniquely named `forum_test_*` databases. Do not point MONGO_TEST_URI at a real/live database service without the owner reviewing permissions and isolation. No real keys/passwords in logs or shared output. Passing automation does not pre-fill manual cases.

## 16. Bug report template — one issue per report

```text
Bug ID: BUG-001
Related test case ID(s):
Title:
Environment: Live / Staging / Local
Website route (remove private tokens/query fragments):
Release/commit if known:
Browser/version, device/OS, viewport:
Account label/role (A/B/C/D/Admin; no password):
Date/time and timezone:
Severity: Critical / High / Medium / Low

Preconditions / test data IDs or safe QA titles:
1.
2.

Steps to reproduce:
1.
2.
3.

Expected result:
Actual result:
Reproducibility: e.g. 3/3 attempts
Did refresh/retry change it?:
Other browser/device result:
Screenshot/video attachment (redacted):
Safe visible error/status code, if available:
Workaround, if any:
Owner notified / timestamp:
Retest after fix: PASS / FAIL / NOT RUN
```

Severity guidance:

- **Critical:** private data exposure, privilege escalation, destructive change to unrelated/real data, widespread service failure. Stop and contact owner immediately.
- **High:** normal signup/login/post/reply/upload broken, incorrect permission/score/read state, repeatable user-data loss.
- **Medium:** feature usable with a workaround, incorrect filters/notifications, important mobile/keyboard issue.
- **Low:** minor spacing, typo or cosmetic inconsistency without blocked task.

Redact passwords, authorization headers, reset fragments/links, API keys, database URLs, unrelated emails and private export contents. A console screenshot can contain secrets—review before sharing. Do not attach a raw HAR without developer/owner review.

## 17. Final report and handover

```text
Test run ID / tester / dates:
Release(s) tested:
Browsers/devices actually tested:
Total unique cases:
PASS:
FAIL:
BLOCKED:
N/A:
NOT RUN:

Critical/High open bugs:
Other bug IDs:
Untested areas and reasons:
Configuration limitations confirmed with owner:
Approved test accounts/content IDs created:
Cleanup completed / owner cleanup still needed:
Retest results after fixes:
Recommendation: Ready for friend demo / Ready with known limits / Not ready
Reason and remaining owner actions:
```

Before finishing:

- Restore any test teacher role/ban changes with owner; confirm no real accounts affected.
- Leave original college/catalogue/network/provider settings unchanged unless owner explicitly approved the change.
- Ask owner which QA content to keep for demonstration. Do not blanket-delete test data or accounts.
- Close/sign out test sessions; remove private export files according to owner agreement.
- Submit this filled checklist, the final report and separate redacted bug reports.
- Rerun affected cases plus SM01–SM06 after each fix. Do not mark a bug fixed just because a commit exists.
- P0 flows must pass and Critical/High issues must be resolved or explicitly accepted by owner before recommending the demo ready.

**Tester ka kaam:** behavior observe aur evidence record karna. **Owner/developer ka kaam:** approve privileged actions, fix bugs, deploy, manage credentials/network/email activation and decide release readiness.
