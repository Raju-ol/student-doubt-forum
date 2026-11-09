# Colleges and feed scopes — 9 November 2026

Institution catalogue stores name, unique slug and optional country code. Admins
can add records from /admin/catalog. isVerified is always false on creation;
client-supplied verification flags are ignored. There is no verified-domain,
moderator delegation, private campus access or auto-enrolment system.

Signup/profile can optionally select a college. This is explicitly self-reported
public discovery metadata. A question inherits the poster's selected college,
unless institution=null explicitly requests worldwide-only. Supplying another
college ID in a post cannot override the poster's selection. Editing preserves
the original question college. Changing profile college changes future posts and
default feed, not the scope of old posts.

Feed scope values:

- college: authenticated user's selected college only; default for members with a
  college. Requires a selection, otherwise a clear error.
- subject: selected subject worldwide, requires subject query parameter.
- all: everything, default for anonymous/independent learners.

All posts remain public by direct link and worldwide feed. Scopes are not access
controls. Subject, academic and status filters compose with each scope. Index on
institution/date supports college filtering. UI wraps filters on mobile.

GET /institutions returns at most 500 public catalogue records. Admin-only POST
/admin/institutions accepts name/slug/country. No real college was added by the
agent; owner must add the desired institution and select it in their profile.

`migrate-institutions.js` requires an explicit database, existing institution and
JSON file of specifically selected user IDs. Dry-run is default; apply requires
backup/paused-write confirmations and production owner approval. It only fills
missing fields for selected, non-deleted users without a different existing
college, and their legacy unassigned questions. Explicit null/worldwide and
existing college values are preserved. Idempotent reruns support partial resume.
Never assigns all existing users or guesses affiliation from email addresses.

75 tests/build pass. Disposable DB tests cover catalogue permissions/unique slug,
ignored verification claims, college/default/worldwide/subject feeds, forged post
college input, invalid scopes, profile switching and guarded dry-run/idempotent
mapping with explicit-global preservation. No production migration or real
institution membership verified. No restored production-copy test or high-load
feed test. Migration changes multiple documents without a transaction; take a
backup and pause writes before approved execution.

Live public institution catalogue returned 200 with zero records. Mobile scope controls default Everything for anonymous visitors; subject-worldwide plus academic filtering returned the existing question. No user affiliation changed.

