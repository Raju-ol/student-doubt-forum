> Historical report or design milestone. For current implementation and verification limits, read [CURRENT_STATE](CURRENT_STATE.md) and [design review](DESIGN_CONSISTENCY_REVIEW.md). This record does not certify the latest release.

# Design v3 change record

Rebuilds the site chrome and the two main pages to match the supplied mock-ups: a left sidebar
(Explore, Library, Saved, My Profile, "Learn · Ask · Grow" card), a peach light theme and a purple
dark theme, an Explore page with hero, subject chips, filters, question cards and side widgets,
and a Library page of downloadable study resources.

## What changed

| Area | Change |
| --- | --- |
| Shell | `Navbar` now renders a top bar (search, Ask a Doubt, bell, account menu) and a sidebar. Below 1024 px the sidebar is a drawer opened by the Menu button; phones keep the bottom tab bar. |
| Themes | Two looks only: Light (peach) and Dark (purple), plus Auto. The old Sticker, Chalkboard and Bento looks are retired; a stored `bento` choice falls back to Auto. |
| Explore | Hero, subject chips (DBMS, Python, Operating Systems, Java, Web Development, then an Others menu), a Filters popover, question cards with avatar, subject, Resolved/Unresolved/Unanswered status, answers, views and asker, Trending Topics and Quick Links. |
| Status wording | Accepted answer is **Resolved**. No accepted answer is **Unresolved**. No replies at all is **Unanswered**. |
| Library | `/library` lists shared resources (Notes, Previous Year Papers, Cheat Sheets, Books, Others) with Download or Open, Popular Resources and an Upload Resource card. `/library/share` shares a file or an https link. The 200 sample questions moved to the Worked Q&A link (`/?scope=all&tag=study-library`). |
| Contributors | `/contributors` lists the top 10 students by reputation. |
| About | `/about` ("How it works", linked from the menu card and the footer) is a static guide with a Student, Teacher and Admin/moderator picker, step-by-step tasks, a feature table with links, limits, house rules and an FAQ. `server/tests/about-page.test.js` checks that every link on it is a real route. |
| Other pages | Question detail, Ask, Profile and sign-in pick up the new look through re-pointed colour tokens in `client/src/design-v3.css`. |

## Server additions

* `Doubt.views`: incremented on every question detail fetch.
* `Resource` model and `server/src/resources.js`: `GET /resources`, `GET /resources/popular`, `POST /resources`, `GET /resources/:id/download` (counts, then redirects), `DELETE /resources/:id`.
* `GET /tags/trending` (30 days, sample library excluded) and `GET /contributors`.
* Default subject catalogue gains **Python** and **C and C++**. They are inserted on the first request after deploy and need no migration.

## Things to know

* **File uploads need Cloudinary.** Without `CLOUDINARY_API_SECRET` the upload option answers "File uploads are not configured yet. Share a link instead." Links work without it.
* **Upload limit is 4 MB** because Vercel functions reject request bodies over about 4.5 MB. The server also checks the file's leading bytes, so a renamed file is refused.
* **Nothing is pre-filled.** The Library starts empty, and Trending Topics fills as students tag questions. Seed it with real notes before demo day.
* Question avatars are coloured initials. The mock-ups use photos, which would need an avatar-upload feature.

## Tests

`server/tests/resources.test.js` (links, categories, download redirect, delete rules, trending tags, views, contributors), `server/tests/format.test.js`, and updated `explore`, `components` and `theme` tests for the new markup and the two-look theme switcher.
