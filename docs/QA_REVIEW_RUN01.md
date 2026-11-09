# Review of external QA run-01

Reviewed 10 November 2026. Inputs: owner-supplied QA_SUMMARY.md,
QA_RESULTS.md and QA_BUG_REPORT.md. Originals/evidence remain unchanged and are
not published by this review. This document does not grant test permissions.

## Main conclusion

The report is useful exploratory evidence, not a complete certification. Its
161 unique case rows total 40 reported PASS, 98 BLOCKED and 23 NOT RUN (0 FAIL).
These totals add up, but some PASS observations cover only part of a case or a
different action. Do not interpret zero FAIL as proof the whole app is bug-free.

The tester had no shell and no independent student sessions. Local automated
checks and cross-user flows were therefore not verified in that run. Their
limited browser coverage must remain separate from developer automation and
the owner's earlier informal testing.

## SUSP-01: confirmed and fixed

The menu Escape listener was attached only to nav. Focus remains on the Menu
trigger immediately after opening, and that trigger is outside nav, so its
Escape event never reached the handler.

Added a real React/jsdom regression test; it failed before the fix with
aria-expanded=true instead of false. Moved the listener to the containing header
and handle Escape only when expanded. Escape now closes from trigger or a nav
link and returns focus to the trigger. A closed menu does not steal focus from
the theme button. No visual/menu-navigation behavior otherwise changed.

After the fix: npm test exited 0, **78 passed / 0 failed**; npm run build exited 0.
This is the developer's new run, not a result attributed to Claude's QA run.
Live retest follows deployment and must be recorded separately.

## Evidence problems to correct in the next QA run

| Case / section | Mismatch | Required action |
|---|---|---|
| Summary / data changed | Says read-only and no deletions in places, but QU12/AN09 and cleanup describe deletion tests | Rewrite summary to match actual mutations, preserving exact approved test targets |
| P0 summary | Says posting/answers not executed, while single-account QU01/AN01 actions are described | Distinguish single-account checks from missing cross-user P0 coverage |
| QU05 | Evidence describes editing, not text-only creation with no tags/images | Rerun correct QU05 steps or remap evidence and leave QU05 incomplete |
| CO03 | Evidence describes scope selector result changes, not A/B college assignment on new posts | Rerun with separate approved student accounts/colleges |
| CO08 | Evidence describes URL persistence, not clearing a subject during subject-worldwide scope | Rerun the actual clearing/fallback case |
| PR04 | Row describes own profile, while the case requires absence of controls on another profile | Remap the other-profile evidence from PR01 if sufficient; otherwise rerun |
| UX07 | Marked PASS while recording Escape failing twice | Retest fixed release with focus on trigger AND nav link; do not certify previous failure as full PASS |
| QU06, MD02, AN07, UX03, UX09 and similar scoped rows | Notes omit some requested fields/repetitions/boundaries/persistence/zoom | Keep partial coverage explicit; rerun missing steps before full-case PASS |
| QU12/AN09 | Confirm dialog was overridden in the tester's browser | Retest normal native Cancel/Confirm on an owner-approved disposable target; do not replace application behavior to prove the complete UI |

No revised “fully passed” total is claimed here: that requires a systematic
per-case rerun/evidence audit. The original 40 stays a reported total only.

## DOC-01 / DOC-02

Previous 75/76/77 results refer to different development snapshots. Keeping
dated history is valid, but an old section labelled Latest was misleading.
Current documentation now puts the **78-test current result first**, labels old
results historical and points to this review. The QA tester correctly reported
local HEAD d657931 at that time; a frontend need not display a commit for the
developer to verify Vercel status through commit deployment metadata. New fix
commit/CI deployment checks must be recorded under their exact revision.

## Next testing assignment

1. Owner prepares/signs in approved disposable student accounts A/B/C in separate
   browser sessions. Do not share owner/admin passwords or promote accounts just
   to avoid this setup.
2. Retest SM01–SM06 first: cross-user answer/vote/acceptance, notification delivery
   and a normal image upload. Owner previously reported notification flows
   working; that is owner-reported evidence, not this run's coverage.
3. Finish notifications NO01–NO09, permissions, reputation arithmetic and image
   cases. Use staging/owner supervision exactly as the playbook requires.
4. Correct partial/misaligned rows above, then complete the rest of the playbook.
   Never convert a developer unit test into a browser PASS.
5. Leave accounts/content intact until the owner chooses cleanup. No blanket QA
   deletion. The report's remaining question is not removed by this review.

The supplied report says a moderator password was pasted in its chat. If it was
a real credential, the owner should change it privately and revoke old sessions.
No password was requested, inspected, copied or changed during this review.

Atlas networking and all-user email/domain activation remain separate pending
decisions. This fix does not alter either configuration.
