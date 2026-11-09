# Materialized reputation

9 November 2026. Implements recommendations section 3.4.

Profiles now read a stored User.reputation instead of fetching every answer vote into Node. Signup initializes it to zero. Legacy accounts use null/missing as an explicit backfill marker and initialise lazily before reading/changing their score; this preserves existing points without requiring an immediate live migration. Reputation remains signed, including negative values, to preserve existing behavior.

Vote add/remove/switch applies the difference in credits using atomic $inc. Compare-and-set vote updates reject conflicts rather than awarding an increment for a mutation that did not happen. Acceptance switching reverses the previous author's credit and awards the new one; a conditional question update rejects a stale acceptance change. Answer deletion reverses vote and acceptance credits only for the request that actually removes the answer. Question/report deletion reuses that helper.

Reconciliation uses a MongoDB aggregation with grouped vote credits rather than returning raw vote documents. server/src/reconcile-reputation.js defaults to dry-run and requires an explicit database. Apply requires --apply and --confirm-writes-paused. Run from server after configuring its private .env:

    node src/reconcile-reputation.js --database=student_doubt_forum

After taking a backup and pausing all application writes, explicitly approved application:

    node src/reconcile-reputation.js --database=student_doubt_forum --apply --confirm-writes-paused

No production backfill has been run. Do not run an apply pass alongside active writes. Lazy initialization avoids forcing this operation at deployment.

## Limits

No multi-document transaction was introduced: a process crash between content mutation and score increment can cause drift, and concurrent vote/accept versus deletion still needs a transactional deployment/maintenance design for strict consistency. Reconciliation repairs drift. Concurrent increment safety is improved but is not a claim of full linearizability across collections. Live load/concurrency tests and production backfill are not verified.

Tests cover current credit transitions, acceptance switch/removal, deletion reversal, missing-field historical backfill and concurrent initialization. Each change runs the full suite and production build; exact final results are recorded in docs/TESTING.md.
