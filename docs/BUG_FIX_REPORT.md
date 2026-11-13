> Historical report or design milestone. For current implementation and verification limits, read [CURRENT_STATE](CURRENT_STATE.md) and [design review](DESIGN_CONSISTENCY_REVIEW.md). This record does not certify the latest release.

# Bug fix report

Branch `fix/review-bugs`, based on `feat/design-v3` (the redesign). Nothing is pushed, merged or deployed.
Fixes were made in a separate copy of the repository, so the uncommitted files in the original project folder were not touched.

## Result

* Build: `vite build` passes.
* Tests: 120 of 120 pass (`npm test`), up from 112. Eight new tests were added.
* All automated writes used throwaway databases (`forum_test_*`, dropped after each run, and `review_preview`, dropped after the browser check). Production data was only read, through the public API.

## Bugs reproduced and fixed

### 1. Header search lost the current place and its filters

* **Reproduced:** `server/tests/header-search.test.js` renders the real `Navbar`. On the original code, searching from `/?subject=DBMS&status=open&page=3` went to `/?search=…`, dropping the subject and status. From Worked Q&A (`/?scope=all&tag=study-library`) it dropped the tag, so the search covered the whole forum. From Saved it left the Saved view. All three tests failed on the original code and pass now.
* **Intended behaviour implemented:** from Explore, Worked Q&A, Library or Saved, the search keeps the current filters and resets only the page. From any other page it starts a fresh question search. Clearing the box keeps the filters.
* **Saved view:** the header search now filters saved questions on the device (title and subject), with a "No saved questions match" state and a placeholder of "Search saved questions…". Before, the Saved view ignored search entirely.
* **Files:** `client/src/components.jsx`, `client/src/pages.jsx`, `server/tests/header-search.test.js`.
* **Evidence:** the new tests, plus a browser run: from `/?subject=DBMS&status=open`, searching "normal" gave `/?subject=DBMS&status=open&search=normal` with one matching card, and searching "zzz" in Saved gave the empty state.

### 2. A dismissed report could still remove content

* **Reproduced:** `server/tests/permissions.test.js` failed with `PATCH /admin/reports/:id` returning 200 where 409 was expected. A moderator could resolve a report twice, so a report dismissed earlier could later delete the question or answer.
* **Fix:** only a pending report can be resolved; otherwise 409 "This report has already been resolved."
* **Files:** `server/src/app.js`, `server/tests/permissions.test.js`.

### 3. Question view counts rose on every refresh (introduced by the redesign)

* **Cause:** the view counter was incremented inside `GET /doubts/:id`, and the page re-fetches after every vote or answer, so voting inflated views.
* **Fix:** a new `POST /doubts/:id/view` that the question page calls once when it opens. It is excluded from the per-account write limit so reading does not use up the posting allowance. `GET` no longer changes data.
* **Files:** `server/src/app.js`, `client/src/pages.jsx`, `server/tests/permissions.test.js`, `server/tests/resources.test.js`.
* **Note:** in development React runs effects twice, so one visit counts 2 locally. A production build counts 1.

### 4. File-upload errors named the wrong limit

* **Cause:** any upload size or field error said "Choose one JPG, PNG or WebP image up to 3 MB", including on the new resource upload (PDF, Word, PowerPoint, 4 MB).
* **Fix:** the message now follows the endpoint. Tested with a 4 MB + 10 byte file.
* **Files:** `server/src/app.js`, `server/tests/permissions.test.js`.

### 5. Closed mobile menu was still keyboard-focusable

* **Reproduced in the browser (375 px):** the off-screen drawer's links could receive focus while closed.
* **Fix:** the closed drawer is `visibility:hidden`, with a delay so the slide-out animation still plays. Verified: closed, a link cannot be focused; open, it can. No horizontal page scroll at 375 px.
* **File:** `client/src/design-v3.css`.

### 6. Text contrast below 4.5:1 in the new theme (introduced by the redesign)

