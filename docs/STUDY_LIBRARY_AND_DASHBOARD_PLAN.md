<!-- consistency-review-2026-11-13 -->
> Current status, 13 November 2026 — See [current implementation and limits](CURRENT_STATE.md). The active design has Auto/Light/Dark themes and a separate community resource Library. Institution-scoped curriculum and publication review remain planned. Older counts, release IDs and provider checks below are dated evidence, not current certification.

# Study Library and dashboard proposal

> **Status update 13 November 2026.** Still a plan. Branch `feat/design-v3` adds an interim `/library` page (a flat list of shared files and https links with download counts). It has no institutions, curriculum, teacher assignment or review workflow, and it uses the route this plan reserves for the real Library. Decide whether to keep, rename or remove it. The 200 sample questions are now called Worked Q&A.

Prepared 12 November 2026. Expanded 13 November 2026 following the owner's separation and institution requirements. Status — planning only. This document does not mark proposed features as implemented, tested or deployed.

## Confirmed direction

- Keep the Doubt Forum name.
- Use the supplied lavender dashboard as the light-mode visual direction.
- Make Study Library a distinct resource section alongside the question forum.
- Materials are publicly browsable with institution filters, as selected by the owner. Support colleges, universities, schools and tuition/coaching institutes. Login is not required to read public materials.
- Admins and authorized teachers provide materials. Students use the library to find and study them.
- The owner will provide the dark-mode reference later. Design its detailed appearance after that reference arrives.

## Existing implementation and the gap

The current Library navigation points to `/?scope=all&tag=study-library`. It filters forum questions, rather than storing educational files. `server/src/study-library.js` manages a legacy demonstration question import. That import must not become the new resource publishing workflow or repopulate the cleared forum.

Existing account roles include student, teacher, moderator and admin. A teacher role currently does not implement resource publishing. Institutions and subjects already exist and should be reused where appropriate. College selection on an account is self-reported and is not a permission grant.

The current upload endpoint accepts JPEG, PNG and WebP images up to 3 MiB. PDF delivery needs its own upload and validation design. Saved questions currently use browser storage.

## Information architecture

Proposed routes

| Area | Route | Purpose |
| --- | --- | --- |
| Forum | `/` | Questions, answers, votes and accepted answers |
| Library | `/library` | Public institution and resource browsing |
| Institution library | `/library/institutions/:slug` | Institution introduction, curriculum and resources |
| Resource | `/library/materials/:id` | Description, academic context, preview and download or source link |
| Teacher workspace | `/library/manage` | Assigned institutions, drafts and submissions |
| Administration | Existing admin area with Library section | Assignments, curriculum, review queue and page settings |

Filters must persist in the URL so users can share a subject or chapter view. Give the Library its own search. Global search can later offer Questions and Materials tabs.

Suggested curriculum

```text
College → Course/Programme → Semester/Year → Subject → Module/Chapter → Material
School  → Class/Grade → Subject → Chapter → Material
Tuition/Coaching → Course/Exam/Batch → Subject → Module/Chapter → Material
```

Modules and chapters are optional levels. A simple institution can publish directly under a subject. A material has one canonical curriculum location and optional tags. Reuse global subject identities through curriculum mappings so a school syllabus and a college syllabus can organize the same subject differently.

## First-release resources

Support PDF notes, previous-year papers, revision sheets, curated important-question PDFs and educational links. Each resource needs a title, short description, institution, curriculum location, type, credited author, academic year when relevant and publication date. Show file format and verified file size for uploads.

An important-question collection initially uses a PDF or educational link. A structured question-bank editor with marks, difficulty and solutions is a later enhancement. Forum answers and library question sets remain separate content types.

Use clear empty states. Never show invented popularity, downloads, views or seeded materials as real institution content. Launch side panels with Latest materials and Teacher recommended, using actual records.

## Permissions proposal

| Person | Proposed capability |
| --- | --- |
| Visitor/student | Browse, filter, search, preview and download published public materials |
| Assigned teacher | Create drafts and edit their own materials within assigned curriculum areas, submit for review |
| Assigned library manager | Manage institution curriculum, page details and publication within explicitly assigned institutions |
| Platform admin | Create institutions, appoint teachers/managers, manage all library records and publish |
| Existing forum moderator | Retain current report-moderation powers; library management requires a separate explicit assignment |

