# API notes

Base: `/api/v1`. Success: `{ success: true, data, message }`. Error: `{ success: false, message }`. Protected routes use `Authorization: Bearer <token>`.

`GET /doubts?search=...` uses weighted English MongoDB text search on title/body/tags, ranked by textScore. Whole-word/stem matches replace substring matching. Existing subject/semester/tag/status filters combine with search. No search retains newest-first order.

POST `/auth/logout-all` (authenticated) revokes all existing JWTs for the current account, including the caller's token. Sign in again to obtain a new token. Normal client sign-out still only clears the current tab. JWT versions are checked against the account on every request.

| Method | Path | Access / action |
|---|---|---|
| GET | /health | Public readiness information |
| POST | /auth/signup | name, email, password, semester; creates student only |
| POST | /auth/login | email, password; returns user and JWT |
| GET | /auth/me | Signed-in account |
| GET | /doubts | search, subject, semester, tag, status, page, limit |
| POST | /doubts | Signed-in; title, body, subject, semester, tags[], imageIds[] |

`body` is stored as the raw Markdown the student typed and is returned unchanged. The server does not render or sanitise it; the client renders it through marked and sanitises with DOMPurify before display. Any client consuming this API must sanitise it too.
| GET | /doubts/:id | Public discussion including answers/comments |
| PUT / DELETE | /doubts/:id | Owner or admin; edit text fields / remove discussion |
| POST | /doubts/:id/vote | Signed-in non-author; value 1 or -1 |
| POST | /doubts/:id/answers | Signed-in; body |
| PUT / DELETE | /answers/:id | Owner or admin |
| POST | /answers/:id/vote | Signed-in non-author; value 1 or -1 |
| PATCH | /answers/:id/accept | Question owner; toggles a single accepted-answer pointer |
| POST | /answers/:id/comments | Signed-in; body |
| GET | /users/:id | Public name, role, semester, reputation and latest contributions |
| PUT | /users/me | Signed-in; name, semester only |
| POST | /uploads | Signed-in; multipart `image`; 3 MB limit |
| DELETE | /uploads | Signed-in; JSON publicId; only own unused upload |
| POST | /reports | Signed-in; targetType doubt/answer, targetId, reason |
| GET | /admin/users | Admin; paginated |
| PATCH | /admin/users/:id/ban | Admin; boolean isBanned; cannot ban admins |
| PATCH | /admin/users/:id/role | Admin; student/teacher only |
| GET | /admin/reports | Admin; paginated pending reports with preview |
| PATCH | /admin/reports/:id | Admin; status dismissed/removed |

Sign out clears browser state; no server logout/revocation endpoint. Current role/ban state is loaded from MongoDB on each authenticated request. Invalid IDs return 400; missing content 404; duplicate email/report 409.

## Data relationships

User ← Doubt.author. User ← Answer.author. Doubt ← Answer.doubt. Answer ← Comment.answer. Doubt.acceptedAnswer points to at most one answer. A unique Vote record links one user and a doubt/answer target. Upload tracks ownership and its optional attached doubt. Report links reporter, target and moderation status. Reputation is calculated from current answer votes (+10/-2) and accepted answers (+15), avoiding accumulating duplicate rewards from repeated toggles.

Email endpoints: POST /auth/forgot-password {email}, /auth/reset-password {token,password}, /auth/verify-email {token}, /auth/verification-email (authenticated). Disabled with 503 until EMAIL_ENABLED=1. See EMAIL_CHANGE_RECORD.md.

