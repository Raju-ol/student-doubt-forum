<!-- consistency-review-2026-11-13 -->
> Current status, 13 November 2026 — See [current implementation and limits](CURRENT_STATE.md). The active design has Auto/Light/Dark themes and a separate community resource Library. Institution-scoped curriculum and publication review remain planned. Older counts, release IDs and provider checks below are dated evidence, not current certification.

# Owner checklist | Demo aur wider launch

Updated 10 November 2026. Live website is usable for a college demo and limited beta. Google login, Gmail recovery and in-app notifications have been confirmed by the owner. The Study Library is already published.

## College demo

1. [Stable site](https://student-doubt-forum-theta.vercel.app/) kholo. Normal browser mein QA Student A aur Incognito mein QA Student B use karo. Credentials privately rakho.
2. A se question post karo. B se reply karo. A ka notification aur unread count dikhao, phir answer accept karo.
3. [Study Library](https://student-doubt-forum-theta.vercel.app/?scope=all&tag=study-library) se ek sample question aur labeled AI explanation dikhao. Search, subject filter aur dark-mode dropdown demo karo.
4. Mentor ko [A–Z playbook](DOUBT_FORUM_A_TO_Z_PLAYBOOK.md), live URL and repo do. Admin walkthrough ke liye [role guide](ADMIN_HINGLISH.md) follow karo.

## Wider launch se pehle

1. Atlas mein actual IP rule expiration aur application database user ka role verify karo. Durable Vercel-to-Atlas connection choose karne ke baad real health check repeat karo.
2. Separate staging database rakho. Encrypted backup ka isolated restore karke counts aur sample threads compare karo.
3. [Tester checklist](TESTER_PLAYBOOK.md) ke cross-user flows finish karo. Recovery ke liye real inbox wala eligible password account use karo. QA sample addresses mail receive nahi karte.
4. Vercel function, Atlas aur Upstash regions record karo. Cold/warm Server-Timing compare karo, phir measured bottleneck par decide karo.
5. Review concurrent writes, interrupted cleanup and provider failure handling in [production readiness](PRODUCTION_READINESS_REVIEW.md). Google and email settings ke liye [deployment guide](VERCEL_HINGLISH.md) use karo.
