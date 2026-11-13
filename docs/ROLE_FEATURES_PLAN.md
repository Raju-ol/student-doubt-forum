<!-- consistency-review-2026-11-13 -->
> Current status, 13 November 2026 — See [current implementation and limits](CURRENT_STATE.md). The active design has Auto/Light/Dark themes and a separate community resource Library. Institution-scoped curriculum and publication review remain planned. Older counts, release IDs and provider checks below are dated evidence, not current certification.

# Role features plan — Student, Teacher, Admin

Written 13 November 2026, against branch `feat/about-page` (`de480ef`, contains the redesign and bug fixes). **This is a plan only. Nothing in it is built.** Each item has a priority, an effort guess and what it depends on, so you can pick a slice and say "build this".

How to read effort: **S** = under half a day, **M** = one to two days, **L** = three days or more.

---

## 1. Honest audit: what each role has today

| Role | What they actually get today |
| --- | --- |
| Visitor | Read everything: questions, answers, Library files, Worked Q&A, contributors. |
| Student | Ask, answer, vote, comment, accept on own questions, report, save on-device, share Library resources, notifications, profile, account settings (Google link, export, delete). |
| Teacher | **Everything a student gets plus a "✓ Teacher" badge. Nothing else.** No teacher-only screen, power or view exists. |
| Moderator | Reports queue: dismiss or remove reported content. Can also remove any Library resource. Nothing else — cannot see users, roles or bans. |
| Admin | All of the above plus: user list, suspend/unsuspend, change roles, subject and college catalogues, publish/reset the 200 Worked Q&A samples. |

The biggest structural gaps: the teacher role is decorative; there is no way to *become* a teacher except knowing the admin personally; admins have no numbers (no counts, no activity, no "what happened this week"); and nothing closes the loop on a question that never got an answer.

---

## 2. The teacher sign-up problem (the one you raised)

You are right that asking "are you a teacher?" at sign-up is the wrong design. If the account form grants it, any student can tick the box and get the badge, and the badge's whole value is trust. If the form merely *asks* and does nothing, it is a lie in the UI. The current system (admin promotes people by hand) is safe but invisible — a real teacher has no path in.

**Proposed design: claim at sign-up, verify before the badge.**

1. Sign-up stays one short form. It gains one optional line: "I teach at a college or coaching institute" (checkbox, default off).
2. Ticking it creates a normal **student** account immediately — no waiting — plus a **pending teacher request** holding: institution (from the existing college list), what they teach (subjects), and one free-text line ("Assistant professor, CS dept" / "Physics faculty, XYZ Academy"). Optionally a proof: institute ID card photo or an institutional email address.
3. The account works as a student straight away. A small banner on their profile says "Teacher verification pending".
4. Admin gets a **Teacher requests** tab in Moderation: approve (role becomes teacher, requester is notified) or decline with a one-line reason. The same request form is reachable later from Account settings ("Are you a teacher? Request the badge"), so nobody has to decide at sign-up.
5. Rate-limited (one open request per account), auditable (who approved, when), reversible (admin can demote).

Why this shape: the badge stays trustworthy because a human approved it; teachers get a visible path in; sign-up stays short; and it reuses things that exist (institutions, notifications, the Moderation area, the role-change audit rules in `server/src/admin-roles.js`).

Effort: **M–L** (model + request routes + two screens + notification + tests). Priority: **high** — it unblocks every other teacher feature.

---

## 3. Student features

### High priority

| # | Feature | What and why | Effort |
| --- | --- | --- | --- |
| S1 | **Profile that shows growth** | Questions asked, answers given, accepted count, reputation history, badges-style milestones ("First accepted answer"). Students show this to friends; it is the retention feature. | M |
| S2 | **Related questions on the question page** | "Similar doubts" under a question, from the existing text search. Stops duplicates and keeps people reading. | S–M |
| S3 | **Duplicate check while asking** | As the title is typed, show "These look similar — is yours answered?". Same search, called from the Ask form. | S–M |
| S4 | **Feed sorting** | Newest / Most votes / Most answered / Unanswered first. The API already filters; this adds a sort parameter and a dropdown. | S–M |
| S5 | **Anonymous asking** | "Post without my name" on the Ask form: author stored but displayed as "Anonymous". Removes the #1 fear of asking in front of classmates. Admins can still see the author for moderation. | M |
| S5a | **Upvote-only questions, as a small button under the question** (owner request, 13 Nov) | Questions lose the downvote; only answers keep both arrows. The big up/down control on the question page is replaced by one small pill under the question text — label it "Same doubt 👍 12" so pressing it means "I have this doubt too", not a judgment. The same small pill can sit on Explore cards. Why: downvoting a question punishes asking, which fights the site's whole message ("no doubt is too small"); a same-doubt count also tells teachers which questions matter to many students. Reputation is unaffected (only answer votes and acceptance earn points). Existing stored question downvotes are simply no longer displayed or accepted. | S–M |

### Medium priority

| # | Feature | What and why | Effort |
| --- | --- | --- | --- |
| S6a | **"Thanks" on an answer** | One small reaction under an answer ("Thanks 🙏") beside the vote arrows, for the asker and others who were helped but do not think in votes. Costs nothing, feeds S1 milestones and T7 teacher stats. | S |
| S6 | **Share button + link previews** | Copy-link button on each question and Open Graph tags so a shared link shows the title in WhatsApp. This is how the site spreads. | S–M |
| S7 | **Saved questions synced to the account** | Saves currently live in one browser. Move them server-side (keep the device list as a fallback). | M |
| S8 | **@mentions in comments** | "@Riya" notifies that person. Needs careful parsing and a notification type. | M |
| S9 | **My drafts** | Auto-save an unposted question locally so a half-written doubt is not lost. | S |
| S10 | **Email digest (opt-in)** | Weekly "3 new questions in your subjects". Needs the Gmail sender already configured. | M |

