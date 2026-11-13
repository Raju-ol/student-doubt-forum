> Historical report or design milestone. For current implementation and verification limits, read [CURRENT_STATE](CURRENT_STATE.md) and [design review](DESIGN_CONSISTENCY_REVIEW.md). This record does not certify the latest release.

# UI Polish Plan V2 — COMPLETE EXECUTION PLAN ("Soft Study" redesign)

> **Status update 13 November 2026.** Historical plan. Steps from it are deployed as the "Soft Study" look; the sidebar redesign that followed is in [Design v3 change record](DESIGN_V3_CHANGE_RECORD.md).

## Appendix A — Illustration assets (13 November 2026)

Assets belong in `client/public/illustrations/` and use PNG filenames. This appendix specifies placement only; it does not mark the redesign as implemented or verified.

| File | Placement |
| --- | --- |
| `auth.png` | Login/signup side illustration |
| `hero-explore.png` | Explore compact hero |
| `hero-library.png` | Library compact hero |
| `ask.png` | Ask a Doubt supporting illustration |
| `empty-search.png` | Empty feed/search results |
| `empty-answers.png` | Question with no answers |
| `empty-saved.png` | No saved questions |
| `empty-notifications.png` | No notifications |
| `error.png` | 404 or appropriate recoverable error state |

Use real existing state conditions and retain the associated instructions and recovery actions. Admin and account settings need no decorative artwork. Images are decorative beside equivalent text, so use empty alt text, explicit dimensions and responsive sizing. Lazy-load below-fold images. Hide supporting hero art on narrow screens where space is needed. Avoid showing an error illustration during loading.

Check illustrations on both cream and dark-violet surfaces, including transparent edges. Apply any brightness adjustment to illustrations alone. Do not generate duplicate dark files unless visual review establishes a need. PNG compression should preserve transparency; target approximately 150 KB per asset where visually acceptable, and record actual sizes rather than claiming a target was reached. Prompts and generation details are recorded in the asset folder's `GENERATION.md`.

**Status:** APPROVED, ready to execute. The executing session follows this file step by step and makes NO new design decisions.
**Scope:** Frontend only (`client/`). No backend, API, auth, or routing changes. No new libraries except `lucide-react`.
**References:** Two mockups from Raju's friend (2026-11-13): warm light theme + dark violet theme. Mockup copies: `docs/screenshots/mockup-light.png`, `docs/screenshots/mockup-dark.png` (commit in step 0).

---

## 0. Decisions already made (do not reopen)

1. **Two themes, themed accent.** Light = warm cream/paper with ORANGE accent. Dark = deep violet-navy with VIOLET accent. Brand/logo stays violet in both. The existing theme system (`theme.js`, `theme-control.jsx`, `theme-init.js`) switches them; we only change token values, not the mechanism.
2. **"Ask a Doubt" is a solid accent button in the header**, always visible. Also stays in Quick Links.
3. **Compact hero:** ~half mockup height; 5 question cards visible on a 1080p screen without scrolling.
4. **Humanist, not AI-generic** (see §6): handwritten accents in exactly two places, warm paper background, real student voice in microcopy, small doodles (sparkles/hearts) as inline SVG.
5. **Workflow: branch `ui-v2`, never commit directly to main.** Vercel builds a preview URL per push; merge to main only after the final QA step passes.
6. **Transparency:** one commit per step with the exact message format in §7, plus `docs/UI_V2_CHANGE_RECORD.md` updated in the same commit. Anyone can trace which commit changed what and how to revert it.

## 1. Design tokens (Step 1 — foundation)

In `styles.css`, define BOTH theme blocks. Existing selectors keep working; replace hard-coded colors with tokens progressively in later steps.

