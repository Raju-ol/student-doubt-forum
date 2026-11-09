# Account data controls — 9 November 2026

GET `/api/v1/users/me/export` streams newline-delimited JSON with an explicit
allow-list of the authenticated user's account details, posts, comments, votes,
reports and upload URLs. No password/recovery hashes, sessions or other users'
private account details. It uses MongoDB cursors with response backpressure and
no-store headers; the browser downloads a private file from Account settings.

DELETE `/api/v1/users/me` requires the current password and confirmation DELETE.
The UI also explains consequences and asks for final confirmation. Admin accounts
are blocked until ownership is transferred through the project owner.

Owned Cloudinary images are removed first, including references in questions.
Provider failure leaves the account accessible for retry, though earlier images
may already have been removed. Another user's images are not targeted. Then an
atomic User update replaces name/email/password with anonymous unusable values,
clears recovery credentials, bans access and increments tokenVersion. This is an
anonymous tombstone, not a physical deletion of the User document. Legacy users
without isDeleted are supported. Deleted profiles return 404; admin lists omit
them and moderation cannot reactivate/promote them.

Discussions, comments and votes stay attached to Deleted user so other authors'
answers and reputation remain intact. Post text may still contain user-entered
personal information; users are told to edit/remove it first. Moderation records
may be retained. Backups, provider logs and screenshots other people downloaded
are not purged by this endpoint. This feature is not a guarantee of complete
erasure or legal compliance.

## Verification

67 tests/build pass before the final deleted-user admin guard. Integration checks
cover private export and exclusions, password/confirmation rejection, legacy
tombstoning, owned image deletion with a mocked Cloudinary adapter, preserving
other images and discussions, profile disappearance and old-session/login denial.
Full suite/build are rerun for the final guards before deployment.

## Not verified / operational limits

No live account deleted or private export downloaded. No real Cloudinary deletion
for this flow. Multi-document cleanup is not transactional; concurrent in-flight
posts/uploads, process interruption, and provider/database failure may require
operator reconciliation. The atomic tombstone prevents later authenticated
requests but cannot undo an already in-flight write. Retained post bodies and
moderation data need a separate review if the user requests removal of specific
personal information. Large browser downloads and recovery from backups are not
load-tested.

Final regression: 75 total tests pass/build/audit clean. Added provider-cleanup failure/retry and admin-deletion rejection coverage. Account anonymization also clears optional college/academic metadata and legacy semester. No live deletion performed.

