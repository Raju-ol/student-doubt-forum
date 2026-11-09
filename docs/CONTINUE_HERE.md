# Student Doubt Forum — current handoff

Updated 9 November 2026. Read this before older plan/history files. Code is the
authority; some historical sections intentionally describe earlier versions.

## Owner return checklist (simple Hinglish)

Code wala kaam neeche listed scope tak complete hai. Ab aapki taraf se:

1. **Email provider:** Resend account aur verified sending domain chahiye.
   Abhi EMAIL_ENABLED off hai, isliye normal posting chal rahi hai. Domain/card
   purchase nahi kiya gaya. Setup ke waqt keys sirf Vercel mein privately enter
   karni hain. Details: [email setup](EMAIL_CHANGE_RECORD.md).
2. **Apna college:** Moderation > Manage subject catalogue > Colleges mein real
   college add karein; phir Edit profile mein select karein. Agent ne koi fake
   college ya automatic membership assign nahi ki. College choice self-reported
   hai; private/verified college access nahi hai.
3. **Atlas expiry:** Last observed 0.0.0.0/0 rule temporary one-week tha. Expiry
   dashboard mein check karna zaroori hai; expire hua to database connection
   rukega. Agent ne rule ko permanent/extend nahi kiya. Durable network access
   ka decision owner ke saath separately karein.
4. **Friends ka real test:** signup, post, image, reply, vote, accept, notification,
   light/dark and mobile test karwa sakte hain. Production deletion/recovery
   tests sirf specifically chosen disposable account par karein. Apna admin
   account delete mat karein; endpoint bhi ownership transfer maangta hai.
5. **Migrations optional/pending:** Existing records compatibility se chal rahe
   hain. Production backfill/assignment run nahi hua. Backup, restored-copy test,
   reviewed user mapping, paused writes and explicit approval ke baad hi apply.

Passwords, JWT_SECRET, database URI, Cloudinary/Upstash/Resend tokens chat,
screenshots, git or this document mein paste na karein.

## What is implemented

| Area | Current behavior / evidence |
|---|---|
| Reputation | Stored deltas, legacy lazy initialization, dry-run reconciliation; multi-document crash/concurrency drift remains a documented limit |
| Sessions | tokenVersion, Sign out everywhere, reset revokes sessions |
| Mongo pool | maxPoolSize 2 per warm instance; not a fleet-wide limit |
| Search | Weighted title/body/tags text index; stemmed words, not arbitrary substrings |
| Rate limits | Shared Upstash API/IP, auth/IP + normalized email, uploads/account. Redis error => safe 503, no per-instance production fallback |
| Email | Hashed one-use verification/reset links and UI; **disabled until owner sets provider/sender** |
| Data controls | Private NDJSON export; password + DELETE confirmation; owned-image cleanup and anonymous account tombstone |
| Themes | System/light/dark, persisted preference, centralized palette, selected contrast checks; mobile live check |
| Notifications | Private bell/inbox for answer/comment/first acceptance; read-one/read-all, no self alerts |
| Tabs | Profile/Admin keyboard tablists, roving focus, panels; real DOM test |
| Academic levels | Optional semester/year/grade/other; legacy semesters compatible; guarded migration |
| Subjects | Mongo catalogue, 30 initial entries, unique aliases, stable icons, admin additions; guarded question migration |
| Colleges | Optional self-reported selection, admin catalogue, college/subject-worldwide/all public feeds; explicit-user migration |

## Validation snapshot