Recommended initial workflow is teacher submission followed by admin or assigned manager publication. Direct publishing can later be enabled for an explicitly trusted teacher. This review policy is a proposal for owner review.

Use institution-scoped assignments instead of giving every teacher global admin access. The server checks active account status, assignment and resource ownership on every mutation. A client-hidden button is insufficient. Changing an institution ID in a request must never expand access. Revoking an assignment removes management powers immediately.

Admins appoint managers from existing registered accounts. They can then assign teachers to institutions and subjects. Selecting a college during signup does not appoint a teacher or manager.

## Page management

Use a shared institution page template. Authorized managers can edit the display name, description, approved logo/cover, curriculum ordering and featured materials. Teachers can manage their own assigned content. Global navigation, account roles and site branding remain platform-admin responsibilities.

Page editing uses validated fields and a preview, rather than arbitrary HTML or JavaScript. A page should show who maintains the library and when materials were last updated.

## Publishing flow

1. Open Manage Library and choose an authorized institution and curriculum location.
2. Choose a material type and upload a PDF or provide an educational link.
3. Enter title, summary, author credit, academic year and optional tags.
4. Save a draft and preview the student-facing page.
5. Submit for review. A manager/admin reviews and publishes or returns it with a reason.
6. Published resources appear in public search and filters. Drafts and review items stay out of public responses.
7. Updates create a replacement version. Keep the working published file until replacement upload and validation succeed. Display the last-updated date.
8. Unpublish/archive removes a resource from discovery. Permanent deletion is a separate explicit operation with attachment cleanup and an audit entry.

Keep a small audit history recording actor, action, target and time. Store sensitive credentials outside records and logs.

## Data and API proposal

Add separate models for curriculum nodes, library assignments and materials. Suggested material fields include institutionId, curriculumNodeId, title, description, type, tags, academicYear, authorCredit, createdBy, status, publishedVersion and timestamps. File metadata includes provider asset identifier, verified format, byte count and delivery reference. Assignments carry userId, institutionId, optional curriculum scope and capabilities.

Validate curriculum parentage to prevent attaching a chapter from one institution to another. Use stable IDs for records and slugs for readable page URLs. Index institution, curriculum, publication status and publication date. Paginate lists and return card metadata in one request. Avoid extra per-card calls and frequent resource polling.

Public endpoints list and retrieve published materials. Authenticated management endpoints handle drafts, review, publication, curriculum and assignments with server-side authorization. Bookmark resource IDs separately from question IDs. Account-synced bookmarks can be a later addition; browser-local saving must be labelled accurately if used initially.

## Files, hosting and free-tier feasibility

Begin with PDFs and external links. Before choosing upload size or storage promises, verify the actual hosting and storage account capabilities, PDF delivery settings and current quotas. No paid plan or new provider is selected by this document.

Use short-lived signed direct uploads if required to avoid sending large PDFs through the application function. Server-controlled upload sessions must bind the account, permitted type and destination. Finalization verifies the provider result and actual file metadata before publishing. Do not trust a filename or browser-supplied MIME type alone. Reject unsupported or oversized files, clean abandoned uploads and apply per-account limits. Evaluate file scanning and inline-preview restrictions before accepting broader office-document formats.

Public library files must be materials the institution is permitted to share. External links display their destination and open safely. The selected public-access design should be clear to teachers before publication.

A free launch depends on actual storage, bandwidth and traffic quotas. External educational links reduce storage usage. Show understandable upload-limit errors and document the operational limits after verification.

## Visual direction

Use a pale lavender surface, white resource cards, restrained purple actions, readable dark text and clear keyboard focus. Keep the reference's sidebar and compact illustrated banner, but prioritize useful content above the fold. Use lightweight assets and avoid large decorative downloads.

Desktop has a left navigation, contextual top search, main content and an optional right panel. Explore shows question cards. Library shows file/link cards with subject, chapter, author, date, format and Preview/Download actions. Cards must distinguish download from an external source link.

Mobile uses the existing navigation pattern adapted to the new routes, a single content column and a compact filter drawer. Secondary panels move below content. Check long institution names, long titles, zoom and narrow screens.

