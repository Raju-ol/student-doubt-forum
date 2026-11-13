<!-- consistency-review-2026-11-13 -->
> Current status, 13 November 2026 — See [current implementation and limits](CURRENT_STATE.md). The active design has Auto/Light/Dark themes and a separate community resource Library. Institution-scoped curriculum and publication review remain planned. Older counts, release IDs and provider checks below are dated evidence, not current certification.

# Student Doubt Forum — Complete Manual Testing Playbook

## Current release supplement — 13 November 2026

Use [CURRENT_STATE](CURRENT_STATE.md) before the older v2.4 baseline below. The reviewed local base is `a0a45eb` plus consistency fixes; this is not a verified live deployment identifier. Themes now read Auto, Light and Dark. The resource Library lives at `/library`. Legacy worked questions live under the `study-library` tag. Record actual live content counts rather than expecting the November 11 zero-data baseline.

Keep the original A/B/C/T role labels and NOT RUN/BLOCKED/PASS/FAIL evidence rules. Both team members use the same record. Tester A covers desktop and administration; Tester B covers phone, teacher/student and themes. Exchange roles for cross-user checks. Use only approved disposable accounts and no production content cleanup.

| Case | Owner | Action and expected result | Manual status |
| --- | --- | --- | --- |
| DC-01 | B | Signed-in phone header keeps menu, brand and bell/avatar aligned; search sits below | NOT RUN |
| DC-02 | A/B | Open/close drawer, Tab/Shift+Tab containment, Escape and focus restoration; no background scrolling while open | NOT RUN |
| DC-03 | A/B | Account menu opens, Escape closes and returns focus; outside pointer closes | NOT RUN |
| DC-04 | A/B | Theme buttons announce Auto/Light/Dark and preserve preference after reload | NOT RUN |
| DC-05 | B | Dropdown choices, focus rings, selected chips and errors remain readable in both themes | NOT RUN |
| DC-06 | A/B | Long resource titles and supplied descriptions are readable; Open/Download targets the correct material | NOT RUN |
| DC-07 | A | Search keeps Library/category/shelf or Saved/subject context; pagination resets | NOT RUN |
| DC-08 | A/B | Resource Library and worked Q&A remain separate; no claim of institute approval on public community resources | NOT RUN |
| DC-09 | A/B | Student teacher-request → admin approval/decline → teacher dashboard and subject list; refresh role state | NOT RUN |
| DC-10 | A/B | Teacher answer highlight/endorsement remains different from question-author acceptance | NOT RUN |
| DC-11 | A | Resource sharing/removal and teacher shelf enforce ownership/role policy; test files only in approved test environment | NOT RUN |
| DC-12 | A | Admin overview, teacher queue, audit and announcement functions work; ordinary users/moderators cannot use admin-only operations | NOT RUN |
| DC-13 | A/B | Anonymous question hides public identity while permitted moderation context remains restricted | NOT RUN |
| DC-14 | A/B | Empty/error/loading states have recovery actions; no fabricated counts or false provider-success claims | NOT RUN |
| DC-15 | B | About, auth, Ask, detail, profile, account and notifications remain usable at 200% zoom and narrow width | NOT RUN |

Automated local checks are recorded separately in [design review](DESIGN_CONSISTENCY_REVIEW.md). They do not mark these human/manual or live-provider cases PASS.

> **Status update 13 November 2026.** Not yet rewritten. Cases that mention the Sticker, Chalkboard and Bento themes, the Study Library chip and "No accepted answer" wording describe the live site at `main`. On branch `feat/design-v3` the themes are Auto, Light and Dark, the library is a page of shared files, and statuses read Resolved, Unresolved and Unanswered. Update the theme cases (UX01 to UX05, section 19) after the branches are merged. Latest results: [Verification record](TESTING.md).

Version 2.5 · Updated 11 November 2026 · One shared checklist for a two-person QA team

## Start here

This Markdown file is the single shared QA source: record results here. Matching Word and PDF copies (read-only convenience) are in `output/team-handover/` with the rest of the team handover pack — see its START_HERE document.

