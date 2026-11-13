# Role slices 2–5 — change record

Written 13 November 2026, on the stacked branches `feat/site-alive` → `feat/people-return` → `feat/admin-steer` → `feat/library-teacher` (each contains the ones before it; the last contains everything). Implements the remaining slices of [ROLE_FEATURES_PLAN](ROLE_FEATURES_PLAN.md) after slice 1 (teacher verification, merged as PR #10). 162 tests pass; `vite build` passes before every commit.

## Slice 2 — "The site feels alive" (`feat/site-alive`)

| Feature | What changed |
| --- | --- |
| S5a Same doubt | Questions are upvote-only: `POST /doubts/:id/vote` accepts only `value: 1`. A small "Same doubt 👍 n" pill sits under the question text and on Explore cards; answers keep both arrows. Stored legacy question downvotes are neither counted nor shown; reputation is untouched. |
| S4 Sorting | `GET /doubts?sort=newest\|votes\|answers\|unanswered`. Newest keeps the old indexed query (and search relevance); the others rank ids by aggregation then load the page. "Sort by" dropdown beside the result count; not a filter chip. |
| S2 Related | `GET /doubts/:id/related` → up to 5 similar questions (id, title, subject, status, answerCount, createdAt only). "Similar doubts" section ends the question page. |
| S3 Duplicate check | `GET /doubts/similar?title=` with the same search; the Ask form shows "These look similar" under the title (debounced 500 ms, 12+ chars, links open in a new tab). Both use `server/src/similar.js`: text-search matches must score ≥ 5 **and** ≥ half the best match, so a lone shared word like "Java" is not "similar". Thresholds are empirical — retune on real data. |
| S6 Share + previews | Share button (share sheet → clipboard → shown link). Crawler user agents (WhatsApp, Facebook, Twitter, Slack, Telegram, Discord, LinkedIn) requesting `/doubts/:id` get a small server-rendered page with Open Graph/Twitter tags; `vercel.json` routes **only** those agents to `/api` for that path. A test keeps the agent lists in `vercel.json` and `server/src/share.js` in step. **Verify on production after deploy:** `curl -A "WhatsApp/2.23" https://<site>/doubts/<id>` should print the meta tags. |

## Slice 3 — "People come back" (`feat/people-return`)

| Feature | What changed |
| --- | --- |
| S5 Anonymous asking | "Post without my name" on the Ask form sets `Doubt.isAnonymous` at creation. The author is stored, but every decorated response replaces them with `{ name: 'Anonymous' }` unless the viewer is the author, an admin or a moderator — **teachers see Anonymous too** (decision §8.2, assumed; flip `seesAnonymousAuthor` in `server/src/forum.js` to change). Public profiles omit anonymous questions; "accepted your answer" notifications name Anonymous. |
| T4 Endorse | `PATCH /answers/:id/endorse` (teacher/admin, never own answer) toggles `endorsedBy`/`endorsedAt`. Only the endorsing teacher or an admin can remove it. Answer order is now accepted → endorsed → teacher-written → votes. The answerer is notified once (`answer_endorsed`). |
| S1 Profile growth | `GET /users/:id` adds `growth: { stats, milestones }`, all derived live (never stored): questions, answers, accepted, answer upvotes, same-doubt presses, endorsements; milestones with progress and hints. Anonymous questions count only for the owner and staff. No reputation history chart — the score has no dated ledger to draw one from. |

## Slice 4 — "The admin can steer" (`feat/admin-steer`)

| Feature | What changed |
| --- | --- |
| A4 Audit log | `AuditLog` model + `recordAudit()` (a failed entry never breaks the action). Records role changes, suspend/restore, report decisions, admin deletions of others' posts, staff Library removals, teacher request decisions, Worked Q&A publish/reset, catalogue additions, banner changes. `GET /admin/audit` (admin only, `?action=` prefix filter); "Audit log" tab in Moderation. Self-deletions and no-op role changes are not logged. |
| A1 Overview | `GET /admin/overview`: questions/answers/signups this week vs last, unanswered count, pending reports and teacher requests, totals incl. Library downloads. Worked Q&A samples and their placeholder accounts are excluded everywhere. New default "Overview" tab with links into each queue. |
| A6 Banner | `Setting` model. `GET /banner` public; `PUT /admin/banner` (≤ 140 chars plain text, empty removes; audited). Shown above every page; dismissal is per device per announcement (its timestamp), so new text reappears. Editor on the Overview tab. |
| A3 Moderator context | `GET /admin/users/:id/context` (moderator+): name/role/joined/suspended, post counts, reports about them by status, 10 recent questions (anonymous flagged) and answers (plain-text excerpts). No email, no new powers. "About the author" on each report card, loaded on demand. |

## Slice 5 — first step toward the institution Library (`feat/library-teacher`)

| Feature | What changed |
| --- | --- |
| T5 Teacher shelf | Resources carry `fromTeacher` (uploader's **current** role, so demotion/suspension removes the label and shelf listing). `GET /resources?shelf=teacher` filters to active teachers' uploads and combines with category/search/paging. "✓ Teacher" badge on cards, a "Teacher recommended" chip, and a note on the share form for teachers. The full institution Library ([STUDY_LIBRARY_AND_DASHBOARD_PLAN](STUDY_LIBRARY_AND_DASHBOARD_PLAN.md)) remains future work. |

## New collections and fields

- `Doubt.isAnonymous`, `Answer.endorsedBy`/`endorsedAt` — additive, default off.
- `TeacherRequest` (slice 1), `AuditLog`, `Setting` — new collections; indexes build on first connect.
- New notification types: `answer_endorsed` (plus slice 1's `teacher_approved`/`teacher_declined`); `Notification.target` is now optional.
- No migration needed; everything is backwards-compatible with existing data.

## Open decisions assumed (confirm or change)

1. **§8.2** Anonymous hides the asker from teachers too (only staff see through). 
2. Similarity thresholds (score ≥ 5 and ≥ 50 % of best) measured on sample data.
3. "Doubt of the week" (T6, §8.3) was **not** built — it is medium priority and its owner (teachers vs admins) is undecided.