Apply the shared layout to authentication, question details, profile and admin pages in a later consistency pass. Preserve current functionality throughout. Keep existing dark-mode behavior working until the supplied dark reference is reviewed, then implement matching component states and contrast.

## Delivery order

1. Review this plan and create a small UI prototype covering Explore, Library, a resource detail and the teacher upload flow.
2. Build curriculum and assignment models with authorization checks and public/draft separation.
3. Build manager setup, teacher drafts, review queue and publication with links first.
4. Verify storage capabilities and implement PDF upload, preview, replacement and cleanup.
5. Add library browsing, shareable filters, pagination, search and saved-material handling.
6. Apply the approved lavender layout across the main screens and incorporate the later dark reference.
7. Update the shared tester playbook, API notes and team handover to match implemented behavior. Run scoped tests and preview review before production publication.

Every phase should leave forum posting, answers, notifications, Google login and password recovery usable. Do not convert forum posts into resources automatically, repeat the old demo import or rerun the production cleanup.

## Acceptance checks

- Visitors can browse published materials by institution, subject and chapter without signing in.
- Shareable filter URLs and browser back navigation preserve context.
- A teacher assigned to institution A cannot modify B, even by crafting API requests.
- An unassigned teacher and a forum moderator cannot grant library permissions.
- Public endpoints never expose draft content or draft attachment delivery references.
- A manager can publish only within their assignment. Removing an assignment revokes access.
- Invalid PDFs, unsupported formats, oversize uploads and failed finalizations are rejected without a published broken card.
- Failed replacement uploads leave the previous published material available.
- Removed materials disappear from discovery and their attachments follow the documented cleanup policy.
- Empty-library screens remain helpful and do not show fabricated resources or statistics.
- Keyboard, mobile and light/dark states support search, filters, upload errors, previews and management actions.
- Existing Q&A and account workflows pass regression checks.

## Owner review still needed

Public browsing is confirmed. Review the proposed teacher-submit/manager-publish workflow and the first-release content types. Detailed dark-mode styling waits for the owner's reference. Upload sizes, provider delivery behavior and quota limits must be established during the technical upload assessment, before implementation promises are made.

## Complete product blueprint — 13 November 2026

### 1. Two destinations inside one website

Keep shared login, profiles, theme controls and navigation. Give Questions and Study Library their own landing pages, search, content collections, cards, saved-item lists and management tools. A library resource never appears as a forum question merely because it contains important questions. Forum votes, answers and acceptance do not apply to resource records.

Use this desktop shell as the visual starting point

```text
┌───────────────────┬─────────────────────────────────────────────────┐
│ Doubt Forum       │ Contextual search      Ask a doubt   Bell Avatar│
│                   ├─────────────────────────────────────────────────┤
│ Explore Questions │ Breadcrumb / compact page introduction          │
│ Study Library     │                                                 │
│ Saved             │ Main questions or materials       Helpful panel │
│ My Profile        │                                                 │
│                   │                                                 │
│ Teaching workspace│                                                 │
│ Administration    │                                                 │
└───────────────────┴─────────────────────────────────────────────────┘
```

Show Teaching workspace only to accounts with assignments and Administration only to authorized users. Keep the main navigation stable across pages. The phone version uses a compact header, existing accessible menu pattern, bottom navigation and one content column. Avoid a second fixed sidebar on phones. Settings and sign out belong in the account controls.

### 2. Student journey and screen inventory

1. Explore remains the Q&A feed. Subject chips, question status and Ask a doubt retain their real forum behavior.
2. Library home introduces institution selection and searches published materials. Institution-type and name filters help locate a university, college, school or tuition institute. Show recent materials using actual records.
3. An institution page shows its introduction, available courses/classes, subjects and optional announcement/featured-material area controlled by its managers. Do not display an official verification badge until verification has actually occurred.
4. A course/class page shows subjects and the correct academic grouping. Labels adapt to semester, year, grade, exam or batch. Avoid displaying meaningless semester fields for a school.
5. A subject page shows ordered modules/chapters and material-type filters. Keep subject-wide resources available without forcing a chapter.
6. A material detail page shows title, description, curriculum breadcrumb, author credit, academic year, source, format, updated date and a working preview/source action. Upload downloads and external-source links have different labels. Provide a clear fallback when an inline preview cannot load.
7. Saved provides separate Questions and Materials tabs. The first implementation must state whether saving is on-device or account-synced. Do not imply cross-device access for browser-local storage.
8. Students can share a resource link. Link sharing must resolve to the material page, rather than an expiring storage URL.
9. Loading, empty, unavailable and error states remain different. Offer Clear filters for zero results and a way back to the subject when a resource is unpublished.

