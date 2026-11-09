# Session revocation

9 November 2026. Recommendations section 3.7 implemented with User.tokenVersion, signed JWT ver claim and per-request comparison. POST /api/v1/auth/logout-all increments the current user's version. Both copied current tokens and older legacy tokens without ver are rejected afterward. Legacy tokens retain compatibility at version zero only. Fresh login receives the current version. Version is not returned in public user data.

The profile supplies a Sign out everywhere action for its owner. Successful revocation clears that tab's session and asks for sign-in. Normal sign-out remains tab-local. Password change/reset is not yet implemented; those future paths must increment tokenVersion too. No production migration is needed because missing versions read as zero.

Tests verify legacy compatibility, old-token denial, anonymous denial and fresh login. Live multi-browser use is not yet verified. The source is tested before push, but Vercel does not wait for GitHub CI on main.
