> Historical report or design milestone. For current implementation and verification limits, read [CURRENT_STATE](CURRENT_STATE.md) and [design review](DESIGN_CONSISTENCY_REVIEW.md). This record does not certify the latest release.

# Student Doubt Forum UI and UX Improvement Plan

> **Status update 13 November 2026.** Historical plan. Steps from it are deployed as the "Soft Study" look; the sidebar redesign that followed is in [Design v3 change record](DESIGN_V3_CHANGE_RECORD.md).

Version 1.0 | Prepared 9 November 2026

## 1. Purpose and intended outcome

Improve the existing Student Doubt Forum so students can find an explanation, ask a clear question, contribute an answer and return to useful discussions with little friction.

This is a website implementation specification. It belongs in the project documentation and can guide design, development and review. It is not homepage copy, an implemented feature list or evidence that the proposed changes have passed testing.

**Recommended first release:** improve the feed, question detail and Ask form; address mobile navigation, accessibility and recoverable errors across those screens. Add related questions and personal discovery after the main journey is reliable.

### Product principles

1. Put the student's next useful action near the content they are using.
2. Make explanations and questions easier to read than surrounding controls.
3. Preserve work when a request fails or sign in is required.
4. Describe trust accurately through role, authorship and answer status.
5. Prefer a few complete interactions over many unfinished features.

## 2. Current application and proposed scope

The source currently contains these routes and capabilities. Their presence in code does not establish current live availability or full browser verification.

| Area | Existing route or component | Improvement direction |
| --- | --- | --- |
| Explore | `/`, `Feed` | Search visibility, compact introduction, filter clarity and readable cards |
| Account access | `/login`, `/signup`, `AuthPage` | Return to intended task, clear validation and password visibility |
| Ask | `/ask`, `Ask` | Guided question writing, draft recovery and image feedback |
| Edit question | `/doubts/:id/edit`, `Ask` | Safe cancellation, retained attachments and clear save feedback |
| Discussion | `/doubts/:id`, `Detail`, `AnswerCard` | Strong answer hierarchy, acceptance wording and preserved browsing context |
| Profiles | `/users/:id`, `Profile` | Clear contribution lists and self-service navigation |
| Moderation | `/admin`, `Admin` | Distinct report actions, confirmation and recovery |
| Shared interface | `Navbar`, `DoubtCard`, `Pager`, `ErrorBox`, `Loading`, `Empty` | Consistent mobile and accessible interaction patterns |

Already represented in the source: subject and semester filters, tags, voting, accepted answers, comments, teacher/admin roles, reports and optional screenshot uploads. Improve these rather than rebuilding them as new features.

### Priority definitions

| Priority | Meaning | Included work |
| --- | --- | --- |
| P0 | Required before calling the redesign complete | Main task flow, mobile usability, form recovery, clear status, keyboard access |
| P1 | Next improvement after P0 is verified | Related-question discovery, contribution shortcuts, better draft recovery and refinement |
| P2 | Separate product expansion | AI guidance, live tutoring, notifications, bookmarks and advanced reputation |

No schedule or completion claim is implied by these priorities. Website changes require implementation and verification after this document is approved as the working direction.

## 3. Audience and core journeys

### Students asking questions

They need to explain where they are stuck, choose relevant academic context and know whether their question was saved. They should be able to browse before creating an account.

### Students and teachers answering

They need to find relevant questions and write explanations with examples. Their role should be visible without overpowering their answer.

### Administrators

They need enough context to distinguish a problematic report from problematic content, and understand the consequence of each action.

### Journey A Find an existing explanation

1. Open Explore.
2. Search for a concept or specific question.
3. Narrow results by subject, semester or status when useful.
4. Open a discussion and read the question before the answers.
5. Return to the same query, filters and page using browser Back.

**Success:** the student reaches relevant content without signing in and does not lose browsing context.

### Journey B Ask a doubt

1. Choose **Ask a doubt**.
2. Sign in if necessary, then return to the intended task.
3. Enter a specific title and academic context.
4. Explain the question and what has already been tried.
5. Optionally attach a supported screenshot.
6. Review and submit once.
7. Open the discussion that the server saved.

