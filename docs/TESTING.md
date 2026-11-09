# Verification record

Date: 9 November 2026. Local Windows machine, Node 24.19.0, npm 11.17.0, local MongoDB.

## Passed

- `npm test`: 25 integration subtests and 1 enclosing test, 26 reported passes, zero failures. Uses an isolated temporary database.
- `npm run build`: successful production React/Vite build. React Router's `use client` directives were ignored by Vite; build completed.
- Local startup: MongoDB connected; Express serves the compiled frontend on port 5000.
- Browser: student A signup with semester, post question; student B signup in a separate tab/session, answer; student A reload/session restoration, accepted answer, comment; keyword search finds the solved discussion.
- Browser: authorized local demo account promoted to admin; Users table, empty Reports view and profile page loaded correctly. No live account role was changed.
- API checks cover normalized duplicate emails, bcrypt hashing, invalid passwords/tokens, author spoofing, permissions, validation, bounded search/filtering, vote toggle/switch, answer acceptance/reputation, teacher promotion, banning existing sessions, report dismiss/remove, cascading answer deletion, profile privacy and unowned upload IDs.
- Dependency install audit: zero reported vulnerabilities at install time.

## Pending or limited

Vercel preparation update: API handler tested locally against the shared MongoDB connection, including health, profile data and unknown API route behavior. Updated integration run reports 26 subtests plus parent (27 passes). Production frontend build passes. Actual Vercel routing, Atlas connectivity and public deployment remain pending until configured and deployed.

- Cloudinary upload/remote deletion end to end: credentials unavailable. File type/signature/size and ownership checks are implemented; remote service integration has not been verified.
- Live Atlas/hosting/deployment acceptance: accounts not configured.
- Full browser moderation mutations, edit/profile forms and error-state coverage: pending; automated checks do not establish every browser interaction.
- Mobile: responsive CSS exists. Browser viewport override did not change the observed 699px width, so 390px layout is NOT verified. Observed 699px view had document width equal to viewport width.
- Keyboard, assistive technology and all browser/device combinations: not fully audited.
- Persistence across full database/service restart and clean ZIP installation: not yet exercised.
- Concurrency, high load and cross-collection partial failures: not exhaustively tested.

Windows restricted execution blocked network/native build components; authorized normal execution completed package installation, build and database checks. No application success is inferred from a failed restricted attempt.
