<!-- consistency-review-2026-11-13 -->
> Current status, 13 November 2026 — See [current implementation and limits](CURRENT_STATE.md). The active design has Auto/Light/Dark themes and a separate community resource Library. Institution-scoped curriculum and publication review remain planned. Older counts, release IDs and provider checks below are dated evidence, not current certification.

# Student Doubt Forum — Complete Feature Specification

> **Status update 13 November 2026.** This document describes the build at code reference `827e8df` and has not been rewritten line by line. Changes since then are listed in [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) (section "Update 13 November 2026"), the [API notes](API.md) and the [Design v3 change record](DESIGN_V3_CHANGE_RECORD.md). Where they differ, the newer records win. Features added since: resource Library, Trending Topics, Top Contributors, view counts, Light and Dark themes, header search that keeps filters, Python and C and C++ subjects.

**Version:** 1.0 · 10 November 2026
**Code reference:** `827e8df`
**Live site:** https://student-doubt-forum-theta.vercel.app/

## What this document is

Every feature in the software, described the same way each time:

| Field | Meaning |
|---|---|
| **What the user sees** | The actual experience, in plain language |
| **Where it lives** | Exact files, server and client |
| **API** | Endpoints, methods, who may call them |
| **Data** | Collections and fields it reads or writes |
| **Rules and limits** | Every number, enforced server-side |
| **How it was built** | The implementation decision that matters, and why |
| **How it is verified** | The test file, and what it actually asserts |
| **Known limits** | What it does not do — stated as plainly as what it does |

**Companion document:** `BUILD_FROM_SCRATCH_PLAYBOOK.md` explains how the software was *made*. This one explains what it *does*.

**Every limit below is enforced on the server.** Client-side `minLength`, `maxLength` and `required` attributes exist for immediate feedback, and the server validates independently in `server/src/validation.js`. A request that bypasses the browser is still bounded.

---

## Contents