```css
:root {            /* LIGHT — warm paper (friend's light mockup) */
  --bg: #FBF4E8;             /* page: warm cream */
  --surface: #FFFFFF;        /* cards */
  --surface-soft: #F6E8D4;   /* hero wash, hovers, chips */
  --brand: #7C5CFF;          /* logo, avatar ring — violet in BOTH themes */
  --accent: #F08A24;         /* buttons, active nav, links — orange */
  --accent-strong: #D97706;  /* hover/pressed */
  --accent-soft: #FDE8CC;    /* accent backgrounds, active pill */
  --text: #2B2113;           /* warm near-black, NOT pure #000 */
  --text-muted: #8A7A5F;
  --success: #15803D; --success-bg: #DCFCE7;
  --warn: #B45309;    --warn-bg: #FEF3C7;
  --chip-pdf: #DC2626; --chip-doc: #2563EB; --chip-ppt: #EA580C;
  --radius-card: 16px; --radius-pill: 999px;
  --shadow-card: 0 2px 10px rgba(120, 90, 40, 0.10);
  --font-ui: 'Poppins', system-ui, sans-serif;
  --font-script: 'Caveat', cursive;   /* §6: two places ONLY */
}
[data-theme="dark"] {        /* DARK — deep violet (friend's dark mockup) */
  --bg: #0F0A1F;
  --surface: #1C1532;
  --surface-soft: #251B40;
  --brand: #8B6CFF;
  --accent: #8B6CFF;         /* violet accent in dark */
  --accent-strong: #A78BFA;
  --accent-soft: #2E2252;
  --text: #EDE9FA;
  --text-muted: #9D94B8;
  --success: #4ADE80; --success-bg: #14321F;
  --warn: #FBBF24;    --warn-bg: #3A2A0E;
  --chip-pdf: #F87171; --chip-doc: #60A5FA; --chip-ppt: #FB923C;
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.35);
}
```
Match the dark-theme attribute/class mechanism to whatever `theme-init.js` already sets — adapt the selector, not the mechanism.

**Fonts** (in `client/index.html`): Google Fonts `<link>` — Poppins 400/500/600/700 + Caveat 600. Add `font-display: swap` behavior via Google's default URL.

## 2. Assets checklist (gather in step 0)

- [ ] `npm i lucide-react` in `client/`
- [ ] Hero illustration, Explore page: student at laptop (Storyset/unDraw, SVG, recolored to theme before download) → `client/public/illustrations/hero-explore.svg`
- [ ] Hero illustration, Library page: books/stationery → `client/public/illustrations/hero-library.svg`
- [ ] Copy the two mockup PNGs into `docs/screenshots/` (paths in header above)
- [ ] Avatars: DiceBear fallback URL helper (initials style), only where no avatar exists
- Sparkles/hearts/doodles: inline SVG written by hand, NOT downloaded images
- If an illustration can't be fetched during the session: skip it, leave the layout slot with the CSS wash, note it in the change record. NOT a blocker.

## 3. Execution steps (one commit each, in order)

**Step 0 — Setup.** Create branch `ui-v2`. Add mockups to `docs/screenshots/`. Create empty `docs/UI_V2_CHANGE_RECORD.md` with the template from §7. `npm i lucide-react`. Verify `npm run build` passes BEFORE any changes (baseline).
**Step 1 — Tokens + fonts.** §1 exactly. Site must look ~unchanged after this step. Build must pass.
**Step 2 — Header.** Search pill centered; solid `--accent` "Ask a Doubt" button (plus icon) right of search, wired to the existing ask-question route/action — find it in `navigation.js`/`pages.jsx`, do not invent a new route; bell + avatar right. (`components.jsx`, `styles.css`)
**Step 3 — Sidebar.** Active item = `--accent-soft` pill with `--accent` text/icon; lucide icons (Home, BookOpen, Bookmark, User); "Learn • Ask • Grow" card simplified, trophy kept.
**Step 4 — Heroes.** Explore + Library: compact (~140–160px), title + one subtitle line, illustration right (hidden <768px), script-font tagline ("Better Together <3" / "Study Smart Not Hard!") as the ONLY script usage. Subject filter chips row under hero: active chip = `--text` bg with white text (as in mockups).
**Step 5 — Question cards.** Subject chip (soft bg, colored text), title 600 weight, status badge top-right (Resolved = success tones, Unresolved = warn tones), meta row muted (votes/answers/views/asker/time), "View discussion →" link in `--accent`, hover: shadow lift + 1px translate. Padding 16–20px. Verify 5 cards fit at 1080p.
**Step 6 — Library cards + sidebar widgets.** File-type chip colors via `--chip-*`; download buttons solid `--accent`; "Upload Resource" callout card in `--accent-soft`; Popular Resources numbered list; Trending Topics chips; Quick Links.
**Step 7 — Dark theme pass.** Walk every page with theme toggled; fix any element still using light hard-coded colors. Both mockups side-by-side as reference.
**Step 8 — Responsive + a11y pass.** 360px, 768px, 1080p. Contrast: body text and muted text ≥4.5:1 on their backgrounds in BOTH themes (orange-on-cream is the risky one — use `--accent-strong` for text links in light theme if needed). Focus states visible on buttons/inputs.
**Step 9 — QA + ship.** `npm run build`; run `scripts/live-smoke.js` flow locally if applicable; spot-check per `docs/TESTER_PLAYBOOK.md`; before/after screenshots into `docs/screenshots/`; open PR `ui-v2` → `main`; after merge, verify Vercel production + run tester playbook once on live.

