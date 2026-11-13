<!-- consistency-review-2026-11-13 -->
> Current status, 13 November 2026 — See [current implementation and limits](CURRENT_STATE.md). The active design has Auto/Light/Dark themes and a separate community resource Library. Institution-scoped curriculum and publication review remain planned. Older counts, release IDs and provider checks below are dated evidence, not current certification.

# API notes

## Current additions — 13 November 2026

All paths below are relative to `/api/v1`. See [current scope](CURRENT_STATE.md) for the distinction between community resources and the planned institution publishing system. The shared success/error envelope and current-account authorization still apply.

| Method | Path | Behavior/access |
| --- | --- | --- |
| GET | `/resources` | Public paginated resources; `search`, `category`, `shelf=teacher`, `page`, `limit` |
| GET | `/resources/popular` | Public popular resources using download request counts |
| POST | `/resources` | Signed-in user, verification policy and rate limit; multipart supported document up to 4 MiB or JSON HTTPS link, title/category/description |
| GET | `/resources/:id/download` | Public redirect and download-request increment, not unique-reader measurement |
| DELETE | `/resources/:id` | Uploader or permitted moderation staff, with storage cleanup |
| GET | `/tags/trending`, `/contributors` | Public discovery lists |
| POST | `/teacher-requests` | Student request; subject list, note, optional institution |
| GET | `/teacher-requests/me` | Current user's most recent request |
| GET | `/teacher/queue` | Teacher/admin unresolved-subject queue; paginated |
| GET, PATCH | `/admin/teacher-requests`, `/admin/teacher-requests/:id` | Admin-only request queue/review |
| GET | `/admin/overview`, `/admin/audit` | Admin-only statistics and audit history |
| GET | `/banner` | Public current announcement |
| PUT | `/admin/banner` | Admin-only announcement update; empty text removes it |

Additional forum behavior includes anonymous questions, related-question suggestions, explicit view tracking, teacher endorsements and newer sort options. Role capabilities are checked against the database on each authenticated request. Consult the route implementation for request fields before extending these APIs. Older API examples below describe earlier milestones and remain historical reference.

Reviewed 10 November 2026 at code reference 827e8df. Base path is /api/v1. JSON success uses { success: true, data, message }, errors use { success: false, message }. Protected calls require Authorization: Bearer <token>. Health, downloads and file uploads have their own response or request formats.

## Authentication and account

| Method and path | Access and input |
| --- | --- |
| GET /health | Public readiness and database status. |
| POST /auth/signup | Public. name, email, password, optional academicLevel and institution. Creates a student. |
| POST /auth/login | Public. email and password. Returns user and token. |
| GET /auth/google/config | Public. Configured Google clientId. |
| POST /auth/google | Public. credential is a Google ID token. Signs in or creates a Google account. |
| POST /auth/google/link | Signed in. credential and password. Explicitly links matching email to the current password account. |
| GET /auth/me | Signed in. Current account and role. |
| POST /auth/logout-all | Signed in. Revokes all existing sessions, including the caller. |
| POST /auth/forgot-password | Public. email. Generic response. Only eligible password accounts receive a link. |
| POST /auth/reset-password | Public. token and password. Single-use token, expires after 30 minutes, revokes sessions. |
| POST /auth/verification-email | Signed in. Requires email verification feature to be enabled. |
| POST /auth/verify-email | Public. token. Requires email verification feature to be enabled. |
| GET /users/:id | Public profile and contributions. |
| PUT /users/me | Signed in. name and optional academicLevel and institution. |
| GET /users/me/export | Signed in. NDJSON attachment. |
| DELETE /users/me | Signed-in non-admin. password or linked Google credential plus confirmation value DELETE. Anonymizes account, removes owned images and retains discussion history. |

Normal sign-out clears browser state. Current role and ban status are checked by the API. Gmail recovery can be enabled independently of verification. For flags and setup see [deployment guide](VERCEL_HINGLISH.md). Shared Upstash limiting can return 429 with Retry-After or 503 on store outage.

## Explore and discussion

