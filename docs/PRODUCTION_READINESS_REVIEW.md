# Production readiness review and remaining work

Reviewed 10 November 2026. This is a source review plus local automated
verification and limited read-only live checks. It is not a certification that
every browser flow, failure scenario or provider setting has been tested.

## Decision

The application has a substantial working beta. Keep the current release as a
limited friends/tester beta while the launch gates below are completed. A
successful Vercel build does not establish email delivery, backup recovery,
concurrent-write integrity or complete cross-user behavior.

Owner asked to postpone manual testing and database migration work. Neither was
silently treated as completed. No live database migration, account deletion,
paid service purchase, sender activation or network-policy change was made in
this review.

## What exists already

- Signup/login, bcrypt passwords, bearer sessions, ban checks and sign-out on all
  devices. Role changes are restricted; clients cannot grant themselves admin.
- Questions, answers, comments, votes, accepted answers, reports and moderation.
- Markdown, highlighted code and maths; validated Cloudinary screenshot uploads.
- Search, tags, academic levels, subject catalogue and optional college feeds.
- Private in-app reply/comment/acceptance notifications and read state.
- Account settings, private data export and anonymized account deletion.
- System/light/dark cycling, responsive navigation and keyboard-accessible tabs.
- Shared Upstash rate limiting, safe connection diagnostics and automated CI.
- Password reset and email verification implementation. Owner reported a real
  owner-only reset/new-password/login cycle working. This is not proof that
  recovery is enabled for every user's address.

Architecture: React/Vite client -> same-origin Vercel `/api/v1` -> Express ->
MongoDB Atlas. Cloudinary stores uploaded images, Upstash stores rate counters,
and Resend delivers configured transactional email. A custom web domain is
optional; a verified sending domain is needed to send recovery mail broadly.

## Fixed during this review

| Finding and evidence | Change | Verification |
| --- | --- | --- |
| Live `/` and `/login` lacked CSP, nosniff and referrer policy; API Helmet did not cover Vercel static HTML. | Added Vercel-wide security headers, self-only scripts, no framing and restricted external resources. | Config regression and post-deployment read-only probe. |
| API responses did not explicitly prohibit storage. No cache leak was demonstrated. | Added private/no-store to Express API and serverless initialization responses, plus deployment rule. | Empty/invalid request tests and deployment probe. |
| Local reproduction: user HTML span retained `position:fixed` styles and could cover controls. | Escape raw HTML before final DOMPurify; preserve generated KaTeX styles. | Overlay regression, injection corpus, maths and code tests. |
| Connection promise remained fulfilled after a later disconnect. | Share only in-flight initialization; reconnect after disconnect and retry failures. | Fake-driver concurrent initialization, disconnect and failure tests. |
| Account lookup database errors became 401, causing valid sessions to be discarded. | Token errors remain 401; lookup failures become 503. | Mocked database-failure regression. |
| Missing JSON bodies could cause property-access 500s. | Normalize missing bodies and reject non-object bodies safely. | Empty, array, null and malformed JSON return 400 with no-store. |
| Blocked browser storage could crash startup/login/logout. | Storage access is guarded; current-tab React state can still work. | Throwing storage getter and normal save/read/remove tests. |
| One email switch coupled password recovery with mandatory verification for posting. | Added separate recovery and verification switches; retained legacy compatibility. | Local reset/login/post flow without mandatory verification. |

Content writes also now have per-account limits: 120 mutations per 15 minutes,
plus 60 question/answer/comment creations per hour. Existing stricter upload,
email and account-operation limits remain. Auth routes are excluded from these
content limits. An integration regression verifies 429/Retry-After and account
isolation using local requests; existing shared-store tests cover Redis scope
isolation. These limits reduce abuse but do not prevent multi-account spam.

These fixes do not turn multi-document mutations into transactions or introduce
durable background jobs. See open development work below.

## Launch gates: owner/provider work

