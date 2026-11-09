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
