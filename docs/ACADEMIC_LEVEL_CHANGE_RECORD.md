# Optional academic levels — 9 November 2026

User and question can now have an optional academicLevel `{system,index,label}`.
Supported systems: semester, year, grade, other. Numbered systems accept 1–30;
other accepts a 1–60 character label. The API derives numbered labels, ignores
unknown nested fields, and accepts explicit null to clear. Missing level is valid
for signup/question creation. Existing semester=1–8 clients remain supported;
new semester values <=8 also mirror the old field for old filters.

Signup/profile/question forms use optional academic controls. Cards/profile/detail
show a level label with a legacy semester fallback. Feed filters use academic
system and optional number. Legacy semester URLs still work. A new compound index
covers academic system/index/date; old indexes remain.

`server/src/migrate-academic-levels.js` defaults to dry-run, requires an explicit
database, and only fills missing academicLevel from legacy semester. It never
overwrites explicit null or new values, deletes data, or removes semester. Apply
also requires --confirm-backup and --confirm-writes-paused. Production execution
still needs the owner's explicit approval and a tested copy/backup. None run.

73 tests/build pass. A disposable database with legacy/new fixture records checks
optional signup, year-based post, filters, legacy display/filter, validation,
dry-run non-mutation, idempotent apply and non-overwrite. This fixture test is not
a restored production-data copy test. Large migration runtime/load and every
browser form combination remain unverified. Existing production data is read
compatibly without needing a migration immediately.

GET /doubts supports academicSystem and academicIndex. Signup, PUT /users/me and
question POST/PUT accept academicLevel in addition to legacy semester.