| What | Value |
|---|---|
| Live website | https://student-doubt-forum-theta.vercel.app/ |
| Verified live release | **735b517**, website Admin/Moderator role management on Chalkboard. Four theme choices are Auto, Sticker, Chalkboard and Bento. |
| Cleanup state | Cleanup VERIFIED on 11 November 2026. Everything and Study Library both returned 0 questions. Removed 203 questions, 202 answers, 2 comments, 2 votes, 3 notifications and 1 attached image. 18 accounts, 30 subjects and 1 college were retained. Contribution-based reputation starts at 0. |
| How to confirm the visual release | Reload and open the theme choices (phone: Menu first). Confirm Chalkboard is available. Record the release and actual starting question count. |
| Latest read-only verification | 11 November 2026, about 10:55 IST: /api/v1/health returned database connected and rateLimitStore redis; the Everything feed returned 0 questions; 30 subjects and 1 college; the theme choices showed Auto, Sticker, Chalkboard and Bento. Logged-out check only; no content was created. |


### Test accounts by role (labels only)

Keep passwords, reset links and sign-in codes out of this file and out of screenshots.

| Label | Role | Who uses it | Notes |
|---|---|---|---|
| A | Student, question author | Tester A, desktop | Manual QA Student A works. It cannot receive email |
| B | Student, answer author | Tester B, phone | Manual QA Student B works. It cannot receive email |
| C | Student, third voter | Either tester, third private window | Optional. Mark C-only cases BLOCKED if no approved account |
| T | Teacher | Owner promotes, then restores | Owner action |
| D | Disposable, deletion only | Owner-approved | Never use A, B or an admin |
| Inbox account | Password account with a real inbox | Owner-approved | Only for EM01–EM03 |
| Admin | Moderation and catalogue | Owner's own session | Testers never ask for admin credentials |

### Empty-site baseline and test data

The owner requested a clean site so the team can write its own questions and answers. A verified encrypted backup is held privately by the owner. The cleanup is verified and the team can begin its new QA run. The starting baseline is **0 questions** in Everything and **0 study-library questions**, with existing accounts, subjects and colleges available. Record the actual live result. Counts will increase as the team adds QA content.

- Initial Explore and Study Library should show a useful empty state. Zero results is expected after cleanup. Subjects can still be present without questions.
- Tester A creates a DBMS question with a distinctive QA title, one tag, an optional academic level, and a safe screenshot. Tester B answers. Use that thread for discovery, notifications, acceptance and saving.
- Prepare a second question and another answer for ordering cases. Put a code block and simple maths in owned QA content for rendering checks.
- Pagination needs enough matching questions. Use staging when the prerequisite is absent and record BLOCKED until it is prepared.
- Earlier Saved lists are device-local snapshots. Their old entries may survive server cleanup and open content not found. Unsave old bookmarks before this run, then save the team's new questions.
- Retain the library import completion record. Live starts empty. First-import and duplicate-import tests use fresh staging.

### First smoke steps (about 15 minutes, both testers)

1. Note the release (see the table above) and fill the run block in §2.
2. A, on desktop: open the live site, sign in, choose **Ask a doubt** and post one question titled `QA-<initials>-<date>-SM`. Copy its link to B.
3. B, on a phone: open the link, write an answer and choose **Post your answer**.
4. A: open the bell (**Notifications**), open the new item, then choose **✓ Accept answer** on B's answer.
5. B: open **Notifications** and confirm the acceptance item. Both refresh the question and confirm **✓ Solved** and **the answer that clicked**.
6. B: open **Menu**, try all four theme choices, then tap **Library**, **Saved** and the middle **+** in the bottom bar.
7. Record SM01–SM06 in §3. Stop and report if sign-in or posting fails.

### Who runs what

| Person | Start with | Owns |
|---|---|---|
| Tester A | Desktop, account A | Desktop discovery and posting: §4, §5, §6, §9, §10, and in §18 QA-LIB, QA-DISC, QA-EXP, QA-NAV-02, QA-NAV-03, QA-QD-01, QA-QD-02, QA-PERF |
| Tester B | Phone, account B | Phone, themes, labels and Saved: §19 Chalkboard first, then §11, §13 (owner-approved rows), §14, and in §18 QA-GO, QA-SAVE, QA-NAV-01, QA-NAV-04, QA-NAV-05, QA-LABEL-01, QA-LABEL-03, QA-THEME |
| Both together | Separate sessions, same QA question | Cross-user walkthrough: §3, §7, §8, QA-LABEL-02 and QA-FLOW-01 |
| Owner / developer | Only when privileged or isolated data is needed | §12 moderation, O rows, §15 staging/local checks, QA-LIB-02, QA-GO-02 |

### How to record a run