**Success:** the question persists, the student sees it, and failures preserve their work.

### Journey C Answer and accept

1. Find a question relevant to the contributor's subject knowledge.
2. Read the existing answers before contributing.
3. Explain the reasoning and add an example where helpful.
4. Submit and see the saved answer.
5. The question author can mark one answer accepted or remove acceptance.

**Success:** answer submission is clear, acceptance reflects the author's choice, and votes remain a separate signal.

## 4. Navigation and information architecture

### Desktop navigation

- Logo links to Explore.
- **Explore** is the main browsing destination.
- **Ask a doubt** is the primary action.
- Signed-out users see **Sign in** with an accessible path to **Create account**.
- Signed-in users see their profile and **Sign out**.
- Administrators see **Moderation**; server authorization remains authoritative.

Do not add empty destinations such as Chat, AI tutor or Notifications to make the navigation appear more complete.

### Mobile navigation

- Use a compact logo and accessible menu control when links cannot fit.
- Keep Ask easy to reach without covering the discussion or keyboard.
- Show search near the top of Explore.
- Put secondary account actions in the menu.
- If a fixed bottom action is used, reserve space for it and test device safe areas.
- A menu or filter dialog must support Escape, focus containment, a labelled close control and focus return.

### Browsing context

Keep search, subject, semester, status, tag and page state in the URL where the existing API supports them. Reset pagination when a search or filter changes. Opening a result must not discard the previous Explore context.

Add a **My questions** shortcut to the signed-in user's existing profile question tab before considering a separate dashboard.

## 5. Explore feed specification

### Content order

1. Compact introduction and primary Ask action.
2. Search field with a persistent label.
3. Filters and active-filter summary.
4. Results count or loading state.
5. Question list.
6. Pagination.
7. Optional writing tips or secondary information.

The current introductory hero can remain expressive on desktop, but should not push search far below the first phone screen. A returning student should reach useful controls quickly.

### Search

- Label: **Search questions**.
- Placeholder: **Search a topic, concept or question**.
- Enter and the Search button perform the same action.
- Keep the submitted query visible.
- Use the current supported keyword search first; do not label it semantic search.
- Avoid an API request on every keystroke unless request control and loading behaviour are deliberately implemented.
- Reject stale responses so older results cannot replace a newer search.

### Filters

Use existing subject, semester, question status and tag capabilities. Show readable selected values and **Clear filters**. On phones, allow a compact filter panel with a visible count of active filters.

Keep status meanings explicit:

| Label | Meaning |
| --- | --- |
| All questions | No status restriction |
| Unanswered | No posted answers |
| Answered | At least one answer, where supported by the existing filter contract |
| Accepted answer | The question author has selected an answer |

Map interface labels to the API's real supported values. Do not add a filter that the server cannot apply. An answered question is not automatically an accepted or factually verified question.

### Question card anatomy

- Subject and semester.
- Specific title linking to the discussion.
- Short body preview, visually limited without changing the stored content.
- Tags when present.
- Answer count and acceptance status.
- Author, role when relevant and date.
- Votes as secondary information.

Make the title the clearest target. Avoid nesting buttons or links inside a single card-wide link. Use correct singular and plural labels. Long titles, names and tags must wrap without widening the page.

### Empty and no-result states

| Situation | Suggested copy | Action |
| --- | --- | --- |
| No community questions | No questions yet. Start with a concept you want to understand. | Ask a doubt |
| No matching search | No questions match your search. Try fewer keywords or clear your filters. | Clear filters; Ask a doubt |
| Feed request failed | We could not load questions. Try again. | Retry |

Keep a failed request distinct from a successful response with zero results.

## 6. Ask and edit form specification

### Fields and guidance

| Field | Guidance | Requirement |
| --- | --- | --- |
| Title | Ask one specific question, such as How does 3NF differ from BCNF | Required; respect existing 160-character maximum |
| Subject | Choose the closest academic subject | Required; reuse the existing subject list |
| Semester | Choose the relevant semester | Required; existing range 1 to 8 |
| Question details | Include the problem, relevant context and exact point of confusion | Required; respect existing 12000-character maximum |
| Attempt | Explain what you tried and where it stopped making sense | Guidance within the body initially; separate optional field only after data/API design |
| Tags | Add a small set of relevant topic labels | Match current server rules; each stored tag has a 24-character maximum |
| Screenshots | Attach only what helps explain the question | Optional; current documented limit is 3 JPEG/PNG/WebP images, 3 MB each |

