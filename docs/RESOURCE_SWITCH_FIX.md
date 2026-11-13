# Admin/resource tab-switch fix — 13 November 2026

During owner-authorized test-account setup, the live Admin page crashed when switching from Overview to Users. Browser logs showed an undefined `.map` call. The shared resource hook returned the old Overview payload during the first render of the Users tab, before its effect updated the loading state.

The hook now associates each response with its route, session and refresh version. A changed request immediately presents a loading state, never a previous tab's data. Aborted responses are ignored. Disabling a request returns no retained data. This also prevents stale data from another session being shown by the same hook.

A deferred-response DOM regression covers Overview → Users → Reports, a late aborted Users response, and disabling the request. The complete local suite passed 163 tests and the production build passed before publication. Provider configuration and authorization rules are unchanged. Test-account passwords are stored only in a Git-ignored private output folder and are not included in this record.
