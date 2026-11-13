# Design consistency review

13 November 2026. Baseline `a0a45eb`; working branch `fix/design-consistency`. Local review only. No production changes or deployment.

## Scope and findings

| Finding | Correction |
| --- | --- |
| Signed-in phone header wraps bell/avatar onto a separate row | A responsive grid keeps menu, brand and account actions aligned above search |
| Small resource cards clamp a long title after just a few words | Wider responsive cards, full wrapping titles and visible supplied descriptions |
| Subject dropdown options force white styling in dark mode | Native option colors now follow the active design tokens |
| Theme labels are visually hidden without an explicit button label | Explicit Auto/Light/Dark accessible labels; accurate device-preference tooltip |
| Account dropdown lacks Escape/outside-pointer dismissal | Dismisses predictably and Escape restores summary focus |
| Phone drawer permits keyboard focus to move behind the scrim | Focus wraps within the open drawer; background scrolling pauses and close restores trigger focus |
| Long names and fixed-width About grids constrain small layouts | Long text wraps and grid minimums respect available width |
| Small phone filter and resource-removal controls | Larger touch targets without moving the action over resource text |

The existing peach/purple visual identity, navigation destinations and backend permissions are preserved. Resource browsing stays separate from forum Q&A. This work does not implement the institution publishing blueprint.

## Evidence

Baseline automated suite — 162 passed, 0 failed. Baseline production build passed. Baseline headless browser traversal — 108 route/role/viewport/theme combinations, no runtime exceptions and no page-wide horizontal overflow. Screenshots were visually inspected for Explore, Library, About and Account in desktop/phone and Light/Dark variants. Counts describe traversal, not certification of every user interaction.

Post-fix verification is recorded below after execution. Browser checks use a fresh local MongoDB database named `forum_design_review_*`, disposable student/teacher/admin fixtures, an isolated headless Edge context and no normal browser profile. The test drops only its own guarded database. It does not read private `.env` values or contact production APIs. No email/upload/provider success is implied.

Reproduce locally with locked dependencies, optional Playwright tooling (`npm install --no-save --package-lock=false playwright`), installed Edge and MongoDB on 127.0.0.1:27017. Build first, then run `node scripts/design-review.mjs`. Screenshots and machine results go to ignored `output/design-consistency/`. The script also asserts no runtime errors/overflow, named visible buttons, phone header alignment, account Escape behavior and phone-drawer keyboard containment. Install locked dependencies again with `npm ci` when finished with optional tooling.

## Final local results

- Final production build passed after all CSS changes.
- Post-fix complete suite passed 162 tests with 0 failures.
- Final browser traversal passed **144** combinations across 18 route/role cases, widths **320, 360, 768 and 1440**, and both Light/Dark themes.
- No runtime exceptions or page-wide horizontal overflow were detected. Visible buttons had text/labels/titles under the automated check.
- Phone checks passed same-row non-overlapping header controls, account-menu Escape/focus restoration, Tab and Shift+Tab containment inside the drawer, and drawer Escape/trigger focus behavior.
- Final desktop Library and 320px dark Account screenshots were inspected after the fixes. Supporting screenshots cover Explore, About and other fixture pages. Output evidence is local and ignored by Git.

## Remaining release checks

Real-phone/browser-device coverage, screen-reader review, long production content and live provider operations remain separate checks. The institution/curriculum/approval Library design remains planned. A release still needs a reviewed diff, build/tests, preview approval and explicit production publication.
