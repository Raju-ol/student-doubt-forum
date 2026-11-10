# Doubt Forum redesign plan

Prepared 10 November 2026 for review. Design reference is the supplied 16-screen Campus Desk image. This plan covers a visual and navigation proposal for the existing Doubt Forum.

## 1. Design decision

Keep the Doubt Forum name throughout the redesign. Keep the purple accent for the first comparison. Borrow the reference's search-first layout, clear typography and question rows. Use a compact introduction with a prominent search field and **Ask a doubt** action. Reduce the space between navigation and useful content. Give mobile controls comfortable spacing and let long titles wrap.

The main test is whether a student can find a relevant question or start asking one faster. Start with Explore and expand after reviewing it in both themes and on mobile.

## 2. What the current app already supports

| Reference area | Current implementation | Proposed treatment |
| --- | --- | --- |
| Home and search results | Explore and search share the root route. Search and filters use URL parameters. | Keep one page and give the results state a heading such as “Results for normalization”. |
| Browse subjects | The catalogue feeds the Explore filter and a desktop sidebar. | Add quick subject links on Explore. Consider a dedicated subject directory after the pilot. |
| Subject and topic | Subject and tag filters already exist. There is no separate curated subject-to-topic hierarchy in the current flow. | Reuse subject filters and tags for the pilot. Plan topic curation, URLs and editor integration separately if needed. |
| Question detail | Accepted answers, Markdown, screenshots, votes, reports and comments already exist. | Make the question, accepted answer and other answers visually distinct while retaining every action. |
| Ask and edit | Both use the existing editor, attachments, tags and unsaved-change handling. | Simplify spacing and field grouping after Explore is approved. |
| Sign-in and profiles | Google and password sign-in, recovery, profile editing and account tools exist. | Carry the same visual styling through later. Keep current sign-in and account flows. |
| Admin and error screens | Users and reports are tabs in the existing moderation view. A catalogue and fallback states also exist. | Improve readability and action hierarchy after the student screens. Add separate routes only if a clear need emerges. |

**Status wording.** The current open filter means “No accepted answer” and may include threads with replies. Keep that label. Show “0 answers” only when the actual count is zero. “Solved” should correspond to an accepted answer.

## 3. Phase 1 | Explore prototype for approval

| Order | Desktop | Mobile |
| --- | --- | --- |
| Header | Keep the current logo, menu and theme controls. Use one prominent Ask action. | Keep the existing mobile menu and make Ask easy to reach. |
| Search | Compact “Find an answer” heading with a visible label and submit action. | Search fills the available width. |
| Discovery | Show a short set of subject shortcuts, an all-subjects control and a Study Library link. | Show the same actions above results with wrapping as needed. |
| Filters | Put scope, subject and status near results. Keep academic level accessible. Show active filters and a clear action. | Use a visible Filters button with an active count if the controls take too much space. |
| Results | Use compact rows with title, subject, answer count and acceptance status. Keep useful metadata, such as date and tags, secondary. | Stack the metadata below the title. Keep row actions readable and give long titles room. |

Use the existing Explore route, catalogue request, API and pagination. Preserve search submission, filter URLs, browser back/forward, college defaults and the existing Study Library link. Keep loading, empty and error-with-retry states. Use existing theme variables so the controls stay readable in System, Light and Dark.

After approval to build a prototype, keep the initial patch to Explore and its scoped styles. Review it locally with representative results before deciding whether to deploy. Avoid changing the shared card on profile pages as a side effect. Relevant files are [pages.jsx](../client/src/pages.jsx), [components.jsx](../client/src/components.jsx), [styles.css](../client/src/styles.css), [p0.css](../client/src/p0.css) and [theme variables](../client/src/styles/variables.css).

## 4. Phase 2 | Complete the question journey

1. **Question detail.** Establish a clear reading order for the original question, accepted answer, other replies and answer composer. Verify images, maths and long code samples on a narrow screen.
2. **Ask and Edit.** Group title, subject, academic information, editor and attachments in a clear sequence. Preserve keyboard access, validation, current permissions and unsaved-change protection.
3. **Browse subjects.** If the shortcuts prove useful, add a directory using the existing catalogue. Have each subject link into filtered results. Review any separate topic model before defining an API or migration.

## 5. Phase 3 | Apply the approved design elsewhere

Bring the final spacing, buttons and status treatments to sign-in, signup, profiles, account, notifications, moderation and error screens. Prioritize student-facing screens first. Consider a curated topic hierarchy or future mentor-room navigation as separately scoped feature work.

## 6. Review and release checks

