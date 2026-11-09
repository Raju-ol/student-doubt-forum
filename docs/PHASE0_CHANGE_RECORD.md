# Phase 0 change record — Recommendations quick wins

Date: 9 November 2026. Source: `RECOMMENDATIONS.md` §8 "Phase 0", §6.3 (CI) and §3.3 (indexes).
Scope chosen by the user: "Phase 0 + quick wins" only. No feature behaviour was changed.

## 1. Database indexes added (§3.3)

File: `server/src/models.js`. Nine indexes added; nothing was removed or renamed.

| Collection | Index | Why |
|---|---|---|
| Doubt | `{ subject: 1, createdAt: -1 }` | Feed filtered by subject |
| Doubt | `{ semester: 1, createdAt: -1 }` | Feed filtered by semester |
| Doubt | `{ tags: 1, createdAt: -1 }` | Feed filtered by tag |
| Doubt | `{ acceptedAnswer: 1, createdAt: -1 }` | Feed filtered by solved/open status |
| Doubt | `{ author: 1, createdAt: -1 }` | Profile page question list |
| Answer | `{ author: 1, createdAt: -1 }` | Profile page answer list |
| Comment | `{ answer: 1, createdAt: 1 }` | Comments load once per answer on every question detail view; this collection previously had no index at all |
| Report | `{ status: 1, createdAt: -1 }` | Admin moderation queue (`status: 'pending'`) |
| Upload | `{ owner: 1, doubt: 1 }` | Unused-upload count check before each image upload |

Deviation from the recommendation: `RECOMMENDATIONS.md` §3.3 says the existing
`{ createdAt: -1 }` index on `Doubt` becomes redundant. It does not. The unfiltered feed
sorts by `createdAt` with no filter field, and a compound index cannot serve that query.
It was therefore kept, with an explanatory comment.

Indexes are created by the existing `model.init()` call in `server/src/database.js`, so they
build automatically on the next connection. No migration script is required. On the live
Atlas cluster the first connection after deploy will build them; the data volume is small,
so this is expected to be near-instant and non-blocking.

## 2. Continuous integration (§6.3)

New file: `.github/workflows/ci.yml`. Runs on every push and pull request:

- `test` job: MongoDB 7 service container with a health check, Node 22.12 with npm cache,
  `npm ci` → `npm run build` → `npm test`. The suite's existing `MONGO_TEST_URI` support is
  used, so it creates and drops its own uniquely named throwaway database.
- `audit` job: `npm audit --audit-level=high`.

New file: `.github/dependabot.yml`. Weekly grouped npm updates (max 5 open PRs) and monthly
GitHub Actions updates.

The CI secret `JWT_SECRET` in the workflow is a throwaway literal used only by the test
database. It is not a real credential and is not used by any deployment.

## 3. LICENSE (§7, §10) — NOT DONE YET

The user chose the **MIT** licence but asked to supply the copyright holder name later.
`LICENSE` has therefore not been created. Until it exists the repository is
all-rights-reserved and no other college may legally use or deploy it. This remains the
single largest open item from §10.

## Verification run on this change

- `npm run build`: passed (Vite production build, 42 modules).
- `npm test`: 29 passes, 0 failures, against a temporary local MongoDB database.
- Index creation confirmed by listing `collection.indexes()` on a throwaway database — all
  nine new indexes present with the expected names.
- `explain('queryPlanner')` confirmed on a throwaway database that the subject, semester,
  tag, solved-status, profile-questions, profile-answers, comments-of-answer and
  moderation-queue queries all resolve to `IXSCAN` rather than a collection scan.
- Pushed as commit `a8a9975`. GitHub Actions run 42596996998 completed **successfully**:
  the `test` job (checkout, setup-node, `npm ci`, `npm run build`, `npm test` against the
  MongoDB 7 service container) and the `audit` job both passed every step. Dependabot read
  its configuration and opened its first update runs on the same commit.

## Not verified
- Index behaviour on the live Atlas cluster (different data, different plan cache) has not
  been observed. Re-check with `explain()` there after deploying.
- Nothing in this change was exercised in a browser. No UI, API response or user-visible
  behaviour was modified.
- The other Phase 1 items from `RECOMMENDATIONS.md` (feed aggregation §3.1, text search
  index §3.2, reputation counter §3.4, distributed rate limiter §3.5) are untouched. The
  feed still issues roughly 60 queries per page and search still runs an unindexed regex
  scan — the indexes added here do not help either of those.
