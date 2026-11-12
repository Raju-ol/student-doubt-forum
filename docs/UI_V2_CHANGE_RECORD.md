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

## Step 4 — Heroes  (commit: see git log, 2026-11-13)
- Changed: `client/src/pages.jsx` (hero markup in Feed only), `client/src/ui-v2.css`
- What: Explore and Library (same Feed, `tag=study-library`) get a compact ~150px hero: script tagline ("Better Together <3" / "Study Smart Not Hard!") with a small inline-SVG sparkle, title, one subtitle line, and the PNG illustration on the right (`hero-explore.png` / `hero-library.png`, empty alt, 480x320 attributes, hidden below 768px). Script font is used only for the tagline. Active subject chip = `--text` background with `--surface` (white in light) text. Spacing under the hero tightened.
- Why: Plan §3 Step 4, decision 3, §6, Appendix A.
- Revert: `git revert <hash>`
- Deviations: (1) The in-hero search form was removed, because the header now has the same search (Step 2, same `?search=` param) and it would not fit the ~150px height. Search state/chips logic untouched. (2) Library hero title is "Study Library" (no existing Library title). (3) Subject chip row could not be visually checked: it needs the catalogue API, which wasn't running (chip style was already text-bg when active; only the text color changed). (4) Only one sparkle doodle added, not 2–3. (5) Screenshot is Explore, light theme, with API errors visible (no backend).
- Screenshot: docs/screenshots/ui-v2-step4-explore-hero.jpg

## Step 5 — Question cards  (commit: see git log, 2026-11-13)
- Changed: `client/src/components.jsx` (`QuestionRow` markup only), `client/src/ui-v2.css`
- What: Each question is now a white card (16px radius, soft shadow, hover lifts 1px with stronger shadow; disabled under reduced-motion). Top row: subject chip (`--accent-soft`/`--accent-strong`), status badge (Accepted answer = success tones, other = warn tones), Save button. Then a 600-weight title, a muted meta row (votes, answers, level, tags, asker · date) and a "View discussion →" link in `--accent-strong` at the right. Existing status wording kept (API's "No accepted answer" / "No answers yet" are not renamed to Resolved/Unresolved because they are more accurate).
- Why: Plan §3 Step 5.
- Revert: `git revert <hash>`
- Deviations / not met: (1) **5 cards do NOT fit at 1080p.** At a 1920x950 viewport 3 cards fit fully (4th is cut off): the area above the list (header, hero, quick chips, list toolbar) is ~505px and each card is ~123px. Fitting 5 would need cards <=77px or trimming the area above, which was not in the plan; needs a decision. (2) "Views" count omitted: the API data has no view count. (3) The answer-count box on the left was removed; the count is in the meta row. (4) Body preview line removed to save height. (5) Screenshot uses a throwaway mock API (not in repo); the real backend wasn't running, so long titles were checked on mock data only (they wrap).
- Screenshot: docs/screenshots/ui-v2-step5-question-cards.jpg

## Step 5b — Trim area above the list  (commit: see git log, 2026-11-13)
- Changed: `client/src/pages.jsx` (class rename only), `client/src/ui-v2.css`
- What: Tightened header, hero (min 140px, 28px title, 150px art), quick-view chips, list toolbar and card padding (cards ~101px) at >=768px so the first 5 cards fit at a 1920x950 viewport (5th card ends at 949px with one two-line title among them).
- Why: Follow-up to Step 5's failed "5 cards at 1080p" check (Raju chose "trim area above").
- Revert: `git revert <hash>`
- Bug fixed: the Step 4 hero reused the class `hero`, which already exists in `styles.css` (old landing hero: `.hero p{margin:20px 0 25px}`, grid, 64px padding). Those rules were silently inflating the hero to 250px and overriding the tagline/subtitle sizes. Renamed my classes to `banner`, `banner__text/script/doodle/sub/art`; Step 4's intended sizes now actually apply.
- Caveats: when the subject chip strip loads (needs the real catalogue API) it adds ~50px, so the 5th card will be partly below the fold at 950px. Verified on mock data only.
- Screenshot: docs/screenshots/ui-v2-step5b-five-cards.jpg