### 1. Durable database connectivity — required before general public launch

The latest owner screenshot shows `0.0.0.0/0` with a one-week expiration. After
expiration Vercel may lose connectivity. It also permits network connections
from all IPv4 addresses; credentials and database grants remain separate checks.
Do not silently convert this temporary rule into permanent broad access.

Owner must choose the long-term deployment/network approach and its budget.
Domain purchase does not solve Atlas outbound-IP restrictions. Current Vercel
Hobby egress cannot be assumed to have a fixed address. Until a decision, track
the actual expiration in Atlas and keep the service labeled beta.

Use a database user scoped to `readWrite` on `student_doubt_forum`; avoid Atlas
admin for application runtime. Verify the actual current role privately. Earlier
screenshots included an admin role, so do not infer least privilege from a
later successful connection.

### 2. Password recovery for everyone — required before general public launch

The `resend.dev` sender is for account-owner testing. Current owner-only success
does not cover friends' addresses. Configure a verified sending domain in Resend
and its DNS records, then a sender on that domain. Website hosting can remain at
the Vercel URL. Do not paste API keys, reset links or passwords in chat/docs.

Suggested staged configuration, after delivery is verified:

```dotenv
EMAIL_ENABLED=0
EMAIL_RECOVERY_ENABLED=1
EMAIL_VERIFICATION_REQUIRED=0
```

Keep `APP_URL=https://student-doubt-forum-theta.vercel.app` and configure private
`RESEND_API_KEY` and `EMAIL_FROM` in Vercel Production. Remove the test-recipient
restriction when moving to the verified sender. Redeploy after env changes.
Verify delivery/reset with an ordinary non-owner account before advertising it.
Later set `EMAIL_VERIFICATION_REQUIRED=1` only after verification delivery and
the existing-user rollout are ready. Legacy `EMAIL_ENABLED=1` still activates
both functions. No live switches were enabled by this review.

### 3. Backups and restore — required before relying on real data

Choose a private encrypted backup destination, schedule, retention and owner.
Confirm Atlas tier capabilities; do not assume free-cluster cloud backups.
Start with a documented export/backup procedure appropriate to the actual tier,
then restore a copy into a separate database. Define acceptable data loss and
recovery time. Never test a restore over the live database or commit dumps.
Cloudinary originals and provider configuration need their own recovery plan.

### 4. Separate staging and safe releases — required before routine production changes

Preview and production must not casually share the live MongoDB dataset,
Cloudinary assets or mail recipients. Current database name is hardcoded to
`student_doubt_forum`; a different URI on the same cluster alone is not enough
to isolate a different database name. Provision separate staging resources or
explicit database-name configuration, verify isolation, then run destructive QA.

Git pushes currently trigger Vercel deployments independently of GitHub CI.
Choose branch protection and a release process that requires passing checks
before production promotion. Do not disable the existing deploy path without
a tested replacement. Preserve a known-good deployment for rollback; a code
rollback does not reverse data changes.

### 5. Operational ownership and user information

Set an uptime alert and error-monitoring destination; decide who responds.
Publish an accurate privacy/retention policy, terms and support contact based
on the owner's decisions. Do not invent legal assurances. Enable provider MFA
privately. If a real owner password was shared with an external tester, rotate
it and use sign-out everywhere; completion has not been confirmed.

## Open development work, in order

