> Historical handover. Start with [CURRENT_STATE](docs/CURRENT_STATE.md), [INDEX](docs/INDEX.md) and the [design review](docs/DESIGN_CONSISTENCY_REVIEW.md). Earlier setup and cleanup instructions are not authorization to rerun them.

# Shaam ko yahan se continue karein

> **Status update 13 November 2026.** Code reference: `main` at `d56cec9` is live. Two branches are pushed to GitHub but **not merged or deployed**: `feat/design-v3` (`ca187ed`, the sidebar redesign and resource library) and `fix/review-bugs` (`deb4702`, built on the redesign, with the bug fixes). Details: [Design v3 change record](docs/DESIGN_V3_CHANGE_RECORD.md), [Bug fix report](docs/BUG_FIX_REPORT.md), [Polish plan](docs/POLISH_PLAN_NOV_2026.md).

The notes below are from the 9 November 2026 deployment checkpoint and are historical. Start at [Continue here](docs/CONTINUE_HERE.md).

**Current handoff, 10 November 2026.** Start at [Continue here](docs/CONTINUE_HERE.md) and [project context](PROJECT_CONTEXT.md). The notes below reflect an earlier checkpoint.

Saved: 9 November 2026 (Asia/Calcutta). User requested stopping now and resuming in the evening. Do not continue deployment work until the user resumes. No reminder was requested.

## Resumed update
LATEST IMAGE CHECK: User configured CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET privately in Vercel Production and redeployed b6df8c6 (deployment visible as 528NWg1GQ...). scripts/live-upload-smoke.js passed against public website: real Cloudinary upload/delivery, unused deletion, attachment linkage/protection, and question deletion with remote-image cleanup. Temporary question/images removed; one QA image-test account remains. Do not repeat Cloudinary credential setup. Still pending: durable network access decision (current allowlist entry is temporary), user's real live account/admin authorization, full browser/mobile QA and final packaging. Working-tree docs and resume notes are not all committed; do not accidentally stage private .env.
LATEST: User screenshots confirm temporary 0.0.0.0/0 entry Active with expiry, and Vercel production commit b6df8c6 Ready. Live smoke script completed successfully: database health, two signups/login/me, anonymous-write rejection, question, second-user answer, vote, acceptance, comment, search, reputation and non-admin access denial. Temporary discussion removed; two clearly named QA test accounts remain. Do not claim browser/device/image/admin mutation coverage from this API test. Next: Cloudinary private credentials and real upload/deletion verification, production origin, live administrator setup if authorized, browser/mobile acceptance, durable network setup before 6-hour access expiry. Do not repeat initial DB troubleshooting unless a new failure occurs.
User resumed, reported saving readWrite privilege after removing Atlas admin. Guided already-authorized 6-hour temporary 0.0.0.0/0 entry; user said next but active state/expiry not yet screenshot-verified. Live health intermittently returns 200 while doubts API returns 500; full smoke tests stopped at health before creating accounts. Likely initial index authorization failure from URI missing database name (inference, not confirmed by live logs). Added safe diagnostic codes (commit 0a4eccc pushed). Added explicit application dbName and disconnect-on-initialization-error locally; run verification and push next. User may need to redeploy latest main if automatic deployment is not updating production. No successful live signup or image flow established.

## Current application
- Local full implementation and Vercel adapter prepared.
- GitHub: https://github.com/Raju-ol/student-doubt-forum
- Latest pushed commit: be4ca52 (Vercel frontend and API deployment).
- Public website: https://student-doubt-forum-theta.vercel.app/
- Vercel reported successful deployment, but live API health check returned HTTP 503: database connection unavailable. Do not describe the full application as live-working yet.
- Local verification: production frontend build passed; latest integration run reported 27 passes (26 subtests plus parent).
- Cloudinary integration and full live student/admin/image flows remain pending.

## Private configuration
- User entered MONGO_URI and JWT_SECRET in Vercel. Actual values must not be requested in chat or screenshots.
- Credentials were accidentally shown earlier. User reported database password change; new JWT key was generated privately in local server/.env and user reported updating Vercel. Values are not copied here.
- Verify privately later that MONGO_URI includes the intended student_doubt_forum database name. Environment changes require redeployment to affect an existing deployment.

## Exact stopping point in Atlas
- Existing free Cluster0 is being used. Do not create a paid cluster or delete existing data.
- Atlas IP Access List screenshot showed only the user's current laptop IP allowed. Vercel network access is not configured.
- User explicitly approved TEMPORARY Allow Access from Anywhere for testing after risk explanation. This has NOT been applied/verified. Prefer a temporary expiry and plan to remove/restrict it after testing; do not infer authorization for permanent broad network access.
- Before network access, we are reducing the existing database user's privileges. Original role was atlasAdmin across all resources.
- User's latest screenshot: Edit Database User dialog, Built-in Role says 1 selected; Specific Privileges expanded, blank Select Role/Database/Collection row.
- Last instructions sent: choose specific role readWrite, database student_doubt_forum, leave collection blank; remove existing Atlas admin built-in role so 0 selected; save/update user.
- User has NOT confirmed that these changes were saved. On resumption, first confirm the saved role state; do not assume completion or click/save an uninspected dialog.

## Next actions after user resumes
1. Verify intended database user's role is readWrite on student_doubt_forum, without the old broad admin role. Keep passwords hidden.
2. Guide the already-authorized temporary network entry, with expiry if supported. Preserve the existing laptop entry. Verify active state.
3. Recheck live /api/v1/health. If still 503, diagnose private URI/password/environment/redeployment; never print credentials. Do not broaden permissions blindly.
4. Verify live two-user signup/question/answer/vote/accept/search/reload/logout flows.
5. Finish Cloudinary configuration, upload/deletion verification, production origin settings, admin setup with specific authorization, mobile verification and final delivery.

## User communication
Use short Hinglish instructions, one small step at a time. User is a complete beginner and found long setup sequences confusing. When they resume, read this file first rather than restarting setup.
