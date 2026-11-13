> Historical report or design milestone. For current implementation and verification limits, read [CURRENT_STATE](CURRENT_STATE.md) and [design review](DESIGN_CONSISTENCY_REVIEW.md). This record does not certify the latest release.

# QA_BUG_REPORT — Student Doubt Forum (run-01)

Run date: 10 Nov 2026 (IST). Environment: Live, built-in browser pane (Chromium 152, Windows). Local commit `d6579311ba`; deployed commit unknown.

## Summary

| Type | Count |
|---|---|
| Confirmed Critical / High | 0 |
| Confirmed Medium / Low | 0 |
| Suspected issues (need owner decision) | 1 |
| Documentation inconsistencies | 2 |

"No confirmed bug" only means none was observed in the small area actually exercised (see QA_RESULTS.md). Signup, posting, answers (no student accounts available), voting, notifications, uploads, moderation and all API checks were NOT tested, so this is not evidence that they work.

## SUSP-01 — Mobile Menu does not close on Escape (suspected, Low)

- Related test cases: UX07 (and SM06).
- Status: suspected. The playbook's expected result for UX07 does not state that Escape must close the menu; this is a keyboard-accessibility expectation, so the owner should decide whether it is a defect.
- Severity: Low. Environment: Live, emulated 390x844 mobile (Pixel 8 UA), logged out.
- Preconditions: open https://student-doubt-forum-theta.vercel.app/ at viewport width < 768px.
- Steps:
  1. Click the "Menu" button (aria-expanded becomes true; Explore / Ask a doubt / Sign in appear).
  2. With the Menu button focused (checked via document.activeElement), press Escape.
  3. Read the button's aria-expanded.
- Expected: Menu closes (common disclosure/menu convention); aria-expanded=false.
- Actual: Menu stays open, aria-expanded remains "true" (2 of 2 attempts, once after clicking, once after explicit focus). Clicking Menu again, or following a link, closes it correctly.
- Reproducibility: 2/2 attempts.
- Evidence: docs/qa-evidence/run-01/UX06-UX07-mobile-390-menu-open.jpg (shows menu open; the failure itself was read from aria-expanded).
- Suggested investigation (UNVERIFIED): check whether the header menu component registers a keydown/Escape handler. Not inspected; I did not read the source code.

## DOC-01 — Test-count statements disagree (documentation, Info)

- Related: Phase 1 (could not be verified).
- TESTER_PLAYBOOK.md says automated checks "last passed at 77 tests"; CONTINUE_HERE.md says 75 in one section and 76 in a later note; TESTING.md has several totals over time. Current code is the authority; please rerun `npm test` and record one current number.

## DOC-02 — Validation records refer to older commits (documentation, Info)

- CONTINUE_HERE.md cites CI for commit c6e559a (and says a new commit "needs its own check"); THEME_CHANGE_RECORD cites 6894467. Local HEAD is `d6579311ba`. I could not confirm that the live deployment matches HEAD or that CI is green for it.

## Observations that are NOT bugs

- Live college catalogue now shows one college (DAITM) although the 9 Nov handoff said institutions returned 0 at that time; the handoff says counts are observations, so this is consistent.
- Direct question page shows "Loading…" briefly before content; normal SPA loading.
- Search URL parameter is `?search=` (my first guess `?q=` was ignored; user error, not a defect).
- Missing-but-valid-format record IDs show a generic "content could not be found" message with a "Try again" button; acceptable, mildly misleading since retry cannot help (Info).