Confirm all minimum lengths, tag-count limits and upload rules against current server validation before changing controls. Schema limits alone are not the entire validation contract.

### Example question

**Title:** Why is this relation in 3NF but not BCNF?

**Details:** I understand that BCNF requires every determinant to be a superkey. For relation R with the dependencies provided in our exercise, I can find the candidate keys but cannot decide which dependency violates BCNF. I tried checking each determinant. Could someone explain the decision using a small example?

Examples shown as guidance should not become prefilled content that students accidentally publish.

### Form behaviour

1. Provide persistent labels and helper text.
2. Validate after a useful interaction or submission, rather than showing errors on untouched fields.
3. Associate field errors with the correct control.
4. On invalid submission, focus the first invalid field or an accessible summary.
5. While submitting, use **Posting** or **Saving changes** and prevent duplicate submissions.
6. On success, navigate using the saved question ID returned by the server.
7. On failure, preserve title, body, academic context and valid attachment references.
8. Warn before abandoning meaningful unsaved changes; do not warn after a successful save.

### Draft recovery

P0 requires retaining the in-memory form after recoverable request errors. P1 may add session-scoped draft restoration across navigation or refresh.

If draft persistence is introduced:

- Scope drafts to the account and the create/edit context.
- Never restore one account's draft into another account's form.
- Clear or offer removal of saved drafts after successful submission and on sign out.
- Store no password, authentication token or raw uploaded file in draft text storage.
- Explain draft restoration and provide **Discard draft**.
- Do not claim a screenshot is safely saved when its upload has not completed.

### Image interaction

Show supported types and size/count limits before selection. Give each image a preview, upload state and labelled Remove control. Preserve valid existing attachments when editing. Allow retry or removal for a failed upload. Submission should not race with unfinished uploads.

## 7. Question detail and answer specification

### Reading order

1. Back to results, preserving browsing context where available.
2. Question title.
3. Subject, semester, author, role and date.
4. Full question body and attachments.
5. Tags and contextual actions.
6. Answer count and a clearly described ordering.
7. Answers.
8. Answer composer or sign-in prompt.

Keep the main reading column comfortable. Images must scale within it. Preserve line breaks. If code formatting is introduced, handle code safely and provide horizontal scrolling within code blocks rather than across the page. Do not render user-supplied HTML directly.

### Answer writing

Suggested guidance: **Explain the reasoning, show the steps and add an example where useful.**

Use a labelled textarea first. A rich editor is optional work, with separate keyboard, sanitization and formatting requirements. Preserve answer text after failures and only clear it after confirmed success.

If answers are reloaded or reordered after submission, keep the student oriented by locating their saved answer and announcing success. Do not unexpectedly move keyboard focus on unrelated background refreshes.

### Acceptance, role and votes

| Signal | Accurate meaning | UI rule |
| --- | --- | --- |
| Accepted answer | Selected by the question author as helpful for their doubt | Use icon and text; author-only controls |
| Teacher | Account assigned the teacher role by an administrator | Do not call independently verified without a real process |
| Votes | Community feedback | Keep separate from acceptance and role |
| Reputation | Contribution score under the existing rules | Explain its basis; avoid implying expertise certification |

Prefer **Accepted by question author** over an unexplained green Solved label. If the existing interface keeps **Solved**, provide adjacent explanatory text. Only one answer can be accepted for a question; removing or changing acceptance must update the visible state after server success.

### Comments and actions

Keep comments for clarification rather than presenting them as full answers. Keep edit, delete and report actions secondary. Show controls according to ownership/role while retaining server-side permission enforcement.

Before deleting an answer, explain whether its comments will also be deleted. Provide Cancel. When content is already gone, show an appropriate unavailable state rather than a broken page.

## 8. Authentication and profiles

### Account forms