**Budget note:** if the session runs low, stop at any completed step — every step leaves the site working. Steps 0–2 alone are shippable.

## 4. Hard rules for the executing session

- Never commit to `main` directly. Branch `ui-v2` only; merge via PR at step 9.
- One step = one commit. Build (`npm run build`) must pass before every commit.
- Do not edit logic in `pages.jsx`/`components.jsx` beyond classNames, markup structure, and icon imports. No state, API, or routing changes.
- Do not touch `server/`, `api/`, `.env*`, `vercel.json`, `render.yaml`.
- Do not introduce Tailwind, CSS-in-JS, or any UI library.
- If something in this plan conflicts with the real code, adapt minimally and write the deviation in the change record. Do not redesign.

## 5. Bug-prevention checklist (run at steps 2, 5, 6, 7, 8)

- Theme toggle twice — no flash of wrong theme, no unstyled elements
- Refresh on each page — theme persists (`theme-init.js` behavior unchanged)
- Ask a Doubt button: works logged-in AND logged-out (whatever the current behavior is — preserve it)
- Long question titles wrap, don't overflow cards
- Empty states still render (no questions / no results)
- Keyboard: tab through header + cards, visible focus
- Console: zero new errors/warnings

## 6. Humanist / anti-AI-look rules (apply throughout)

- Warm paper bg + warm near-black text in light theme (no pure white/black) — this alone kills the "AI SaaS" look
- Script font in exactly 2 places (the two hero taglines). Never for headings or buttons
- Tiny hand-drawn touches: 2–3 inline-SVG sparkles/hearts near heroes, nothing animated
- Microcopy in real student voice, short and warm. Examples to use:
  - Empty search: "Nothing yet — try a shorter keyword?"
  - No answers: "No answers yet. You could be the first 👀"
  - Upload card: "Have useful notes? Share them with the community!"
  - Avoid: "Unlock your potential", "Seamlessly explore", "Empower your learning journey"
- Slight asymmetry is fine (illustration overlapping hero edge, badge not perfectly aligned to grid)
- No glassmorphism, no neon gradients, no giant rounded gradient buttons

## 7. Transparency: commits + change record

**Commit messages:** `ui-v2(step-N): <what changed in plain words>`
e.g. `ui-v2(step-2): header me Ask a Doubt accent button add kiya` — plain English also fine.

**`docs/UI_V2_CHANGE_RECORD.md`** — append per step, same commit:
```md
## Step N — <name>  (commit: <short-hash>, date)
- Changed: <files>
- What: <2–3 lines, plain language>
- Why: <1 line, reference this plan's section>
- Revert: `git revert <short-hash>`
- Screenshot: docs/screenshots/<file> (steps 4,5,6,7 minimum)
```
This file + `git log --oneline` = full history anyone on the team can read. Rollback of the whole redesign = revert the merge commit on main, or Vercel → Deployments → promote previous.

## 8. Definition of done

- All 9 steps committed on `ui-v2`, merged to main via PR, Vercel production verified
- Change record complete, before/after screenshots present
- Both themes match the mockups' feel (not pixel-perfect — same structure, spacing, color system)
- Zero console errors; tester playbook spot-run passes on live