- Compare current and proposed Explore side by side at 360 px, 768 px and desktop width in Light and Dark. Check System follows the device preference.
- Use three tasks with a couple of students if available. Find a DBMS answer, switch between college and worldwide results, and start asking a question. Record where they hesitate or choose the wrong filter.
- Use a keyboard to search, change filters and open a result. Verify visible focus, clear labels, readable status badges and usable touch targets. Check long titles and browser zoom.
- Test direct links and browser back/forward, signed-out and signed-in college behavior, loading, retry, empty results, pagination and the Study Library link.
- Run the existing tests and build once implementation begins. Compare Explore requests with the current version. The first redesign should add no feed or catalogue request.
- **Decision gate.** Proceed past Explore only if search, filters and status are easier to find and the current flows still work. If the feed feels too dense, adjust the row spacing and metadata before extending the design.

## 7. Decisions for review

- Recommended starting style is a warm neutral light surface with the current Doubt Forum purple. Adapt the same hierarchy to dark mode.
- Recommended first scope is Explore only. Review subject pages and topic taxonomy separately. After the redesign is complete, the owner may choose a new name. Treat that as a separate branding change and review the logo, browser title, metadata and documentation together. A URL change is a separate decision.
- Existing infrastructure is enough for the visual pilot. The plan needs no new paid design assets, hosting or API.

## 8. Implementation status (10 November 2026, for review)

Explore and Question Detail are redesigned in the workspace. Nothing is deployed.

- **Explore.** Compact search and headline, quick views (Study Library, Accepted answers, No accepted answer, Saved), a scrollable subject strip from the catalogue and a flat question list with separators. Scope, answer status and academic level sit behind a **Filters** button with an active count; active filters show as removable chips. At 1366×900 six titles are visible in the first screen (one before). On mobile, Study Library and Ask a doubt sit side by side under the search box.
- **Status wording.** "No accepted answer" uses the existing `status=open` filter, which means no accepted answer and can include replies. Rows show "No answers yet" only when the real count is zero, otherwise "No accepted answer". No zero-answer filter was added: the API counts answers after pagination, so a client-side filter would give wrong page counts. A correct one needs a stored answer count on each question and is a separate server change.
- **Saved questions.** Save/Unsave buttons on rows and on Question Detail. The first version stores up to 200 saves in this browser's local storage (`doubt-forum.saved.v1`) and says so on the Saved view. Blocked storage shows an explanation. The Saved view (`/?view=saved`) makes no feed request.
- **Question Detail.** One reading column: question, accepted answer, other answers (highest voted first) and a separate answer composer, with a "Write an answer" jump button. Markdown, images, votes, comments, reports, accept, edit and delete use the existing components and permissions.
- **Compatibility.** Existing URL parameters work unchanged. `view` is the only new parameter, and it is never sent to the API. Explore still makes one catalogue and one feed request.
- **Checks.** Production build passed. 59 non-database tests passed, including 9 new ones in `server/tests/explore.test.js` and `server/tests/saved-questions.test.js`. A headless Chrome flow run against fixture data covered search, subject strip, quick views, pagination, back to results, browser back, keyboard save/unsave, blocked storage and posting an answer. The database-backed suites still need a local MongoDB and were not run.

## 9. Gen Z themes across the whole site (11 November 2026)

The owner chose the Gen Z directions from the design canvas and asked for them site-wide. The theme switcher now has four choices: **Auto** (Sticker in light mode, After Hours in dark mode), **Sticker** (cream paper, thick ink outlines, hard shadows, lime/pink/yellow accents), **After Hours** (dark-first, purple glow, lime for solved) and **Bento** (soft lilac/peach/mint tiles). Stored values stay `light`/`dark`, so earlier saved choices keep working; `bento` is new.

- All colours live in `client/src/styles/variables.css`. Shape tokens (edge width, shadows, radii, display font, tilt) are set per theme, and `client/src/genz.css` applies them to every shared piece: header, buttons, inputs, panels, badges, tabs, tables, editor, toasts and footer. That carries the look to sign-in, ask/edit, profile, notifications, account, moderation and error pages without changing their logic.
- Fonts are bundled through free `@fontsource-variable` packages (Inter, Space Grotesk, Unbounded, Bricolage Grotesque), because the production Content Security Policy only allows self-hosted fonts.
- Phones get a bottom tab bar (Explore, Library, Ask, Saved, Me/Sign in). The header menu holds the theme switcher, notifications and account links.
- Explore gains a headline and two desktop sidebar cards that link to existing views; no new requests. "Same doubt" counters and answer streaks from the mockups are not built, since they need server changes.
- Checks: `server/tests/theme.test.js` now verifies 4.5:1 contrast for 19 text/background pairs in each theme. Build passed and 59 non-database tests passed. All pages were screenshotted in all three themes at 1366 px and 360 px with sample data, with no horizontal overflow or page errors.

Commit review verified the production build and all 99 tests using local MongoDB. The review restored desktop account and sign-out links and aligned the discovery label with the API's accepted-answer filter. A Chrome check with sample data confirmed all three themes at desktop, tablet and phone widths, plus the Saved-to-question round trip.