- Use visible labels and appropriate autocomplete attributes.
- Support password managers and pasted passwords.
- Add a labelled Show password control.
- Keep entered non-secret values on a recoverable error.
- Do not persist passwords in draft storage.
- Use clear feedback without exposing unnecessary account information.
- Preserve the intended task when asking the student to sign in.
- Accept only valid internal destinations for any return URL.
- Do not show password recovery as a working feature until its backend and delivery flow exist.

### Profile experience

Show name, semester, role, join date and contributions. Keep public email hidden. Only the owner can edit their profile unless an authorised administrative workflow is provided.

Clearly distinguish Questions and Answers. If a list is capped, label it as recent contributions rather than implying the displayed count is a lifetime total. Do not add a total count until the server supplies an accurate value.

## 9. Moderation experience

Use separate Users and Reports views. On phones, allow a contained table scroll or accessible stacked records rather than squeezing every column.

### Report review

Show content type, content excerpt or unavailable state, report reason, reporter context and a discussion link when valid.

| Action | Meaning | Feedback |
| --- | --- | --- |
| Dismiss report | Close the report without removing the content | Report dismissed |
| Remove content | Remove the reported question or answer under the existing deletion rules | Content removed; explain affected discussion data before confirmation |
| Suspend account | Restrict the account under existing server behaviour | Access suspended |
| Restore access | Remove the account restriction | Access restored |
| Change role | Assign or remove the teacher role | State the new role |

Prevent repeated actions while a request is running. On failure, retain report context and offer retry. Do not add Undo unless the backend actually supports restoration. Changing a role or suspension status must not rely on a client-only toggle.

## 10. Visual system

Retain the application's existing indigo direction and spacing rhythm. Use visual polish to improve hierarchy rather than adding decoration to every surface.

| Token | Proposed value | Intended usage |
| --- | --- | --- |
| Primary | `#4F46E5` | Main actions and selected navigation |
| Primary hover | `#4338CA` | Primary interactive hover state |
| Page | `#FAF9FC` | Application background |
| Surface | `#FFFFFF` | Cards and forms |
| Main text | `#30283F` | Titles and body |
| Secondary text | `#62566F` | Supporting readable text; replace overly light text where needed |
| Border | `#E7E3ED` | Decorative boundaries; stronger borders where control visibility needs them |
| Success accent | `#16A34A` | Status decoration with text or icon |
| Danger accent | `#DC2626` | Destructive status; validate actual text/button combinations |
| Radius | `8px` | Shared cards and controls |
| Spacing | `8, 16, 24, 32, 48px` | Padding, gaps and section rhythm |

Suggested web typography: 16px body with about 24px line height; 14px supporting text; 24–32px main screen titles on phones; restrained larger introductory text on wide screens. Aim for roughly 65–75 characters per line for long explanations.

These are proposed tokens, not a passed contrast audit. Check actual foreground/background pairs, including hover, disabled, focus, link and error states. Do not use the success accent as small text on white without checking and adjusting its contrast.

Use icons consistently and pair unfamiliar icons with labels. Avoid unnecessary gradients, animation, stock illustrations and large empty heroes that compete with questions.

## 11. Responsive and accessible interaction

### Responsive checks

Test at 360, 390, 768, 1024 and 1440 CSS pixels. Choose breakpoints based on where content stops fitting rather than device names.

- No horizontal page scrolling from cards, tags, navigation or images.
- Primary controls remain reachable when a software keyboard is open.
- Long emails in administrator views remain contained.
- Header menus do not cover focused controls without a way to dismiss them.
- Sidebars move below the main task or collapse when space is limited.
- Text remains usable at increased zoom and browser text size.

### Accessibility requirements

- Semantic headings and one clear main content region.
- Working Skip to content link.
- Complete keyboard navigation and visible focus.
- Visible labels and programmatically associated errors.
- Meaningful names for menu, remove image, vote and password controls.
- Status communicated through text as well as colour.
- Screen-reader announcements for important save and error outcomes.
- Focus return after closing a modal or menu.
- Reduced-motion support for nonessential animation.
- Proposed minimum touch targets of 44 by 44 CSS pixels for primary interactive controls.

