# System/light/dark theme — 9 November 2026

Added an accessible Color theme select, saved in localStorage. System follows
prefers-color-scheme and reacts to operating system changes. Invalid/blocked
storage falls back safely. A small self-hosted external script resolves the
initial theme before app paint without requiring inline CSP exceptions. A CSS
system preference fallback also covers missing startup script execution.

All 104 hard-coded color usages/palette roles from styles.css and p0.css were
centralized in styles/variables.css. Surface, ink, edge and shadow roles have
separate dark values so white button text does not become a dark background
color. Primary buttons use an explicit on-primary foreground. Code highlighting
gets dark keyword/string/comment/number colors; the renderer remains lazy-loaded.

69 tests pass and build succeeds. New checks cover system/explicit/invalid
preference, denied storage, centralized colors and dark primary/card,
on-primary/primary, text/card, muted/card contrast >=4.5:1. These are selected
contrast pairs, not an exhaustive WCAG audit. The palette keeps original light
values and maps dark tones; every component/state still needs visual review.

Local IAB preview could not reach 127.0.0.1:5173 (connection timeout). Live visual
check follows deployment. No claim of complete browser/accessibility coverage.

Live visual check complete: dark feed reviewed, 390px viewport has 375px content width and matching scroll width (no horizontal page overflow). Reload retained Dark selection. Restored System afterward. Screenshot saved locally as dark-theme-qa.png in the parent workspace. Authenticated editor/moderation dark states are not all visually audited.


## 10 November 2026 — click-to-cycle control

Replaced the dropdown with one native button cycling System -> Light -> Dark -> System. A sliding indicator moves across monitor/sun/moon icons; the visible label and accessible name report the current/next modes. Native Enter/Space activation and saved preference remain; system changes still apply in System mode. Animation respects reduced-motion preference. 77 tests pass/build succeeds, including a real DOM click-cycle, persistence/remount and media-listener cleanup test. Live visual verification follows deployment.