- Local **75 tests pass**, production build passes, npm audit reports **0 vulnerabilities**.
- CI for final code commit c6e559a: [run 42612388866](https://github.com/Raju-ol/student-doubt-forum/actions/runs/42612388866)
  succeeded for Node 22, Node 24 and audit. Vercel reports deployment completed.
  This validation record is a documentation-only follow-up to that code commit.
- Live health returned database connected + rateLimitStore=redis; protected feed
  returned 200. Subjects returned 30; institutions returned 0; all-feed 1 existing
  question at the time of check. These counts are observations, not fixed limits.
- Live mobile signup has optional academic controls and self-reported college;
  subject-worldwide + semester filter returned the existing legacy Semester 5
  question. 390px viewport had 375px content/scroll width, no horizontal overflow.
- Dark feed/mobile and reload persistence checked, restored System afterwards.
  Markdown preview had a CSS hidden-control bug, fixed and live-verified with
  maths/code. Unsent draft cleared; no public QA question posted.
- User-approved QA Markdown Browser test account remains in production. Do not
  delete it without applicable action-time approval.
- No real email sent, production account deleted, private export downloaded,
  admin role/content mutation exercised during this batch, or production data
  migration applied. Cloudinary account-deletion flow uses a test adapter.
- Multi-document operations are not transactional; no complete load, backup
  restore, screen-reader, legal-compliance or every-screen dark-theme audit.

## Architecture and important files

React 19/Vite frontend: `client/src/main.jsx`, `pages.jsx`, shared `components.jsx`,
`account-pages.jsx`, `notifications.jsx`, `catalog-page.jsx`. Auth context uses
sessionStorage JWT; theme preference alone uses localStorage.

Express API: `server/src/app.js` under /api/v1. Feature routes/helpers are split
into email.js, account.js, rate-limits.js, notifications.js, academics.js,
subjects.js and institutions.js. Mongoose schemas in models.js. Vercel wraps the
app with api/index.js; database.js reuses the connection and builds indexes.

Keep `decorateMany` for lists; do not restore per-item vote/count queries.
Markdown stays lazy and sanitized last. markdown.js must remain Node-importable;
styles live in markdown-view.js. Use fileURLToPath for Windows Unicode paths.
Do not remove the unfiltered question createdAt index. Test Node 22/24 latest
patches because jsdom requires recent releases, even though runtime minimum is
older. CI test shell must preserve pipefail.

## Private deployment variables

Existing: MONGO_URI, JWT_SECRET, CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET.
Shared counters: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (owner reported
saving both for Production/Preview; live Redis connectivity verified).
Email activation later: APP_URL, RESEND_API_KEY, EMAIL_FROM, EMAIL_ENABLED=1.
No secret may use VITE_ prefix. Example names only in server/.env.example.

## Migration commands — dry-run only examples

Run from the `server` folder with its private .env configured. Replace COPY_DB
with a disposable restored copy first. These commands do not imply approval for
production writes.

```powershell
node src/reconcile-reputation.js --database=COPY_DB
node src/migrate-academic-levels.js --database=COPY_DB
node src/migrate-subjects.js --database=COPY_DB
node src/migrate-institutions.js --database=COPY_DB --institution=REVIEWED_ID --user-ids-file=REVIEWED_JSON_PATH
```

Subject catalogue must exist before subject migration. Institution migration
requires an existing institution and a JSON array of specifically reviewed user
IDs. Explicit nulls/new values are preserved. Apply flags and limitations are in
each change record. Never infer all users belong to one college.

## Work still outside this batch

Real sender/domain activation and inbox tests; durable Atlas networking;
production-copy migration/reconciliation review; mentions, email digest, Web Push;
institution domain verification/private access; subject editing/typeahead and a
larger catalogue; robust deletion/outbox cleanup workers; comprehensive load and
accessibility audits. Do not label the whole original recommendations document
complete—only the implemented handoff scope above.

## Continuing development

The owner authorized autonomous commits/pushes in the current session. Main pushes
deploy Vercel without waiting for CI. Run relevant tests/build first and stage
specific files. This historical handoff is context, not a substitute for user
authorization in another session. Preserve local untracked PLAYBOOK.md,
RESUME_HERE.md, existing local guides/scratch scripts. Never run scratch scripts
blindly. Do not widen Atlas access or run destructive production migrations
without explicit approval.

Detailed change records are linked from RECOMMENDATIONS.md and docs/TESTING.md.
