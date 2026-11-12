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

## Step 2 — Header  (commit: see git log, 2026-11-13)
- Changed: `client/src/components.jsx` (Navbar), `client/src/ui-v2.css` (new, imported last in `main.jsx`), `client/src/main.jsx`
- What: Added a centered pill search to the header (submits to `/?search=<text>`, same param Explore already uses). "Ask a Doubt" is now a solid `--accent` pill with a lucide Plus icon, moved to the first spot in the right-hand group (before theme switch, bell, avatar). Route unchanged (`/ask`, still protected, so logged-out users go to sign-in as before). Bell and avatar unchanged.
- Why: Plan §3 Step 2, decision 2.
- Revert: `git revert <hash>`
- Deviations: (1) Styles live in new `ui-v2.css` loaded after `genz.css`, not in `styles.css`: genz.css sets `.nav-ask` colors with `!important` and loads later, so styles.css could not win. (2) Header had no search before (it lives in the Explore page); the new header search is additional, the Explore search is untouched until Step 4. (3) Mobile (<640px): Ask stays hidden in the collapsed menu because the bottom tab bar already has Ask (existing behavior). (4) Known: white text on `--accent` is below 4.5:1 in both themes; to be resolved in Step 8 (contrast pass).
- Screenshot: none (steps 4-7 required); checked manually in light and dark.

## Step 3 — Sidebar (navigation)  (commit: see git log, 2026-11-13)
- Changed: `client/src/components.jsx` (Navbar links, MobileTabBar), `client/src/ui-v2.css`
- What: Navigation items now use lucide icons (Home, BookOpen, Bookmark; mobile bar also User). Active item = `--accent-soft` pill with `--accent-strong` text/icon (desktop header links + mobile tab bar). Active state is now computed for Explore / Study Library / Saved (previously Explore was highlighted on all three). Header nav kept on one row at >=1024px.
- Why: Plan §3 Step 3.
- Revert: `git revert <hash>`
- Deviations: (1) The app has NO left sidebar and no "Learn • Ask • Grow" card or trophy (searched `pages.jsx`/`components.jsx`). Per §4 (adapt minimally, don't redesign) I applied the sidebar styling to the nav items that exist (header links + mobile tab bar) and did NOT invent a sidebar or that card. If a real sidebar/card is wanted it needs a design decision. The existing right-hand cards ("be someone's hero", "Study Library") are left for Step 6. (2) Active text uses `--accent-strong` rather than `--accent` for better contrast on cream (plan §3 Step 8 allows this). (3) Logged-in header width (bell + name) not visually checked: backend not running in this session.
- Screenshot: none (steps 4-7 required).
