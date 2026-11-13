> Historical handover. Start with [CURRENT_STATE](docs/CURRENT_STATE.md), [INDEX](docs/INDEX.md) and the [design review](docs/DESIGN_CONSISTENCY_REVIEW.md). Earlier setup and cleanup instructions are not authorization to rerun them.

# Student Doubt Forum Complete Build and Deployment Playbook

> **Status update 13 November 2026.** This document describes the build at code reference `827e8df` and has not been rewritten line by line. Changes since then are listed in [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) (section "Update 13 November 2026"), the [API notes](docs/API.md) and the [Design v3 change record](docs/DESIGN_V3_CHANGE_RECORD.md). Where they differ, the newer records win. Features added since: resource Library, Trending Topics, Top Contributors, view counts, Light and Dark themes, header search that keeps filters, Python and C and C++ subjects.

**Current guide, 10 November 2026.** Read the [A–Z playbook](docs/DOUBT_FORUM_A_TO_Z_PLAYBOOK.md) and [project context](PROJECT_CONTEXT.md). The build notes below document earlier milestones.

**Project record:** 9 November 2026  
**Audience:** beginners who want to understand, reproduce and maintain this application  
**Language:** simple English with Hinglish explanations  
**Live website:** https://student-doubt-forum-theta.vercel.app/  
**Source repository:** https://github.com/Raju-ol/student-doubt-forum

This playbook records how we built Student Doubt Forum with Codex, ran it locally, uploaded the source to GitHub, deployed frontend and backend on Vercel, connected MongoDB Atlas and Cloudinary, and set up the owner's application admin account. It also explains what failed, how it was fixed, and how to repeat the process.

The application’s core live API flow and image integration passed tests. The owner also reported successfully posting an image question and seeing the admin Moderation link. Database network access is currently temporary for one week. This is a working college-project deployment, with further production hardening and broader device testing still needed.

No real passwords, JWT signing keys, API secrets, connection passwords or recovery codes are included. All credential examples below use placeholders. Screenshots containing credentials must never be added to this guide or a repository.

## Contents

