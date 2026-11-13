# Current project state

Updated 13 November 2026. Reviewed code baseline `a0a45eb` plus the local `fix/design-consistency` changes. This is the entry point for present behavior. Historical change records keep their original evidence and dates. Code and executed checks take precedence over a document's date.

## Product and navigation

Doubt Forum uses a shared sidebar, topbar search and account menu. Phone navigation uses a drawer and bottom tab bar. Themes are Auto, Light (peach) and Dark (purple). Legacy Sticker/Chalkboard/Bento instructions describe earlier releases. Auto follows the device preference, rather than implementing a time-of-day schedule.

| Destination | Current implementation |
| --- | --- |
| `/` | Questions, search, subject/scope/status filters, sorting, trending tags, related questions, same-doubt votes, explicit view tracking |
| `/doubts/:id` | Answers, teacher ordering/highlighting, teacher endorsement, author acceptance, comments, sharing and reports |
| `/ask` | Authenticated question creation, optional anonymity, duplicate suggestions and screenshot attachments |
| `/library` | Separate public resource collection, categories, search, teacher shelf, popularity, links and document uploads |
| `/library/share` | Signed-in community resource sharing, subject to verification configuration and limits |
| `/?scope=all&tag=study-library` | Legacy worked Q&A tagged questions; distinct from material resources |
| `/?view=saved` | Browser-local saved questions; not account-synced material bookmarks |
| `/teach` | Teacher dashboard using teacher subjects and unresolved questions |
| `/contributors` | Contributor ranking using stored contribution data |
| `/about` | In-app How it works guide |
| `/account`, `/users/:id` | Account management, teacher requests/subjects, public profile and growth milestones |
| `/notifications` | Personal forum/account event notifications and read state |
| `/admin` | Role-dependent moderation and admin tools, including teacher reviews, overview, audit and announcement controls |
| `/admin/catalog` | Admin subject/institution catalogue and legacy demo-import controls |

## Roles and the Library boundary

Students use the forum and can share resources. Teacher status is granted by an admin-reviewed request or admin role management; a signup request alone does not grant teacher authority. Teachers have subject queues, answer highlighting/endorsements and a teacher-resource shelf. The shelf follows the uploader's current eligible teacher role. Forum moderators have report permissions and approved moderation context. Admins manage users, roles, teacher requests, catalogue and admin operations. Server checks, rather than hidden UI buttons, enforce access.

The resource Library is implemented separately from questions. The owner's larger institution-based Library is still a proposal. Institution-scoped teacher/manager assignments, course/class/module/chapter organization, draft/review/publication states and reviewed revisions are **not implemented** by the current resource collection. Public community sharing must not be described as the approved institution publishing workflow. See [Library blueprint](STUDY_LIBRARY_AND_DASHBOARD_PLAN.md).

## Files and delivery

- Forum screenshots accept JPEG, PNG and WebP up to 3 MiB each, with up to three attachments per question.
- Resource uploads accept supported PDF, Word and PowerPoint formats up to 4 MiB; HTTPS links support larger or externally hosted resources.
- Cloudinary credentials and delivery settings are required for real uploads. Local tests cannot establish production provider configuration.
- Resource download GET requests increment a counter and redirect. This is a request counter, not a verified unique-reader or completed-download statistic.
- The library currently publishes community resources directly. There is no private draft-file workflow.

## Architecture and operations

React/Vite renders the client. Express provides `/api/v1`; MongoDB stores accounts/forum/resources/admin data. Vercel serves the deployed application. Cloudinary supplies attachment storage when configured, Google Identity provides optional sign-in, Gmail SMTP supplies optional transactional delivery, and configured Redis supplies shared production rate limits.

The live address is https://student-doubt-forum-theta.vercel.app/. A GitHub merge or local test does not itself prove a particular deployment is live. Verify the deployment's release before recording live QA results.

Use `npm ci`, `npm run build` and `npm test`. Database tests need isolated localhost MongoDB; some existing test code assumes port 27017. Never point tests at the production connection string. Tests create and remove uniquely named disposable databases. Keep `.env*`, tokens, reset links and account passwords out of Git, screenshots and reports. Preserve existing private configuration.

## Verification and known limits

The baseline build passed and all 162 automated tests passed against disposable localhost databases. The baseline browser review visited 108 combinations of routes, roles, widths (360/768/1440) and Light/Dark, with no runtime exceptions or page-wide overflow. This found usability issues documented in [design review](DESIGN_CONSISTENCY_REVIEW.md).

Final post-fix results belong in that review and [verification record](TESTING.md). Local fixtures are evidence for local code only. Real Google sign-in, actual Gmail delivery, Cloudinary delivery and deployed Atlas/Redis availability require provider/live checks. No production data or configuration is changed by this review.

## Documentation workflow

Start with [documentation index](INDEX.md), this file, the current API additions and the current tester supplement. Use historical reports for dated evidence. Keep planned features labelled Planned, executed checks labelled with their environment, and unexecuted manual cases marked NOT RUN. Do not infer current question counts from the November 11 cleanup record or automatically restore the legacy demo library.
