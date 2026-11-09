# Subject catalogue and aliases — 9 November 2026

Subjects now come from a MongoDB Subject collection and GET /subjects, not a
client array. There are 30 initial subjects spanning science, computing,
engineering, medicine, humanities and commerce. This is a starter catalogue,
not the proposed hundreds of institution-specific subjects.

On first catalogue use, idempotent `$setOnInsert` upserts add default subjects.
This is an automatic additive catalogue initialization; existing questions are
not migrated or rewritten. Names and aliases normalize Unicode, whitespace and
case into a unique multikey lookup index. An alias cannot be reused by another
subject. Slugs are unique and icons belong to catalogue records, not array order.

Known post subjects resolve to canonical name + subjectId. Feed filters accept
aliases and include both canonical IDs and exact case-insensitive legacy names.
Legacy unknown free-text API subjects remain accepted/readable for compatibility;
the UI presents the catalogue and preserves an existing unknown edit value.
Normalization of arbitrarily spaced legacy text requires the migration.

Admin > Manage subject catalogue can add names, aliases, fields and a slug.
POST /admin/subjects is admin-only. There is intentionally no destructive delete
or automatic renaming of existing subjects. GET /subjects is public, capped at
500 records. Regular users do not administer the catalogue.

`migrate-subjects.js --database=...` is dry-run by default. It requires the
catalogue to exist, only fills missing subjectId, reports unknown names, and
does not seed/write during dry-run. Apply requires explicit backup and paused
writes confirmations, a tested database copy, and owner approval for production.
No production question migration run.

74 tests/build pass. Tests cover idempotent seeding, permissions, alias collision,
canonical post/filter, legacy aliases and non-mutating/idempotent fixture
migration. Live admin mutations and restored production-copy migration are not
tested. No per-institution subjects, user-created aliases or catalogue editing
workflow yet. Large catalogue search/typeahead remains future work.

Live catalogue returned 30 subjects. Mobile dropdown and Data Structures filtering verified; initial catalogue seed is additive and existing question content was not rewritten.