Run manual keyboard and screen-reader checks. Automated checks help find issues but do not establish complete accessibility.

## 12. Shared interaction states and copy

| State | Behaviour | Suggested copy |
| --- | --- | --- |
| First load | Reserve reasonable space; show a labelled loading state | Loading questions |
| Refresh | Retain useful content where appropriate; indicate progress | Updating results |
| Successful question | Open saved discussion and confirm once | Your question has been posted |
| Successful answer | Show the saved answer | Your answer has been posted |
| Submission failure | Retain input and allow retry | We could not save your question. Your text is still here |
| Session expired | Preserve recoverable work and guide sign in | Sign in again to continue |
| No answers | Encourage a contribution without claiming help is guaranteed | No answers yet. Share an explanation if you can help |
| Question unavailable | Offer a useful exit | This question is no longer available |
| Upload failure | Identify the affected file | This image could not be uploaded. Retry or remove it |

Use a nearby field error for a correctable input problem and a page/form-level error for a request failure. Avoid generic Something went wrong messages when the interface can provide a useful explanation. Do not show raw stack traces or service credentials.

## 13. Related questions and discovery

Implement after the main flow is stable.

### Before posting

Use existing keyword search as the first version. Offer **Check similar questions** once a meaningful title exists. Show a small list with title, subject and answer status. The student can open a result without losing their draft or continue posting if the results do not help.

Do not block posting because a superficially similar title exists. Do not describe keyword matches as AI understanding.

### After reading

Suggest a few discussions using shared subject or tags, excluding the current question. Prefer a simple, explainable rule first. If the API lacks this capability, treat it as a backend task rather than downloading the full question database into the browser.

Bookmarks, followed topics and notifications require their own persistence and interaction design. A static button that does not save anything is not a completed feature.

## 14. Implementation map and dependencies

Paths below are relative to the `student-doubt-forum` project root.

| File or area | Work |
| --- | --- |
| `client/src/pages.jsx` | Feed hierarchy, Ask guidance and recovery, discussion readability, profile and moderation states |
| `client/src/components.jsx` | Navigation, question cards, status language, accessible shared controls |
| `client/src/styles/variables.css` | Shared colour, spacing and control tokens |
| `client/src/styles.css` | Responsive layout, reading widths, focus, overflow and state presentation |
| `client/src/main.jsx` | Route handling only if new destinations or recovery routes are required |
| `client/src/context.jsx` | Session-aware task recovery and shared status behaviour where appropriate |
| `client/src/api.js` | Consistent request errors and cancellation support where needed |
| `server/src` | Only required API, validation, query or persistence changes; retain existing authorization |
| `docs/TESTING.md` | Record actual checks, dates, environment and unresolved limitations |

### Dependency order

1. Agree on shared status meanings and component patterns.
2. Update visual tokens and responsive shared controls.
3. Improve Explore and preserve browsing context.
4. Improve Ask/edit recovery and validation.
5. Improve discussion and acceptance clarity.
6. Check account, profile and moderation journeys.
7. Add related questions and persistent drafts if prioritised.
8. Perform a full acceptance pass on the implemented result.

A frontend-only label or layout change should not require a database migration. Separate attempt fields, bookmarks or new notification models require an explicit data/API plan.

## 15. Acceptance checklist

Unchecked items are work to verify, not claims that the current application fails them.

### Explore

- [ ] Search is easy to find at 360 and 390px widths.
- [ ] Keyboard and Search button produce the same results.
- [ ] Active filters are understandable and removable.
- [ ] Changing filters resets pagination.
- [ ] Back restores the previous query, filters and page.
- [ ] No-results, loading and failed-request states are distinct.
- [ ] Long question titles and tags do not cause page overflow.

### Asking and editing

- [ ] Required fields, limits and image rules appear before submission.
- [ ] Field errors identify the affected input.
- [ ] Failed saves preserve typed content.
- [ ] Repeated clicks do not create unintended duplicate requests.
- [ ] A confirmed save opens the correct discussion.
- [ ] Cancel and unsaved-change handling work on create and edit.
- [ ] Existing attachments remain intact during edits.
- [ ] Upload failure and unfinished upload states are recoverable.