| Priority | Work | Why / completion evidence |
| --- | --- | --- |
| High | Make vote/reputation/acceptance/delete effects recoverable and consistent. | They span multiple writes. A crash after one write can leave scores/cleanup inconsistent. Use replica-set-tested transactions for MongoDB work and a retryable saga/outbox for external effects. Prove concurrent requests and injected failures, not only sequential success. |
| High | Harden account-deletion concurrency and large-account cleanup. | Current Cloudinary loop runs before the tombstone; concurrent profile/content writes and interrupted cleanup need coordination. Introduce a deletion state, revoke access early, block new writes, bound/retry cleanup and prevent stale profile writes restoring identity. Preserve admin ownership safeguards. |
| High | Atomically claim attachments and recover orphaned uploads. | Ownership is checked, but question creation and attachment association are separate operations. Concurrent reuse and interrupted uploads need atomic claims/compensation and a safe orphan-retention policy. |
| Medium | Make notifications durable if reliable delivery is a product promise. | Notification insertion is best-effort after content changes. Add a deduplicated outbox/retry path; safely handle removed targets and retention. Current inbox is not push/email notification delivery. |
| Medium | Paginate answers/comments and bound exports/cleanup. | Question detail can load all replies; export and deletion can exceed serverless runtime/payload/memory limits for large accounts. Verify scale limits and provide pagination/background work. |
| Medium | Recover from lazy-renderer fetch failures and transient session-loading failures. | Raw text fallback exists, but failed module imports need an intentional retry path; a database outage should not look like permanent logout. |
| Medium | Improve request IDs, structured error visibility and moderation audit history. | Generic safe public errors exist, but operators need actionable correlation without secrets or private payload logging. |
| Medium | Review reset-link resend races and delivery failure handling. | A new reset hash supersedes the previous link before delivery completes; delayed/out-of-order messages can confuse users. Test races and provide clear retry guidance without account enumeration. |
| Later | Refactor dense page/API modules, drafts/navigation guards, richer search and notification preferences. | Maintainability/product improvements after launch gates; not reasons to buy extra services immediately. |

Database/network migration was explicitly deferred by the owner. The high-risk
transaction/job changes above are still open; they were not rushed into a
standalone-local-Mongo test setup and declared production-safe.

## QA and verification status

- Local baseline: 78 tests passed before changes.
- Revised suite: 86 tests passed, including the new regressions and independent
  public-recovery flow. Production build passed; production dependency audit
  reported zero known vulnerabilities at review time. This is point-in-time.
- Existing external QA is partial: 40 reported PASS, 98 BLOCKED, 23 NOT RUN;
  some PASS entries need corrected evidence. Read `QA_REVIEW_RUN01.md`.
- Owner reported recovery, college selection and notification flows working.
- An early read-only live health probe returned 503 while a subsequent feed
  request returned 200. Root cause was not established; do not attribute it to
  Atlas expiration or claim availability based on one successful request.
- Full cross-user, real-device, upload-provider failure, interrupted deletion,
  restore and concurrency evidence remains incomplete. Manual QA is postponed
  at the owner's request; this is an open release gate, not a silent PASS.

Commands for the next maintainer:

```sh
npm ci
npm test
npm run build
npm audit --omit=dev --audit-level=moderate
npm run check:production
```

Tests create/drop isolated `forum_test_*` local databases. Never set test Mongo
configuration to production. `check:production` makes four read-only requests;
it never signs in, creates accounts, uploads, deletes or prints response data.

## Owner's next session: short checklist

1. Read this document; keep the site in limited beta for now.
2. Tell the maintainer whether to obtain a sending domain now or defer public
   recovery. You do not need to buy a web domain just to keep testing.
3. Confirm Atlas access expiration and decide the durable networking budget.
4. Choose backup destination/retention and a support/alert contact.
5. Confirm password rotation/sign-out everywhere if a real password was shared.
6. Allow remaining high-priority data-consistency work and staging setup, then
   assign the existing tester playbook before public launch.

## Primary references

- Resend test-domain restriction: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
- Atlas cloud backup overview/tier requirements: https://www.mongodb.com/docs/atlas/backup/cloud-backup/overview/
- Vercel cache headers: https://vercel.com/docs/caching/cache-control-headers
- Vercel static outbound IPs: https://vercel.com/docs/networking/static-ips

Check provider documentation and account state again when making purchasing or
infrastructure decisions. This document contains no credentials.