Suggested card information

```text
PDF · Notes                       Institution name
Database normalization — Module 2
DBMS / B.Tech CSE / Semester 4
By credited teacher · Updated date
View material                         Save
```

Cards do not need learner ratings, public comments or download counters in the first release. The educational content and its academic context should be easy to scan.

### 3. Institution onboarding

Initially the platform admin creates an institution from the existing catalogue-management area, with type, display name, unique slug and optional location/description. Existing institutions must keep their IDs. Add type with a backwards-compatible migration or explicit unset state, rather than assuming all existing entries are colleges.

The platform admin selects an existing registered account and grants an institution-specific manager assignment. The manager configures curriculum and page details. The platform admin initially appoints teachers; delegated teacher appointment by institution managers can be added later with a distinct capability. Teacher assignments can optionally be restricted to a subject/course.

A university may have department and campus names represented as curriculum groupings in the first release. Cross-institution federations and complicated multi-campus account ownership can wait until there is a concrete need. One teacher may hold explicit assignments in multiple institutions.

There is no automatic institution creation or authority from an email domain, signup selection or self-selected teacher label. Public browsing does not require institution membership.

### 4. Operational responsibilities

Platform admin handles institution creation, account-role changes and assignment grants/revocations. Institution managers maintain their assigned pages, curriculum and review queues. Teachers supply accurate materials in authorized areas. Students browse resources and use the separate forum for discussion.

Removing a teacher assignment does not delete published learning materials. Preserve credit and let a manager maintain those records. A suspended/deleted account loses management access. A manager can archive an incorrect resource without deleting an institution or unrelated course. Teacher identity and credited author can differ, so retain both submitter and author-credit fields.

### 5. State transitions and revision rules

Use explicit Draft, In review, Published, Returned for changes and Archived states. Teachers edit their drafts and returned submissions, then submit them. Managers/admins publish, return with an explanatory note, or archive. Avoid ambiguous approve buttons without showing the target institution and material.

Keep the published version accessible while a replacement is under review. Store a new revision independently, then change the published-version pointer after approval. Concurrent edits require a revision/version check and an understandable conflict message. Never overwrite a newer edit silently.

Changing a resource's institution or curriculum must trigger the same assignment and parentage checks as creating it. A teacher cannot transfer content to expand their authority. Before deleting a curriculum node, require moving or archiving its children; do not leave orphaned materials. Managers can reorder chapters through explicit ordering controls.

Permanent deletion should have a concrete confirmation, a record of the operation and attachment cleanup. Archiving is the normal content-removal workflow. The separate legacy content cleanup is already complete and must not be rerun for this feature.

### 6. Production behavior and safeguards

- Render descriptions as plain text or sanitized supported Markdown. Page settings cannot introduce scripts or arbitrary embeds.
- Validate educational links on the server. Accept supported HTTPS destinations, reject script/data/file URLs and credential-bearing URLs. Do not fetch arbitrary destinations on the server to build previews.
- Treat previews as untrusted documents. Establish a supported PDF preview approach and fallback link compatible with the site's security headers. Do not promise external Drive links are always downloadable or embeddable.
- Private drafts need private attachments. An unlisted draft database row is insufficient if its file has a public permanent URL. Select a provider delivery mechanism that supports the chosen draft policy before offering upload drafts.
- Rate-limit material writes, link submissions and uploads. Apply per-institution storage accounting and a maximum file size. Limits must reflect the actual free-tier account and be visible before upload.
- Upload progress, cancellation, expired signatures, retries and cleanup of abandoned files need explicit behavior. Resource records publish only after successful verification.
- Keep authoring forms recoverable on failure. Warn before navigating away from unsaved edits. Avoid logging signed download links or credentials.
- Paginate public lists. Use indexed institution/curriculum/status lookups, bounded search inputs and stable sort order. Reuse catalogue requests and avoid loading the entire library into the browser.
- Only cache public publication responses. Management responses stay private and uncached. Invalidate public caches on publication, archive and revision changes.
- Use actual error monitoring and delivery logs to diagnose failed saves/uploads. Keep sensitive content and credentials out of logs.
- Record backup/restore procedures for new collections and attachments, with a restore rehearsal on an isolated database before a broad production rollout.