### Discussion

- [ ] Question content, answer content and comments have distinct hierarchy.
- [ ] Accepted status is explained and separate from votes and role.
- [ ] Acceptance controls are shown to the question author and enforced by the server.
- [ ] Failed answer submissions preserve the answer text.
- [ ] Images and long content stay inside the reading area.
- [ ] Deleted or unavailable discussions have a useful exit.

### Account and moderation

- [ ] Sign in returns the student to the intended internal destination.
- [ ] Public profiles do not reveal email addresses.
- [ ] Draft recovery does not expose another account's content.
- [ ] Report dismissal and content removal have different confirmations.
- [ ] Destructive actions explain their consequences.
- [ ] Unauthorised access remains rejected by the server.

### Visual and accessibility review

- [ ] All supported widths are checked in a real browser.
- [ ] Main journeys work using only the keyboard.
- [ ] Focus remains visible and logical after dialogs and navigation.
- [ ] Labels, errors and important status messages are announced appropriately.
- [ ] Actual colour combinations pass the chosen accessibility target.
- [ ] Increased zoom and long content remain usable.
- [ ] No core action depends only on hover or colour.

## 16. Verification and usability study

Run the existing production build after code changes. Use existing integration coverage for changed server behaviour. Add targeted tests only for meaningful new behaviour, such as safe return destinations, draft isolation or changed filtering; avoid tests that merely repeat style values.

Manually exercise these flows:

1. Signed-out search and read.
2. Ask from a protected route, sign in and continue.
3. Failed question save followed by a successful retry.
4. Second account answering the first account's question.
5. Question author accepting and changing an accepted answer.
6. Upload failure and valid image recovery if image changes are included.
7. Administrator review and a denied non-administrator action.
8. Phone layout and keyboard navigation.

Use disposable, clearly labelled test content. Do not mutate real student discussions to demonstrate the flow.

### Student sessions

Invite five students for exploratory sessions. Ask each to find a DBMS explanation, post a question, answer a peer and locate an earlier contribution. Record task completion, time, hesitation, errors and recovery. Include phone use and keyboard navigation.

Proposed target: at least four of five students finish each core task without intervention. This is a planning target, not a measured result or a statistical claim. Establish a baseline before stating that the redesign improved performance.

If analytics are introduced, define events such as search submitted, question saved and answer saved. Do not log raw question bodies, passwords or private account data merely to measure completion. Anonymous browsing metrics cannot prove that a student understood an explanation.

## 17. Future features and release boundaries

| Feature | Consider when | Required design decisions |
| --- | --- | --- |
| Bookmarks | Students need to revisit useful discussions | Persistence, removal, empty state and account scope |
| Notifications | Students repeatedly miss replies | In-app delivery, unread state, preferences and failure behaviour |
| AI hints | Core explanations and community flows are reliable | Label AI output, handle uncertainty, preserve teacher/community distinction and provide fallback |
| Live tutoring | Staffing and scheduling are available | Tutor availability, sessions, cancellations, accessibility and operational support |
| Rich text editor | Plain text limits real explanations | Keyboard support, safe rendering, code and math behaviour |

Complete the core acceptance checklist before expanding the primary navigation around these features.

## 18. Research references

The companion research report reviewed public sources on 9 November 2026. The references below explain the design inspiration; they do not establish that this project is affiliated with these services or that its interface has been usability-tested against them.

| Reference | Relevant pattern |
| --- | --- |
| [Stack Overflow tour](https://stackoverflow.com/tour) | Structured Q&A, tags, votes and author acceptance |
| [Sarthaks eConnect](https://www.sarthaks.com/) | Academic question search and community discovery |
| [Brainly](https://brainly.com/) | Guided learning and manageable explanation steps |
| [Chegg Homework Help](https://www.chegg.com/homework-help) | Subject context and organised explanations |
| [Photomath overview](https://support.google.com/photomath/answer/14328660?hl=en) | Clear problem input and solution steps |
| [Khanmigo](https://www.khanacademy.org/khanmigo) | Learning prompts and guided reasoning |

Use these as interaction references. Prioritise your own students' needs, existing project capabilities and observed usability issues when making final decisions.