| Method and path | Access and input |
| --- | --- |
| GET /catalog | Public. Returns subjects and institutions in one response. |
| GET /subjects, GET /institutions | Public. Standalone catalogues retained for existing clients. |
| GET /doubts | Public. search, subject, tag, status, scope, academicSystem, academicIndex, page, limit. Legacy semester filter accepted. |
| GET /doubts/:id | Public. Discussion with answers and comments. |
| POST /doubts | Signed in. title, body, subject, optional academicLevel, tags, imageIds and institution. |
| PUT /doubts/:id, DELETE /doubts/:id | Question owner or admin. Edit fields or delete. Original college scope is preserved on edit. |
| POST /doubts/:id/vote, POST /answers/:id/vote | Signed-in non-author. value 1 or -1. |
| POST /doubts/:id/answers | Signed in. body. |
| PUT /answers/:id, DELETE /answers/:id | Answer owner or admin. Update body or delete. |
| PATCH /answers/:id/accept | Question owner. Toggles the single accepted-answer pointer. |
| POST /answers/:id/comments | Signed in. body. |
| POST /uploads | Signed in. Multipart image field, 3 MB limit. |
| DELETE /uploads | Signed in. publicId of an owned, unattached upload. |
| POST /reports | Signed in. targetType doubt/answer, targetId and reason. |
| GET /notifications | Signed in. Own inbox, page parameter, 25 per page. |
| PATCH /notifications/:id/read, POST /notifications/read | Signed in. Mark one or all of the caller's notifications read. |

Search uses weighted English text matching on title, body and tags. Scope supports college, subject and all. College is the default for users who selected one. Subject scope requires a subject. All scopes are public. Filter the demo batch using scope=all and tag=study-library. Academic level supports semester, year, grade or other. Legacy semester inputs and older free-text subject records remain supported. Bodies are stored as raw Markdown and should be sanitized when rendered, as the official client does.

## Moderation

| Method and path | Access and input |
| --- | --- |
| GET /admin/users | Admin. Paginated registered users. |
| GET /admin/reports | Admin or moderator. Paginated pending reports. |
| PATCH /admin/users/:id/ban | Admin. Boolean isBanned. Admin targets are protected. |
| PATCH /admin/users/:id/role | Admin. student, teacher, moderator or admin. Own and primary-admin roles are protected. |
| PATCH /admin/reports/:id | Admin or moderator. status dismissed or removed. |
| POST /admin/subjects | Admin. name, optional slug, aliases, field, icon. |
| POST /admin/institutions | Admin. name, optional slug and country. |
| GET /admin/study-library | Admin. Publication status and preview of counts, subjects and tag. |
| POST /admin/study-library | Admin. JSON body { "confirm": "study-library-v1" }. One-time publication with deterministic IDs and a completion record. |

Use a staging database to test first publication and repeat requests. See the [A–Z playbook](DOUBT_FORUM_A_TO_Z_PLAYBOOK.md) for schema relationships and operating guidance.


## Update 13 November 2026 (branches `feat/design-v3` and `fix/review-bugs`)

New or changed routes. Not live until the branches are merged and deployed.

| Method and path | Access and input |
| --- | --- |
| GET /resources | Public. category (notes, papers, cheatsheets, books, others), search, page, limit. Returns title, kind, size, downloads and the sharer's name, never the file address. |
| GET /resources/popular | Public. The five most downloaded resources. |
| POST /resources | Signed in and verified. Multipart `file` (PDF, DOC, DOCX, PPT, PPTX, up to 4 MB, leading bytes checked) or JSON/field `link` (https only), plus title, category and optional description. Files need the Cloudinary variables; without them the file route answers 503 and links still work. 10 per hour per account. |
| GET /resources/:id/download | Public. Counts one download, then redirects (302) to the stored file or link. |
| DELETE /resources/:id | The sharer, a moderator or an admin. Also removes the stored file. |
| GET /tags/trending | Public. Top 8 tags in the last 30 days. Sample library questions are excluded. |
| GET /contributors | Public. Top 10 active accounts by reputation. Never returns email addresses. |
| POST /doubts/:id/view | Public. Adds one to the question's view count and returns it. The question page calls it once on open. It does not count against the per-account write limit. |

Behaviour changes

- GET /doubts/:id no longer changes the view count. GET /doubts and GET /doubts/:id include `views`.
- GET /doubts with no search, subject or tag excludes the sample-library questions. Search, subject browsing and `tag=study-library` still reach them.
- PATCH /admin/reports/:id answers 409 when the report is not pending, so a dismissed report can no longer remove content later.
- Upload size errors name the endpoint's own limit (3 MB image, 4 MB resource file).
- Tags are stored without leading `#` characters and in lower case.
- DELETE /admin/study-library (admin, body `{ "confirm": "study-library-v1" }`) removes the sample library and its completion record so it can be published again. GET /admin/study-library also returns `presentCount`.