### 7. Design details and accessibility

Follow the supplied rounded student-dashboard references, with soft surfaces, restrained accents, compact banners and readable type. The working UI-polish plan contains later warm-cream/orange and violet directions; reconcile those references into one reviewed token set before styling. The earlier lavender plan is a visual reference, not a reason to create another incompatible theme.

Use the generated nine PNG illustrations where the mapped states actually occur. Most management screens need no art. Keep the largest reading area for learning content. Avoid large banners on every nested chapter page. Breadcrumbs and clear active navigation should tell students where they are.

Keyboard users must reach and operate filters, menus, preview actions and review controls. Provide visible focus, actual labels, status text alongside badge colors, upload instructions and an announced save/error result. Verify text contrast, 200% zoom, long names, reduced motion, and widths around 360, 768 and 1440 pixels. A theme adjustment must not change publishing behavior or permissions.

### 8. Build milestones and review gates

| Milestone | Concrete output | Check before moving on |
| --- | --- | --- |
| A — Design | Responsive Explore, Library home, institution, subject, material and teacher/review screen prototypes | Owner reviews navigation, separation and visual hierarchy; sample data clearly labelled |
| B — Library foundation | Separate models, institution types, curriculum, assignments and public read APIs | Permission tests and institution-isolation tests pass |
| C — Linked materials | Teacher drafts, review, publish/archive, educational source links and page settings | Full teacher-to-student flow works without touching forum questions |
| D — Uploaded PDFs | Verified storage setup, upload sessions, private draft files, preview/download, revisions and cleanup | Invalid uploads and failed replacements leave no public broken content |
| E — Complete student experience | URL-based filters, pagination, search, separate saved-material handling, mobile and theme polish | Loading/error/empty states and accessibility checks pass |
| F — Release | Updated team handbook, API docs, migration instructions, preview deployment and rollback procedure | Owner reviews preview, required tests pass, then production publication and live smoke checks |

Build and ship only complete milestones. The linked-material milestone must describe itself accurately; it does not mean direct PDF uploading is finished. Do not label the whole website production-ready solely because a build succeeds.

### 9. What is essential and what can wait

First release needs public browsing, institution types, curriculum, separate resources, assigned teacher access, admin/manager review, publication/archive, reliable links/PDF delivery, pagination, search, usable empty states and documented operations. The direct upload milestone is required before advertising direct file uploads.

Useful later additions include following a subject, opt-in new-material notifications, account-synced bookmarks, broken-link reports with a management queue, exam-year filters and resource version history visible to students. These should use explicit settings and actual backend events.

Future possibilities include syllabus progress tracking, structured question banks, institution announcements, teacher office hours and moderated study groups. Mentoring, live chat and AI assistance are separate projects with their own permissions, moderation and operating costs. An AI explanation or summary should be labelled, link to its source material and respect access and usage limits. Do not bundle these into the initial library release or promise unlimited free operation.

### 10. Decisions and handover

Confirmed requirements are separate Q&A/materials, public browsing, multiple institution types, subject/module/chapter organization, teacher/admin publishing capabilities and the shared Doubt Forum identity.

Recommended defaults for review are teacher submission followed by manager/admin publication, PDF and HTTPS learning links first, explicit institution assignments, and archive-before-delete operations. Future account-synced saving and opt-in material notifications are extensions, not implied existing features.

Before implementation, review the prototype and publication defaults. During the upload milestone, establish provider capabilities and numerical quotas from current official documentation and the actual account. Before launch, update the shared tester handbook with role isolation, draft confidentiality, revision conflicts, file delivery and mobile/theme cases. Mark checks as passed only after execution and evidence capture.
