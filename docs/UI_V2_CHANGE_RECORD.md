# UI V2 Change Record ("Soft Study" redesign)

Plan: `docs/UI_POLISH_PLAN_V2.md`. Branch: `ui-v2`. One commit per step; find the hash with `git log --oneline`.

Template per step:
- Changed / What / Why / Revert / Screenshot

---

## Step 0 — Setup  (commit: see git log, 2026-11-13)
- Changed: `docs/UI_POLISH_PLAN_V2.md`, `docs/UI_V2_CHANGE_RECORD.md`, `docs/screenshots/mockup-light.png`, `mockup-dark.png`, `client/public/illustrations/*` (9 PNGs + GENERATION.md + ADDITIONAL_PROMPTS.md), `client/package.json`, `package-lock.json`
- What: Created branch `ui-v2` (from local main, which is 3 commits behind origin/main). Added plan, mockups and the already-generated PNG illustrations. Installed `lucide-react`. Baseline `npm run build` passed before any UI change.
- Why: Plan §3 Step 0, Appendix A.
- Revert: `git revert <hash>`
- Deviation: illustrations are PNG (Appendix A), not SVG as in §2. Many unrelated uncommitted docs/scripts existed in the working tree; they are NOT included in these commits.

## Step 1 — Tokens + fonts  (commit: see git log, 2026-11-13)
- Changed: `client/src/styles.css`, `client/src/main.jsx`, `client/package.json`, `package-lock.json`
- What: Added the plan §1 light + dark token blocks (new names only, nothing uses them yet, so the site looks unchanged). Added Poppins 400/500/600/700 and Caveat 600 via self-hosted `@fontsource` imports.
- Why: Plan §1 foundation.
- Revert: `git revert <hash>`
- Deviations: (1) Fonts via `@fontsource/poppins` + `@fontsource/caveat` instead of a Google Fonts `<link>`: production CSP in `vercel.json` (`font-src 'self'`, `style-src` without fonts.googleapis.com) would block it, and `vercel.json` is off-limits. Same mechanism the project already uses for Inter/Caveat Brush. (2) `--text` and `--radius-card` NOT redefined: both already exist in `variables.css` and are used (56 and 8 uses); redefining would change the look in this step. Later steps decide per-element use. (3) Dark block uses `:root[data-theme=dark]` to match `theme-init.js` (it always sets `data-theme` to light/dark/bento). Bento inherits the light tokens.