### Later

- Follow a subject or a question (notify on activity). Streaks ("answered 3 days in a row"). Study groups. Reputation levels that unlock small privileges (e.g. 50+ rep can edit tags). Dark-pattern-free gamification only — no fake urgency.

---

## 4. Teacher features (all depend on §2 existing first)

### High priority

| # | Feature | What and why | Effort |
| --- | --- | --- | --- |
| T1 | **Teacher verification flow** | §2 above. | M–L |
| T2 | **Teacher dashboard: unanswered in my subjects** | One screen: unresolved questions filtered to the subjects the teacher registered, oldest first. Turns "help if you stumble on it" into a 10-minute daily routine. | M |
| T3 | **Teacher answer highlight** | A teacher's answer gets a tinted card and sorts above other unaccepted answers (below the accepted one). The badge exists; make it matter where it counts. | S |
| T4 | **Endorse an answer** | A teacher can mark a student's answer "Teacher endorsed ✓". Lighter than accepting (which stays the asker's right), hugely motivating for the answerer, and it feeds S1's milestones. | M |

### Medium priority

| # | Feature | What and why | Effort |
| --- | --- | --- | --- |
| T5 | **Publish to the Library as a teacher** | Teacher uploads get a "Teacher" label and sort into a "Teacher recommended" shelf. First real step toward the institution Library plan. | M |
| T6 | **Pin a "Doubt of the week"** | A teacher or admin pins one good question to the top of Explore for a week. Creates the weekly rhythm from the polish plan. | S–M |
| T7 | **Teacher stats** | Answers given, endorsements, students helped this month. Gives teachers a reason to come back. | S–M |

### Later

- Assigned institutions and curriculum areas, drafts and review queue — this is the full `STUDY_LIBRARY_AND_DASHBOARD_PLAN.md` workflow. Office-hours slot ("Prof. X answers live Thursday 5pm"). Class codes: a teacher creates a code, their class joins, teacher sees their class's questions.

---

## 5. Admin and moderator features

### High priority

| # | Feature | What and why | Effort |
| --- | --- | --- | --- |
| A1 | **Admin overview numbers** | One screen: questions/answers/signups this week vs last, unanswered count, pending reports, pending teacher requests, Library downloads. Today the admin flies blind; this is also the screen you show your teacher at the demo. | M |
| A2 | **Teacher requests queue** | The approve/decline half of §2. | (in T1) |
| A3 | **Moderator user view (read-only)** | Moderators can see a user's recent posts and reports *about* them when judging a report, without ban/role powers. Today they judge content with no context. | S–M |
| A4 | **Audit log** | Who banned/promoted/removed what, when. Mostly exists in scattered records; surface it as one list. Protects you when something is deleted and someone asks why. | M |

### Medium priority

| # | Feature | What and why | Effort |
| --- | --- | --- | --- |
| A5 | **Bulk and soft moderation** | Lock a question (visible, no new answers), move it to another subject, merge duplicates. Lighter tools than delete. | M–L |
| A6 | **Announcement banner** | Admin sets a one-line site banner ("Exam week: extra teachers online Thursday"). | S |
| A7 | **Report reasons taxonomy** | Spam / abuse / wrong subject / duplicate instead of free text only; lets A1 count what kind of trouble you get. | S |
| A8 | **Resource review queue (optional switch)** | If Library spam appears, admin can flip uploads to "reviewed before public". Build the switch only when needed. | M |

### Later

- Institution manager role (from the Library plan). CSV export of stats. Automated spam heuristics. Appeals flow for banned accounts.

---

## 6. Suggested build order (slices you can approve one at a time)

1. **Slice 1 — "Teachers are real":** T1 (verification flow incl. A2) + T3 (highlight) + T2 (teacher dashboard). After this, the teacher story in the demo is true end to end.
2. **Slice 2 — "The site feels alive":** S5a (upvote-only questions, small "Same doubt" button) + S4 (sorting) + S2 (related) + S3 (duplicate check) + S6 (share + previews).
3. **Slice 3 — "People come back":** S1 (profile growth) + T4 (endorse) + S5 (anonymous asking).
4. **Slice 4 — "The admin can steer":** A1 (overview) + A4 (audit log) + A6 (banner) + A3 (moderator context).
5. **Slice 5 — toward the institution Library:** T5, then the full plan in `STUDY_LIBRARY_AND_DASHBOARD_PLAN.md`.

Each slice is shippable alone and in order of demo value. Slices 1 and 2 together are roughly a week of focused work.

## 7. What NOT to add (deliberately)

- **Self-service teacher checkbox that grants the badge** — defeats the trust the badge carries (§2 is the answer).
- **Live chat / DMs** — moderation burden far above a college project's capacity; comments cover it.
- **AI answer generation** — the forum's value is humans explaining; the Worked Q&A samples already cover "AI explains".
- **Public follower counts** — popularity contests sour small communities.
- **A second redesign** — the v3 design is new; let it settle.

## 8. Open decisions for you

1. Teacher proof at request time: institutional email, ID photo, or plain trust + admin judgment? (Plain trust is fine at your scale; say so and T1 gets simpler.)
2. Should anonymous asking (S5) hide the asker from teachers too, or only from students?
3. Does "Doubt of the week" (T6) belong to teachers, admins, or both?
4. Which slice do you want first?
