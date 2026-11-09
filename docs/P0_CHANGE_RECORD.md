# P0 usability change record

Date: 9 November 2026. Working direction: UI_UX_IMPROVEMENT_PLAN_V1.md.

## Implemented
- Safe internal sign-in return destinations retained across login/signup switching; protected Ask and discussion/vote paths pass the intended destination.
- Show/hide password control and My questions shortcut.
- Nonmodal mobile navigation disclosure, Escape dismissal and focus return. Because it is a disclosure rather than a modal, focus stays in the normal page tab order.
- Compact phone hero, persistent search label, clearer control borders, darker secondary text and larger reading text/touch controls.
- Feed cards retain originating result URL; detail Back to results uses that context. Filters/page remain in URL.
- Correct question/answer singular labels. Open filter now says No accepted answer, matching existing API semantics; it does not claim zero answers.
- Accepted status identifies author selection, separate from voting and teacher role.
- Resource response cancellation now guards successful results too, preventing stale responses from replacing newer data.
- Retry controls on data errors, recent-contribution labels and clearer removal consequences.
- Unsaved Ask/edit warnings on document link navigation and tab unload; create/edit baseline distinguishes initial content from changes. Native browser required/min/max field validation remains authoritative in the client; backend rules unchanged.
- Failed question/answer requests retain existing in-memory text. Upload failures retain other valid attachments; no persistent cross-account draft storage added.

## Verification
- Production build passed.
- Browser protected Ask -> sign-in with returnTo -> successful login -> Ask verified using an existing local demo account.
- Feed horizontal overflow checked at 360, 390, 768, 1024 and 1440 CSS px; document width did not exceed viewport at each size.
- Mobile navigation open/close, Escape and focus return verified at 390px.
- Native unsaved-confirmation automation timed out; the Cancel/stay branch is NOT conclusively browser verified. Browser Back interception is not implemented by the native document-link guard; session draft restoration is still P1.
- Targeted safe-return security test added. Existing integration suite remains applicable because backend contract did not change.

## Remaining acceptance checks
Full screen-reader audit, complete contrast-pair measurement, keyboard journey coverage beyond menu, phone software-keyboard/safe-area checks, simulated upload/save failures, cancellation branches, live moderation mutation review and final public browser verification remain unrun. Do not label every checklist item passed based solely on a successful build or these layout checks.

No P1 related-question/draft persistence feature or P2 product expansion was added. Existing data and credentials are preserved.
