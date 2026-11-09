# In-app notifications — 9 November 2026

Notification collection indexes `{user:1,createdAt:-1}` and
`{user:1,readAt:1,createdAt:-1}`. Unique event keys deduplicate one answer event,
one comment event and the first acceptance of an answer. Repeated acceptance of
the same answer does not repeatedly notify. No self/ban/deleted-recipient alerts.

Events: a question receives an answer, an answer receives a comment, an answer is
accepted. The bell links to a paginated private inbox; it checks on visible-page
load/navigation, once per minute while visible, and after read-state changes.
Opening a discussion marks its item read. Users can mark one/all as read. Removed
discussions render a safe unavailable message. Actor projection includes name,
never email. Account export includes owned notifications.

GET `/notifications` returns items/unread/total/page/pages (25/page).
PATCH `/notifications/:id/read` and POST `/notifications/read` only affect the
authenticated user. No public inbox or cross-user read-state mutation.

70 tests/build pass: end-to-end local question/answer/comment/accept events,
self suppression, idempotent event key, private projection, unread counts,
anonymous rejection and owner-scoped marking. No live notifications created by
the agent. Email digest, mentions, push and realtime delivery are not implemented.
Notification insertion is awaited but best-effort after the content mutation;
there is no transactional outbox/retry worker, so a database interruption can
lose an alert without losing the actual post. Not load-tested.