1. [What we built](#1-what-we-built)
2. [Architecture and services](#2-architecture-and-services)
3. [How Codex and the owner worked together](#3-how-codex-and-the-owner-worked-together)
4. [Tools and accounts](#4-tools-and-accounts)
5. [Source structure](#5-source-structure)
6. [Local setup and startup](#6-local-setup-and-startup)
7. [Database design](#7-database-design)
8. [Authentication and permissions](#8-authentication-and-permissions)
9. [Questions answers votes and reputation](#9-questions-answers-votes-and-reputation)
10. [GitHub setup and upload](#10-github-setup-and-upload)
11. [MongoDB Atlas setup](#11-mongodb-atlas-setup)
12. [Vercel deployment](#12-vercel-deployment)
13. [Database connection failures and fixes](#13-database-connection-failures-and-fixes)
14. [Cloudinary setup and image uploads](#14-cloudinary-setup-and-image-uploads)
15. [Admin and teacher management](#15-admin-and-teacher-management)
16. [API reference](#16-api-reference)
17. [Verification and test evidence](#17-verification-and-test-evidence)
18. [Friends testing and the demo](#18-friends-testing-and-the-demo)
19. [Future changes and maintenance](#19-future-changes-and-maintenance)
20. [Troubleshooting](#20-troubleshooting)
21. [Reusable Codex prompts](#21-reusable-codex-prompts)
22. [Final status and remaining work](#22-final-status-and-remaining-work)
23. [References](#23-references)

## 1 What we built

Student Doubt Forum is a small question-and-answer community for college students. A student asks a question, another student or teacher answers, and the question owner marks the most useful answer as accepted.

| Area | Implemented behavior |
|---|---|
| Accounts | Signup, login, sign out and session restoration on refresh |
| Questions | Create, list, view, edit and delete with permission checks |
| Classification | Subject, semester and up to five tags |
| Discovery | Keyword search, subject/semester/tag/status filters and pagination |
| Answers | Post, edit and delete; accepted answer shown first |
| Voting | Upvote/downvote; repeat removes vote; opposite switches vote |
| Discussion | Comments below answers |
| Reputation | Calculated from answer votes and accepted answers |
| Profiles | Name, semester, role, reputation and recent contributions |
| Teachers | Visible teacher badge based on current account role |
| Images | Up to three JPEG/PNG/WebP images per doubt, 3 MB each |
| Moderation | Report content, review reports, remove content, suspend/restore users |
| Roles | Student, teacher and admin |
| Interface | Plain CSS, responsive layout, loading/empty/error states |

Not included: AI answers, realtime chat, notifications, password recovery, email verification, full audit history or production monitoring/backups.

The original attached Claude playbook was a reference. We used Codex to edit files and run checks directly. Historical documents proposed both smaller and larger scopes; the owner explicitly chose the full application and a 12 November target. The final implementation and verified results take precedence over earlier planning checkboxes.

## 2 Architecture and services

```text
Developer laptop -- Git push --> GitHub repository
                                     |
                                     v
                          Vercel build and deployment
                                     |
Friend's browser -- HTTPS --> Vercel
                              |-- React frontend and static assets
                              |-- /api/* -> Node function -> Express
                                                   |-- MongoDB Atlas
                                                   `-- Cloudinary
```

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React, React Router, Vite | Pages, navigation, forms and API requests |
| Styling | Plain CSS and CSS variables | Appearance and responsive layouts |
| Backend | Node.js and Express | Validation, authentication, permissions and APIs |
| Database | MongoDB with Mongoose | Accounts, questions, answers and related records |
| Passwords | bcryptjs | Store password hashes instead of raw passwords |
| Sessions | jsonwebtoken | Signed seven-day bearer tokens |
| Upload handling | multer memory storage | Receive and validate image files |
| Image service | Cloudinary | Store and deliver images |
| Source history | Git and GitHub | Save versions and supply code to hosting |
| Hosting | Vercel | Serve frontend and backend using one public origin |

Frontend browser requests use `/api/v1`; no localhost address is built into the production API URL. Locally, Vite proxies API requests to Express. On Vercel, routing sends API traffic to the function and other page routes to React.

MongoDB stores an image's URL/public ID and ownership, not the image file itself. Cloudinary stores the image. Compass is a database viewer; it does not replace the MongoDB database server.

## 3 How Codex and the owner worked together

**Codex handled:** reading the reference document; inspecting installed tools; writing source files; installing packages; implementing backend/frontend; creating tests; diagnosing failures; preparing deployment configuration; uploading commits; checking public API behavior; and maintaining progress notes.

**The owner handled:** account sign-ins, email/device authorization, private password entry, service dashboards, approving account access changes, adding private Vercel variables, and trying the application.

Our loop was: inspect existing state → implement a bounded change → test → fix reproduced failures → save progress → take the next step. A successful build was not treated as proof that the database worked.

For another beginner: ask Codex to inspect first and edit files directly. Do not ask it to regenerate an existing working project from memory. Keep each setup instruction small; if the dashboard differs, share a screenshot with secrets hidden.

## 4 Tools and accounts

The inspected laptop already had Node.js 24.19.0, npm 11.17.0 and Git 2.55.0. Local MongoDB was reachable and successfully used. We checked before reinstalling anything.

Accounts used:

- GitHub: the repository owner is `Raju-ol`.
- MongoDB Atlas: an existing free Cluster0 in the owner's project.
- Vercel: the owner's Hobby workspace, connected to the repository.
- Cloudinary: the owner's image-service account.

Use current vendor dashboards to confirm plans and limits. Free tiers have caps and may change. No paid upgrade was required in this recorded workflow. Long-term restricted database networking can require a different networking/hosting arrangement; the current broad IP entry is temporary.

## 5 Source structure

```text
student-doubt-forum/
  package.json                  npm workspace commands
  package-lock.json             locked installed dependency versions
  .gitignore                    excludes private config/dependencies/builds
  vercel.json                   production build and routing
  render.yaml                   earlier alternative; not the selected host
  Start Application.cmd         Windows local launcher
  api/index.js                  Vercel request handler
  client/
    index.html
    vite.config.js
    src/
      main.jsx                  routing and app entry
      pages.jsx                 feed, auth, ask, detail, profile, admin
      components.jsx            shared cards, forms, voting, navigation
      context.jsx               authentication state
      api.js                    fetch wrapper
      styles.css
      styles/variables.css
  server/
    .env.example                safe configuration template
    .env                        PRIVATE; not tracked or packaged
    src/
      app.js                    Express routes, middleware, uploads
      server.js                 local/server startup
      database.js               shared connection and diagnostics
      models.js                 Mongoose schemas
      auth.js                   identity, roles and ownership
      validation.js             bounded input validation
      forum.js                  voting, reputation and deletion helpers
      make-admin.js             controlled admin helper
    tests/
      forum.test.js
      database-errors.test.js
  scripts/
    setup-local.js
    package-source.js
    live-smoke.js
    live-upload-smoke.js
  docs/                         API, verification and setup guides
  PROJECT_CONTEXT.md            project memory
  RESUME_HERE.md                checkpoint history
  PLAYBOOK.md                   this document
```

The actual implementation uses several consolidated modules. It does not reproduce every proposed controller/model folder from the original planning document.

## 6 Local setup and startup

### Reproduce from the current repository

Open PowerShell and choose a folder where you want the source. Private repository access requires your own authorized GitHub account.

```powershell
git clone https://github.com/Raju-ol/student-doubt-forum.git
cd student-doubt-forum
npm.cmd ci
node scripts/setup-local.js
```

The setup helper creates `server/.env` only if absent. It generates a random JWT key without printing it and preserves an existing private configuration. MongoDB must be running locally.

The source ZIP produced earlier in the session predates some later deployment changes. For the latest code, use the current repository plus any saved local additions, or rebuild the package after saving those additions. Do not assume an older ZIP contains this playbook or the latest upload test.

### Configuration

Local private file example; placeholders are not working credentials:

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/student_doubt_forum
JWT_SECRET=REPLACE_WITH_A_PRIVATE_RANDOM_VALUE
CLIENT_URL=http://127.0.0.1:5173
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET
```

The backend requires a JWT secret of at least 32 characters. Prefer 48 cryptographically random bytes encoded as hex. The setup helper already generates one; never use an example string as the real secret.

### Simple local run

```powershell
npm.cmd run build
npm.cmd start
```

Expected messages: MongoDB connected; application running on port 5000. Open `http://127.0.0.1:5000`. Keep the terminal open. `Ctrl+C` stops the server.

On Windows, double-click `Start Application.cmd` for guided local startup. It checks Node, preserves private configuration, installs dependencies if missing, builds and starts. It still requires MongoDB and an available port.

### Development mode

Run in separate terminals from the project root:

```powershell
npm.cmd run dev:server
```

```powershell
npm.cmd run dev:client
```

Open `http://127.0.0.1:5173`. Cloudinary configuration is needed locally only when testing local image uploads; setting variables in Vercel does not update the laptop's `.env`.

### Local versus online data

Local MongoDB and Atlas are separate databases. A local demo account or local admin promotion does not automatically appear online. We created fresh accounts on the live website; we did not claim to migrate all local data to Atlas.

## 7 Database design

All collections use timestamps. Actual collection names follow Mongoose's naming, such as `users`, `doubts`, `answers`, `votes`, `comments`, `reports` and `uploads`.

| Model | Main fields | Relationship |
|---|---|---|
| User | name, unique email, passwordHash, role, semester, isBanned | Author of content |
| Doubt | title, body, subject, semester, tags, images, author, acceptedAnswer | References user and accepted answer |
| Answer | doubt, body, author | References question and user |
| Vote | targetType, target, user, value | Unique vote per user/target/type |
| Comment | answer, body, author | Belongs to an answer |
| Report | targetType, target, reason, reporter, status | Moderation record |
| Upload | publicId, url, owner, optional doubt | Ownership and attachment lifecycle |

Reputation, vote scores and answer counts are derived rather than blindly incremented. The unique vote index prevents duplicate vote records. A single accepted-answer pointer on each question represents one accepted answer.

Current search uses escaped, bounded case-insensitive regular expressions on title/body. A planned text index was not the implemented search mechanism. Profiles show the latest 50 questions and 50 answers; question and admin lists are paginated.

## 8 Authentication and permissions

Signup accepts name, normalized email, password and semester. Public signup always creates a student; passing `role: admin` in the request does not grant admin access. Passwords are hashed with bcrypt before saving, and the hash is excluded from normal query responses.

Login returns a JWT lasting seven days. The client saves it in `sessionStorage` and sends:

```http
Authorization: Bearer YOUR_SESSION_TOKEN
```

Refresh calls `/auth/me`. Each authenticated request loads current account/ban state from MongoDB. Closing the tab normally ends that tab's stored session. Sign out clears local browser state, but does not revoke a copied JWT server-side. This implementation does not use HTTP-only session cookies.

Rules enforced by the server:

- Author identity comes from the signed-in user, not from submitted author IDs.
- Only the owner or admin can edit/delete content.
- Only the question owner can accept an answer.
- Users cannot vote on their own content.
- Admin-only routes check the current database role.
- Banned users cannot continue using an existing token.
- Input types, lengths, IDs, pagination and uploads are validated.
- React renders user text as text, not untrusted HTML.

## 9 Questions answers votes and reputation

The owner selected a subject, semester and tags, then entered a question. Another account answered. The first account refreshed, accepted the answer and added a comment. Search found the solved discussion.

Voting rules: value `1` upvotes; `-1` downvotes; repeating the same vote removes it; the opposite vote switches it. Reputation from answers is +10 for an upvote, -2 for a downvote and +15 for acceptance. Switching/removing votes and acceptance is reflected in the calculated score.

Deleting an accepted answer clears the question's accepted pointer and reopens it. Deleting a question runs answer/comment/vote cleanup and removes its recorded Cloudinary images. Operations across collections do not use database transactions; partial-failure recovery and concurrent changes need more hardening.

## 10 GitHub setup and upload

The owner created a private repository named `student-doubt-forum` under `Raju-ol`, without adding an initial README/license/gitignore, because those files already existed locally.

First local checkpoint:

```powershell
git init -b main
git add .
git diff --cached --name-only
git check-ignore server/.env
git diff --cached --check
git commit -m "feat: build student doubt forum with authentication and moderation"
git remote add origin https://github.com/Raju-ol/student-doubt-forum.git
```

Review staged filenames before committing. `server/.env` should be ignored and absent from `git ls-files server/.env`. The example file is safe to track; real values are not.

### Account mismatch we encountered

The connected GitHub service account and laptop Git account initially differed from the intended repository owner. The first push returned 403 permission denied. We did not upload to the other account or delete unrelated credentials.

Git Credential Manager was already installed. Its device sign-in was used:

```powershell
git credential-manager github login --username Raju-ol --device --no-ui
```

The owner opened the displayed GitHub device URL, signed into the correct account, entered the short-lived device code and authorized Git Credential Manager. That device code is not a phone OTP; do not reuse an old code.

Then:

```powershell
git -c credential.username=Raju-ol -c credential.interactive=false push -u origin main
git -c credential.username=Raju-ol -c credential.interactive=false ls-remote origin refs/heads/main
git rev-parse HEAD
```

Matching remote/local commit IDs verified the upload. Someone reproducing this with a different owner must replace the account and repository names.

| Recorded commit | Purpose |
|---|---|
| bcee01a | Initial working forum implementation |
| be4ca52 | Vercel frontend/API deployment configuration |
| 0a4eccc | Safe database failure diagnostic codes |
| b6df8c6 | Explicit application database and initialization retry fix |

Several local guides and verification scripts were added later. They may not be in the last pushed commit until explicitly committed/pushed. A documentation request is not permission to publish private notes automatically.

## 11 MongoDB Atlas setup

### Create or reuse a free cluster

The owner signed into Atlas and tried to select Free. Atlas said the free-cluster limit in that project had already been reached. The Clusters screen showed an existing Cluster0, so we reused it rather than paying, deleting data or creating duplicate infrastructure. The recorded cluster was in AWS Mumbai.

### Database user

Atlas login and database login are different. An Atlas account lets you manage the dashboard. A database user lets the application read/write data.

Under Database & Network Access → Database Users, the original application database user had a broad Atlas admin role. We changed it to:

| Setting | Value |
|---|---|
| Specific privilege | readWrite |
| Database | student_doubt_forum |
| Collection | blank, meaning all collections within this database |
| Existing Atlas admin built-in role | removed |

Save using Update User. This application database permission is completely separate from the website's student/teacher/admin role.

### Connection string

Cluster0 → Connect → Drivers and Client Libraries → JavaScript / Node.js Driver. Copy the URI privately. Example only:

```text
mongodb+srv://DB_USERNAME:DB_PASSWORD@CLUSTER_HOST/student_doubt_forum
```

Replace the password placeholder with the database user's password, not the Atlas dashboard login password. Preserve query parameters provided by Atlas. Reserved URI characters in credentials require percent encoding; do not use an unknown online password encoder. Do not paste the completed URI into chat or source control.

The final backend also explicitly selects `student_doubt_forum`, so its chosen database matches the restricted readWrite grant even when a copied URI ends in `/`.

### Network access

Initially only the owner's laptop IP was allowed. Vercel could not reliably initialize the live database. After explaining the exposure and obtaining permission for temporary testing, we added:

- Access List Entry: `0.0.0.0/0`.
- Comment: `Temporary Vercel testing`.
- Temporary switch: ON.
- Initial duration: six hours.
- Later duration: one week for friends to test.

The latest screenshot showed Active and 1 WEEK. This lets clients from any IP attempt database authentication; a valid database password is still required. It is not a private-network or permanent hardened setup. Never silently turn temporary broad access into a permanent entry.

Friends visit Vercel, which contacts Atlas. Their individual IPs do not need separate Atlas entries. After this entry expires, new database connections may fail; do not assume an existing warm connection makes expiry harmless. Record the exact expiry shown in Atlas and review before the demo.

## 12 Vercel deployment

Render was considered first and its alternative blueprint remains in the source. The owner asked whether Vercel could host both frontend and backend. We checked current Express support, corrected the earlier oversimplification and selected Vercel. Render was not the final deployed host.

### Import settings

Sign into Vercel with the intended GitHub owner, import the repository and use:

| Setting | Actual value |
|---|---|
| Root Directory | ./, repository root |
| Framework Preset | Vite |
| Install Command | npm ci |
| Build Command | npm run build |
| Output Directory | client/dist |
| Backend | api/index.js Node function |
| Environment | Production |

Do not import only `client` when deploying this combined configuration. After initial success Vercel suggested deploying `./client` and `./server` separately; those extra projects were not needed.

### Actual vercel.json

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "functions": {
    "api/index.js": { "maxDuration": 60 }
  },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api" },
    { "source": "/:path*", "destination": "/index.html" }
  ]
}
```

Vercel serves the compiled frontend. Its API handler obtains a shared database connection and passes requests to Express with client static serving disabled. Local Express can still serve the built frontend separately.

### Environment variables

Vercel project → Settings → Environment Variables. The separate Environments page creates deployment environments and was the wrong page for adding keys. We cancelled that popup; no Pro upgrade was needed to add variables.

| Key | Value source | Recorded status |
|---|---|---|
| MONGO_URI | Private Atlas URI | Set by owner; live flow passed |
| JWT_SECRET | Private random signing key, at least 32 characters | Set by owner; replacement used after exposure |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | Set; live upload passed |
| CLOUDINARY_API_KEY | Cloudinary API Key | Set; live upload passed |
| CLOUDINARY_API_SECRET | Cloudinary API Secret | Set privately; live upload passed |
| CLIENT_URL | Exact public origin | Recommended live value below; not independently confirmed saved |
| NODE_ENV | production | Recommended production setting; not independently confirmed saved |

Public origin: `https://student-doubt-forum-theta.vercel.app` without a page path. The source's Render blueprint suggests TRUST_PROXY=1; do not copy proxy settings blindly to another platform. Confirm proxy trust behavior before changing it.

Key and value are separate boxes: Key is `JWT_SECRET`, without `=`; Value contains only the secret. `MONGO_URI` is the full URI, not just the password. Select Production for production credentials. Use a separate database/credentials for Preview instead of sharing live data by default. Do not set frontend `VITE_API_URL` to localhost in production.

### Apply changes with redeploy

Saving environment variables does not update an existing deployment automatically. Open Deployments → current production row → three-dot menu → Redeploy. Keep Production selected. In the recorded run, Use existing Build Cache remained unchecked. Wait until Building becomes Ready.

A deployment list contains versions of one project, not separate applications. The version with the current Production label serves the public domain. Ready proves build/deployment success; functional tests prove application behavior.

## 13 Database connection failures and fixes

Initial deployment rendered the frontend but `/api/v1/health` returned HTTP 503. This meant a deployed page was not yet a fully working application.

We inspected the Atlas allowlist, reduced the application's database-user privileges and enabled temporary network access. Health sometimes returned 200, but questions still returned 500. The observed behavior was consistent with a database-selection/initialization problem; the precise earlier server-side failure was not conclusively captured in live logs.

Two code changes resolved the recorded live flow:

1. Added safe categorized diagnostics rather than returning raw connection errors.
2. Explicitly selected `student_doubt_forum`, reused a connection promise, and disconnected/reset after initialization failure so a half-initialized connection could not be mistaken for success.

Final connection settings include a ten-second selection timeout and maximum pool size five. Models initialize before the connection setup promise completes. A warm function instance reuses the connection; each separate instance may have its own pool.

| Diagnostic code | What to check |
|---|---|
| MONGO_URI_MISSING | Variable exists in the deployed Production environment |
| JWT_SECRET_INVALID | Signing key exists and meets minimum length |
| DATABASE_AUTH_FAILED | Correct database user and current password |
| DATABASE_PERMISSION_DENIED | readWrite grant and selected database match |
| DATABASE_URI_INVALID | URI syntax, placeholder replacement and encoding |
| DATABASE_NETWORK_UNAVAILABLE | Atlas entry active, cluster/network/DNS reachable |
| DATABASE_CONNECTION_FAILED | Inspect sanitized runtime diagnostics |

We verified that production commit b6df8c6 was Ready, then the live question/answer tests passed. Do not fix database failures by repeatedly increasing privileges or deleting collections.

## 14 Cloudinary setup and image uploads

The owner signed into Cloudinary. During onboarding, Integrate Cloudinary with my tech stack was selected. The Quick Start screen already showed Node.js. Settings → API Keys supplied the cloud name and an active API key/secret pair.

Add these independently to Vercel Production and save each:

```text
CLOUDINARY_CLOUD_NAME = cloud name only
CLOUDINARY_API_KEY = full API key value
CLOUDINARY_API_SECRET = actual copied secret, not displayed asterisks
```

The application uses these three variables. Copying the sample `CLOUDINARY_URL=...` placeholder is not a substitute. Keep the secret hidden; use the copy control instead of revealing it in a screenshot.

After all entries were saved, the owner redeployed the latest production code. Actual upload/delivery and deletion tests then passed.

### Upload lifecycle

1. Signed-in browser submits a multipart `image` file to `/uploads`.
2. Server checks size, accepted media type and signature.
3. Server uploads the buffer to Cloudinary.
4. An Upload record tracks returned publicId, URL and owner.
5. Question creation accepts the owner's unused `imageIds`, up to three, and links them to that doubt.
6. The owner can remove unused uploads. Attached uploads are protected from that unused-image endpoint.
7. Deleting the question runs attached-image deletion.

Maximum file size is 3 MB. Supported formats are JPEG, PNG and WebP. Vercel request-size limits still apply. The current edit form preserves attachments; it does not replace attached images. There is no automatic expiry job for abandoned unused uploads.

### Owner's manual test

We supplied a DBMS question about primary keys/foreign keys and generated an educational table image. The owner uploaded it, posted a question and reported that it worked. The sample file was saved outside the application source folder as `dbms-question.png`; it is not required to run the application.

## 15 Admin and teacher management

The first local demo admin was separately approved and promoted for testing. That did not affect live Atlas accounts. Later the owner registered on the public website, changed the intended live account's application role in Atlas and reported that Moderation appeared.

### Add another student

Ask them to use Create an account on the website. Do not manually construct a user document or raw password hash.

### Add a teacher

An application admin opens Moderation → Users and selects Make teacher for the intended account. Make student reverses the role. Teacher badges come from the current user role.

### Add a trusted admin

The current application dashboard deliberately only switches student/teacher roles. Another admin requires an owner-controlled database action:

1. Have the intended person register normally.
2. Atlas → Cluster0 → Browse Collections / Data Explorer.
3. Select `student_doubt_forum` → `users`.
4. Filter by the exact intended registered email:

```json
{ "email": "registered-person@example.com" }
```

5. Verify one matching account before editing.
6. Use List/Table edit controls to change only `role` from `student` or `teacher` to `admin`.
7. Save with Update. Do not change `_id`, passwordHash or email accidentally.
8. Refresh the website; confirm Moderation appears and intended pages load.

To remove website admin access, change that exact user's role back to student. Keep at least one intended administrator. Do not grant admin to testers by default. A full user-record screenshot can expose password hashes; avoid sharing it.

`server/src/make-admin.js` is also available for controlled local operation, but it uses its configured MONGO_URI, not automatically the live database. It must never be run against an assumed database or with credentials placed in command-line arguments. The live owner setup recorded here used Atlas instead.

### Moderation operations

Users tab supports teacher/student changes and suspension/restoration for non-admin accounts. Reports tab lists pending reports and supports dismissing or removing reported content. Existing admin accounts cannot be suspended or demoted using those user endpoints. Full live browser coverage of every moderation action is still pending; the owner reporting a visible link alone does not prove all mutations.

## 16 API reference

Base path: `/api/v1`. Success shape: `{ success: true, data, message }`. Error shape: `{ success: false, message }`; database initialization failures may also include a safe `code`.

| Method | Endpoint | Main purpose |
|---|---|---|
| GET | /health | Database readiness |
| POST | /auth/signup | Create student |
| POST | /auth/login | Authenticate |
| GET | /auth/me | Current account |
| GET / POST | /doubts | Filtered list / create doubt |
| GET / PUT / DELETE | /doubts/:id | Details / edit / delete |
| POST | /doubts/:id/vote | Toggle/switch question vote |
| POST | /doubts/:id/answers | Create answer |
| PUT / DELETE | /answers/:id | Edit/delete answer |
| POST | /answers/:id/vote | Toggle/switch answer vote |
| PATCH | /answers/:id/accept | Accept/unaccept |
| POST | /answers/:id/comments | Add comment |
| GET | /users/:id | Public profile/contributions |
| PUT | /users/me | Edit own name/semester |
| POST / DELETE | /uploads | Upload / delete own unused image |
| POST | /reports | Submit report |
| GET | /admin/users | Paginated user list |
| PATCH | /admin/users/:id/ban | Set suspension state |
| PATCH | /admin/users/:id/role | Student/teacher changes |
| GET | /admin/reports | Pending reports |
| PATCH | /admin/reports/:id | Dismiss/remove |

List query parameters: `search`, `subject`, `semester`, `tag`, `status`, `page`, `limit`. See `docs/API.md` and actual route code for payload details. Logout is client-side; no server revocation endpoint exists.

## 17 Verification and test evidence

### Local checks

```powershell
npm.cmd test
npm.cmd run build
```

Tests use a uniquely named `forum_test_*` database, assert the cleanup target and drop only that temporary database. Do not rewrite tests to clear the application database. The latest full local run in this record reported **28 passes**, including parent tests; this is not 28 separate browser journeys.

Checks include hashing, unique normalized email, validation, wrong passwords, tokens, anonymous writes, ownership, vote transitions, reputation, acceptance, teacher roles, bans, report moderation, image ownership, Vercel handler behavior and diagnostic categorization. Earlier 26/27 totals were earlier revisions, not conflicting final counts.

Production builds passed. React Router use-client warnings were ignored by the build and were not deployment failures. The dependency audit reported zero vulnerabilities at installation time; that is not a permanent security certification.

### Live core test

Run intentionally against an authorized deployment only:

```powershell
node scripts/live-smoke.js https://student-doubt-forum-theta.vercel.app
```

It creates two labeled QA accounts and checks health, signup/login/me, anonymous-write rejection, a question, second-user answer, vote, acceptance, comment, search, reputation and non-admin denial. It deletes the temporary discussion afterward. QA accounts remain; passwords/tokens are generated in memory and not printed/saved.

### Live image test

```powershell
node scripts/live-upload-smoke.js https://student-doubt-forum-theta.vercel.app
```

Uses a tiny synthetic PNG, one labeled QA account and real Cloudinary requests. It verified upload, image HTTP delivery, unused deletion, attachment linkage/protection and question/image cleanup. The test account remains. Avoid repeatedly creating QA accounts unnecessarily.

### Browser evidence and limits

Local browser checks verified separate student sessions, signup, question, answer, acceptance, comments, search and refresh restoration. Local admin Users/Reports views loaded. The owner reported live image posting and the Moderation link. Mobile CSS exists, but an attempted 390px viewport override stayed at 699px; full 390px verification must not be claimed. Screen-reader, keyboard, load/concurrency, complete live moderation and every edit/error state are not comprehensively verified.

## 18 Friends testing and the demo

Share the public website link, not database credentials or the local localhost URL. Friends should each create a student account. They do not need Atlas, Cloudinary or GitHub access.

| Tester | Action | Expected result |
|---|---|---|
| A | Signup and sign in | Account/session created |
| A | Post image question | Preview and saved discussion display image |
| B | Answer A's question | Correct author and answer shown |
| A | Upvote B's answer | Score changes once |
| A | Accept B's answer | Solved state and accepted label |
| Either | Search by title keyword | Same discussion found |
| A | Refresh, then sign out | Session restores before sign-out; protected writes denied afterward |
| Owner | Review admin pages | Intended role access only |

Ask for exact action, expected result, actual result, screenshot without secrets, browser/device and time. Do not ask friends to disclose passwords. A screenshot of a failed request is more useful than repeatedly saying not working.

Demo sequence: problem → two student accounts → question/image → answer → accept/vote/search → profile/reputation → admin overview → architecture → known limits. Check Atlas entry expiry before presenting. Live data in Atlas persists independently of closing the laptop, while the website still depends on active service accounts, network access and valid credentials.

## 19 Future changes and maintenance

### Change code

Inspect current files/context, implement a bounded change, run relevant tests/build and review the diff. Before uploading:

```powershell
git status --short
git diff --check
git diff
```

Stage intended paths, review staged filenames, commit a descriptive message and push main using the correct account. Watch Vercel for a new deployment. Verify it is current Production before concluding a change is live. Do not reset unrelated work or force-push history to fix a normal setup error.

### Change private configuration

Edit Vercel Environment Variables and redeploy. Changing local `.env` does not update Vercel, and saving a Vercel value does not rebuild the existing deployment. Keep secret values out of build logs, shell arguments and chat.

### Secret exposure incident

During setup, a screenshot accidentally showed a database password and JWT key. We treated them as exposed: the owner changed the database password; Codex generated a new local JWT key privately; the owner updated Vercel. JWT rotation can invalidate existing sessions, so users may need to sign in again. No leaked value belongs in a reusable guide.

For a Cloudinary secret leak, rotate/replace the affected credential through its account controls, update the private hosting variables and redeploy. Preserve evidence without copying secrets into public issue reports.

### Access and operations

Review one-week Atlas expiry before it lapses. Choose the long-term networking approach explicitly rather than silently disabling expiry. Maintain least-privilege database credentials. Check free-tier usage, storage, upload volume, abandoned uploads and retained QA accounts. Backup/restore planning, shared rate limiting and monitoring are future work.

### Source packaging

The packaging helper excludes `.env` files except `.env.example`, node_modules, build output, Git metadata and logs. Its existing staging-folder guard prevents overwriting a prior package. Preserve/rename an older staging output before intentionally making another; never recursively delete an unchecked path. Verify the final archive contents and rehearse clean setup before claiming a submission-ready ZIP.

## 20 Troubleshooting

| Symptom | What happened or what to inspect |
|---|---|
| Atlas Free option disabled | Existing free cluster already occupied the project allowance; reused Cluster0 |
| Atlas asks for payment | Check selected tier; do not assume a paid upgrade is needed |
| GitHub push 403 | Wrong stored Git account; authorized intended owner with device flow |
| Cannot resolve host in restricted execution | Network restriction; reran authorized operation with required network permission |
| Windows blocks native build component | Restricted build failed; authorized normal run completed successfully; did not disable endpoint protection |
| Page renders but database fails | Check API health, variables, Atlas access and selected database; frontend success is insufficient |
| Health works but queries fail | Check database privileges/index initialization and whether correct new code is deployed |
| URI pasted as password only | Use full mongodb+srv URI with credentials and intended database |
| Password contains reserved characters | Correctly percent-encode credential portion; preserve URI structure |
| New environment value has no effect | Redeploy with latest settings |
| Environment creation shows Pro upgrade | Wrong Environments page; use Environment Variables |
| Vercel lists three deployments | Historical versions; current Production row is the live one |
| Image service not configured | Verify all three Cloudinary keys in Production, then redeploy |
| Upload rejects image | Supported type/signature, one file/request, <=3 MB and valid session |
| Image deletion leaves cached URL visible | CDN caches may persist temporarily; a cached response alone does not prove origin deletion failed |
| Local admin missing online | Local/Atlas data are separate; promote intended live registered account |
| Cannot create admin from website panel | Current API only permits student/teacher role changes there |
| Website breaks after testing week | Atlas broad temporary entry may have expired |

## 21 Reusable Codex prompts

These are newly written reusable prompts summarizing our workflow, not a verbatim transcript of every original message.

### Inspect and continue

> Read PLAYBOOK.md, PROJECT_CONTEXT.md and the current source. Inspect the actual state before changing anything. Preserve unrelated files. Tell me the next bounded task in simple Hinglish. Never print or request secret values.

### Reproduce locally

> Help me run this repository from scratch on my laptop. Check Node, Git and MongoDB first. Use the lockfile, preserve private configuration and verify health plus a two-student question/answer flow. Report failed or unrun checks honestly.

### Fix a bug

> I did [action]. Expected [result], got [actual result]. Inspect relevant code and sanitized errors, identify the root cause and make the smallest useful fix. Test the affected flow and update the verification record. Do not expose .env or clear application data.

### Deploy a change

> Prepare this existing application for the selected hosting service using current official docs. Preserve the public API and local startup. Verify tests/build, check staged files exclude secrets, push using the intended account, then verify the deployed behavior. I will enter credentials privately.

### Add an administrator

> Help me promote this specifically identified registered application account to admin. Verify the exact account and intended database before changing role. Do not confuse website admin with Atlas database-user permissions. Preserve passwordHash and all unrelated fields. Verify access afterward.

### Resume later

> Save what changed, actual test results, unresolved issues, latest deployment and exact next action in the progress file. Do not copy secrets. When I return, continue from the saved state rather than rebuilding.

## 22 Final status and remaining work

### Completed in this recorded session

- Full selected forum features implemented locally.
- Source uploaded under the intended GitHub owner and commit identity checked.
- Frontend and Express API deployed together on Vercel.
- Atlas application database connected with restricted readWrite privileges.
- Safe diagnostics, explicit database selection and initialization failure handling added.
- Live core API flow passed.
- Cloudinary configured privately; real image flow passed.
- Owner reported successful image question posting.
- Owner reported live admin Moderation link after intended role update.
- Latest Atlas screenshot showed Active broad access with one-week temporary expiry for friend testing.
- This playbook explains the implemented setup rather than treating historical plans as completion evidence.

### Still to verify or improve

- Exact Atlas access expiry and long-term restricted networking decision.
- Full live admin mutation walkthrough and teacher/report scenarios in the browser.
- Full mobile/keyboard/accessibility testing across devices.
- Confirm saved production CLIENT_URL/NODE_ENV and platform-specific proxy/rate-limit behavior.
- Globally shared rate limiting; current counters are per process/function instance.
- Password recovery/email verification and token revocation if required.
- Backups, monitoring, audit history, concurrency/partial-failure recovery and orphan-image cleanup.
- Fresh source package/extraction rehearsal; older ZIP is not the final latest package.
- College report/PPT or personal submission details if required; they were not completed merely by deploying the app.

Friends' feedback can reveal additional bugs. A successful test record is evidence for those tested flows, not a guarantee of every device or future service configuration.

## 23 References

These vendor pages informed setup; interface labels, availability and plan limits can change. Our screenshots and test outputs establish what happened in this session.

- Vite setup: https://vite.dev/guide/
- Express installation: https://expressjs.com/en/starter/installing.html
- Atlas free cluster: https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/
- Atlas connection: https://www.mongodb.com/docs/atlas/connect-to-database-deployment/
- Atlas IP access lists: https://www.mongodb.com/docs/atlas/security/ip-access-list/
- Atlas document editing: https://www.mongodb.com/docs/atlas/atlas-ui/documents/
- Atlas filters: https://www.mongodb.com/docs/atlas/atlas-ui/query/filter/
- Vercel Express support: https://vercel.com/docs/frameworks/backend/express
- Vercel rewrites: https://vercel.com/docs/rewrites
- Vercel pricing/limits: https://vercel.com/pricing
- Cloudinary credentials: https://cloudinary.com/documentation/developer_onboarding_faq_find_credentials

For this source tree, read PLAYBOOK.md for the full journey, README.md for startup, docs/API.md for endpoints and actual source/tests when precise behavior matters. Historical checkpoint files retain earlier failures and should be read chronologically; do not mistake an old pending note for the latest verified result.
