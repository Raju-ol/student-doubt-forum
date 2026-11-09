# Student Doubt Forum

## User request
Build the complete application with the beginner user. Full scope confirmed: authentication, doubts, answers, search/filtering, voting, accepted answers, comments, profiles, teacher badges, image uploads and admin moderation. Target: live application by 12 November 2026 (interpreted from user's “12”).

## Technical direction
React/Vite, plain CSS, Express and MongoDB. Cloudinary uploads. Same-origin production: Express serves the compiled frontend, simplifying deployment. Bearer JWT authentication as described in supplied playbook. Historical reduced-scope plans are not the current scope.

## Progress
- 2026-11-09: Read supplied playbook and inspected workspace. No application code existed. Node 24.19.0, npm 11.17.0 and Git 2.55 are installed.
- Created isolated project and dependency manifests. Database connection is not verified. No application features or live deployment verified yet.

## Latest verified state
- Implemented React screens and Express/Mongoose API: auth, doubts, answers, comments, filters/search, voting, acceptance, reputation, profiles, upload ownership, admin roles/bans/reports.
- Dependencies installed with lockfile; installation audit reported zero vulnerabilities.
- Local MongoDB connected. Production build passed. Integration flow: 25 subtests plus parent, 26 reported passes.
- Browser verified two independent student sessions, signup, post, answer, acceptance, comment, search and reload session restoration. Admin Users/Reports views and profile read view verified.
- User explicitly approved promoting local demo account aarav-browser@example.test to admin; promotion completed. Earlier automatic rejection is resolved by that specific authorization. Do not infer permission for other persistent access changes.
- Cloudinary upload/deletion and public deployment remain pending. User has no service accounts yet and requested setup guidance. Next user action: create/verify GitHub account, then connect user-owned repository, Atlas, Cloudinary and hosting incrementally.
- Private local server/.env generated without printing secrets. Never include it in repository or ZIP. Local demo accounts/data must not be seeded into production.
- 390px mobile check is unverified: viewport override left actual viewport at 699px. Do not claim full mobile QA.
- docs/GO_LIVE_HINGLISH.md has the account/deployment guide. Start Application.cmd starts the local version. API and testing docs reflect implementation limits.

## External access eventually required
User signs into hosting/database/image accounts and enters secrets privately. Never paste credentials into chat. Do not promise deadline completion without verification.