* **Measured** by the new `server/tests/design-contrast.test.js`. White on the light active gradient was 4.28:1 and the orange accent text on white was 4.47:1.
* **Fix:** darker active gradient and accent in light mode, and a deeper start colour for the dark active gradient. Every text colour pair in both themes now reaches 4.5:1, and the file-type icons reach 3:1.
* **File:** `client/src/design-v3.css`.

### 7. The Ask page's main text box had no accessible name

* **Found** by an accessibility sweep of Explore, Library, Ask, Share, Contributors and Saved (unnamed controls, unlabeled inputs, duplicate ids, headings, landmarks). Only this one failed: the label wrapped the whole editor, so it named the first toolbar button, not the textarea.
* **Fix:** the label now points at the textarea. Verified in the browser.
* **File:** `client/src/pages.jsx` (plus a small style in `client/src/design-v3.css`).

## Checked and working (no change needed)

Covered by `server/tests/permissions.test.js`, run against a throwaway database:

* Unsigned writes get 401. A tampered token, a banned account's token and a token revoked by "sign out everywhere" all get 401.
* Short titles, a JSON array body, a malformed id, an unknown feed scope and "college" scope without sign-in are rejected with 400 or 401.
* A moderator cannot edit or delete another person's question, accept an answer, list users, open the study-library admin, change a role or suspend an account. Admins cannot be suspended.
* Authors cannot vote on their own content. Only the asker can accept an answer.
* Duplicate reports are refused. Resource deletion is limited to the sharer or a moderator.

## External connections: what was actually verified

| Connection | Status | Evidence |
| --- | --- | --- |
| MongoDB, local | Verified | The configured `MONGO_URI` in `server/.env` points at a local MongoDB. Connected, 11 collections and their indexes listed, reads and writes work in tests. |
| MongoDB Atlas (production) | Verified indirectly | The live `/api/v1/health` reported `database: connected`, and `/doubts` and `/catalog` returned data. No credentials are available locally, and nothing was written. |
| Redis rate limits (production) | Verified indirectly | The live health reported `rateLimitStore: redis`. Every API request passes through the Redis-backed limiter and fails closed when Redis is down, and the live API answered 200. The limiter code is unit-tested with a fake Redis. |
| Cloudinary uploads | **Not verified** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are not in the local private configuration. A real upload on the live site would create production data. Run `node scripts/live-upload-smoke.js <https-origin>` yourself when you are ready. |
| Gmail password recovery | **Not verified** | `EMAIL_PROVIDER`, `GMAIL_SMTP_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_FROM` and the `EMAIL_*` switches are not in the local configuration. The mail code is covered by tests with a fake sender only. |
| Google sign-in | **Not verified** | `GOOGLE_CLIENT_ID` is not in the local configuration. Token checks are covered by tests with a fake verifier only. |
| Redis, direct | **Not verified** | `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not in the local configuration. |

Only `PORT`, `MONGO_URI`, `JWT_SECRET` and `CLIENT_URL` exist locally. The other variables live in the Vercel project, which this review could not read.

## Missing features, not bugs

* **Institution-based Study Materials Library** (`docs/STUDY_LIBRARY_AND_DASHBOARD_PLAN.md`) is still only a plan: institutions, curriculum levels, teacher assignment, review workflow, PDF validation design and institution filters do not exist.
* The `/library` page added by the redesign is **not** that feature. It is a flat list of shared files and links with no institution, curriculum or teacher roles. It also takes over the route the plan reserves for the real Library. Decide whether to keep it as an interim page, rename it, or remove it before the planned Library is built. The 200 sample questions are still reachable as "Worked Q&A" (`/?scope=all&tag=study-library`), which is a question-tag filter and not a materials library.
* Question avatars are coloured initials because there is no profile-photo upload.

## Not covered

* Visual checks used a local copy with seeded data at desktop and 375 px widths in light and dark. The live site was not opened in a browser.
* No production write was attempted, so sign-up, posting, uploading and emailing on the live site are untested here.
* While previewing the redesign earlier, a preview server briefly connected to the local development database and created an empty `resources` collection with its indexes there. No documents were added or changed.
