<!-- consistency-review-2026-11-13 -->
> Current status, 13 November 2026 — See [current implementation and limits](CURRENT_STATE.md). The active design has Auto/Light/Dark themes and a separate community resource Library. Institution-scoped curriculum and publication review remain planned. Older counts, release IDs and provider checks below are dated evidence, not current certification.

# Continue Student Doubt Forum

> **Status update 13 November 2026.** Code reference: `main` at `d56cec9` is live. Two branches are pushed to GitHub but **not merged or deployed**: `feat/design-v3` (`ca187ed`, the sidebar redesign and resource library) and `fix/review-bugs` (`deb4702`, built on the redesign, with the bug fixes). Details: [Design v3 change record](DESIGN_V3_CHANGE_RECORD.md), [Bug fix report](BUG_FIX_REPORT.md), [Polish plan](POLISH_PLAN_NOV_2026.md).

**Next steps.** (1) Review the two branches and merge. (2) After deploying, run `node scripts/live-upload-smoke.js <https-origin>` and re-check Google sign-in and Gmail recovery. (3) Add real notes or links to the Library and real questions to the forum ([draft](SEED_QUESTIONS_DRAFT.md)). (4) Decide what to do with the interim `/library` page before the institution library is built. Older instructions below still apply; where they mention code reference `827e8df` or the old themes, they are historical.

Updated 10 November 2026. This is the current handoff.

1. Open the repository root student-doubt-forum and read [project context](../PROJECT_CONTEXT.md), [A–Z playbook](DOUBT_FORUM_A_TO_Z_PLAYBOOK.md) and the relevant [API notes](API.md).
2. Run git status --short and git log -5 --oneline. Preserve existing local work and dated verification evidence. Keep private values in the provider dashboards or ignored local environment.
3. Use [the stable production URL](https://student-doubt-forum-theta.vercel.app/) for Google sign-in checks and the [published Study Library](https://student-doubt-forum-theta.vercel.app/?scope=all&tag=study-library) for demo data. Use isolated local/staging data for destructive operations, imports, load tests and failure simulation.
4. Run npm test, npm run build, and relevant browser checks. Record the actual commit, environment and pass/blocked/not-run results in [TESTING.md](TESTING.md).
5. Update the affected guide and keep the [owner checklist](OWNER_NEXT_STEPS_HINGLISH.md) current. Track a launch blocker separately from the college demo checklist.

Current code reference is 827e8df. Google sign-in, Gmail recovery and notifications have owner confirmation. The Study Library is already published. The full manual cross-role run, durable Atlas access, restore drill and isolated release path remain open.

## Copyable AI handoff

> Read README.md, PROJECT_CONTEXT.md, docs/DOUBT_FORUM_A_TO_Z_PLAYBOOK.md and docs/CONTINUE_HERE.md in the student-doubt-forum repo. Review the code for the requested change and preserve any work already in progress. Use the stable public URL https://student-doubt-forum-theta.vercel.app/ for authorized read-only checks. Use an isolated database for write, failure and load testing. Keep secrets private. Report what changed, how you verified it, and what needs the owner.