1. Pick one run ID, for example QA-11NOV-R1. Keep one shared copy of this file and write each result beside its case ID.
2. Finish P0 cases first. Check the environment label (L, O, S) on each row before acting. If a case needs C, an inbox account, admin, or staging and you do not have it, record BLOCKED and name what is missing.
3. Write results as `PASS · c9f78df · Tester B · Android Chrome · 360 px`, or `FAIL · BUG-001 · ...`. Always include the release.
4. For labels, copy the exact wording you saw and say what it should communicate.
5. Compare findings, retest fixes and submit the filled playbook with the §17 summary.

### Results history

- Version 2.0 and 2.1 of this playbook (release bc3b3d0) had no recorded results: every case was still NOT RUN when Chalkboard (c9f78df) went live on 11 November 2026. All cases below are for c9f78df unless a result says otherwise.
- External QA Run 01 results stay in [QA_REVIEW_RUN01.md](https://github.com/Raju-ol/student-doubt-forum/blob/main/docs/QA_REVIEW_RUN01.md) as evidence for the builds they were recorded on.
- Automated developer checks are listed in [TESTING.md](https://github.com/Raju-ol/student-doubt-forum/blob/main/docs/TESTING.md). They never count as manual PASS results here.
- New and changed cases in this version start at NOT RUN. When a case is rerun on a later release, keep the old result in the same cell and add the new one after it, each with its release ID.

**Goal:** Poora application test karna, reproducible bugs report karna, aur har test ka actual result record karna. Coding knowledge normal UI tests ke liye required nahi hai.

This checklist is a test plan, **not a claim that these tests have passed**. Every case below starts as NOT RUN. See the [release verification record](https://github.com/Raju-ol/student-doubt-forum/blob/main/docs/TESTING.md) for the latest developer and live checks. Recheck the release deployed when testing begins.

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

**Priority labels:** P0 = core flow, run first. P1 = standard regression. An explicit staging or owner instruction on a case overrides the section’s default environment.

### Current expected behavior — important

| Feature | What to expect in this release |
|---|---|
| Email verification | All-user verification is OFF; unverified friends can sign up/post |
| Password recovery | Gmail recovery for eligible forum password accounts. Verify with an approved QA account that has a real inbox |
| Forgot password privacy | Generic confirmation. Unknown addresses and Google-only accounts do not receive reset mail |
| Notifications | In-app bell/inbox for replies, comments and first acceptance; can take about 60 seconds on a visible idle page |
| Email notifications / phone push / mentions | Not implemented; do not mark missing behavior as a regression |
| Auto theme | Follows device preference: Sticker on a light device, Chalkboard on a dark device (c9f78df). On the previous release bc3b3d0 the dark look was Chalkboard |
| Theme control | Four direct choices: Auto, Sticker, Chalkboard, Bento (c9f78df). A saved Chalkboard choice opens as Chalkboard. On a phone, open Menu first |
| Discovery labels | No accepted answer can include questions with replies. No answers yet means the count is zero. The quick view and filter are both called No accepted answer |
| Saved questions | Stored per browser profile and device, up to 200. Saved status is a snapshot taken when saving, and saves are not linked to the signed-in account |
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
| C | Optional independent voter and permission checks | Tester 1 or 2 uses an approved extra account in a third isolated browser session. Mark C-only cases BLOCKED if unavailable |
| T | Teacher and moderator badge checks | Owner may promote a named disposable account, then restore it |
| D | Account deletion only | Separate disposable account; owner must approve deletion; never A/B/owner/admin |
| Admin | Moderation/catalogue tests | Owner-operated session or separately authorized limited test arrangement |

For college scope tests, owner supplies two existing QA colleges, College 1 and College 2, or prepares them on staging. Do not invent real affiliations or add throwaway catalogue records on live without approval; there is no catalogue deletion UI.

Prepare: one small JPG, PNG and WebP; a >3 MiB image; an unsupported PDF/text file; harmless screenshots without personal data. Use fake/renamed image payloads only in the staging advanced section.

### Run information — fill before testing

```text
Tester 1 / desktop / account label:
Tester 2 / phone / account label:
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

Use one shared copy. Record tester and device next to failures and blockers. If results differ by device, use one row, for example PASS (A/desktop) · FAIL (B/phone, BUG-002).

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
| SM03 | A accepts and upvotes B's answer; B refreshes the discussion | Accepted state and score visible; no duplicate mutation | NOT RUN |
| SM04 | Check A/B notification inboxes; mark one read | Correct recipient/event; read state and badge update | NOT RUN |
| SM05 | Upload one small screenshot to a QA question | Preview and posted attachment render on desktop/phone | NOT RUN |
| SM06 | Open mobile Menu, choose each of the four themes, then tap Library, Saved and the middle + (Ask a doubt) in the bottom bar | All four looks apply; Library, Saved and Ask open; nothing overflows sideways | NOT RUN |

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

Use A as author and B as responder. B can vote on A's question, and A can vote on B's answer. Use C for independent-voter cases. Undo smoke votes and acceptance before recording B's reputation baseline **R** for REP cases.

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
| SU01 | Scroll the subject strip and choose DBMS, then All subjects | Catalogue loads and selection, results and URL stay in sync | NOT RUN |
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
| RO03 | O | Inspect admin account controls | Admin accounts cannot be suspended or deleted. Own and primary-admin role changes are protected. Another admin can change a secondary admin role | NOT RUN |
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

### Password recovery with Gmail

| ID | Env | Steps | Expected result | Result |
|---|---|---|---|---|
| EM01 | O | In a separate approved password account with a real inbox, sign out and use Forgot password | Generic confirmation; actual mail in Inbox/Spam with correct website link | NOT RUN |
| EM02 | O | Tester opens the QA reset link, sets a new password privately and signs in | New login works; old password/old sessions rejected | NOT RUN |
| EM03 | O | Tester reopens the consumed QA reset link | Reuse rejected safely | NOT RUN |
| EM04 | L | Request reset once for a controlled email with no forum account | Generic response and no reset mail. The form does not reveal account existence | NOT RUN |
| EM05 | S | Developer tests expired link, invalid token, too-short/over-72-byte password and older other-user token | Safe rejection; no unintended password update | NOT RUN |
| EM06 | L | New unverified student signs up/posts | Posting remains possible while EMAIL_ENABLED is off | NOT RUN |
| EM07 | S | Owner/developer configures full verification with a suitable test mail adapter | One-use verification links, unverified posting block, verified posting success, resend limits and expiry | NOT RUN |

Gmail password recovery and mandatory verification are separate. Verification is expected to be off. Use only the approved QA inbox and account. Manual QA Student A/B aliases cannot receive mail. Keep reset links and passwords private.

## 14. Theme, mobile, keyboard and usability (P1, L)

Test at least desktop Chrome plus one other desktop browser, Android Chrome if available, and Safari/iPhone if available. Unavailable platforms must be BLOCKED/N/A with explanation, never assumed PASS.

| ID | Steps | Expected result | Result |
|---|---|---|---|
| UX01 | Select each of the four theme choices (Auto, Sticker, the dark choice, Bento). On a phone, find them in Menu. The dark choice is Chalkboard on bc3b3d0 and Chalkboard on the Chalkboard release | Each applies immediately and exactly one option is selected. Record which dark name you saw | NOT RUN |
| UX02 | Tab to each theme option and activate it with Enter/Space | Accessible names match the choices and selected state is announced | NOT RUN |
| UX03 | Reload after selecting Sticker, the dark choice or Bento. Then select Auto and switch the device between light and dark | Explicit choice persists after reload. Auto shows Sticker on a light device and the dark choice on a dark device | NOT RUN |
| UX04 | Enable OS reduced-motion setting | Theme indicator does not require animation; control still works | NOT RUN |
| UX05 | Review feed, detail, editor preview, profile, account, inbox, admin in Sticker, the dark choice and Bento | Readable text/badges/errors/code/maths; no invisible labels or white-on-white controls | NOT RUN |
| UX06 | Phone portrait/landscape, 320/375/390px widths where possible | No whole-page horizontal overflow; menus/forms/actions reachable; code/table may scroll internally | NOT RUN |
| UX07 | Open/close mobile Menu; Escape; navigate from it | Expanded state matches; closes on navigation; keyboard focus usable | NOT RUN |
| UX08 | Tab through forms, toolbar, tabs, vote buttons, dialogs and notification controls | Logical focus order, visible focus, usable labels; no keyboard trap | NOT RUN |
| UX09 | Use Skip to content and 200% browser zoom | Main content reachable; content/actions not lost or obscured | NOT RUN |
| UX10 | Inspect loading, empty and validation/error states | Meaningful messages; retry possible where offered; no indefinite spinner or duplicate success | NOT RUN |
| UX11 | Use screen reader if available | Theme option name and selected state, tabs/selected panel, menu state and alerts understandable | NOT RUN |
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
Test run ID / both testers / dates:
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

## 18. Live redesign, labels, and added feature checks

Run these alongside the assigned sections after SM01–SM06.

| ID | Env | Tester | What to do | Expected result | Result |
| --- | --- | --- | --- | --- | --- |
| QA-GO-01 | L | B | Open Sign in on the stable live URL and use an approved Google account | Google sign-in opens the intended forum profile | NOT RUN |
| QA-GO-02 | S | B + developer | In Account, link Google to an existing password account in staging | Matching email and correct password link the same account. Invalid credentials or mismatched email are rejected | NOT RUN |
| QA-LIB-01 | L | A | Open Library before the team posts. If needed, tag one owned QA question study-library, open it from Library and go Back to results | After verified cleanup the initial view is empty. Only matching QA questions subsequently appear. Back preserves the library view | NOT RUN |
| QA-LIB-02 | S | Owner | On fresh staging, preview and publish the library once, then retry | 200 questions and answers import once. Student access is rejected | NOT RUN |
| QA-DISC-01 | L | A | Check Accepted answers and No accepted answer against accepted, zero-answer and replied-but-unaccepted QA threads | Accepted only shows accepted threads. Both other threads match No accepted answer. Only the zero-answer row says No answers yet | NOT RUN |
| QA-DISC-02 | L | A | Open Filters, choose scope/status/academic level, remove one chip, clear the rest, then refresh and use Back/Forward | Advanced filter count and chip labels stay accurate. Removing one filter preserves the others. URLs and controls stay in sync | NOT RUN |
| QA-SAVE-01 | L | B | Save a public QA question, open Saved, refresh, open the question, go Back to results, then unsave | Saved question survives refresh. Back returns to Saved. Unsave removes it and updates the count | NOT RUN |
| QA-SAVE-02 | L | B | Save on one browser profile, open the site in a fresh independent profile, and try Save/Unsave by keyboard | Profiles have separate lists. Saved says Stored on this device only. The pressed state reflects the save status | NOT RUN |
| QA-SAVE-03 | L | B | In an isolated browser profile, block site storage if supported, then try Save | Helpful message appears. Reading still works and no false saved state appears | NOT RUN |
| QA-NAV-01 | L | B | On a phone, tap Explore, Library, central +, Saved and Me/Sign in. Open Menu for notifications, Account and themes | Each opens the intended screen. Active tab is clear. Bottom bar does not cover controls | NOT RUN |
| QA-NAV-02 | L | A | On desktop, sign in and use Account and Sign out in the header | Both actions are visible. Account requires login after sign-out | NOT RUN |
| QA-LABEL-01 | L | B | Check visible and accessible names for Menu, themes, filters, Save, votes, uploads and bell. Tab through at 200% zoom | Labels stay readable and describe the correct action or state. Focus is visible | NOT RUN |
| QA-LABEL-02 | L | Both | A posts, B replies, A accepts, then both open Notifications | Accepted label is on the right answer. New/read labels, count and actor match what happened | NOT RUN |
| QA-THEME-01 | L | B | Open Explore scope and academic filters, the Ask subject dropdown and the profile college dropdown in all three looks | Selected text and available options are readable | NOT RUN |
| QA-PERF-01 | L | A | Record first and repeat Explore load times at normal browsing pace | Record device, network and whether retry helped. If a 500 appears, record its time and route | NOT RUN |
| QA-EXP-01 | L | A | On desktop, read the Explore top. Search a word from your QA title, then clear it with the × on the search chip | Headline reads “stuck on something? someone’s been there.” The results heading changes to Results for “your word” and back to Latest questions. The count line reads “N questions” | NOT RUN |
| QA-EXP-02 | L | A | Click Accepted answers, then click it again. Repeat with No accepted answer and Study Library. Search a word first, then click Accepted answers | The chip shows as selected and the heading matches it (Accepted answers / No accepted answer / Study Library). Clicking a selected chip turns it off. Your search word is kept when you switch between Accepted answers and No accepted answer | NOT RUN |
| QA-EXP-03 | L | A | Choose DBMS in the subject strip, then All subjects. Open Filters and set Answer status and an academic level. Count the number on Filters | The heading shows the subject name, and All subjects clears it. The Filters number counts only scope (when changed), answer status and academic level. Subject, search and tag show as removable chips, without adding to the number. Clear all appears only when two or more chips are shown | NOT RUN |
| QA-EXP-04 | L | A | With No accepted answer selected, choose Next →, open a question, choose Back to results, then use the browser Back and Forward buttons | Pager reads “Page 2 of N”. Back to results returns to the same page with the same filter. Browser Back/Forward keep the URL and the list in sync | NOT RUN |
| QA-EXP-05 | L | A | On a desktop window at least 1024 px wide, use the two side cards: “be someone’s hero today” and “exam-ready explainers”. Then make the window narrower than 1024 px | Find one to answer → opens the No accepted answer view. Open the library opens Study Library. Below 1024 px the side cards are hidden and nothing is lost from the list | NOT RUN |
| QA-NAV-03 | L | A | Signed in on desktop, read the header left to right. Narrow the window to about 800 px | Header shows Explore, Study Library, Saved, the theme choices, the bell, Ask a doubt, your avatar, My questions, Account and Sign out. At about 640–1100 px the Study Library and Saved header links hide, and the same views stay available as Explore chips | NOT RUN |
| QA-NAV-04 | L | Both | B creates two unread notifications for A (answer and comment on A's QA question). A checks the bell on desktop and in the phone Menu, then opens one item and uses Mark all as read | The bell shows the unread number (99+ above 99) and its accessible name says the count. In the phone Menu it reads Notifications with the number. After opening one item and Mark all as read, the number clears and stays cleared after refresh | NOT RUN |
| QA-NAV-05 | L | B | On a phone, open Menu, press Escape or tap Menu again, then open it and pick Account. Repeat from the bottom bar Me tab | Menu lists Explore, Study Library, Saved, the four themes with names, Notifications, your name, My questions, Account and Sign out. The menu closes on Escape and after navigating. Me opens your profile. Signed out, Me reads Sign in | NOT RUN |
| QA-LABEL-03 | L | B | Find each exact label below on the phone and on desktop. Copy any label that differs | Explore rows: “✓ Accepted answer”, “No accepted answer”, “No answers yet”, “Any level”, “N answers”. Save button: Save / Saved. Question page: “✓ Solved”, “No accepted answer yet”, “No answers yet”, “N answers · 1 accepted”, “N answers · none accepted yet”, “No one has answered yet”, “the answer that clicked”, “Accepted by the student who asked”, “Highest voted first”, “Write an answer ↓”, “Post your answer” | NOT RUN |
| QA-SAVE-04 | L | B | Open Saved, open a saved question, choose Back to results. Then open the same question from Explore and Save/Unsave it there | Back to results returns to Saved questions, not Explore. Save and Saved on the question page match the Saved list after refresh | NOT RUN |
| QA-SAVE-05 | L | B | Save a question, read the toast, then sign out and open Saved. Sign in as A in the same browser profile and open Saved. Later, have A accept an answer on a saved question | Toast: “Saved on this device. Find it under Saved on Explore.” Unsave toast: “Removed from saved questions.” The list stays the same signed in or out and for any account in that profile, because saves belong to the browser. The row keeps “Status as of saving” and does not update to Accepted on its own | NOT RUN |
| QA-QD-01 | L | A | Open a QA question that has an accepted answer and two other answers, on desktop and phone | Order is: Back to results, the QUESTION card, the summary line, “the answer that clicked” with the accepted answer, “2 other answers” (Highest voted first), then Your answer. Markdown, images, votes, comments and Report still work in each part | NOT RUN |
| QA-QD-02 | L | A | Signed in, choose Write an answer ↓ on a question. Then sign out and repeat | Signed in: the page scrolls to Your answer and the cursor is in the editor. Signed out: Your answer shows Sign in to answer and create an account, and sign-in returns you to the same question | NOT RUN |
| QA-FLOW-01 | L | Both | Full walkthrough on one new QA question: A posts with a tag and image; B answers; A gets the notification and accepts; B gets the acceptance notification; A removes acceptance, then accepts again; both refresh | Each step shows the right author, labels and counts. Explore row changes from No answers yet → No accepted answer → ✓ Accepted answer. Only the first acceptance notifies B. Record which theme each tester used | NOT RUN |

For password recovery, use EM01–EM07. Manual QA Student A and B can cover the two-browser walkthrough. Their test addresses cannot receive mail. Record account labels and keep credentials out of the report.

## 19. Chalkboard dark mode — live release c9f78df

Prerequisite for every row: the theme choices read **Auto, Sticker, Chalkboard, Bento**. If you see After Hours, reload once; if it persists, record `BLOCKED · old copy shown` with the browser name. Owner: Tester B unless stated. Environment: L.

| ID | Env | Tester | What to do | Expected result | Result |
| --- | --- | --- | --- | --- | --- |
| CB-01 | L | B | On desktop and phone, open the theme choices and hover or read each name | Four choices: Auto, Sticker, Chalkboard, Bento. After Hours no longer appears. Exactly one is selected | NOT RUN |
| CB-02 | L | B | Choose Chalkboard and look at Explore, a question, Ask, sign-in, profile, Notifications and the 404 page | Dark green board, chalk-white dashed outlines, handwritten headings, pastel sticky notes (pink Study Library, mint accepted, yellow highlight and Ask). Question titles and answers stay in normal print and are easy to read | NOT RUN |
| CB-03 | L | B | Select Auto. Switch the device to dark, then to light, without reloading; reload once in each | Dark device shows Chalkboard. Light device shows Sticker. The Auto option stays selected | NOT RUN |
| CB-04 | L | B | Use a browser profile in which After Hours was chosen before 11 Nov 2026 and open the site. If no such profile exists, record BLOCKED · no pre-release profile | The site opens in Chalkboard and the Chalkboard option is selected. No reset to Auto is needed | NOT RUN |
| CB-05 | L | A | Check Sticker and Bento on Explore, a question and sign-in. If you kept screenshots from bc3b3d0, compare them at the same window size | No visible change from bc3b3d0 in either look. In particular, Sticker has no dotted background. Report any difference with both screenshots | NOT RUN |
| CB-06 | L | B | In Chalkboard, open a question with an accepted answer, code and maths; open the editor Preview; trigger one form error | The accepted answer has a mint outline and readable text. Code, maths, errors and badges are readable. Nothing is white-on-white | NOT RUN |
| CB-07 | L | B | In Chalkboard on a phone at 360 px, use Menu, the bottom bar, Filters and Save | Controls are reachable, labels are readable and nothing overflows sideways. The middle + opens Ask a doubt | NOT RUN |
| CB-08 | L | B | On a slow network (browser throttling to Slow 4G), choose Chalkboard on a fresh profile and watch the headline | The headline may appear in a plain font first, then switch to the handwritten font. Text never disappears. Record how long the switch took | NOT RUN |

Chalkboard went live as c9f78df on 11 November 2026. When the next release ships, keep these results with c9f78df and add the new ones after them.

## 20. Admin and Moderator roles

Owner performs these cases with an approved QA target and restores the target
to its original role afterward. The primary owner role is protected.

| ID | Env | Tester | Steps | Expected result | Result |
| --- | --- | --- | --- | --- | --- |
| RM01 | O | Owner + A | Admin signs in, opens Moderation, selects Users and finds the QA account by exact email | Role dropdown offers Student, Teacher, Moderator and Admin | NOT RUN |
| RM02 | O | Owner + B | Select Moderator for the QA target, Save role and confirm, then refresh that user's page | Moderator badge and Moderation link appear; Reports opens | NOT RUN |
| RM03 | O | B | As Moderator, open a prepared QA report and dismiss it | Only the intended report changes; queue refreshes | NOT RUN |
| RM04 | O | Owner + B | Moderator removes a reported disposable QA question | Confirmation names the destructive action; approved target is removed | NOT RUN |
| RM05 | O | B | As Moderator, inspect Moderation and open the catalogue URL | Reports available. Users/role/suspension controls and catalogue access unavailable | NOT RUN |
| RM06 | O | Owner + A | Promote the approved QA target to Admin and refresh it. Restore it to Student from the primary owner session | Admin can manage users; restored student loses admin API access and UI after refresh | NOT RUN |
| RM07 | O | Owner | Inspect the current admin's own role selector and attempt changing the primary owner's role from the approved secondary admin | Own selector disabled; primary owner remains Admin and change is rejected | NOT RUN |
| RM08 | O | Owner | Grant and restore Teacher on the QA target. Cancel another role confirmation | Teacher badge follows saved role; cancel leaves role unchanged | NOT RUN |

The normal student account cannot grant itself a role during signup or profile
editing. Admin permissions are stored in the database and checked by the API.
