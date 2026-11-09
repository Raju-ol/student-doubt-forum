# Raju ke liye: agli baar kya karna hai

10 November 2026. Site abhi limited beta hai. Saare production kaam complete
hone ka claim nahi hai. Technical review aur developer ke remaining tasks:
[PRODUCTION_READINESS_REVIEW.md](PRODUCTION_READINESS_REVIEW.md).

## Abhi aapko coding ya manual testing karne ki zaroorat nahi

Security/reliability fixes, automated checks aur GitHub push maintainer ne
handle kiye. Provider ke secrets ya password is file/chat mein mat daalna.

## Aapke decisions/access chahiye

1. **Sab users ka forgot-password:** abhi owner-only email test kaam kar chuka
   hai. Friends ke email par reset bhejne ke liye Resend mein verified sending
   domain chahiye. Decide karo domain abhi lena hai ya beta mein baad mein.
   Website ka Vercel URL reh sakta hai. Domain lene se MongoDB access solve
   nahi hoga. Koi paid purchase apne aap nahi ki gayi.
2. **Atlas expiry:** `0.0.0.0/0` rule par one-week timer tha. Atlas mein actual
   expiry dekhni hai aur long-term network arrangement/budget decide karna hai.
   Rule expire ho gaya to site ka database connection ruk sakta hai. Temporary
   broad rule ko permanent apne aap nahi banaya gaya.
3. **Backup:** private backup kahan rakhna hai, kitne din rakhna hai aur kitna
   data-loss tolerate kar sakte ho, decide karo. Restore alag database par prove
   karna hai; live data par experiment nahi.
4. **Owner account:** agar real password kisi AI/tester ko diya tha, privately
   password badlo aur Account mein sign out everywhere karo. Provider accounts
   par MFA enable karo. OTP/password mujhe mat bhejna.
5. **Public launch:** support email/contact aur privacy/retention decisions do.
   Launch se pehle separate staging aur CI-pass release process chahiye.

## Developer ka kaam bhi abhi bacha hai

Concurrent votes/reputation aur deletion ko failures ke baad recoverable banana,
attachment claims/cleanup ko reliable banana, large threads/exports ko bound
karna aur notification retry/monitoring improve karna. Ye sab aapko khud code
nahi karna; detailed priority list technical review mein hai.

Manual testing aapki request par postpone hai. Public launch se pehle tester ko
[TESTER_PLAYBOOK.md](TESTER_PLAYBOOK.md) aur known QA gaps dene hain. Sirf Vercel
Ready ya automated tests pass hone se saare user flows certified nahi hote.

Agli session mein bolo: **“Owner next steps kholo, pehle email/domain decision
aur production priority list se continue karo.”**