**[Summary tables](#summary-tables)** — feature index · what each role can do · all limits in one place · complete API surface

**A. [Accounts and identity](#a-accounts-and-identity)** — A1–A13
**B. [Asking questions](#b-asking-questions)** — B1–B7
**C. [Answers, discussion and reputation](#c-answers-discussion-and-reputation)** — C1–C6
**D. [Discovery](#d-discovery)** — D1–D8
**E. [Notifications](#e-notifications)** — E1–E3
**F. [Moderation and administration](#f-moderation-and-administration)** — F1–F7
**G. [Catalogues](#g-catalogues)** — G1–G2
**H. [Study Library](#h-study-library)** — H1
**I. [Interface, accessibility and platform](#i-interface-accessibility-and-platform)** — I1–I9

**[Verification status](#verification-status)** · **[Deliberately not built](#deliberately-not-built)**

---

# Summary tables

## Feature index

| | Feature | Who | Status |
|---|---|---|---|
| **A1** | Email and password signup | Anyone | Live |
| **A2** | Password login | Anyone | Live |
| **A3** | Google sign-in | Anyone | Live, owner-confirmed |
| **A4** | Link Google to a password account | Signed in | Live |
| **A5** | Session handling | Signed in | Live |
| **A6** | Sign out · Sign out everywhere | Signed in | Live |
| **A7** | Email verification | Anyone | Built, flag **off** |
| **A8** | Password recovery | Anyone | Live via Gmail, owner-confirmed |
| **A9** | Roles and badges | All | Live |
| **A10** | Edit own profile | Signed in | Live |
| **A11** | Public profile page | Anyone | Live |
| **A12** | Export my data | Signed in | Live, never exercised live |
| **A13** | Delete my account | Signed-in non-admin | Live, never exercised live |
| **B1** | Ask a question | Signed in | Live |
| **B2** | Markdown editor with toolbar and preview | Signed in | Live |
| **B3** | Markdown rendering: code, maths, tables | Anyone | Live |
| **B4** | Screenshot upload | Signed in | Live, Cloudinary-verified |
| **B5** | Edit a question | Author or admin | Live |
| **B6** | Delete a question | Author or admin | Live |
| **B7** | Unsaved-changes guard | Signed in | Live, partially verified |
| **C1** | Post an answer | Signed in | Live |
| **C2** | Edit or delete an answer | Author or admin | Live |
| **C3** | Comment on an answer | Signed in | Live |
| **C4** | Accept an answer | Question author | Live |
| **C5** | Vote on questions and answers | Signed-in non-author | Live |
| **C6** | Reputation | All | Live |
| **D1** | Paginated feed | Anyone | Live |
| **D2** | Weighted text search | Anyone | Live |
| **D3** | Subject filter | Anyone | Live |
| **D4** | Academic level filter | Anyone | Live |
| **D5** | Solved / open filter | Anyone | Live |
| **D6** | Tag filter | Anyone | Live |
| **D7** | Feed scopes | Anyone | Live |
| **D8** | Back-to-results context | Anyone | Live |
| **E1** | Notification events | Signed in | Live, owner-confirmed |
| **E2** | Bell with unread count | Signed in | Live |
| **E3** | Inbox with mark-as-read | Signed in | Live |
| **F1** | Report content | Signed in | Live |
| **F2** | Report queue, dismiss or remove | Admin | Live, mutations not browser-verified |
| **F3** | User list, suspend or restore | Admin | Live, mutations not browser-verified |
| **F4** | Promote to teacher | Admin | Live |
| **F5** | Subject catalogue administration | Admin | Live |
| **F6** | College catalogue administration | Admin | Live |
| **F7** | Publish the Study Library | Admin | Live, published once |
| **G1** | Subject catalogue with aliases | All | Live, 30 subjects |
| **G2** | College catalogue | All | Live, 1 college |
| **H1** | Study Library: 200 Q&A | Anyone | Live, published |
| **I1** | System / light / dark theme | Anyone | Live |
| **I2** | Responsive layout | Anyone | Live, verified to 390 px |
| **I3** | Accessibility features | Anyone | Live, partially audited |
| **I4** | Loading, empty, error and retry states | Anyone | Live |
| **I5** | Toast notices | Anyone | Live |
| **I6** | Shared rate limiting | All | Live, Redis mode confirmed |
| **I7** | Health endpoint | Anyone | Live |
| **I8** | Security headers | All | Live, verified live |
| **I9** | Diagnostics and timing headers | Operator | Live |

## What each role can do

| Capability | Guest | Student | Teacher | Admin |
|---|---|---|---|---|
| Browse, search, filter the feed | ✅ | ✅ | ✅ | ✅ |
| Read any question, answer, comment | ✅ | ✅ | ✅ | ✅ |
| View any public profile | ✅ | ✅ | ✅ | ✅ |
| Browse the Study Library | ✅ | ✅ | ✅ | ✅ |
| Ask a question | ❌ | ✅ | ✅ | ✅ |
| Answer, comment | ❌ | ✅ | ✅ | ✅ |
| Vote (not on own content) | ❌ | ✅ | ✅ | ✅ |
| Upload a screenshot | ❌ | ✅ | ✅ | ✅ |
| Accept an answer on own question | ❌ | ✅ | ✅ | ✅ |
| Edit or delete **own** content | ❌ | ✅ | ✅ | ✅ |
| Report content | ❌ | ✅ | ✅ | ✅ |
| Receive notifications | ❌ | ✅ | ✅ | ✅ |
| Export or delete own account | ❌ | ✅ | ✅ | Delete ❌ |
| Display a visible badge | ❌ | ❌ | ✅ Teacher | ✅ Admin |
| Edit or delete **anyone's** content | ❌ | ❌ | ❌ | ✅ |
| Review and resolve reports | ❌ | ❌ | ❌ | ✅ |
| Suspend or restore an account | ❌ | ❌ | ❌ | ✅ |
| Promote student ↔ teacher | ❌ | ❌ | ❌ | ✅ |
| Add subjects and colleges | ❌ | ❌ | ❌ | ✅ |
| Publish the Study Library | ❌ | ❌ | ❌ | ✅ |
| Create another **admin** | ❌ | ❌ | ❌ | ❌ — database only |
| Suspend or demote an admin | ❌ | ❌ | ❌ | ❌ — protected |

Two deliberate gaps in that last block: **no admin can create another admin, suspend an admin, demote an admin, or delete an admin account.** Those actions require direct database access, so a compromised admin account cannot escalate or lock everyone else out.

A **Teacher** badge is a visible credibility marker only. It confers no extra permission whatsoever.

## All limits in one place

### Content

| What | Limit |
|---|---|
| Question title | 10–160 characters |
| Question body | 20–12,000 characters |
| Answer body | 10–12,000 characters |
| Comment body | 2–1,000 characters |
| Report reason | 5–1,000 characters |
| Tags per question | up to 5 |
| Tag length | 1–24 characters, lowercased, de-duplicated |
| Images per question | up to 3, unique |
| Image size | 3 MB each |
| Image formats | JPEG, PNG, WebP — verified by magic bytes |
| Unattached uploads held per account | 9 |
| Subject name | 2–60 characters |
| Subject aliases | up to 15, each 1–60 characters |
| Subject icon | 1–8 characters |
| College name | 2–140 characters |
| Country code | exactly 2 letters |
| Academic level index | 1–30 |
| Academic `other` label | 1–60 characters |
| Legacy semester | 1–8 |

### Accounts

| What | Limit |
|---|---|
| Name | 2–60 characters |
| Email | 5–254 characters, lowercased, pattern-checked |
| Password | ≥8 characters, ≤72 **bytes** (bcrypt's real limit) |
| bcrypt cost | 12 |
| JWT lifetime | 7 days, HS256 |
| `JWT_SECRET` | ≥32 characters |
| Verification token | 32 random bytes, 24-hour expiry, single use |
| Reset token | 32 random bytes, 30-minute expiry, single use |

### Pagination

| List | Page size |
|---|---|
| Feed | 10 default, 30 maximum, page ≤ 10,000 |
| Notifications | 25 |
| Admin users | 25 |
| Admin reports | 25 |
| Profile questions | latest 50 |
| Profile answers | latest 50 |
| Subject catalogue | up to 500 |
| College catalogue | up to 500 |

### Rate limits

| Scope | Limit | Keyed by |
|---|---|---|
| All API | 600 / 15 min | IP subnet |
| Login + signup | 30 / 15 min | IP subnet |
| Login + signup | 30 / 15 min | Normalised email |
| Content writes | 120 / 15 min | Account |
| Content creation | 60 / 60 min | Account |
| Image upload | 15 / 60 min | Account |
| Email actions | 10 / 60 min | IP |
| Email actions | 3 / 60 min | Normalised email |
| Verification resend | 3 / 60 min | Account |
| Data export | 3 / 60 min | Account |
| Account deletion | 5 / 60 min | Account |
| Study Library import | 5 / 15 min | Account |

### Reputation

| Event | Points |
|---|---|
| Upvote on your answer | **+10** |
| Downvote on your answer | **−2** |
| Your answer accepted | **+15** |
| Any vote on your question | 0 |

Reputation can be negative. Reversals are exact: remove an upvote and −10 is applied; un-accept and −15 is applied.

## Complete API surface

Base path `/api/v1`. Success `{ success: true, data, message }`. Error `{ success: false, message }`. Protected calls need `Authorization: Bearer <token>`. Every API response carries `Cache-Control: private, no-store, max-age=0`.

### Identity and account

| Method | Path | Access | Input |
|---|---|---|---|
| GET | `/health` | Public | — |
| POST | `/auth/signup` | Public | `name`, `email`, `password`, optional `academicLevel`, `institution` |
| POST | `/auth/login` | Public | `email`, `password` |
| GET | `/auth/me` | Signed in | — |
| POST | `/auth/logout-all` | Signed in | — |
| GET | `/auth/google/config` | Public | — |
| POST | `/auth/google` | Public | `credential` |
| POST | `/auth/google/link` | Signed in | `credential`, `password` |
| POST | `/auth/forgot-password` | Public | `email` |
| POST | `/auth/reset-password` | Public | `token`, `password` |
| POST | `/auth/verification-email` | Signed in, flag on | — |
| POST | `/auth/verify-email` | Public, flag on | `token` |
| GET | `/users/:id` | Public | — |
| PUT | `/users/me` | Signed in | `name`, optional `academicLevel`, `institution` |
| GET | `/users/me/export` | Signed in | — → NDJSON attachment |
| DELETE | `/users/me` | Signed-in non-admin | `password` or `credential`, plus `confirmation: "DELETE"` |

### Content and discovery

| Method | Path | Access | Input |
|---|---|---|---|
| GET | `/catalog` | Public | — |
| GET | `/subjects` | Public | — |
| GET | `/institutions` | Public | — |
| GET | `/doubts` | Public | `search`, `subject`, `tag`, `status`, `scope`, `academicSystem`, `academicIndex`, `semester`, `page`, `limit` |
| POST | `/doubts` | Signed in (+ verified if flag on) | `title`, `body`, `subject`, optional `academicLevel`, `tags`, `imageIds`, `institution` |
| GET | `/doubts/:id` | Public | — |
| PUT | `/doubts/:id` | Author or admin | same fields |
| DELETE | `/doubts/:id` | Author or admin | — |
| POST | `/doubts/:id/vote` | Signed-in non-author | `value: 1 \| -1` |
| POST | `/doubts/:id/answers` | Signed in (+ verified) | `body` |
| PUT | `/answers/:id` | Author or admin | `body` |
| DELETE | `/answers/:id` | Author or admin | — |
| POST | `/answers/:id/vote` | Signed-in non-author | `value: 1 \| -1` |
| PATCH | `/answers/:id/accept` | Question author | — |
| POST | `/answers/:id/comments` | Signed in (+ verified) | `body` |
| POST | `/uploads` | Signed in (+ verified) | multipart `image` |
| DELETE | `/uploads` | Signed in | `publicId` |
| POST | `/reports` | Signed in | `targetType`, `targetId`, `reason` |
| GET | `/notifications` | Signed in | `page` |
| POST | `/notifications/read` | Signed in | — |
| PATCH | `/notifications/:id/read` | Signed in | — |

### Administration

| Method | Path | Input |
|---|---|---|
| GET | `/admin/users` | `page` |
| PATCH | `/admin/users/:id/ban` | `isBanned: boolean` |
| PATCH | `/admin/users/:id/role` | `role: "student" \| "teacher"` |
| GET | `/admin/reports` | `page` |
| PATCH | `/admin/reports/:id` | `status: "dismissed" \| "removed"` |
| POST | `/admin/subjects` | `name`, optional `slug`, `aliases`, `field`, `icon` |
| POST | `/admin/institutions` | `name`, optional `slug`, `country` |
| GET | `/admin/study-library` | — |
| POST | `/admin/study-library` | `confirm: "study-library-v1"` |

---

# A. Accounts and identity

## A1 · Email and password signup

**What the user sees.** A two-column sign-up screen. Left: the story panel — *"Every answer starts with a little curiosity."* Right: the form — full name, email, password, with a Show/Hide password toggle, plus two optional controls for academic level and college. One button: "Create your account →". On success they are signed in immediately and sent to wherever they were headed.

**Where it lives.** `client/src/pages.jsx` (`AuthPage`) · `academic-fields.jsx` · `institution-select.jsx` · `server/src/app.js` (`POST /auth/signup`) · `validation.js` · `academics.js` · `institutions.js`

**API.** `POST /auth/signup` → `{ user, token }`, HTTP 201, message *"Welcome to Doubt Forum!"*

**Data.** Creates a `users` document with `reputation: 0`, `role: 'student'`, `tokenVersion: 0`.

**Rules and limits.** Name 2–60. Email 5–254, lowercased, pattern-checked, unique. Password ≥8 characters and ≤72 bytes. Rate limited 30 per 15 minutes by IP **and** 30 per 15 minutes by normalised email. Academic level and college are optional.

**How it was built.** Three decisions:

1. **`role` is never read from the request body.** `User.create({ ...fields, passwordHash, reputation: 0 })` where `fields` is built only from validated inputs. Sending `role: "admin"` does nothing — not because it is filtered, but because it is never looked at.
2. **`reputation: 0` is set explicitly at creation.** The schema default is `null`, which is the lazy-backfill marker for accounts that predate stored reputation. A new account must not look like a legacy one.
3. **A failed verification email does not fail signup.** When the verification flag is on, `issueEmail` runs inside a `try/catch` that logs `signup_verification` and continues. A mail outage must not stop people joining.

Duplicate emails surface through the MongoDB 11000 unique-index violation, translated by the error handler into *"This record already exists. For signup, try a different email."*

**How it is verified.** `server/tests/forum.test.js` — hashing, normalised duplicate emails (case and whitespace), validation boundaries, and that a submitted `role` is ignored. `academics.test.js` — optional-level signup. Live: `scripts/live-smoke.js` performs two real signups; two manual student accounts passed on 10 November.

**Known limits.** No CAPTCHA. No disposable-domain blocking. No password-strength meter beyond the length floor. Timing of the duplicate-email response is not constant.

---

## A2 · Password login

**What the user sees.** Email, password, Show/Hide toggle, "Sign in →". Below it, a "Forgot password?" link. On success, redirect to the original destination.

**Where it lives.** `pages.jsx` (`AuthPage`) · `app.js` (`POST /auth/login`) · `navigation.js`

**API.** `POST /auth/login` → `{ user, token }`, message *"Welcome back!"*

**Rules and limits.** Same two rate-limit buckets as signup. `isDeleted` accounts are excluded from the lookup entirely. Banned accounts get HTTP 403 *"Your account has been suspended."*

**How it was built.** The failure response is deliberately uniform:

```js
const user = await User.findOne({ email: address, isDeleted: { $ne: true } })
                       .select('+passwordHash +googleSubject');
if (!user?.passwordHash || !(await bcrypt.compare(secret, user.passwordHash)))
  fail(401, 'Email or password is incorrect.');
```

A non-existent account, a wrong password, and a Google-only account with no password all produce the identical message. Only after a successful compare does the ban check run — so a suspended user learns their account is suspended, but only once they have proved they own it.

`passwordHash` needs an explicit `.select('+passwordHash')` because the schema marks it `select: false`. Two independent layers protect it: the schema default, and `safeUser()`'s explicit output field list.

**Open-redirect protection.** The `returnTo` parameter passes through `safeReturn()`:

```js
export function safeReturn(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')
      || /[\\\u0000- ]/.test(value)) return '/';
  try {
    const url = new URL(value, 'https://forum.invalid');
    return url.origin === 'https://forum.invalid' && !['/login','/signup'].includes(url.pathname)
      ? url.pathname + url.search + url.hash : '/';
  } catch { return '/'; }
}
```

It rejects protocol-relative `//evil.com`, backslashes, control characters, and `/login`/`/signup` (which would loop). Parsing against a sentinel origin and comparing the result is what catches the exotic cases.

**How it is verified.** `forum.test.js` — wrong password, invalid token, banned account with a live session. `navigation.test.js` — the open-redirect cases above.

**Known limits.** No account lockout after repeated failures; rate limiting is the only brake. No "remember me". No login-notification email.

---

## A3 · Google sign-in

**What the user sees.** Google's official "Continue with Google" button under the form, with an "or" divider. One click, pick an account, signed in. First time through it creates the account.

**Where it lives.** `client/src/google-button.jsx` · `pages.jsx` · `account-pages.jsx` · `server/src/google-auth.js`

**API.** `GET /auth/google/config` → `{ clientId }`. `POST /auth/google` with `{ credential }` → `{ user, token }`, 201 if created, 200 if returning.

**Data.** Sets `googleSubject` (unique, sparse, `select: false`). Sets `emailVerifiedAt` only when the email is authoritative.

**Rules and limits.** Credential must be a string ≤8192 characters. Audience must match `GOOGLE_CLIENT_ID`. `claims.email_verified` must be exactly `true`. Rate limited at 30 per 15 minutes by IP. Banned or deleted accounts are refused.

**How it was built.** Four decisions.

**1. Verification is server-side and complete.** `google-auth-library`'s `verifyIdToken` checks the signature against Google's keys, the audience, and the expiry. A credential that merely *looks* like a JWT fails. Then:

```js
if (!claims?.sub || claims.email_verified !== true)
  fail(403, 'Choose a Google account with a verified email address.');
```

**2. "Authoritative email" is narrower than "verified email".**

```js
authoritativeEmail: address.endsWith('@gmail.com') || Boolean(claims.hd)
```

Google can vouch for the current mailbox for Gmail and for Workspace domains (`hd` = hosted domain). For other addresses it is only asserting that the address was verified at some past point. Only an authoritative email sets `emailVerifiedAt`.

**3. Account collision is explicit, never magical.** If the email already has a password account, the response is:

> *An account already uses this email. Sign in with your password and link Google from Account settings.*

Silent merging on a matching email address is an account-takeover pattern. The user must prove they hold the password first.

**4. Concurrent first-time signups are handled.** Two simultaneous sign-ins can race to create the same `googleSubject`. The code catches 11000 and re-reads:

```js
catch (error) {
  if (error.code !== 11000) throw error;
  user = await findGoogleUser(identity.subject);
  if (!user) fail(409, 'An account already uses this email. …');
}
```

**On the client,** the GSI script loader is defensive: a 10-second timeout, the script element removed on failure, and the cached promise cleared so a retry can succeed. The button re-renders on two triggers — a `ResizeObserver` for width and a `MutationObserver` on `document.documentElement`'s `data-theme` for light/dark — and both guard against redundant re-renders by comparing against the last rendered width and theme. When `clientId` is blank the whole component renders nothing, so an unconfigured deployment degrades cleanly.

**How it is verified.** `google-auth-library.test.js`: valid token creates an account; unverified email rejected; audience mismatch rejected; existing-email collision returns the linking message; concurrent creation handled; banned account refused. Live: owner-confirmed working.

**Known limits.** Needs the stable production origin — Vercel's per-deployment URL triggers `origin_mismatch`. The button cannot render if a network blocks Google's script; the fallback is password sign-in. A Google-only account has no password, so it cannot use password recovery.

---

## A4 · Link a Google account to a password account

**What the user sees.** In Account settings, a "Google sign-in" section. If already linked: a confirmation line. If not: a password field and the Google button, with the Google button disabled until the password has at least 8 characters.

**Where it lives.** `client/src/account-pages.jsx` (`GoogleAccountSettings`) · `server/src/google-auth.js`

**API.** `POST /auth/google/link` with `{ credential, password }` → updated profile.

**Rules and limits.** Requires the current forum password. The Google account's email must **exactly match** the forum email. Refuses if a Google account is already linked. Signed-in only, 30 per 15 minutes by IP.

**How it was built.** Four guards, in order:

```js
if (!user?.passwordHash || !await bcrypt.compare(password(req.body.password), user.passwordHash))
  fail(401, 'Password is incorrect.');
if (user.googleSubject) fail(409, 'A Google account is already linked to this profile.');
if (user.email !== identity.email)
  fail(400, 'Choose the Google account with the same email as your forum profile.');
```

Then the write itself is conditional on nothing having changed underneath:

```js
linked = await User.findOneAndUpdate({
  _id: user._id,
  passwordHash: user.passwordHash,
  googleSubject: { $exists: false },
  isBanned: { $ne: true },
  isDeleted: { $ne: true },
}, { $set: fields }, { new: true }).select('+googleSubject');
if (!linked) fail(409, 'Your account changed. Refresh and try again.');
```

An 11000 here means that Google identity is already attached to a different profile, translated to a clear 409 rather than a 500.

Linking also sets `emailVerifiedAt` when the Google email is authoritative and the account was not already verified — a free verification for the user.

**How it is verified.** `google-auth-library.test.js` — wrong password rejected, mismatched email rejected, double-link rejected, successful link, `googleSubject` collision returns 409.

**Known limits.** No unlinking. The emails must match exactly, so a user with a different Google address cannot link.

---

## A5 · Session handling

**What the user sees.** Sign in once; a refresh keeps you signed in. Closing the tab signs that tab out. Sessions last 7 days.

**Where it lives.** `client/src/context.jsx` · `session.js` · `server/src/auth.js`

**API.** `GET /auth/me` → the current account, called on load whenever a token exists.

**How it was built.** Four decisions.

**1. Tokens live in `sessionStorage`, not `localStorage`.** Per-tab, cleared on tab close. On a shared or lab computer that difference matters.

**2. Blocked storage never breaks the app.** Some privacy settings disable Web Storage entirely, and an unguarded `sessionStorage` access throws:

```js
export function readSessionToken() {
  try { return globalThis.sessionStorage?.getItem('forum-token') || ''; } catch { return ''; }
}
export function saveSessionToken(token) {
  try { /* set or remove */ return true; } catch { return false; }
}
```

The current tab can still sign in using React state. Persistence must never prevent logout or crash startup.

**3. Every protected request re-reads the user from the database.**

```js
req.user = await User.findById(claims.sub).select('+googleSubject');
if (!req.user || req.user.isBanned || req.user.isDeleted
    || (claims.ver ?? 0) !== (req.user.tokenVersion || 0))
  return next(Object.assign(new Error('Your session has expired or the account is unavailable. Please sign in again.'), { status: 401 }));
```

Role and ban state are **never** trusted from the token. Ban someone and their current session stops working on the next request.

**4. A transient database failure returns 503, not 401.**

```js
try { req.user = await User.findById(claims.sub)… }
catch { return next(Object.assign(new Error('Account service is temporarily unavailable. Please try again shortly.'), { status: 503 })); }
```

Telling a user to sign in again because the database blinked is wrong and throws away their session. A 503 says "retry", which is the truth.

The `sub` claim is also pattern-checked as a 24-character hex string before it reaches a query.

**How it is verified.** `forum.test.js` — invalid tokens, anonymous writes, bans against live sessions. `production-hardening.test.js` — transient auth-lookup errors return 503. `theme.test.js` covers the blocked-storage pattern.

**Known limits.** No refresh tokens; after 7 days you sign in again. No cross-tab synchronisation — signing out in one tab leaves another tab's in-memory token alive until its next request.

---

## A6 · Sign out, and sign out everywhere

**What the user sees.** "Sign out" in the navigation clears this tab. On your own profile, "Sign out everywhere" asks *"Sign out on every device, including this one?"* and, on confirmation, invalidates every session you have.

**Where it lives.** `components.jsx` (`Navbar`) · `pages.jsx` (`Profile`) · `app.js` (`POST /auth/logout-all`)

**API.** `POST /auth/logout-all` → increments `tokenVersion`, message *"Signed out on all devices. Please sign in again."*

**How it was built.** A stateless JWT cannot normally be revoked — that is its whole trade-off. The fix is one integer:

```js
// models.js
tokenVersion: { type: Number, default: 0, min: 0 }

// auth.js — the token carries it
jwt.sign({ ver: user.tokenVersion || 0 }, process.env.JWT_SECRET,
         { subject: String(user._id), expiresIn: '7d', algorithm: 'HS256' })

// identify() — compared on every request
if ((claims.ver ?? 0) !== (req.user.tokenVersion || 0)) /* reject */
```

`claims.ver ?? 0` is what gives legacy tokens, minted before this feature existed, compatibility at version zero — so shipping it required no migration and signed nobody out.

A successful password reset increments the same counter, so recovering an account also evicts whoever had been using it.

`tokenVersion` is never included in `safeUser()`, so it is never exposed to a client.

**How it is verified.** `forum.test.js` — legacy token compatibility, old tokens rejected after revocation, anonymous denial, a fresh login receiving the current version.

**Known limits.** Not verified across multiple real browsers. Normal sign-out is tab-local and does not revoke a token that has already been copied — that is what "sign out everywhere" is for.

---

## A7 · Email verification *(built, flag off)*

**What the user sees — when enabled.** Signup sends a verification link. Until verified, posting a question, answer, comment or image returns: *"Verify your email before posting. Open Account settings to request a verification link."* Account settings has a "Send verification email" button. Reading and account management stay fully available.

**Where it lives.** `server/src/email.js` · `email-policy.js` · `client/src/account-pages.jsx` (`EmailAction` with `mode="verify"`)

**API.** `POST /auth/verification-email` (signed in) · `POST /auth/verify-email` with `{ token }`

**Rules and limits.** Token 32 random bytes, stored as SHA-256 only, **24-hour** expiry, single use. Resend limited to 3 per account per hour, plus 10 email actions per IP per hour. Both routes return 503 when the flag is off.

**How it was built.** The gate is one middleware, applied to exactly four routes:

```js
export function requireVerified(req, res, next) {
  if (verificationRequired() && !req.user?.emailVerifiedAt)
    return next(Object.assign(new Error('Verify your email before posting. …'), { status: 403 }));
  next();
}
```

Applied to `POST /doubts`, `POST /doubts/:id/answers`, `POST /answers/:id/comments` and `POST /uploads`. Nothing else. A user who cannot verify can still read everything, edit their profile, export their data and delete their account.

**Existing accounts are not falsely marked verified.** They must request a link. That is why this flag is separate from recovery (see A8) — switching them on together would have blocked every existing student's next post.

`safeUser()` returns both `emailVerified` and `verificationRequired`, so the client can show the right state without knowing the server's configuration.

**How it is verified.** `email.test.js` — token hashing, posting gate, replay rejection, expiry rejection, and that disabled mode returns 503.

**Known limits.** **Not enabled in production.** No real inbox delivery has been tested for verification specifically. Enabling it requires a verified sending domain, or every unverified existing user is locked out of posting.

---

## A8 · Password recovery

**What the user sees.** "Forgot password?" → enter your email → *"If the account is available, a reset link has been sent. Check your inbox and spam folder."* The email contains a link; the page asks for a new password; after success you sign in with it, and every other session is signed out.

**Where it lives.** `server/src/email.js` · `email-policy.js` · `client/src/account-pages.jsx` (`EmailAction`)

**API.** `POST /auth/forgot-password` with `{ email }` · `POST /auth/reset-password` with `{ token, password }`

**Rules and limits.** Token 32 random bytes, SHA-256 stored, **30-minute** expiry, single use. 3 requests per normalised address per hour; 10 email actions per IP per hour. Only accounts that actually have a password are eligible — a Google-only account is not.

**How it was built.** Six decisions, and most of them are about not leaking information.

**1. One response for every outcome.** Valid account, unknown address, banned user, Google-only account, delivery failure — all return the identical generic body. Enumeration gets you nothing.

**2. The real outcome goes to the server log as a safe code,** never to the response:

| Code | Meaning |
|---|---|
| `recipient_not_enabled` | Restricted test mode is on and this address differs |
| `no_password_account` | No eligible password account for that address |
| `gmail_config_missing_or_invalid` | Sender or App Password missing or malformed |
| `gmail_auth_rejected` | Gmail refused SMTP sign-in |
| `gmail_connection_failed` | Network, DNS or timeout |
| `gmail_send_failed` | Transport failed mid-send |
| `app_url_invalid` | Link base invalid, or not HTTPS in production |
| `provider_accepted` | Provider accepted it; inbox placement can still differ |

The operator reads this from Vercel's logs. No inbox screenshot, no environment value and no raw log ever needs to be shared to debug a delivery problem.

**3. The token travels in the URL fragment.**

```js
const link = new URL('/reset-password', base);
link.hash = token;
```

A fragment is not sent to the server in a normal navigation and does not appear in referrer headers.

**4. Links are built from an operator-controlled `APP_URL`, never the request's `Host` header** — a Host-derived reset link is a classic poisoning vector. In production the base must be HTTPS or the attempt fails with `app_url_invalid`.

**5. Consumption needs a button press, not a page load.** Corporate link scanners and mail previews fetch URLs automatically and would otherwise burn the one-time token before the user ever clicked.

**6. Consumption is one atomic operation:**

```js
const user = await User.findOneAndUpdate(
  { resetHash: hash, resetExpires: { $gt: new Date() }, isBanned: false,
    passwordHash: { $type: 'string' }, ...(publicRecoveryEnabled() ? {} : { email: emailTestRecipient() }) },
  { $set: { passwordHash }, $unset: { resetHash: 1, resetExpires: 1 }, $inc: { tokenVersion: 1 } });
if (!user) fail(400, 'This link is invalid or has expired. Request a new one.');
```

Match, consume and revoke in one write — so two simultaneous uses of the same link cannot both succeed. The `$inc` on `tokenVersion` is what evicts an attacker who was already signed in.

**The two-flag design.** `EMAIL_RECOVERY_ENABLED` turns on recovery without turning on mandatory verification. `EMAIL_TEST_RECIPIENT` restricts recovery to one address you own, so delivery can be proved before it is promised to anyone. During restricted mode the reset route *additionally* constrains its update to that email, so an older token belonging to another user cannot be used — and the mail adapter enforces the recipient rule independently of the route. Two layers.

Also: the UI clears the fragment from history after a successful use — `window.history.replaceState(null, '', location.pathname)`.

**How it is verified.** `email.test.js` — hashing, expiry, replay, generic response for unknown *and* for failed delivery, session revocation on reset, old password rejected, restricted-recipient mode, rejection of another user's token during restricted mode. Live: owner-confirmed working through Gmail.

**Known limits.** Gmail's sending limits make this beta-grade. Generic responses do not guarantee constant *timing*. A Google-only account cannot use this flow at all — by design, since it has no password.

---

## A9 · Roles and badges

**What the user sees.** A Teacher badge (amber, "✓ Teacher") or an Admin badge next to a name, on profiles and beside every post. Admins additionally see a "Moderation" link in the navigation.

**Where it lives.** `components.jsx` (`Badge`, `Author`, `Navbar`) · `server/src/auth.js` · `models.js`

**Rules and limits.** `role` enum is `['student','teacher','admin']`, default `student`. Public signup can only produce `student`. The admin API accepts role changes only between `student` and `teacher`, and refuses any request whose target is already an admin.

**How it was built.** The badge reflects the role on the **current** populated author record, not a value frozen into the post. Demote someone and their old answers stop showing the badge immediately.

Two guards:

```js
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin')
    return next(Object.assign(new Error('Administrator access required.'), { status: 403 }));
  next();
}
export function owns(user, author) {
  if (String(user._id) !== String(author) && user.role !== 'admin')
    fail(403, 'You do not have permission to change this content.');
}
```

`requireAdmin` guards the whole admin router at mount time — `api.use('/admin', requireUser, requireAdmin, admin)` — so a feature module mounted there cannot accidentally be public.

**A teacher has exactly zero extra permissions.** The badge is a credibility signal for readers, nothing more. That keeps the authorisation model to two levels — owner and admin — which is far easier to reason about than three.

**How it is verified.** `forum.test.js` — teacher promotion, admin-only route denial for non-admins, ownership checks, and that admin targets are protected.

**Known limits.** No moderator tier between teacher and admin. No per-college moderators. No verification that a teacher is actually a teacher.

---

## A10 · Edit your own profile

**What the user sees.** "Edit profile" on your own profile page opens a form: name, academic level, college. Save and the header updates.

**Where it lives.** `pages.jsx` (`Profile`) · `academic-fields.jsx` · `institution-select.jsx` · `app.js` (`PUT /users/me`)

**API.** `PUT /users/me` with `{ name, academicLevel?, institution? }` → updated `safeUser`

**Rules and limits.** Name 2–60. Academic level optional, `null` clears it. College must exist in the catalogue, or `null`. Email and role cannot be changed here. Counts against the content-write limit (120 / 15 min / account).

**How it was built.** One line, and the restriction is the design:

```js
req.user.name = text(req.body.name, 'Name', 2, 60);
Object.assign(req.user, academicFields(req.body), await institutionFields(req.body));
```

Only three things are assigned. Email, role, reputation, verification state and token version are structurally out of reach — there is no code path from this route to them.

`institutionFields()` validates existence before accepting:

```js
if (typeof body.institution !== 'string' || !mongoose.isObjectIdOrHexString(body.institution)
    || !await Institution.exists({ _id: body.institution }))
  fail(400, 'Choose a college from the catalogue.');
```

**Changing your college changes future posts and your default feed. It does not retroactively re-scope old posts** — those keep the college they were posted under.

**How it is verified.** `academics.test.js`, `institutions.test.js` — profile switching, validation, legacy compatibility.

**Known limits.** No avatar upload — the avatar is the first letter of the name. No bio or links. No email change. No self-service name-change history.

---

## A11 · Public profile page

**What the user sees.** A header with the avatar initial, name, badge, academic level, join date, and a reputation figure. Two tabs: "Recent questions (n)" and "Recent answers (n)". Answers show the parent question title and a plain-text excerpt. Your own profile adds "Edit profile" and "Sign out everywhere".

**Where it lives.** `pages.jsx` (`Profile`) · `components.jsx` (`Avatar`, `Badge`, `DoubtCard`, `TabList`) · `excerpt.js` · `app.js` (`GET /users/:id`)

**API.** `GET /users/:id` → `{ user, doubts, answers }`

**Rules and limits.** Public. Latest 50 questions and 50 answers, not paginated. Deleted accounts return 404 *"This account has been deleted."*

**How it was built.** The response is a hand-built object, not a serialised model:

```js
ok(res, { user: { _id, name, role, semester, academicLevel: effectiveLevel(user),
                  institution, createdAt, reputation: score }, doubts, answers });
```

Email is not in that list. A public profile does not expose an email address, and because the field list is explicit rather than a `.toObject()` with deletions, a new sensitive field added to the schema later cannot leak here by default.

Three queries run in parallel with `Promise.all`, and the question list goes through `decorateMany` so vote counts and answer counts cost two aggregations rather than two per item.

**How it is verified.** `forum.test.js` — profile privacy (no email, no hash), reputation display, deleted-account 404. `tabs.test.js` and `components.test.js` — the tab ARIA and keyboard behaviour.

**Known limits.** The 50-item lists are not paginated. No activity graph, no badge system, no follower counts.

---

## A12 · Export my data

**What the user sees.** In Account settings: *"Download your account details and contributions as a newline-delimited JSON file. Keep the download private."* One button downloads `doubt-forum-data.ndjson`.

**Where it lives.** `server/src/account.js` · `client/src/account-pages.jsx`

**API.** `GET /users/me/export` → NDJSON attachment, `Content-Disposition: attachment`, `Cache-Control: no-store`

**Data exported.** One JSON object per line, typed:

| `type` | Contents |
|---|---|
| `account` | id, name, email, role, semester, academicLevel, institution, createdAt |
| `question` | title, body, subject, subjectId, institution, semester, academicLevel, tags, images, author, acceptedAnswer, timestamps |
| `answer` | doubt, body, author, timestamps |
| `comment` | answer, body, author, timestamps |
| `vote` | targetType, target, value, timestamps |
| `report` | targetType, target, reason, status, timestamps |
| `upload` | url, doubt, timestamps |
| `notification` | actor, type, target, readAt, createdAt |

**Rules and limits.** 3 exports per account per hour.

**How it was built.** Two decisions.

**1. An explicit allow-list, never a dump.** Every list specifies its projection by name:

```js
['question', Doubt, { author: req.user._id },
 'title body subject subjectId institution semester academicLevel tags images author acceptedAnswer createdAt updatedAt'],
```

With a comment in the source stating the rule: *"Explicit allow-list: no password hash, token version or recovery hashes."* The inverse approach — dump and delete — leaks every field anyone adds later.

**2. It streams with real backpressure.** A cursor per collection, and a proper wait when the socket's buffer is full:

```js
for await (const data of Model.find(filter).select(projection).lean().cursor()) {
  if (res.destroyed) return;
  if (!res.write(JSON.stringify({ type, data }) + '\n'))
    await new Promise(resolve => {
      const done = () => { res.off('drain', done); res.off('close', done); resolve(); };
      res.once('drain', done); res.once('close', done);
    });
}
```

Listening for `close` as well as `drain` is what prevents a hang when the client disappears mid-download. A user with thousands of posts does not put the whole export in server memory.

**Why NDJSON.** It streams naturally, every line is independently parseable, and a truncated download is still partially readable — none of which is true of one large JSON array.

**How it is verified.** `account.test.js` — the export contains the expected types, and specifically does **not** contain `passwordHash`, `tokenVersion`, `resetHash` or `verificationHash`.

**Known limits.** No live export has ever been downloaded. Large downloads are not load-tested. Not a machine-readable portability format for import elsewhere. Other users' content that mentions you is not included, and should not be.

---

## A13 · Delete my account

**What the user sees.** In Account settings, a clearly worded section:

> *Your name, email, sign-in access and uploaded images will be removed. Questions, answers, comments and votes remain under Deleted user to preserve discussions. Remove personal details from your post text first. Private moderation records may be retained.*

Then: current password, and a field where you must type `DELETE`. A browser confirmation follows. Google-linked users can instead confirm with their linked Google account.

**Where it lives.** `server/src/account.js` · `client/src/account-pages.jsx`

**API.** `DELETE /users/me` with `{ password, confirmation: "DELETE" }` or `{ credential, confirmation: "DELETE" }`

**Rules and limits.** 5 attempts per account per hour. Admin accounts are refused: *"Transfer administrator ownership before deleting this account."*

**How it was built.** Four decisions.

**1. Images go first, and a failure stops everything.**

```js
for await (const upload of Upload.find({ owner: user._id }).cursor()) {
  let result;
  try { result = await cloudinary.uploader.destroy(upload.publicId); }
  catch { fail(503, 'Image cleanup is temporarily unavailable. Please retry account deletion later.'); }
  if (!['ok','not found'].includes(result.result))
    fail(503, 'Image cleanup is temporarily unavailable. Please retry later.');
  await Doubt.updateMany({ 'images.publicId': upload.publicId },
                         { $pull: { images: { publicId: upload.publicId } } });
  await Upload.deleteOne({ _id: upload._id, owner: user._id });
}
```

Deleting the account first would orphan the images with nothing left pointing at them. Doing images first means a provider outage leaves the account **usable**, so the user can retry. `'not found'` counts as success, which makes a retry after a partial run safe.

**2. The account update is a single atomic operation:**

```js
const removed = await User.findOneAndUpdate(
  { _id: user._id, passwordHash: user.passwordHash ?? null,
    googleSubject: user.googleSubject ?? null, role: { $ne: 'admin' }, isDeleted: { $ne: true } },
  { $set: { name: 'Deleted user',
            email: `deleted-${user._id}-${randomBytes(8).toString('hex')}@deleted.invalid`,
            passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
            role: 'student', isDeleted: true, deletedAt: new Date(),
            emailVerifiedAt: null, institution: null, academicLevel: null, isBanned: true },
    $unset: { googleSubject: 1, verificationHash: 1, verificationExpires: 1,
              resetHash: 1, resetExpires: 1, semester: 1 },
    $inc: { tokenVersion: 1 } });
if (!removed) fail(409, 'Your account changed during deletion. Sign in again and retry.');
```

The `.invalid` TLD is reserved and can never route. The replacement password hash is a real bcrypt hash of 32 random bytes — not an empty string, not `null` — so no code path can ever match it. `isBanned: true` plus the `tokenVersion` bump mean every existing session dies instantly.

**3. It is an anonymous tombstone, not a row deletion.** Questions, answers, comments and votes stay attached to "Deleted user". Deleting them would break other people's threads, destroy their reputation, and leave orphan references all over the database. The UI says exactly this, and tells the user to edit personal details out of their post text *before* deleting — because the post text is the one thing this operation cannot clean.

**4. Admins are blocked.** Allowing self-deletion of the last admin would lock everyone out of moderation permanently.

**How it is verified.** `account.test.js` — password and confirmation rejection, legacy tombstoning, owned-image deletion against a mocked Cloudinary adapter, other users' images untouched, discussions preserved, profile returns 404, old sessions and logins denied, provider-failure retry path, admin deletion rejected.

**Known limits.** No live deletion has ever been performed. The multi-collection cleanup is not transactional — an in-flight post during deletion may need operator reconciliation. Retained post bodies may still contain personal information. Moderation records are retained. Backups, provider logs and screenshots other people downloaded are not purged. **This is not a guarantee of complete erasure or of legal compliance.**

---

# B. Asking questions

## B1 · Ask a question

**What the user sees.** A two-column page: *"Let's clear that doubt."* Title, a rich body editor, subject dropdown, optional academic level, a tags field, and a screenshot uploader. The sidebar shows writing tips: make the title specific, share what you tried, add details or a screenshot, pick the right subject and tags — plus *"Keep personal information out of screenshots."* A line below the form states where the question will appear: your college and the worldwide feed, or just the worldwide feed.

**Where it lives.** `pages.jsx` (`Ask`) · `components.jsx` (`MarkdownEditor`) · `academic-fields.jsx` · `app.js` (`POST /doubts`) · `subjects.js` · `academics.js`

**API.** `POST /doubts` → the created question, 201, *"Your doubt has been posted."*

**Rules and limits.** Title 10–160. Body 20–12,000. Subject 2–60. Up to 5 tags of 1–24 characters, lowercased and de-duplicated. Up to 3 unique `imageIds`, each owned by you and unattached. Academic level 1–30 or an `other` label of 1–60. Signed in, and verified if that flag is on. Two rate limits apply: 120 content writes / 15 min and 60 creations / hour, both per account.

**How it was built.** Three decisions.

**1. Image ownership is re-verified at attach time, not trusted from the request:**

```js
const uploads = await Upload.find({ publicId: { $in: ids }, owner: req.user._id, doubt: null });
if (uploads.length !== ids.length) fail(400, 'Some images are unavailable. Upload them again.');
```

Three conditions at once: the publicId exists, you own it, and it is not already attached. A count mismatch fails the whole request. You cannot attach someone else's screenshot, and you cannot re-attach an image already on another question.

**2. College is inherited from the author, and cannot be forged:**

```js
institution: req.body.institution === null ? null : req.user.institution || null
```

Sending another college's ID does nothing — the only thing the body can do is send exactly `null` to opt out of college scope and post worldwide only.

**3. Subject resolution is forgiving about the past:**

```js
const found = await Subject.findOne({ keys: subjectKey(name) });
return found ? { subject: found.name, subjectId: found._id }
             : { subject: name, subjectId: undefined };
```

A catalogue match stores both the canonical name and the reference. An unknown free-text subject is still accepted and stored, so posts from before the catalogue existed remain valid and new clients are not blocked by a missing catalogue entry.

The upload records are stamped after creation, in a second write:

```js
await Upload.updateMany({ _id: { $in: uploads.map(u => u._id) } }, { doubt: doubt._id });
```

**How it is verified.** `forum.test.js` — validation boundaries, tag rules, unowned upload IDs rejected. `institutions.test.js` — forged college input ignored, worldwide opt-out respected. `subjects.test.js` — canonical resolution, aliases, legacy free-text. Live: `live-smoke.js` and `live-upload-smoke.js`.

**Known limits.** No drafts saved across sessions — the in-page guard (B7) is all there is. No duplicate detection before posting. No question templates. No preview of how it will look in the feed.

---

## B2 · Markdown editor with toolbar and preview

**What the user sees.** A toolbar of eight buttons above the text area — **B**, *I*, `<>`, `{ }`, ∑, •, 🔗, ❝ — and two tabs: Write and Preview. Clicking a button wraps your selection, or inserts sample text with the caret positioned so you can type straight over it. Preview shows the rendered result. A hint reads: *"Markdown is supported. Use the code block button for code, and `$x^2$` for maths."*

**Where it lives.** `client/src/editor.js` (pure logic) · `components.jsx` (`MarkdownEditor`)

**The eight tools.**

| Button | Inserts | Sample text |
|---|---|---|
| B | `**…**` | bold text |
| I | `*…*` | italic text |
| `<>` | `` `…` `` | variableName |
| `{ }` | ` ```java … ``` ` | `System.out.println("hi");` |
| ∑ | `$…$` | `x^2 + y^2` |
| • | `- ` | first point |
| 🔗 | `[…](https://)` | link text |
| ❝ | `> ` | quoted text |

**How it was built.** The whole feature exists because of one observation recorded in the change record: *"students will click buttons but will not learn Markdown syntax from a hint."*

**All the fiddly logic lives in a React-free module.** `editor.js` imports nothing. `applyTool()` handles every edge case:

```js
export function applyTool(value = '', start = 0, end = 0, tool) {
  const text = typeof value === 'string' ? value : '';
  const from = Math.max(0, Math.min(start, text.length));
  const to   = Math.max(from, Math.min(end, text.length));   // reversed selection → clamped
  const selected = text.slice(from, to) || tool.sample;       // empty selection → sample
  const lead = tool.block && from > 0 && text[from - 1] !== '\n' ? '\n' : '';
  const insert = lead + tool.before + selected + tool.after;
  const caretStart = from + lead.length + tool.before.length;
  return { text: text.slice(0, from) + insert + text.slice(to),
           caretStart, caretEnd: caretStart + selected.length };
}
```

Four behaviours fall out of those six lines: out-of-range offsets clamp instead of corrupting the body; a reversed selection works; an empty selection inserts helpful sample text; and a block tool (code block, list, quote) prepends a newline when it is not already at line start — without which the Markdown simply would not apply.

The returned caret positions are used to restore the selection after React re-renders:

```js
onChange(result.text);
requestAnimationFrame(() => {
  element.focus();
  element.setSelectionRange(result.caretStart, result.caretEnd);
});
```

**The textarea stays mounted in Preview mode**, hidden with the `hidden` attribute rather than unmounted, so switching tabs never loses the caret or an in-flight draft.

> **The bug this produced.** A global `textarea` display rule overrode the browser's `hidden` attribute, so Preview showed *both* the rendered output and the source editor. Fixed with an explicit `textarea[hidden]` rule. Only a real browser finds this; the jsdom test asserted the attribute and was correct — the CSS was wrong.

Tabs use `role="tablist"`, `aria-selected`, `aria-controls` and a roving tabindex, with Left/Right arrow movement from `nextTab()`.

**How it is verified.** `editor.test.js` (10 subtests) — every tool produces renderable Markdown; selections are wrapped not replaced; block tools start their own line; reversed and out-of-range selections do not corrupt the body; arrow keys move between tabs. `components.test.js` — eight labelled `type="button"` toolbar buttons exist, the tablist has correct ARIA and exactly one `tabIndex={0}`, and validation attributes reach the textarea. Live at 390 px: all eight controls remain reachable across wrapped rows, and Preview correctly hides the source.

**Known limits.** No drag-and-drop image insert. No keyboard shortcuts (no Ctrl+B). No table builder — tables must be typed. No syntax highlighting inside the editor itself, only in the preview.

---

## B3 · Markdown rendering: code, maths and tables

**What the user sees.** Formatted question and answer bodies: bold and italic, bulleted and numbered lists, blockquotes, tables, links that open in a new tab, syntax-highlighted code blocks in thirteen languages, and mathematics rendered properly — `$x^2$` inline, `$$…$$` as a display equation.

**Where it lives.** `client/src/markdown.js` (the pipeline) · `markdown-view.js` (browser entry + CSS) · `components.jsx` (`Markdown` component) · `excerpt.js` (plain-text previews)

**The pipeline, and the order is the security property.**

```
marked (gfm: true, breaks: true)
  → marked-katex-extension (KaTeX, throwOnError: false)
    → highlight.js (13 registered languages)
      → DOMPurify (explicit tag and attribute allow-list)
```

**Allowed tags:** `p br strong em del a ul ol li blockquote code pre span h3 h4 hr table thead tbody tr th td`
**Allowed attributes:** `href title class style aria-hidden colspan rowspan align start`
**Blocked:** `ALLOW_DATA_ATTR: false`, `ALLOW_ARIA_ATTR: false`, and — deliberately — **`img` is not on the list**.

**Languages:** plaintext, Java, Python, C++, C, C#, JavaScript, TypeScript, SQL, HTML/XML, CSS, JSON, Shell.

**How it was built.** Seven decisions.

**1. Sanitise last.** Stated in the source: *"Sanitising last means nothing marked or KaTeX produce can introduce script content, regardless of what the student typed. The server's CSP (`script-src 'self'`) is a second layer, not a substitute."*

**2. Nothing was migrated.** Bodies are still stored exactly as the student typed them. Plain text is valid Markdown, so every pre-existing post renders as it did.

**3. `breaks: true`.** A single newline becomes a line break — matching exactly how bodies read before, under `white-space: pre-wrap`. Without this, every existing post would have silently reflowed.

**4. Headings clamp to h3/h4.**

```js
heading({ tokens, depth }) {
  const level = Math.min(Math.max(depth, 3), 4);
  return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
}
```

A post body sits inside the page's own heading outline. An `h1` in a post would break the document structure for screen readers.

**5. Raw HTML is escaped, not dropped.**

```js
html({ text }) { return escapeHtml(text); }
```

With the reason in a comment: *"User HTML must not inherit the inline styles needed by generated KaTeX. In particular, a positioned span could cover the application's controls."* Escaping also means a student who types `<` sees `<` rather than losing their text silently.

**6. Thirteen languages, hand-registered.** Importing all of highlight.js adds roughly a megabyte for languages this audience never uses. An unknown language is HTML-escaped rather than dropped, so an unrecognised fence still shows the code.

**7. Links never control the opener.**

```js
purifier.addHook('afterSanitizeAttributes', node => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('rel', 'nofollow noopener noreferrer');
    node.setAttribute('target', '_blank');
  }
});
```

**The bundle split.** The renderer is about 130 KB gzipped — 140 % of the entire rest of the app. So it loads on demand:

| Chunk | gzipped |
|---|---|
| Main bundle, before | 93.11 KB |
| Main bundle, after | 95.05 KB |
| Markdown chunk, on demand | 130.61 KB |

The feed and the sign-in screens never load it. The stylesheets live in `markdown-view.js` rather than `markdown.js` specifically so that `markdown.js` stays importable from Node for the tests, where a CSS import would throw.

**And the fallback is never unsafe:**

```js
if (!render) return <p className="prose">{source}</p>;   // React escapes this
return <div className="prose markdown" dangerouslySetInnerHTML={{ __html: render(source) }} />;
```

While the chunk is in flight the body is readable plain text. It is never both unrendered and dangerous.

**Feed excerpts use a different, dependency-free path.** `excerpt.js` strips Markdown syntax with regex only, because the feed imports it and must not pull in the 130 KB renderer.

**How it is verified.** `markdown.test.js` (14 subtests) — plain text still renders with line breaks; formatting, code blocks, tables and KaTeX render; headings clamp; previews strip Markdown. And **thirteen XSS payloads**: `<script>`, `onerror`, `<svg/onload>`, `<iframe>`, `javascript:` links, `<form>`, `<input>`, `<style>`, `<object>`, a MathML-wrapped script, and a base64 `data:text/html` link.

> **How those assertions work matters.** The test **parses the sanitised output** and asserts that no element ends up with an event-handler attribute or a `javascript:`/`data:text/html` URL. String matching would have produced false failures on inert escaped text, and false passes on cleverly encoded payloads.

CSP was also checked against a running server: `style-src` includes `'unsafe-inline'` and `font-src` includes `'self'`, so KaTeX's inline styles and bundled fonts work, while `script-src` stays `'self'`. Live at 390 px: bold text, KaTeX maths and highlighted code all render with no horizontal overflow.

**Known limits.** **Comments render as plain text** — extending the renderer to comments was out of scope. No image embedding in bodies. No Mermaid or other diagrams. English-only KaTeX error messages. No server-side rendering or validation of Markdown, and none is needed, because the stored value is plain text and rendering happens in the browser.

---

## B4 · Screenshot upload

**What the user sees.** On the Ask form: a dashed upload zone reading "+ Add an image" with *"JPG, PNG or WebP · up to 3 MB each · 3 images max"*. Thumbnails appear with an × to remove. On the question page, images show below the body and open full size in a new tab.

**Where it lives.** `app.js` (`POST /uploads`, `DELETE /uploads`) · `forum.js` (`removeDoubt`) · `pages.jsx` (`Ask`, `Detail`)

**API.** `POST /uploads` multipart `image` → the Upload record, 201. `DELETE /uploads` with `{ publicId }`.

**Rules and limits.** 3 MB per file. One file per request. JPEG, PNG or WebP. Up to 3 per question. At most 9 unattached uploads held per account. 15 uploads per account per hour. Resized server-side to a 1800×1800 limit.

**How it was built.** Five layers of checking, in order.

```js
// 1. Rate limit — before multer, so a flood never gets parsed
limiter('upload', 15, 60 * 60 * 1000, { account: true })

// 2. Configuration check — a clear message, not a crash
if (!process.env.CLOUDINARY_API_SECRET)
  fail(503, 'Image uploads are not configured yet. You can still post a text doubt.');

// 3. multer: memory storage, hard caps, MIME filter
multer({ storage: multer.memoryStorage(),
         limits: { fileSize: 3 * 1024 * 1024, files: 1 },
         fileFilter: (req, file, cb) =>
           cb(null, ['image/jpeg','image/png','image/webp'].includes(file.mimetype)) })

// 4. Magic-byte signature check on the actual bytes
const valid = (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)                       // JPEG
  || b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))                 // PNG
  || (b.toString('ascii',0,4) === 'RIFF' && b.toString('ascii',8,12) === 'WEBP');     // WEBP
if (!valid) fail(400, 'The file is not a supported image.');

// 5. Storage ceiling
if (await Upload.countDocuments({ owner: req.user._id, doubt: null }) >= 9)
  fail(400, 'Remove unused uploads before adding more images.');
```

**Why steps 3 and 4 are both needed.** A declared MIME type is just a string in the request — a renamed `.exe` passes step 3 and fails step 4. Checking the actual leading bytes is the only real format check.

**The attachment lifecycle is what makes deletion safe.** `doubt: null` means unattached. `DELETE /uploads` only matches `{ publicId, owner, doubt: null }` — so **an attached image cannot be removed through the unused-upload route**, verified live. Deletion of a question goes through the cascade instead:

```js
for (const image of images) {
  await cloudinary.uploader.destroy(image.publicId);   // remote first
  await image.deleteOne();                              // then the local record
}
```

With the reason in a comment: *"Keep the records when remote deletion fails so the operation can be retried."* The reverse order would orphan the file in Cloudinary with nothing pointing at it.

Editing a question preserves its attachments — the edit form says so and hides the uploader — because replacing attachments on edit would need a reconciliation path that does not exist.

**How it is verified.** `forum.test.js` — ownership, unowned publicIds rejected, attachment protection. Live, via `live-upload-smoke.js`: a real Cloudinary upload, the returned URL delivering HTTP 200 with an image content type, unused-image removal succeeding, a second removal returning 404, re-upload attaching to a question, the attached image rejected by the unused route, and question deletion running remote cleanup.

**Known limits.** No image editing, cropping or rotation. No alt-text field — the alt attribute is generic. No automatic cleanup job for abandoned unattached uploads; the 9-upload ceiling is the only pressure valve. No virus scanning. No EXIF stripping, so location metadata in a photo is not removed. A CDN may serve a cached copy briefly after deletion.

---

## B5 · Edit a question

**What the user sees.** "Edit question" on your own question (or any question, if you are an admin) opens the same form pre-filled, headed *"Refine your question."* Attachments are shown but not editable, with *"Existing attachments are preserved when editing."*

**Where it lives.** `pages.jsx` (`Ask` with `edit`) · `app.js` (`PUT /doubts/:id`)

**API.** `PUT /doubts/:id` → the updated question, *"Doubt updated."*

**Rules and limits.** Author or admin only. Same validation as creation. College scope is preserved. Images unchanged.

**How it was built.** Three lines, reusing everything:

```js
const doubt = await findDoc(Doubt, req.params.id);
owns(req.user, doubt.author);
Object.assign(doubt, await doubtFields(req.body)); await doubt.save();
```

`doubtFields()` is the same function creation uses, so edit and create can never drift apart in their validation.

`doubtFields` does not touch `institution`, so **the original college scope survives an edit** — a user who changes their college later does not retroactively move their old questions. The UI states this: *"Editing keeps the original college scope."*

The client also checks ownership before showing the form, to fail fast with a clear message rather than letting the user fill in a form that will be rejected. The server check is the real one.

**How it is verified.** `forum.test.js` — ownership enforcement, admin override, cross-account denial, validation reuse.

**Known limits.** No edit history or revision diff. No "edited" marker on the post. No attachment editing. No edit window or rate restriction beyond the general content-write limit.

---

## B6 · Delete a question

**What the user sees.** "Delete" on your own question, with a confirmation: *"Delete this doubt and all its answers? This cannot be undone."* On success you return to the feed.

**Where it lives.** `app.js` (`DELETE /doubts/:id`) · `forum.js` (`removeDoubt`)

**API.** `DELETE /doubts/:id` → *"Doubt deleted."*

**How it was built.** The cascade order is deliberate:

```js
export async function removeDoubt(doubt, cloudinary) {
  const images = await Upload.find({ doubt: doubt._id });
  for (const image of images) { await cloudinary.uploader.destroy(image.publicId); await image.deleteOne(); }
  const answers = await Answer.find({ doubt: doubt._id });
  for (const answer of answers) await removeAnswer(answer);
  await Vote.deleteMany({ targetType: 'doubt', target: doubt._id });
  await doubt.deleteOne();
}
```

1. **Images first** — remote, then record, so a provider failure is retryable.
2. **Answers via `removeAnswer`**, reusing the full per-answer path so each answer's comments, votes **and reputation reversal** are handled correctly. Deleting a question therefore correctly removes the reputation its answers earned, including +15 for an accepted one.
3. **Question votes.**
4. **The question itself, last** — so an interrupted deletion leaves a question that can be retried, not orphan children with no parent.

The same `removeDoubt` function is used by admin content removal (F2), so there is exactly one deletion path in the codebase.

**How it is verified.** `forum.test.js` — cascading answer deletion, comment and vote cleanup, reputation reversal including accepted answers, recorded image cleanup. Live: question deletion with real Cloudinary cleanup.

**Known limits.** No transaction — a crash mid-cascade leaves partial state needing operator reconciliation. No soft delete and no undo. Notifications pointing at the question survive and render *"This discussion was removed."*

---

## B7 · Unsaved-changes guard

**What the user sees.** With unsaved edits, clicking an internal link asks *"Leave this form? Unsaved changes will be lost."* Closing the tab triggers the browser's own warning.

**Where it lives.** `client/src/useUnsavedChanges.js` · used by `Ask`

**How it was built.** React Router navigation does not fire `beforeunload`, so the hook intercepts link clicks in the capture phase — and then excludes every click that is not a real navigation:

```js
function leave(event) {
  const link = event.target.closest?.('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey
      || event.shiftKey || link.hasAttribute('download') || link.target === '_blank') return;
  if (link.href === window.location.href || link.getAttribute('href').startsWith('#')) return;
  if (!window.confirm('Leave this form? Unsaved changes will be lost.')) {
    event.preventDefault(); event.stopPropagation();
  }
}
document.addEventListener('click', leave, true);   // capture, to run before the router
```

Middle-click, Ctrl-click, Cmd-click, Shift-click, downloads, new-tab links, same-page links and fragment links are all exempt — otherwise the guard would fire on things that do not actually leave the page.

**"Dirty" is a fingerprint comparison, not a flag:**

```js
const fingerprint = JSON.stringify([form.title, form.body, form.subject,
                                    form.academicLevel, form.tags,
                                    images.map(i => i.publicId)]);
useEffect(() => { if (ready && baseline === null) setBaseline(fingerprint); }, [ready, baseline, fingerprint]);
useUnsavedChanges(ready && baseline !== null && fingerprint !== baseline);
```

The baseline is captured once the form is ready. On the edit form that is *after* the existing question loads — so pre-filled content is not mistaken for unsaved changes. Typing and then undoing back to the original state correctly clears the warning, which a boolean flag would not.

**How it is verified.** Browser-tested for the navigation warning. **Explicitly recorded as not conclusively verified:** the Cancel/stay branch. Browser Back interception is not implemented by this document-link guard.

**Known limits.** Does not cover browser Back. No draft persistence across sessions — if the browser crashes, the text is gone. `window.confirm` cannot be styled.

---

# C. Answers, discussion and reputation

## C1 · Post an answer

**What the user sees.** Below the answers on a question page: *"Share what you know — explain the why, not just the answer."* The same Markdown editor, and a "Post your answer →" button. Guests see a sign-in prompt instead.

**Where it lives.** `pages.jsx` (`Detail`) · `app.js` (`POST /doubts/:id/answers`) · `notifications.js`

**API.** `POST /doubts/:id/answers` with `{ body }` → the answer, 201, *"Answer posted. Thank you for helping!"*

**Rules and limits.** Body 10–12,000. Signed in, verified if the flag is on. Content-write and content-create limits apply. Any number of answers per question; no self-answer restriction.

**How it was built.** The notification is fired immediately after creation and is deliberately non-blocking:

```js
const answer = await Answer.create({ doubt: doubt._id, author: req.user._id,
                                     body: text(req.body.body, 'Answer', 10, 12000) });
await notifyUser({ user: doubt.author, actor: req.user._id, type: 'question_answered',
                   target: doubt._id, eventKey: `answer:${answer._id}` });
```

`notifyUser` swallows its own errors — the answer must succeed even if notification insertion fails. The `eventKey` is derived from the answer's own id, so the notification cannot duplicate.

`findDoc` validates the id format before any query:

```js
if (typeof id !== 'string' || !mongoose.isObjectIdOrHexString(id)) fail(400, 'Invalid record ID.');
```

A malformed id gives a clean 400, not a Mongoose CastError surfacing as a 500.

On a failed submission the client **retains the typed text in memory** — a recorded P0 usability requirement — so a network error does not cost the user their answer.

**How it is verified.** `forum.test.js` — creation, validation, anonymous rejection. `notifications.test.js` — the event is created for the question author and suppressed for self-answers.

**Known limits.** No rich reply threading — comments are the only sub-level. No answer drafts. No "answer in progress" indicator to prevent duplicate work.

---

## C2 · Edit or delete an answer

**What the user sees.** "Edit" and "Delete" on your own answers. Edit swaps in an inline Markdown editor with Save and Cancel. Delete confirms with *"Delete this answer and its comments?"*

**Where it lives.** `pages.jsx` (`AnswerCard`) · `app.js` · `forum.js` (`removeAnswer`)

**API.** `PUT /answers/:id` with `{ body }` · `DELETE /answers/:id`

**How it was built.** Deletion reverses reputation exactly, and the ordering is what makes it correct:

```js
export async function removeAnswer(answer) {
  await ensureReputation(answer.author);
  const removed = await Answer.findOneAndDelete({ _id: answer._id });
  if (!removed) return;                       // another request already removed it
  const rows = await Vote.aggregate([
    { $match: { targetType: 'answer', target: answer._id } },
    { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$value', 1] }, 10, -2] } } } }]);
  const acceptance = await Doubt.updateOne({ _id: answer.doubt, acceptedAnswer: answer._id },
                                           { $unset: { acceptedAnswer: 1 } });
  await addReputation(answer.author, -(rows[0]?.total || 0) - (acceptance.modifiedCount ? 15 : 0));
  await Promise.all([Comment.deleteMany({ answer: answer._id }),
                     Vote.deleteMany({ targetType: 'answer', target: answer._id })]);
}
```

Four things in that function:

1. **`findOneAndDelete` returning a document is the proof of ownership of the operation.** Only the request that actually removed the answer applies the reputation reversal. Two concurrent deletions cannot double-subtract.
2. **`ensureReputation` runs first**, so a legacy account with `reputation: null` is initialised before a `$inc` is applied to it — otherwise the increment would be applied to nothing.
3. **The acceptance clear is conditional** on `acceptedAnswer: answer._id`, and `modifiedCount` tells you whether the −15 applies. Deleting an accepted answer reopens the question.
4. Comments and votes are cleaned up in parallel at the end.

**How it is verified.** `forum.test.js` — ownership, admin override, cascading comment and vote deletion, reputation reversal, accepted-answer reopening.

**Known limits.** No edit history. No "edited" marker. No transaction across the four operations.

---

## C3 · Comment on an answer

**What the user sees.** "+ Add a comment" under each answer opens a small textarea. Comments appear as a compact list with author and date.

**Where it lives.** `pages.jsx` (`AnswerCard`) · `app.js` (`POST /answers/:id/comments`)

**API.** `POST /answers/:id/comments` with `{ body }` → 201, *"Comment added."*

**Rules and limits.** Body 2–1,000. Signed in, verified if the flag is on. One level only — no replies to comments. Not paginated.

**How it was built.** The interesting part is on the read side. Loading a thread does **not** query comments per answer:

```js
const [decorated, comments] = await Promise.all([
  decorateMany(answers, 'answer', req.user),
  Comment.find({ answer: { $in: answers.map(a => a._id) } })
         .sort({ createdAt: 1 }).populate('author', authorFields)]);
const byAnswer = new Map();
for (const comment of comments) {
  const key = String(comment.answer);
  if (!byAnswer.has(key)) byAnswer.set(key, []);
  byAnswer.get(key).push(comment);
}
```

One `$in` query for the whole page, grouped in memory. Served by the `{answer: 1, createdAt: 1}` index — a collection that previously had **no index at all**, despite being queried on every single question view.

Posting a comment notifies the answer's author, with `eventKey: comment:<id>`.

**Comments render as plain text, not Markdown.** This is deliberate and recorded: extending the renderer to comments was out of scope, and it keeps comments visually subordinate to answers.

**How it is verified.** `forum.test.js` — creation, validation, cleanup on answer deletion, per-answer grouping and author population. `notifications.test.js` — the comment event.

**Known limits.** Plain text only. No nesting. No voting on comments. No pagination — a thread with hundreds of comments loads all of them.

---

## C4 · Accept an answer

**What the user sees.** On your own question, each answer has "✓ Accept answer". The accepted one gets a green border, a "✓ Accepted by question author" label, and sorts to the top. The question shows a solved badge, and appears under "Accepted answer" in the status filter. The button becomes "Remove acceptance".

**Where it lives.** `pages.jsx` (`AnswerCard`) · `app.js` (`PATCH /answers/:id/accept`) · `forum.js` (`toggleAcceptance`)

**API.** `PATCH /answers/:id/accept` → `{ accepted: boolean }`

**Rules and limits.** **Only the question's author.** Not the answer's author, not an admin, not a teacher. One accepted answer per question. Toggling off is allowed.

**How it was built.** Three decisions.

**1. "One accepted answer" is structural, not a rule.** It is a single `acceptedAnswer` pointer on the question, not an `isAccepted` flag on each answer. A second acceptance *moves the pointer*; there is no state in which two answers are accepted, because the data model cannot represent it.

**2. Not even an admin can accept.**

```js
if (String(doubt.author) !== String(req.user._id))
  fail(403, 'Only the student who asked can accept an answer.');
```

Acceptance means "this solved *my* problem". Nobody else can know that, so nobody else can assert it.

**3. The write is a compare-and-set, and reputation moves with it:**

```js
const result = await Doubt.updateOne(
  { _id: doubt._id, acceptedAnswer: doubt.acceptedAnswer || null },
  accepted ? { $set: { acceptedAnswer: answer._id } } : { $unset: { acceptedAnswer: 1 } });
if (!result.modifiedCount) fail(409, 'Acceptance changed in another request. Please refresh and retry.');
if (previous) await addReputation(previous.author, -15);
if (accepted) await addReputation(answer.author, 15);
```

The filter includes the *expected current* value. If someone else changed acceptance between read and write, the update does not fire and the request fails with a 409 rather than awarding points for a change that did not happen. `ensureReputation` runs for both the old and the new author before either increment.

The notification is only sent when accepting, with `eventKey: accepted:<id>` — so re-accepting the same answer later never notifies twice.

**Answer sorting** puts acceptance first, then score:

```js
result.sort((a, b) => Number(b.isAccepted) - Number(a.isAccepted) || b.votes - a.votes);
```

**How it is verified.** `forum.test.js` — only the question author may accept, toggling works, switching reverses the previous author's credit, the solved status filter responds, a stale change returns 409.

**Known limits.** No multiple accepted answers. No time limit on changing acceptance. No notification to the author who *loses* acceptance.

---

## C5 · Voting

**What the user sees.** ▲ and ▼ with a score between them, on every question and answer. Your current vote is highlighted. Clicking the same arrow again removes your vote; the opposite arrow switches it. The buttons are disabled on your own content.

**Where it lives.** `components.jsx` (`VoteButtons`) · `app.js` · `forum.js` (`toggleVote`)

**API.** `POST /doubts/:id/vote` · `POST /answers/:id/vote`, both with `{ value: 1 | -1 }`

**Rules and limits.** Signed in. **Cannot vote on your own content.** `value` must be exactly `1` or `-1`. One vote per user per target, enforced by a unique index. Only answer votes affect reputation.

**How it was built.** Four decisions.

**1. The unique index is the integrity guarantee:**

```js
voteSchema.index({ targetType: 1, target: 1, user: 1 }, { unique: true });
```

Everything else builds on it. The database cannot hold two votes from one user on one target, whatever the application does.

**2. Toggling is computed, not stored:**

```js
const previous = await Vote.findOne(filter);
const nextValue = previous?.value === req.body.value ? 0 : req.body.value;
```

Same value → 0 → delete. Different value → switch. No existing vote → create. Three cases, one expression.

**3. Every write is a compare-and-set, and a concurrent change is reported honestly:**

```js
if (previous) {
  const result = nextValue === 0
    ? await Vote.deleteOne({ _id: previous._id, value: previous.value })
    : await Vote.updateOne({ _id: previous._id, value: previous.value }, { value: nextValue });
  if (!(result.deletedCount || result.modifiedCount))
    fail(409, 'Your vote changed in another request. Please retry.');
} else {
  try { await Vote.create({ ...filter, value: nextValue }); }
  catch (error) { if (error.code === 11000) fail(409, 'Your vote changed in another request. Please retry.'); throw error; }
}
```

The reputation delta then reflects exactly what changed:

```js
await addReputation(doc.author, voteCredit(nextValue) - voteCredit(previous?.value));
```

Switching an upvote to a downvote is `(−2) − (+10) = −12`, applied as one atomic `$inc`. Removing an upvote is `0 − 10 = −10`. No special cases.

**4. Totals are aggregated on read, never stored.** `decorateMany` computes the total **and** the viewer's own vote in a single aggregation, which is only sound because of decision 1:

```js
const mine = user?._id
  ? { $sum: { $cond: [{ $eq: ['$user', user._id] }, '$value', 0] } }
  : { $sum: 0 };
```

Since there can be at most one vote per user per target, summing the viewer's values yields precisely their single vote or zero. For an anonymous viewer the accumulator is a constant.

Self-voting is blocked on both sides — server `fail(403, 'You cannot vote on your own content.')`, and client `disabled={busy || item.author?._id === user?._id}`.

**How it is verified.** `forum.test.js` — upvote, downvote, repeat removes, opposite switches, self-vote rejected, invalid values rejected, reputation deltas correct for every transition, unique index enforced.

**Known limits.** No vote history visible to the user. No reputation threshold required to vote or downvote. No reversal limit. Question votes do not affect reputation at all.

---

## C6 · Reputation

**What the user sees.** A number on every profile, labelled "Reputation". It can be negative.

**Where it lives.** `server/src/reputation.js` · `forum.js` · `reconcile-reputation.js` · `pages.jsx` (`Profile`)

**The scoring rules.**

| Event | Points |
|---|---|
| Upvote on your answer | +10 |
| Downvote on your answer | −2 |
| Your answer accepted | +15 |
| Any vote on your question | 0 |

**How it was built.** Four decisions, and this is the most carefully engineered small feature in the project.

**1. It is stored, not computed on read.** Before this change, every profile view loaded every vote on every answer that user had written into Node memory. Now it is one field, updated by atomic `$inc`.

**2. `null` is an explicit backfill marker:**

```js
reputation: { type: Number, default: null }
```

New accounts get `0` at creation. An account that predates the feature has `null`, and is initialised lazily on first read or change:

```js
export async function ensureReputation(userId) {
  const user = await User.findById(userId).select('reputation').lean();
  if (!user) return 0;
  if (typeof user.reputation === 'number') return user.reputation;
  const score = await calculateReputation(userId);
  await User.updateOne({ _id: userId, reputation: null }, { $set: { reputation: score } });
  return (await User.findById(userId).select('reputation').lean())?.reputation || 0;
}
```

The `{ reputation: null }` condition in the filter is the important part: a concurrent initialiser cannot overwrite increments another request has already applied. The feature shipped with **no migration and no deployment-time backfill**, and no existing score was zeroed.

**3. Reconciliation stays in the database.** `calculateReputation` is one aggregation with two `$lookup` stages — vote credits and accepted-answer count — so individual vote documents never travel to Node:

```js
{ $lookup: { from: Vote.collection.name, let: { answer: '$_id' }, pipeline: [
    { $match: { $expr: { $and: [{ $eq: ['$target','$$answer'] }, { $eq: ['$targetType','answer'] }] } } },
    { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$value', 1] }, 10, -2] } } } }
  ], as: 'credits' } },
{ $lookup: { from: Doubt.collection.name, localField: '_id',
             foreignField: 'acceptedAnswer', as: 'accepted' } },
```

**4. A reconciliation tool exists, because stored derived values drift.** `reconcile-reputation.js` is dry-run by default:

```powershell
node src/reconcile-reputation.js --database=student_doubt_forum
# → {"mode":"dry-run","checked":42,"different":0}
```

Applying requires `--apply --confirm-writes-paused`. **Having the repair tool is part of the feature, not an afterthought** — if you store a derived value, you owe yourself a way to detect and fix drift.

**How it is verified.** `forum.test.js` — every vote transition, acceptance switch and removal, deletion reversal, missing-field historical backfill, and concurrent initialisation. Reconciliation matched the stored value in every exercised flow.

**Known limits.** **No multi-document transaction.** A process crash between a content mutation and a score increment causes drift; reconciliation repairs it. Concurrent increment safety is improved but is not a claim of full linearizability across collections. No production backfill has been run. Not load-tested. No reputation-gated privileges — reputation is purely a display value.

---

# D. Discovery

## D1 · The feed

**What the user sees.** A hero — *"Big questions. Better answers, together."* — then "Explore doubts" with a question count chip, a search box, a filter row, and a list of question cards. Each card shows votes, answer count, subject, academic level, a solved badge if applicable, the title, a plain-text excerpt, tags and the author. A sidebar offers "Find a question to answer", six subject shortcuts, and a community note. Pagination at the bottom.

**Where it lives.** `pages.jsx` (`Feed`) · `components.jsx` (`DoubtCard`, `Pager`) · `app.js` (`GET /doubts`) · `forum.js` (`decorateMany`)

**API.** `GET /doubts?scope=&search=&subject=&tag=&status=&academicSystem=&academicIndex=&semester=&page=&limit=`
→ `{ items, total, page, pages }`

**Rules and limits.** Public. 10 per page default, 30 maximum, page number ≤ 10,000.

**How it was built.** Three decisions.

**1. Filter state lives in the URL, not in React.** `useSearchParams` holds every filter and the page number; the resource hook keys off the resulting string:

```js
const { data, error, loading, refresh } = useResource('/doubts?' + params.toString());
```

Filters become shareable links, the back button works correctly, and changing a filter re-fetches automatically because the route string changed. There is no filter state to keep in sync.

**2. Two aggregations serve the whole page.** `decorateMany` adds `votes`, `myVote`, `answerCount` and `status` to every item with two grouped aggregations, not two per item.

| Route | Queries before | After |
|---|---|---|
| `GET /doubts?limit=12` | 28 | 6 |
| `GET /doubts/:id` | 13 | 10 |
| `GET /users/:id` | 32 | 10 |

And the count is flat: 6 queries at limit 5, 10 and 30 alike, where the old code would have issued about 64 at limit 30.

**3. Sort includes `_id` as a tie-breaker** — `.sort({ createdAt: -1, _id: -1 })` — so two questions created in the same millisecond have a stable order, and a paginated reader never sees the same item twice or skips one.

Every filter has a matching compound index ending in `createdAt`, so one index serves both the filter and the sort.

**One optimisation that was reverted.** A feed aggregation written to replace `find` + `countDocuments` benchmarked **slower** on the live deployment. It was rolled back, and `Server-Timing` headers were added to find out where the time actually went — cold: `db-ready` 6.7 s, `feed-db` 0.6 s. The query was never the bottleneck.

**How it is verified.** `forum.test.js` — pagination bounds, filter combinations, decoration shape. Phase-0 measurement with MongoDB command monitoring. `explain('queryPlanner')` confirmed `IXSCAN`. Live: all filters returned HTTP 200 with correct shape.

**Known limits.** No infinite scroll. No sort options — newest first, or relevance when searching. Index behaviour on the live Atlas cluster has not been observed with `explain()`.

---

## D2 · Search

**What the user sees.** A search box: *"Search a topic, concept, or question…"* with help text: *"Search whole words in questions and tags. Related English word forms can also match."*

**Where it lives.** `pages.jsx` (`Feed`) · `app.js` (`GET /doubts`) · `models.js` (the text index)

**API.** `GET /doubts?search=<terms>`

**Rules and limits.** 1–120 characters. English language. Whole words and stems only.

**How it was built.** A weighted text index replaced a bounded case-insensitive regex, which could not use an index at all and would collapse as the collection grew:

```js
doubtSchema.index({ title: 'text', body: 'text', tags: 'text' },
  { name: 'doubt_search', weights: { title: 10, tags: 5, body: 1 }, default_language: 'english' });
```

A match in the title counts ten times a match in the body, and a tag five times. Scoring and ordering:

```js
const query = filter.$text
  ? Doubt.find(filter, { searchScore: { $meta: 'textScore' } })
         .sort({ searchScore: { $meta: 'textScore' }, createdAt: -1, _id: -1 })
  : Doubt.find(filter).sort({ createdAt: -1, _id: -1 });
```

Relevance first, then recency, then `_id` — so results are deterministic. Unsearched lists keep pure date ordering.

> **This changed behaviour, and the UI says so.** Words and English stemmed forms match; partial substrings no longer necessarily do. `normalize` and `normalizing` match each other; `normali` matches neither. MongoDB's text grammar applies, so quoted phrases and `-excluded` terms work. English stop words may return nothing. **Tags became searchable**, which they were not before.

That explicit help text in the UI is part of the feature — a silent behaviour change in search looks like broken search.

No existing body was rewritten. The index builds during normal model initialisation after deployment.

**How it is verified.** `forum.test.js` — stemming matches, deliberate partial-word non-match, tag search, combination with subject and semester filters, punctuation, pagination with search.

**Known limits.** English only — multilingual needs Atlas Search. No substring or fuzzy matching. No typo tolerance. No semantic or AI search. No search over answers or comments. Live index build time and multilingual relevance unmeasured. A pre-existing incompatible text index is not dropped automatically.

---

## D3 · Subject filter

**What the user sees.** An "All subjects" dropdown listing the catalogue. Six subject shortcut buttons with icons in the sidebar.

**API.** `GET /doubts?subject=<name or alias>`

**How it was built.** The filter matches **both** the canonical reference and legacy free-text, case-insensitively:

```js
export async function subjectFilter(value) {
  const name = text(value, 'Subject', 2, 60); await ensureSubjects();
  const found = await Subject.findOne({ keys: subjectKey(name) });
  return found
    ? { $or: [ { subjectId: found._id },
               { subject: { $in: [found.name, ...found.aliases]
                              .map(v => new RegExp(`^${escapeRegex(v)}$`, 'i')) } } ] }
    : { subject: name };
}
```

Three properties: filtering by `"DSA"` finds questions stored as `"Data Structures"`, because the alias resolves through `keys`; questions posted before `subjectId` existed are still found by name; and **`escapeRegex` is applied** — a subject name goes into a regex, and an unescaped one is a denial-of-service vector.

**Known limits.** One subject at a time. No subject hierarchy. 500-record catalogue cap. No typeahead for a large catalogue.

---

## D4 · Academic level filter

**What the user sees.** An "All academic levels" dropdown — Semester, Year, Grade, Other — and, when a numbered system is chosen, an optional level-number box.

**API.** `GET /doubts?academicSystem=semester&academicIndex=5`

**How it was built.** The filter has to find both new-format and legacy records:

```js
const levelFilter = { 'academicLevel.system': system, ...(index ? { 'academicLevel.index': index } : {}) };
filter.$or = [levelFilter,
  ...(system === 'semester' ? [{ academicLevel: null, semester: index || { $exists: true } }] : [])];
```

When the system is `semester`, it also matches records that have no `academicLevel` but do have the legacy `semester` field. A question posted as "Semester 5" before this feature existed is found by the new filter with no migration — which was verified live.

Served by `{'academicLevel.system': 1, 'academicLevel.index': 1, createdAt: -1}`, with the legacy `{semester: 1, createdAt: -1}` retained.

**Known limits.** One system at a time. No ranges. `other` cannot be filtered by its label text.

---

## D5 · Solved and open filter

**What the user sees.** A dropdown: "All questions", "No accepted answer", "Accepted answer".

**API.** `GET /doubts?status=solved` or `?status=open`

**How it was built.** Two lines, against the single pointer:

```js
if (req.query.status === 'solved') filter.acceptedAnswer = { $ne: null };
if (req.query.status === 'open')   filter.acceptedAnswer = null;
```

> **The label wording is deliberate.** The option says **"No accepted answer"**, not "Unanswered". A question can have five answers and none accepted. A recorded P0 fix changed this label precisely because the original wording claimed something the API does not mean.

Served by `{acceptedAnswer: 1, createdAt: -1}`.

**Known limits.** No "unanswered" filter (zero answers), which would need a different query shape.

---

## D6 · Tag filter

**What the user sees.** Tags under each question are links. Clicking one filters the feed and shows "Tag: **java**".

**API.** `GET /doubts?tag=<tag>`

**How it was built.** Tags are normalised at write time — lowercased, trimmed, de-duplicated via a `Set`, max 5, each 1–24 characters — so the filter is an exact match on a multikey index, with no normalisation needed at read time. Served by `{tags: 1, createdAt: -1}`.

**Known limits.** One tag at a time. No tag catalogue, no tag synonyms, no popular-tags list, no tag renaming.

---

## D7 · Feed scopes

**What the user sees.** A scope dropdown with three options:

| Option | Shows | Default for |
|---|---|---|
| My college | Questions from your selected college | Members with a college |
| Selected subject worldwide | One subject, everywhere | — (requires a subject) |
| Everything | All questions | Guests and independent learners |

Disabled options are visibly disabled — "My college" without a college selected, "Selected subject worldwide" without a subject chosen.

**Where it lives.** `pages.jsx` (`Feed`) · `app.js` (`GET /doubts`) · `institutions.js`

**How it was built.** The default is computed, not stored:

```js
const scope = req.query.scope || (req.user?.institution ? 'college' : 'all');
if (!['all','college','subject'].includes(scope)) fail(400, 'Choose a valid feed scope.');
if (scope === 'college') {
  if (!req.user) fail(401, 'Sign in to view your college feed.');
  if (!req.user.institution) fail(400, 'Choose your college in your profile first.');
  filter.institution = req.user.institution;
}
if (scope === 'subject' && !req.query.subject) fail(400, 'Choose a subject for the worldwide subject feed.');
```

A student with a college lands on their college feed; everyone else lands on everything. Each failure mode has a specific, actionable message rather than an empty list.

> **Scopes are discovery filters, not access controls.** This is stated in the code, in the change record, in the API documentation and in the UI. **Every question is public and readable by direct link, regardless of scope.** A college feed is a convenience for finding relevant questions — it is not privacy, and must never be presented as privacy.

Served by `{institution: 1, createdAt: -1}`. All other filters compose with each scope.

**How it is verified.** `institutions.test.js` — college feed, default scope, worldwide, subject scope, invalid scope rejection, profile switching, and that a forged college in a post body is ignored.

**Known limits.** No private or campus-only content. No multi-college membership. No verified membership — college selection is self-reported, and the UI says so: *"It is self-reported and does not verify membership."*

---

## D8 · Back-to-results context

**What the user sees.** Open a question from a filtered feed, and "← Back to results" returns you to **that** filtered page, not a bare feed.

**How it was built.** The card passes its originating URL through router state:

```js
<Link to={`/doubts/${doubt._id}`} state={{ from: location.pathname + location.search }}>
```

And the detail page validates it before using it:

```js
<Link className="back-link" to={safeReturn(location.state?.from)}>← Back to results</Link>
```

`safeReturn()` is the same open-redirect guard used for sign-in returns. Router state is not a trusted input — it can be forged — so it goes through the same validation.

This was a recorded P0 usability fix: losing your filters when you opened a question was the single most annoying thing about the original feed.

**Known limits.** State is lost on a full page reload, which falls back to `/`.

---

# E. Notifications

## E1 · Notification events

**Three events.**

| Type | Fires when | Recipient | Event key |
|---|---|---|---|
| `question_answered` | Someone answers your question | Question author | `answer:<answerId>` |
| `answer_commented` | Someone comments on your answer | Answer author | `comment:<commentId>` |
| `answer_accepted` | Your answer is accepted | Answer author | `accepted:<answerId>` |

**Where it lives.** `server/src/notifications.js` · fired from `app.js`

**How it was built.** One function, with three guards and one upsert:

```js
export async function notifyUser({ user, actor, type, target, eventKey }) {
  if (String(user) === String(actor)) return;
  try {
    if (!await User.exists({ _id: user, isDeleted: { $ne: true }, isBanned: false })) return;
    await Notification.updateOne({ eventKey },
      { $setOnInsert: { user, actor, type, target, eventKey } }, { upsert: true });
  } catch { console.error('Notification creation failed'); }
}
```

Four decisions:

1. **Self-actions are skipped.** Answering your own question notifies nobody.
2. **Banned and deleted recipients are skipped.** No point filling a dead inbox.
3. **`eventKey` is unique, and the write is `$setOnInsert`.** This is the whole deduplication design. Re-accepting the same answer cannot notify twice, because the key is derived from the answer's own id. No application-level "have I already sent this?" check is needed — the unique index is the check.
4. **Errors are swallowed.** A notification failure must never fail the content mutation that triggered it. The post is what matters.

**The actor projection is `'name'` only** — `.populate('actor', 'name')`. A notification never exposes another user's email address.

**How it is verified.** `notifications.test.js` — end-to-end question/answer/comment/accept events, self-suppression, idempotent event key, private projection, unread counts, anonymous rejection, owner-scoped marking.

**Known limits.** **Delivery is best-effort.** It is awaited, but there is no transactional outbox and no retry worker, so a database interruption can lose an alert without losing the post. No mention notifications. No notification for a vote, an edit, or losing acceptance.

---

## E2 · Notification bell

**What the user sees.** 🔔 Notifications in the navigation, with an unread count in brackets, capped at "99+".

**How it was built.** Polling, with three triggers and one important condition:

```js
const refresh = () => {
  if (document.visibilityState !== 'hidden')
    api('/notifications', { token }).then(data => { if (active) setUnread(data.unread); })
                                    .catch(() => { if (active) setUnread(null); });
};
refresh();
const interval = setInterval(refresh, 60000);
window.addEventListener('forum-notifications', refresh);
document.addEventListener('visibilitychange', refresh);
```

| Mechanism | Purpose |
|---|---|
| 60-second interval | Routine refresh |
| `visibilitychange` | Immediate update when you return to the tab |
| `forum-notifications` custom event | Instant update after you mark something read, from anywhere in the app |
| `visibilityState !== 'hidden'` | **No polling in a background tab** — a tab left open overnight makes no requests |

That last condition is why a 60-second poll is affordable on a serverless free tier. The custom `window` event is a deliberately simple cross-component channel — the inbox dispatches it, the bell listens, and no shared state is needed.

A failed request sets `unread` to `null`, which renders no count rather than a stale or zero one.

**Known limits.** Up to 60 seconds of latency. No WebSocket or SSE. No browser push. No sound or favicon badge.

---

## E3 · Notification inbox

**What the user sees.** A list: *"**New ·** Priya answered your question."* with the question title as a link, the date, and "Mark as read". A "Mark all as read" button when anything is unread. Opening a discussion marks that item read. Removed discussions show *"This discussion was removed."*

**API.** `GET /notifications?page=` → `{ items, unread, page, pages, total }` · `POST /notifications/read` · `PATCH /notifications/:id/read`

**Rules and limits.** 25 per page. Signed in. **Only your own notifications**, for reading and for marking.

**How it was built.** Ownership is in the query filter, not a separate check:

```js
const item = await Notification.findOneAndUpdate(
  { _id: req.params.id, user: req.user._id }, { $set: { readAt: new Date() } });
if (!item) fail(404, 'Notification not found.');
```

Requesting someone else's notification id simply does not match, and gets a 404 — which also avoids confirming that the id exists. There is no code path that can mutate another user's read state.

Three counts in parallel: items, total, and unread, so the bell and the pager stay consistent in one request.

**Removed targets are handled gracefully:**

```js
{item.target ? <Link to={`/doubts/${item.target._id}`}>{item.target.title}</Link>
             : <p className="muted">This discussion was removed.</p>}
```

A populated reference to a deleted question comes back `null`, and that is rendered as a safe message rather than a broken link or a crash.

`Cache-Control: no-store` is set explicitly on this route, on top of the global API rule.

**Known limits.** No filtering by type. No "mark as unread". No deletion of notifications. No time grouping. No preference controls for which events notify you.

---

# F. Moderation and administration

## F1 · Report content

**What the user sees.** "Report" under every question and answer, for signed-in users. It opens a small form: *"Why are you reporting this?"* Submitting shows *"Report sent to the moderators."*

**API.** `POST /reports` with `{ targetType, targetId, reason }` → 201

**Rules and limits.** Reason 5–1,000 characters. `targetType` must be `doubt` or `answer`. Signed in. One pending report per user per target.

**How it was built.** Duplicate prevention is scoped to *pending* reports only:

```js
if (await Report.exists({ target: target._id, reporter: req.user._id, status: 'pending' }))
  fail(409, 'You have already reported this content.');
```

So a user who reported something that was dismissed can report it again later if the situation changes — but cannot spam the queue with the same complaint.

The target is loaded through `findDoc` first, which validates the id and confirms the content exists, so a report can never point at nothing.

**Reports are never shown to the reported user,** and the reason text is rendered as **plain text** in the moderation queue, not as Markdown — a moderator-facing field is not a place to run a rendering pipeline.

**How it is verified.** `forum.test.js` — creation, validation, duplicate rejection, invalid target type rejection.

**Known limits.** No report categories, only free text. No anonymous reporting — the reporter is always recorded. No feedback to the reporter about the outcome. No automatic action on volume.

---

## F2 · Report queue

**What the user sees.** Moderation → Reports. Each card shows a "Reported doubt/answer" badge, the content's title or a 120-character excerpt, the reason, who reported it and when, a "View discussion →" link, and two buttons: "Dismiss report" and "Remove content" (in danger red). Removal confirms: *"Remove this reported content? Removing a question also removes its answers, comments and attachments. This cannot be undone."* Empty state: "All caught up".

**API.** `GET /admin/reports?page=` · `PATCH /admin/reports/:id` with `{ status: 'dismissed' | 'removed' }`

**Rules and limits.** Admin only. 25 per page. Only pending reports are listed.

**How it was built.** The queue loads the reported content alongside each report, so a moderator can judge without clicking through:

```js
const items = await Promise.all(reports.map(async report => ({
  ...report.toObject(),
  content: await (report.targetType === 'doubt' ? Doubt : Answer)
             .findById(report.target).select('title body doubt') })));
```

A `null` content means it was already removed, and the UI renders "Content already removed" rather than breaking.

**Removal reuses the exact same deletion code as a user's own delete:**

```js
if (req.body.status === 'removed') {
  const Model = report.targetType === 'doubt' ? Doubt : Answer;
  const target = await Model.findById(report.target);
  if (target) {
    if (report.targetType === 'doubt') await removeDoubt(target, cloudinary);
    else await removeAnswer(target);
  }
}
```

This matters: admin removal correctly cascades to answers, comments, votes, Cloudinary images **and reputation reversal**, because there is only one deletion path in the codebase. A separate admin-delete implementation would inevitably have missed one of those.

Served by `{status: 1, createdAt: -1}`.

**How it is verified.** `forum.test.js` — dismiss, remove with full cascade, non-admin denial.

**Known limits.** No moderation log or audit trail of who did what. No reversal of a removal. No bulk actions. No warning or messaging to the content's author. **Live browser coverage of the mutations is not complete** — an admin reporting that the link appears does not prove every action works.

---

## F3 · User list, suspend and restore

**What the user sees.** Moderation → Users: a table of name, email, role, status (Active or Suspended), and actions. "Suspend" / "Restore access" confirms by name. Admin rows show no actions at all.

**API.** `GET /admin/users?page=` · `PATCH /admin/users/:id/ban` with `{ isBanned: boolean }`

**Rules and limits.** Admin only. 25 per page. Deleted accounts are excluded from the list. **Admin accounts cannot be suspended.** `isBanned` must be a boolean.

**How it was built.** Three guards:

```js
if (user.isDeleted) fail(404, 'This account has been deleted.');
if (user.role === 'admin') fail(403, 'Administrator accounts cannot be suspended here.');
if (typeof req.body.isBanned !== 'boolean') fail(400, 'Provide the account status.');
```

The boolean type check is not pedantry — a string `"false"` is truthy in JavaScript, and would suspend an account that was meant to be restored.

**A suspension takes effect on the very next request,** because `identify()` re-reads the user from the database every time and checks `isBanned`. There is no session to wait out and no cache to clear.

The list maps every record through `safeUser()`, so even an admin-facing list cannot leak a password hash or a token version.

**Why admins are protected:** a compromised admin account cannot lock the other administrators out. Combined with the fact that no admin can *create* an admin, the admin set can only be changed through direct database access.

**How it is verified.** `forum.test.js` — banning an account with a live session immediately denies it, admin targets protected, non-admin denial, deleted accounts omitted.

**Known limits.** No search or filter in the user list. No suspension reason or duration. No notification to the suspended user. Mutations not fully browser-verified.

---

## F4 · Promote to teacher

**What the user sees.** "Make teacher" / "Make student" in the Users table. The badge appears immediately.

**API.** `PATCH /admin/users/:id/role` with `{ role: 'student' | 'teacher' }`

**How it was built.** One deliberately narrow guard:

```js
if (user.role === 'admin' || !['student','teacher'].includes(req.body.role))
  fail(403, 'Only student and teacher roles can be changed here.');
```

Two things are impossible through this route: promoting anyone to `admin`, and changing an existing admin's role. **Admin creation requires direct database access** (Atlas Data Explorer or `make-admin.js`), which is a deliberately higher bar than "be an admin".

**How it is verified.** `forum.test.js` — teacher promotion, demotion, admin promotion rejected, admin target rejected.

**Known limits.** No bulk promotion. No verification that a teacher is actually a teacher. No teacher application workflow.

---

## F5 · Subject catalogue administration

**What the user sees.** Moderation → "Manage subject catalogue →". A form for subject name, optional slug, comma-separated alternative names and an optional field, with explanation: *"Aliases help students find the same subject under different names."* Below, the current catalogue with icons and aliases.

**API.** `POST /admin/subjects` with `{ name, slug?, aliases?, field?, icon? }` → 201

**Rules and limits.** Admin only. Name 2–60. Slug auto-derived if omitted, must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Up to 15 aliases, each 1–60. Icon 1–8 characters, default `◈`. Slug and every key must be unique.

**How it was built.** Normalisation into a unique multikey index is the whole mechanism:

```js
export const subjectKey = value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
// …
keys: [...new Set([name, ...aliases].map(subjectKey))]
// …
subjectSchema.index({ keys: 1 }, { unique: true });
```

`NFKC` handles Unicode equivalence, whitespace is collapsed, case is folded. The name and every alias all land in one `keys` array with a unique index — so **an alias cannot be claimed by two subjects**, and a lookup by any name or alias is a single indexed query.

A collision gets a specific message rather than a generic 409: *"That subject name, slug or alias already belongs to the catalogue."*

**There is deliberately no delete and no rename.** Existing questions reference subjects by name and by id. Deleting or renaming a subject would orphan or silently re-label real content. The catalogue is additive by design.

**How it is verified.** `subjects.test.js` — idempotent seeding, permissions, alias collision, canonical post and filter, legacy aliases, non-mutating and idempotent fixture migration.

**Known limits.** No editing or deletion. No per-institution subjects. No user-suggested aliases. 500-record cap. No typeahead for a large catalogue.

---

## F6 · College catalogue administration

**What the user sees.** On the same page: a form for college name, optional slug and optional two-letter country code, with the note *"College selection is for public feed discovery, not a verified membership badge."*

**API.** `POST /admin/institutions` with `{ name, slug?, country? }` → 201

**Rules and limits.** Admin only. Name 2–140. Slug pattern-validated and unique. Country exactly two letters, uppercased.

**How it was built.** `isVerified` is **always** `false` on creation, and a client-supplied value is ignored:

```js
ok(res, await Institution.create({ name, slug, country, isVerified: false }), 'College added.', 201);
```

The field exists for a future verification system. Accepting it from a request now would mean a verified badge could be claimed rather than earned. The change record is explicit: *"There is no verified-domain, moderator delegation, private campus access or auto-enrolment system."*

**How it is verified.** `institutions.test.js` — catalogue permissions, unique slug, **ignored verification claims**, country validation.

**Known limits.** No editing or deletion. No logos. No verification. No campus-level sub-organisations. Currently one college in production.

---

## F7 · Publish the Study Library

**What the user sees.** A "Study library" panel on the catalogue page: *"200 demo questions and AI-generated study answers across 10 subjects"*, the subject list, and either a "Publish study library" button or a link to browse the published batch. Publishing confirms: *"Publish 200 labeled demo questions and AI answers to the public feed?"*

**API.** `GET /admin/study-library` → `{ published, questionCount, subjects, tag }` · `POST /admin/study-library` with `{ confirm: 'study-library-v1' }`

**Rules and limits.** Admin only. 5 attempts per account per 15 minutes. Requires the exact confirmation string. Idempotent.

**How it was built.** See H1 for the full design. The route itself is thin:

```js
if (req.body.confirm !== batch) fail(400, 'Confirm the study library import.');
const result = await importStudyLibrary(req.user._id);
ok(res, result, result.alreadyImported ? 'Study library already published.' : 'Study library published.');
```

A second call reports `alreadyImported: true` rather than erroring — the correct response to "do this thing that is already done".

**How it is verified.** `study-library.test.js` — deterministic IDs, idempotent repeat import, validation of the data files.

**Known limits.** No unpublish. No partial or per-subject publishing. No second batch without changing the `batch` constant in code.

---

# G. Catalogues

## G1 · Subject catalogue

**What the user sees.** Thirty subjects across science, computing, engineering, medicine, humanities and commerce, each with an icon, in the Ask form's dropdown, the feed filter, and six sidebar shortcuts.

**The thirty seeds.** Data Structures (aliases: DSA, Data Structures and Algorithms) · DBMS (Database Management Systems, Databases) · Java · Operating Systems (OS) · Computer Networks (Networking) · Mathematics (Math, Maths) · Web Development · Other · Physics · Chemistry · Biology · Statistics · Economics · Accounting (Accountancy) · Business Studies · History · Geography · Political Science · Sociology · Psychology · English Literature · Law (Legal Studies) · Anatomy · Physiology · Pharmacology · Mechanical Engineering · Electrical Engineering · Civil Engineering · Architecture · Art and Design

**API.** `GET /subjects` · `GET /catalog` (combined)

**How it was built.** Three decisions.

**1. Seeding is idempotent and lazy,** triggered by first catalogue use rather than by a deploy step:

```js
await Subject.bulkWrite(seeds.map(([name, aliases, icon]) => {
  const fields = subjectFields({ name, aliases, icon });
  return { updateOne: { filter: { slug: fields.slug }, update: { $setOnInsert: fields }, upsert: true } };
}), { ordered: false });
```

`$setOnInsert` means a subject an admin has since customised is never overwritten by the seed. `ordered: false` lets the rest succeed if one row conflicts.

**2. Concurrent cold starts are handled.** A `WeakMap` keyed on the database connection caches the initialisation promise, and an 11000 from a simultaneous seeder is tolerated:

```js
const ready = new WeakMap();
// …
catch (error) { if (error.code !== 11000) throw error; }   // concurrent cold starts
```

Keying on the connection object rather than a module-level boolean means a reconnect re-seeds correctly. And the cache is cleared on failure, so a transient error does not permanently poison the state:

```js
)().catch(error => { ready.delete(db); throw error; })
```

**3. Icons live on the record, not in array order.** Before this change the client held a hard-coded array where position implied the icon. Now `icon` is a field, so adding a subject cannot shift everyone else's icon.

**How it is verified.** `subjects.test.js`. Live: the catalogue returned 30 subjects; mobile dropdown and "Data Structures" filtering verified; the seed confirmed additive with no existing content rewritten.

**Known limits.** A starter catalogue, not the hundreds of institution-specific subjects a real deployment would want. No editing or deletion. No per-institution subjects.

---

## G2 · College catalogue

**What the user sees.** An optional "College (optional)" dropdown on signup and in the profile, with "No college / independent learner" first, and the note: *"College selection helps filter public questions. It is self-reported and does not verify membership."*

**API.** `GET /institutions` · `GET /catalog`

**How it was built.** Two client details worth noting. The dropdown preserves a value that is no longer in the catalogue:

```js
{defaultValue && !institutions.some(item => item._id === defaultValue) &&
  <option value={defaultValue}>Current college</option>}
```

So a user whose college was removed from the catalogue does not silently lose their selection when they next save their profile.

And the catalogue is fetched **once**, with the in-flight promise cached in a ref so React StrictMode's double-invoke does not double-fetch:

```js
initialCatalog.current ??= api('/catalog');
```

A catalogue load failure sets a visible notice — *"Subject and college options could not load. Refresh the page to try again."* — rather than silently rendering empty dropdowns.

**Known limits.** No verification. No logos. No multi-college membership. One college in production.

---

# H. Study Library

## H1 · 200 labelled questions with AI-generated answers

**What the user sees.** Public questions, browsable at `/?scope=all&tag=study-library`, tagged `study-library`, across ten subjects with twenty questions each. Every question body ends with a labelled blockquote:

> *This is a sample question from the Doubt Forum study library.*

Every answer ends with:

> *AI-generated study example. Verify important details with your course material.*

Authors are "Study Library (Demo)" and "AI Study Assistant (Demo)".

**Where it lives.** `server/src/study-library.js` · `demo-questions.json` (200 × `{id, title, subject, question}`) · `demo-answers.json` (200 answers keyed by id) · `client/src/study-library-admin.jsx`

**How it was built.** The 200 prompts were written for the project, and a separate AI agent wrote the 200 explanations. Both are static JSON files. **There is no live AI request anywhere in the running application.**

Five design decisions, all about making a one-shot import safe.

**1. Deterministic IDs from a content hash:**

```js
const batch = 'study-library-v1';
const idFor = key => new mongoose.Types.ObjectId(
  createHash('sha256').update(`${batch}:${key}`).digest('hex').slice(0, 24));
```

The same key always yields the same ObjectId. Combined with `$setOnInsert` + `upsert` on every write, an interrupted or concurrent import inserts only what is missing and touches nothing else. No locking, no transaction, no cleanup needed.

**2. Answers are seeded before their questions.** The ordering is explicit in the source — *"Seed each answer before publishing its question"* — so there is no window in which a visitor can see a library question with no answer.

**3. The demo authors cannot sign in.** Created with `isBanned: true` and `@doubt-forum.invalid` emails. The `.invalid` TLD is reserved and can never route, and the ban blocks authentication. A demo account is a label, not a usable login.

**4. Every row is validated before anything is written:**

```js
if (seenIds.has(row.id) || seenTitles.has(title.toLowerCase()))
  throw new Error('Duplicate study library question.');
const question = text(row.question, 'Question', 20, 11000);
const answer = text(answers[row.id], 'Answer', 10, 11000);
// …
if (Object.keys(answers).length !== items.length)
  throw new Error('Study library question and answer counts differ.');
```

Duplicate ids, duplicate titles, length bounds and a question/answer count mismatch all throw up front. The 11,000 limit leaves room for the appended label within the 12,000 field maximum. A missing subject also throws, rather than importing content nobody can find.

**5. Completion is recorded, not inferred.** A row in `study_library_imports` holds the counts, who imported, and when — so status is one read rather than a document count that could be confused with real content.

The `study-library` tag is what keeps the batch separable from real community questions, for browsing and for filtering it out.

**How it is verified.** `study-library.test.js` — deterministic IDs, idempotent repeat import, validation. Live: 200 public questions confirmed; a sample thread showed a labelled demo answer.

**Known limits.** Static content — it never updates. No live AI. No per-subject or partial publishing. No unpublish. A second batch requires a code change to the `batch` constant. Answers are AI-generated and **labelled as needing verification**, which is the honest framing: they are study examples, not authoritative course material.

---

# I. Interface, accessibility and platform

## I1 · System, light and dark theme

**What the user sees.** One button in the header showing the current mode with an icon — monitor, sun or moon — and a sliding indicator. Click to cycle System → Light → Dark → System. The choice persists across reloads. In System mode, changing your operating system's appearance changes the site live.

**Where it lives.** `client/src/theme.js` (pure) · `theme-control.jsx` · `styles/variables.css` · `public/theme-init.js`

**How it was built.** Five decisions.

**1. Pure logic, separately testable:**

```js
export const THEMES = ['system', 'light', 'dark'];
export function themePreference(value) { return THEMES.includes(value) ? value : 'system'; }
export function nextTheme(value) { return THEMES[(THEMES.indexOf(themePreference(value)) + 1) % THEMES.length]; }
export function resolvedTheme(preference, systemDark) {
  return themePreference(preference) === 'system' ? (systemDark ? 'dark' : 'light') : preference;
}
```

An invalid stored value resolves to `system` rather than breaking.

**2. No flash of the wrong theme — without an inline script.** The CSP is `script-src 'self'` with no `'unsafe-inline'`, so the usual inline theme script is not an option. Instead, a self-hosted external file loads in `<head>` before the stylesheets:

```js
// public/theme-init.js
(() => {
  let preference = 'system';
  try { preference = localStorage.getItem('forum-theme') || 'system'; } catch {}
  if (!['system','light','dark'].includes(preference)) preference = 'system';
  document.documentElement.dataset.theme = preference === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
})();
```

**3. A CSS fallback covers the script not running at all:**

```css
@media (prefers-color-scheme: dark) { :root:not([data-theme]) { /* dark tokens */ } }
```

**4. All 104 hard-coded colours were centralised** into `variables.css`, with semantic roles — `--page`, `--card`, `--border`, `--text`, `--muted`, `--primary`, `--on-primary`, plus explicit `surface-*`, `ink-*`, `edge-*` and `shadow-*` roles for the legacy palette. Dark mode overrides each role separately, which is what prevents the classic bug where white button text becomes a dark background colour. `--on-primary` exists specifically so a primary button's foreground is independent of the text colour. Code highlighting gets its own dark keyword, string, comment and number colours.

**5. `color-scheme` is set per theme,** so native scrollbars, form controls and dropdown options follow — which is what fixed the white-options-on-dark-background bug.

The click-to-cycle button replaced a dropdown on 10 November. Its accessible name reports both states — `Color theme: Dark. Switch to System` — the animation respects `prefers-reduced-motion`, and `localStorage` writes are wrapped in `try/catch`.

**How it is verified.** `theme.test.js` — system, explicit and invalid preferences; denied storage; centralised colours; and measured contrast ratios ≥ 4.5:1 for dark primary-on-card, on-primary-on-primary, text-on-card and muted-on-card. A real DOM test clicks through the cycle and checks persistence across remount and media-listener cleanup. Live: System → Light → Dark via click, Enter and Space; dark persisted across reload; at 390 px the indicator reached its 56 px Dark position with no horizontal overflow.

**Known limits.** Selected contrast pairs only — **not an exhaustive WCAG audit**. Authenticated editor and moderation screens are not all visually audited in dark mode. No high-contrast mode. No per-account theme sync across devices.

---

## I2 · Responsive layout

**What the user sees.** On a phone: a compact hero, a "Menu" button that discloses the navigation, single-column cards, and filters that wrap. On a desktop: a two-column layout with a sidebar.

**How it was built.** The mobile navigation is a **disclosure, not a modal**, and that choice has consequences the code handles:

```js
function closeMenu(event) {
  if (expanded && event.key === 'Escape') {
    event.preventDefault(); setExpanded(false); menuButton.current?.focus();
  }
}
```

`aria-expanded` and `aria-controls` on the trigger; Escape closes it and **returns focus to the trigger**; the menu closes automatically on route change. Because it is a disclosure rather than a modal, focus stays in the normal page tab order — no focus trap, which is correct for this pattern and recorded as a deliberate decision.

> **A QA-reported bug worth noting.** Escape worked inside the menu but not when focus was on the trigger itself. The fix put the handler on the containing `<header>` so it catches both. The test was written to **fail first** against the reported bug, then pass.

Other P0 usability fixes in this area: a compact phone hero, a persistent search label, clearer control borders, darker secondary text, and larger reading text and touch targets.

**How it is verified.** Horizontal overflow checked at 360, 390, 768, 1024 and 1440 CSS px — document width never exceeded the viewport. At 390 px, content and scroll width both measured 375 px, repeatedly, across the dark theme, the Markdown preview and the theme control. Menu open/close, Escape and focus return verified at 390 px.

**Known limits.** No landscape-specific layout. Software-keyboard and safe-area behaviour on phones is unverified. Not tested on real devices beyond viewport emulation. Tablet layouts are untuned.

---

## I3 · Accessibility features

**What is implemented.**

| Feature | Where |
|---|---|
| Skip-to-content link | `main.jsx` — `<a className="skip-link" href="#main">` |
| Semantic landmarks | `header`, `main`, `nav`, `footer`, `aside`, `article`, `section` |
| Accessible tabs | `TabList` — labelled tablist, `aria-selected`, `aria-controls`, roving tabindex, Arrow wrap, Home/End |
| Editor tabs | Same pattern, with Arrow Left/Right |
| Disclosure navigation | `aria-expanded`, `aria-controls`, Escape, focus return |
| Live regions | `role="status"` on the toast and loading states, `role="alert"` on errors |
| Vote state | `aria-pressed` on each vote button |
| Labelled controls | Every input has a `<label>`; icon-only buttons have `aria-label` |
| Theme button | Accessible name reports current **and** next mode |
| Decorative elements | `aria-hidden="true"` on avatars and hero art |
| Reduced motion | `prefers-reduced-motion` respected by the theme animation |
| Heading structure | Post bodies clamped to h3/h4 so they nest inside the page outline |
| Focusable panels | Tab panels have `tabIndex={0}` and `aria-labelledby` |

**How it was built.** The audit found that the original tabs were not tabs — they were buttons with `aria-pressed`, which tells a screen reader "toggle button", not "tab in a set of three". The fix extracted the key arithmetic into a pure module and wrapped it in one shared component:

```js
export function tabDestination(values, current, key) {
  const index = Math.max(0, values.indexOf(current));
  if (key === 'Home') return values[0];
  if (key === 'End') return values.at(-1);
  if (key === 'ArrowRight') return values[(index + 1) % values.length];
  if (key === 'ArrowLeft') return values[(index - 1 + values.length) % values.length];
  return null;
}
```

Then the component manages focus and the roving tabindex:

```js
tabIndex={value === item.value ? 0 : -1}
ref={node => { refs.current[item.value] = node; }}
onKeyDown={keyDown}
```

Exactly one tab is in the tab order at a time, and arrow keys move both selection and focus — which is what the WAI-ARIA tabs pattern requires.

**How it is verified.** `tabs.test.js` — key destination maths including wrap-around. `components.test.js` — a real jsdom DOM test dispatches keyboard events and asserts `activeElement`, `aria-selected`, `tabIndex` and `aria-controls`. `theme.test.js` — measured contrast pairs.

**Known limits.** **No screen-reader audit has been performed.** Keyboard behaviour is asserted structurally and tested in jsdom, but was not exercised with a real keyboard and a real screen reader. Contrast is measured for selected pairs only, not exhaustively. No complete keyboard journey beyond the menu and the tabs. These are named open items, not oversights.

---

## I4 · Loading, empty, error and retry states

**What the user sees.** A spinner with "Loading…" while data arrives. Friendly empty states — *"Be the first to ask"*, *"A fresh perspective is welcome"*, *"All caught up"*. Errors appear in a red box with a "Try again" button. A crash shows "Something went wrong" with a Reload button rather than a blank page.

**How it was built.** Four shared components in `components.jsx`:

```js
export function Loading() { return <div className="state" role="status"><span className="spinner" /> Loading…</div>; }
export function Empty({ title = 'No doubts here yet', children }) { /* … */ }
export function ErrorBox({ message, retry }) {
  return message ? <div className="error" role="alert">{message}
    {retry && <button className="text-button retry-button" onClick={retry}>Try again</button>}</div> : null;
}
```

Plus a class error boundary at the root of the tree, so a render crash anywhere degrades to a reload prompt instead of a white screen.

**Empty states are context-aware.** The feed distinguishes "no questions exist yet" from "your filters matched nothing":

```js
<Empty title={params.size ? 'No matching questions' : 'Be the first to ask'}>
  {params.size ? 'Try a different search or clear your filters.'
               : 'Share a question from your coursework and start learning together.'}
</Empty>
```

**And the retry is a real retry**, not a page reload — it bumps a version counter in `useResource`, which re-runs the fetch.

**Every error message comes from the server.** `api()` throws an `Error` carrying the server's `message`, and no component replaces it with its own copy. There is one exception, for the case where there is no server response at all:

```js
catch (error) {
  if (error.name === 'AbortError') throw error;
  throw new Error('Cannot reach the server. Check your connection and try again.');
}
```

**Known limits.** No skeleton screens. No optimistic updates. No offline mode or service worker.

---

## I5 · Toast notices

**What the user sees.** A small dismissible message at the corner for confirmations and incidental errors — *"Your doubt is live in the community!"*, *"Answer accepted."* It disappears after about 6.5 seconds.

**How it was built.** One piece of state in the auth context, exposed as `notify`:

```js
useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6500); return () => clearTimeout(timer); }, [notice]);
// …
{notice && <div className="toast" role="status">{notice}
  <button aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
```

Putting it in the context means any component can call `notify(message)` with no prop drilling and no separate toast library. `role="status"` makes it a polite live region. The timer is cleared on change, so rapid notices do not stack their timeouts.

**The division of labour is consistent:** an inline `ErrorBox` for anything that blocks the current action (a failed form submission), a toast for anything that does not (a background action's confirmation or failure). Catalogue load failures use the toast, so a degraded dropdown is explained rather than silent.

**Known limits.** One notice at a time — a new one replaces the old. No queue. No undo action in a toast.

---

## I6 · Shared rate limiting

**Twelve buckets.** See the limits table above for all of them.

**What the user sees.** HTTP 429 *"Too many requests. Please try again later."* with a `Retry-After` header. If the limiter's own store is unavailable in production, HTTP 503 *"Request protection is temporarily unavailable. Please try again shortly."*

**Where it lives.** `server/src/rate-limits.js`

**How it was built.** Four decisions.

**1. Keys are HMACed, so no identity is stored in plain form:**

```js
keyGenerator: req => {
  const address = email && typeof req.body?.email === 'string'
    ? req.body.email.trim().toLowerCase().slice(0, 254) : '';
  const identity = account && req.user ? `user:${req.user._id}`
                 : address ? `email:${address}` : `ip:${ipKeyGenerator(req.ip)}`;
  return createHmac('sha256', env.JWT_SECRET || 'local-development-only').update(identity).digest('hex');
}
```

No raw IP, email address or token becomes a Redis key name. The source comment is careful about what this is: *"Pseudonymous Redis keys; no email addresses, tokens or raw IP addresses."* Pseudonymous, not anonymous — but a Redis dump no longer reveals who was rate-limited.

**2. The transport is validated before any request is made:**

```js
if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password
    || endpoint.search || endpoint.hash || endpoint.pathname !== '/' || !token) throw unavailable();
```

A misconfigured URL with credentials in it, or a plain-HTTP URL, is rejected rather than used. Requests then use a bearer header, a 3-second timeout and `redirect: 'error'`.

**3. It fails closed in production.**

```js
class ProtectedRedisStore extends RedisStore {
  async increment(key) {
    try { return await super.increment(key); } catch { throw unavailable(); }
  }
}
```

With `passOnStoreError: false`. The comment states the reasoning: *"Never silently fall back to independent memory counters when a deployed Redis store fails."* Per-instance memory counters across a dozen serverless instances are not a rate limit — they are the appearance of one.

**4. Simultaneous script loads are shared, but a real NOSCRIPT is not swallowed:**

```js
if (/^NOSCRIPT(?:\s|$)/.test(body.error)) throw new Error('NOSCRIPT script unavailable');
```

All limiter scopes use the same Lua scripts. Concurrent `SCRIPT LOAD` calls are deduplicated through a `Map`, and the library's own reload-and-retry path is preserved by letting that one specific error through unchanged.

**Modes:** `redis` (configured), `memory` (local development), `unavailable` (deployed but misconfigured — blocks protected routes). `/health` reports the mode.

**How it is verified.** `rate-limits.test.js` — HTTPS transport, private error handling, two app instances sharing a counter, 429 with `Retry-After`, separate IP/account/scope buckets, expiry, NOSCRIPT reload, outage 503, and local-versus-production mode selection. Live: health returned `rateLimitStore: redis` and a protected feed returned 200.

**Known limits.** Shared-counter tests use a **REST contract fake, not a real Redis concurrency or load test.** No live brute-force test was run. Free Upstash quota exhaustion or an outage temporarily blocks the API. **This is request throttling, not DDoS protection.** Rotating `JWT_SECRET` resets every limiter identity.

---

## I7 · Health endpoint

**API.** `GET /api/v1/health` → `{ database: 'connected', rateLimitStore: 'redis' | 'memory' | 'unavailable' }`, or HTTP 503 with *"Database unavailable."*

**How it was built.** Deliberately placed **before** the rate limiter:

```js
api.get('/health', (req, res) => {
  if (mongoose.connection.readyState !== 1)
    return res.status(503).json({ success: false, message: 'Database unavailable.' });
  ok(res, { database: 'connected', rateLimitStore: limiter.mode }, 'Doubt Forum API is running.');
});
```

Two reasons: health must answer *during* an outage, including a Redis outage; and monitoring polls should not consume anyone's request quota.

> **It reports configuration, not connectivity.** `rateLimitStore: 'redis'` means Redis is configured. A successful *protected* API call is what proves Redis is reachable. A healthy database and a dead Redis can coexist. This distinction is documented because it caused real confusion.

**Known limits.** No dependency checks for Cloudinary or the mail provider. No version or build identifier in the payload. No uptime history.

---

## I8 · Security headers

**What is sent.**

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`; `script-src 'self' https://accounts.google.com/gsi/client`; `style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style`; `img-src 'self' data: blob: https://res.cloudinary.com`; `font-src 'self' data:`; `connect-src 'self' https://accounts.google.com/gsi/`; `frame-src https://accounts.google.com/gsi/`; `base-uri 'self'`; `object-src 'none'`; `form-action 'self'`; `frame-ancestors 'none'`; `upgrade-insecure-requests` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` |
| `Cache-Control` (API) | `private, no-store, max-age=0` |
| `X-Powered-By` | removed |

**How it was built.** Set in **two independent places**, and that redundancy is the point: Helmet in `app.js` covers responses Express produces, and `vercel.json` covers the static HTML and assets, which Vercel serves without Express ever running.

> **This gap is why the hardening phase existed.** Before it, the actual HTML page a visitor loaded had **no CSP at all** — Helmet was protecting only the API.

Each allowance is as narrow as the feature requires:

- `script-src 'self'` with no `'unsafe-inline'`, which is why the theme initialiser is a self-hosted file.
- `'unsafe-inline'` in `style-src` only, for KaTeX's positioning styles — an accepted and documented trade-off.
- `img-src` names Cloudinary explicitly, with no wildcard, and `<img>` is not in the Markdown allow-list either.
- `COOP: same-origin-allow-popups` rather than strict `same-origin`, because strict breaks Google's popup. The exact value needed, not a blanket relaxation.

**How it is verified.** `production-hardening.test.js` — header presence and values, API no-store, invalid JSON handling, auth error codes. `scripts/check-production.js` verifies them against the live deployment on every release. Four read-only live probes passed after `3af40f0`.

**Known limits.** No HSTS header (the platform handles TLS). No Subresource Integrity on Google's script. `'unsafe-inline'` in `style-src` remains a known allowance. No CSP reporting endpoint.

---

## I9 · Diagnostics and timing headers

**What the operator gets.**

**Three `Server-Timing` metrics**, readable in any browser's Network panel:

| Metric | Measures |
|---|---|
| `db-ready` | MongoDB initialisation (set by the Vercel adapter) |
| `rate-limit` | Limiter round trip |
| `feed-db` | The feed query itself |

**Seven database diagnostic codes**, returned on a connection failure with no credentials attached:

| Code | What to check |
|---|---|
| `MONGO_URI_MISSING` | The variable exists in the deployed environment |
| `JWT_SECRET_INVALID` | Present and ≥32 characters |
| `DATABASE_AUTH_FAILED` | Correct database user and current password |
| `DATABASE_PERMISSION_DENIED` | The `readWrite` grant covers the selected database |
| `DATABASE_URI_INVALID` | URI syntax and placeholder replacement |
| `DATABASE_NETWORK_UNAVAILABLE` | Atlas entry active, cluster reachable, DNS |
| `DATABASE_CONNECTION_FAILED` | Inspect sanitised runtime diagnostics |

**Eight email diagnostic codes** — listed under A8.

**How it was built.** The categoriser walks the error's nested causes, because a Mongoose connection error buries the real reason several levels down:

```js
const related = [error, error?.cause, ...(error?.reason?.servers?.values?.() || [])]
  .flatMap(item => [item, item?.error, item?.error?.cause]);
if (related.some(item => item?.code === 18 || item?.codeName === 'AuthenticationFailed'))
  return 'DATABASE_AUTH_FAILED';
```

And the adapter returns the code **without** the message:

```js
// Never return connection strings or credentials in a public error response.
res.end(JSON.stringify({ success: false,
  message: 'Database connection is unavailable. Please try again shortly.', code }));
```

**This pattern is the single most useful operational tool in the project.** A raw driver error can contain the connection string. A generic "something went wrong" tells the operator nothing. A short safe code tells them exactly what to fix, and can be pasted into a chat or an issue without leaking anything.

The same philosophy governs logging — error **name and code only**, never the message or the stack, because a stack can contain a query and a query can contain user data.

**How it is verified.** `database-errors.test.js` — every code's categorisation, including nested causes. `Server-Timing` was used in anger: it is what showed `db-ready` at 6.7 s against `feed-db` at 0.6 s on a cold request, and what justified reverting a feed aggregation that had benchmarked worse.

**Known limits.** No aggregation or alerting — codes appear in Vercel's logs and must be read manually. No request tracing or correlation IDs. No performance dashboard.

---

# Verification status

| Area | Automated | Live / API | Browser | Gaps |
|---|---|---|---|---|
| Auth, password | ✅ | ✅ smoke | ✅ | — |
| Google sign-in | ✅ | — | ✅ owner | Linking not independently browser-tested |
| Email recovery | ✅ | — | ✅ owner | Gmail limits; beta-grade |
| Email verification | ✅ | — | ❌ | **Not enabled in production** |
| Questions, answers, votes, accept | ✅ | ✅ smoke | ✅ | — |
| Markdown rendering | ✅ 14 subtests + 13 XSS payloads | — | ✅ 390 px | No screen-reader check |
| Image upload | ✅ | ✅ real Cloudinary | ✅ owner | No EXIF stripping; no virus scan |
| Reputation | ✅ | ✅ smoke | ✅ | No production backfill; not load-tested |
| Feed, search, filters | ✅ | ✅ | ✅ | Live `explain()` not observed |
| Notifications | ✅ | — | ✅ owner | Best-effort delivery; not load-tested |
| Moderation | ✅ | ✅ denial path | ⚠️ partial | **Mutations not fully browser-verified** |
| Account export | ✅ | — | ❌ | Never downloaded live |
| Account deletion | ✅ | — | ❌ | Never performed live |
| Rate limiting | ✅ with a contract fake | ✅ mode confirmed | — | **No real concurrency or load test** |
| Theme | ✅ + contrast pairs | — | ✅ 390 px | Not an exhaustive WCAG audit |
| Responsive | — | — | ✅ 5 widths | No real devices; no keyboard/safe-area |
| Security headers | ✅ | ✅ live probes | — | No CSP reporting |
| Study Library | ✅ | ✅ 200 confirmed | ✅ sample | — |

**Headline numbers.** Full local suite: **90 passing** before the final feed adjustment; the final focused run **38 passing**; CI passed on Node 22 and 24 plus audit (run 42812978312). `npm audit --omit=dev`: zero known vulnerabilities at that run. External QA Run 01: 40 PASS, 98 BLOCKED, 23 NOT RUN across 161 cases — and several of those passes need better evidence.

**Performance samples.** Warm filtered feed and catalogue: 1.1–1.3 s. One cold request: ~6.7 s database readiness, ~9.4 s wall.

**These are samples and dated evidence, not guarantees.** A passing test proves the tested flow on the tested day.

---

# Deliberately not built

Named explicitly, so nobody assumes an omission is an oversight.

**AI** — No live AI anywhere. The Study Library is static pre-generated content. No AI answers, no AI summaries, no AI moderation, no embeddings, no retrieval.

**Realtime** — No WebSockets, no SSE, no live thread updates, no typing indicators, no presence.

**Messaging** — No private messages, no email digests, no mentions, no browser push, no SMS.

**Content** — No file attachments other than images. No video or audio. No polls. No bounties. No wikis. No duplicate detection. No related questions. No bookmarks or following. No course or professor pages.

**Social** — No followers. No badge or achievement system. No leaderboards. No reputation-gated privileges.

**Moderation** — No audit log. No moderator tier between teacher and admin. No per-college moderators. No automated spam or abuse detection. No appeals process. No undo for a removal.

**Accounts** — No two-factor authentication. No OAuth providers other than Google. No SSO or SAML. No email change. No avatar upload. No account merging.

**Operations** — No monitoring or alerting service. No error aggregation. No analytics. No feature-flag system beyond the two email flags. No A/B testing. No admin audit trail.

**Platform** — No native apps. No PWA or offline mode. No internationalisation — English only, including search. No RTL layout.

**Data** — No multi-document transactions. No soft delete or trash. No content version history. No scheduled jobs of any kind, including upload cleanup.

---

*Dated evidence, not guarantees. Read the change records in `docs/*_CHANGE_RECORD.md` chronologically — each one carries its own "Not verified" section, and an older pending note is not the latest result.*
