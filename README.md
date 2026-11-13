# Doubt Forum

A student Q&A application with a separate public study-resource Library, built with React/Vite, Express and MongoDB.

## Current version

Reviewed 13 November 2026 against GitHub `a0a45eb`, with local corrections on `fix/design-consistency`. The app uses a sidebar dashboard, peach Light and purple Dark themes, plus Auto following the device.

- Students ask questions, optionally anonymously, answer/comment, vote, accept answers, save questions on-device and receive notifications.
- The resource Library supports categories, search, HTTPS links, supported document uploads, a teacher shelf and download-request counts.
- Teachers request admin verification, select subjects, use a teaching dashboard and endorse answers. Their status does not grant admin access.
- Moderators review reported content. Admins manage users/roles, teacher requests, catalogue, overview, audit and the site announcement.
- Google sign-in, Gmail recovery, Cloudinary storage and shared Redis limits depend on the intended deployment configuration.

The institution/course/class/subject/chapter Library with scoped teacher permissions and publication review is planned. It is not implemented by the current community resource Library.

Live website: https://student-doubt-forum-theta.vercel.app/

## Run locally

Requirements: Node 22.12+ and MongoDB. Preserve existing private configuration.

1. Run `npm ci`.
2. For a new setup only, copy `server/.env.example` to `server/.env`. Set a local `MONGO_URI`, a cryptographically random private `JWT_SECRET` and the intended client URL. Never paste secrets into documentation.
3. Run `npm run dev:server` and `npm run dev:client` in separate terminals. Vite proxies API calls to the local backend.
4. Alternatively, run `npm run build` then `npm start` to serve the compiled app with Express.

## Verification

`npm test` runs unit, component and API/database tests. Use an isolated localhost MongoDB; some existing tests assume port 27017. Tests create and remove disposable test databases. Never supply the production connection string.

The baseline and initial post-fix suites each passed all 162 tests. Build and local browser results, their environment and remaining limits are recorded in [design review](docs/DESIGN_CONSISTENCY_REVIEW.md) and [testing](docs/TESTING.md). No local result alone verifies live provider delivery or production readiness.

Optional local browser checks: install Playwright without changing dependency files, build the app, start isolated localhost MongoDB, then run `node scripts/design-review.mjs`. See the review for details and output paths. Playwright is optional test tooling, not an application dependency.

## Documentation

Start with [current state](docs/CURRENT_STATE.md) and the [documentation index](docs/INDEX.md).

| Need | Document |
| --- | --- |
| Architecture and feature boundaries | [Current state](docs/CURRENT_STATE.md), [project context](PROJECT_CONTEXT.md) |
| API contract and newer endpoints | [API notes](docs/API.md) |
| Shared two-person manual checklist | [Tester playbook](docs/TESTER_PLAYBOOK.md) |
| Verification and design corrections | [Design review](docs/DESIGN_CONSISTENCY_REVIEW.md), [testing](docs/TESTING.md) |
| Admin operations | [Admin guide](docs/ADMIN_HINGLISH.md) |
| Institution-based Library blueprint | [Library plan](docs/STUDY_LIBRARY_AND_DASHBOARD_PLAN.md) |
| Continue development | [Handoff](docs/CONTINUE_HERE.md) |

Historical change records preserve their dates and original evidence. Current code and executed checks take precedence over document dates. Keep implemented features, proposals, local tests and live checks distinct.

## Release and data rules

Use a feature branch and reviewed preview before production publication. Verify the intended release after deployment and keep rollback instructions available. Do not reset production data, reimport sample questions, alter cloud configuration or disclose credentials as part of normal testing. Resource publication is currently public community sharing; use the institution Library plan before implementing restricted academic publishing.
