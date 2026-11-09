# Email verification and recovery — 9 November 2026

Implemented behind `EMAIL_ENABLED=1`. It remains disabled on production until the
owner supplies a transactional email provider and verified sender privately.
Existing accounts and posting continue normally while disabled.

## Routes and UI

- POST `/auth/forgot-password` accepts email, returns the same generic success
  body for existing/unknown/banned accounts and delivery failure.
- POST `/auth/reset-password` accepts token/password, atomically consumes the
  hashed unexpired token and increments tokenVersion, revoking all sessions.
- POST `/auth/verification-email` requires a session; resends to that account.
- POST `/auth/verify-email` atomically consumes an unexpired verification token.
- `/account`, `/forgot-password`, `/reset-password`, `/verify-email` provide UI.
- Once enabled, verification is required for creating questions, answers,
  comments and uploads; reading and account management remain accessible.
  Existing accounts are not falsely marked verified: they must request a link.

Tokens are 32 random bytes, stored only as SHA-256 hashes in hidden User fields.
Verification expires in 24 hours; reset in 30 minutes. Reissuing replaces the old
link. Expired values cannot be used; no TTL deletes User records. Links use an
operator-controlled APP_URL and fragment tokens, never an incoming Host header.
The UI clears a successfully consumed fragment from history. Link processing
requires a button submission, avoiding automatic consumption by link scanners.

Resend REST POST uses a bearer header, fixed endpoint, timeout and safe errors.
The API key is server-only. Password validation uses the existing 8-character /
72-byte bcrypt boundary. Shared IP, email and account throttles cover email flows.
No token or provider response is logged. Generic response bodies do not guarantee
constant timing; synchronous mail delivery may differ from an unknown address.

## Owner setup still needed

Create a Resend account and verify an owned sending domain. Set RESEND_API_KEY,
EMAIL_FROM and APP_URL=https://student-doubt-forum-theta.vercel.app in Vercel.
Do not use Resend's restricted onboarding sender for arbitrary forum users.
After a real inbox test, set EMAIL_ENABLED=1 and redeploy. No domain purchase or
paid service was authorized or performed. Do not enable first and strand users.

## Verification and limitations

66 tests pass; production build passes. Database integration uses a capturing
email adapter to check signup, hashes, verification posting gate, replay, expiry,
reset, old password rejection, session revocation, generic unknown response and
disabled mode. No real email sent, inbox deliverability checked, or production
verification enforced. Resend account, sender/domain and real recovery test remain
owner-dependent. No claim of complete abuse protection or legal compliance.

Reference: [Resend API contract](https://github.com/resend/resend-openapi/blob/main/resend.yaml).
