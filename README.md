# Student Doubt Forum

A college question-and-answer application built with React, Express and MongoDB. Students can ask doubts, answer, comment, vote, accept answers, search and filter. Teachers have a badge. Administrators manage users and reported content. Optional screenshot uploads use Cloudinary.

## Current status

Own profiles now offer Sign out everywhere. This revokes existing bearer tokens server-side using a per-account token version; normal Sign out remains tab-local. Password recovery is still pending an email service.

Reputation is now a stored counter updated on votes, acceptance and deletion. Legacy accounts initialize lazily from historical data. For an explicit dry-run/reconciliation procedure and cross-collection consistency limits, read docs/REPUTATION_CHANGE_RECORD.md. No live backfill is required at startup or has been run by this change.

Working local implementation. Automated database/API integration checks and a production client build pass. A two-student browser flow has been verified. Cloudinary credentials and a hosted database/service are not configured yet; image upload and live deployment remain pending. See docs/TESTING.md for exact coverage and limitations.

## Run on this laptop

Requirements: Node 22.12+ (Node 24.19 was used), npm, MongoDB listening on 127.0.0.1:27017.

1. Open a terminal in this project folder.
2. Run `npm ci` to install the locked dependencies.
3. Copy `server/.env.example` to `server/.env`. Preserve an existing `.env`.
4. Set `JWT_SECRET` to a cryptographically random value of at least 32 characters. Generate one locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Keep it private.
5. Confirm `MONGO_URI` points to your intended database.
6. Run `npm run build`, then `npm start`.
7. Open http://127.0.0.1:5000 in your browser.

The private local configuration was already created on the original laptop; it is excluded from source control and the source package. Do not replace it unnecessarily.

## While developing

In two terminals, run `npm run dev:server` and `npm run dev:client`. Open http://127.0.0.1:5173. Vite forwards `/api` requests to the backend. For deployment, Express serves the compiled React app and APIs together, using one origin.

## Make your own administrator

Register the intended account using the application first. In the `server` directory run `node src/make-admin.js your-registered-email`. This changes only that existing account's role. Public signup cannot create administrators. Do not promote a stranger's account. There is no default production admin password.

## Formatting in questions and answers

Bodies are written in Markdown. The editor has buttons for bold, italic, inline code, fenced
code blocks, mathematics, lists, links and quotes, plus a preview tab. Fenced code blocks are
syntax highlighted for thirteen common languages; `$x^2$` and `$$...$$` render as mathematics
through KaTeX. Stored bodies are plain text, so posts written before this existed are
unaffected.

Rendering happens in the browser and the result is sanitised with DOMPurify before it is
inserted, with the server's `script-src 'self'` content security policy as a second layer.
Images are not permitted inside bodies; screenshots go through the upload flow below.

## Images

Set the three `CLOUDINARY_` values in private server configuration. Restart the server. Each doubt supports up to 3 JPEG/PNG/WebP files, maximum 3 MB each. The server checks file signatures and ownership, then uploads to Cloudinary. Unattached images can be removed by their uploader. Attached images are removed when their doubt is deleted. Editing preserves attachments; replace them by reposting if necessary. Unused uploads are not automatically expired in this first implementation.

## Tests

Running the test suite needs Node 22.22.2+ or 24.15+, because jsdom (used by the client rendering tests) requires it. The application itself still runs on Node 22.12+.

`npm test` creates a unique `forum_test_*` database on the local MongoDB server, runs integration checks and deletes that test database only. It never clears the application database. An optional `MONGO_TEST_URI` may point to an authorized test server. The test user needs permission to create/drop the uniquely named test database.

GitHub Actions runs `npm ci`, `npm run build` and `npm test` against a MongoDB 7 service container on every push and pull request, plus `npm audit --audit-level=high`. See `.github/workflows/ci.yml`.

`npm run build` verifies the frontend production build. Browser verification is separately documented; automated API tests do not prove every screen is correct.

## Licence

MIT. See `LICENSE`. Any college may use, modify and deploy this software, including
commercially, as long as the copyright notice and licence text are kept.

## Project files

- `client/src`: React screens, shared components, session context, API client, plain responsive CSS.
- `server/src`: Express API, Mongoose models, validation, authorization and forum operations.
- `server/tests`: integration tests using Node's built-in test runner.
- `docs`: setup guidance, API notes and test record.
- `render.yaml`: deployment blueprint, requires user-owned account/configuration.

## Authentication and limits

JWTs last 7 days and are sent in the Authorization header. The browser stores the token in sessionStorage; refresh restores the session, closing the browser tab normally ends that tab's stored session. Sign out clears the local token, but does not revoke a copied token server-side. The server checks the current account and ban status on every authenticated request. Public profiles hide email addresses. Passwords are hashed with bcrypt.

The current version is a college-project implementation, not a production service with email verification, password recovery, malware scanning, backups, monitoring, audit history or a token revocation system. Lists are bounded/paginated; profiles show the latest 50 questions and 50 answers. Database operations spanning multiple collections do not use transactions, so concurrent deletion/upload edge cases and failure recovery need additional hardening before broader public use.

## Live application

The selected host is now Vercel. Follow docs/VERCEL_HINGLISH.md for its import settings and private environment configuration. docs/GO_LIVE_HINGLISH.md retains the earlier Render alternative. Live readiness requires user-owned GitHub, database, Cloudinary and hosting accounts, private credentials, deployment and a fresh live acceptance run. A local URL is not a public website.
