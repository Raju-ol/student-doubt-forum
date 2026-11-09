import { randomBytes, createHash } from 'node:crypto';
import { verificationRequired, recoveryEnabled as publicRecoveryEnabled } from './email-policy.js';
import bcrypt from 'bcryptjs';
import { User } from './models.js';
import { requireUser } from './auth.js';
import { email, password, fail } from './validation.js';

export const hashToken = token => createHash('sha256').update(token).digest('hex');
export function emailTestRecipient() {
  const value = (process.env.EMAIL_TEST_RECIPIENT || '').trim().toLowerCase();
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : '';
}
const recoveryAllowed = address => publicRecoveryEnabled() || Boolean(emailTestRecipient() && address.toLowerCase() === emailTestRecipient());
const tokenHash = value => {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) fail(400, 'This link is invalid or has expired. Request a new one.');
  return hashToken(value);
};
export function requireVerified(req, res, next) {
  if (verificationRequired() && !req.user?.emailVerifiedAt) return next(Object.assign(new Error('Verify your email before posting. Open Account settings to request a verification link.'), { status: 403 }));
  next();
}
export async function sendTransactionalEmail({ to, subject, text }) {
  if (!recoveryAllowed(to)) throw new Error('Email delivery unavailable');
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error('Email delivery unavailable');
  try {
    const result = await fetch('https://api.resend.com/emails', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000), headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }) });
    if (!result.ok) throw new Error();
  } catch { throw new Error('Email delivery unavailable'); }
}
export async function issueEmail(user, kind, sendEmail = sendTransactionalEmail) {
  if (!recoveryAllowed(user.email) || (!verificationRequired() && kind !== 'reset')) throw new Error('Email delivery unavailable');
  const token = randomBytes(32).toString('hex');
  const verify = kind === 'verify';
  const hashField = verify ? 'verificationHash' : 'resetHash';
  const expiryField = verify ? 'verificationExpires' : 'resetExpires';
  const base = new URL(process.env.APP_URL || 'http://127.0.0.1:5173');
  if (process.env.NODE_ENV === 'production' && base.protocol !== 'https:') throw new Error('Email delivery unavailable');
  // APP_URL is operator-controlled. Never trust a request Host header for links.
  const link = new URL(verify ? '/verify-email' : '/reset-password', base);
  link.hash = token;
  await User.updateOne({ _id: user._id, isBanned: false }, { $set: { [hashField]: hashToken(token), [expiryField]: new Date(Date.now() + (verify ? 86400000 : 1800000)) } });
  await sendEmail({ to: user.email, subject: verify ? 'Verify your Doubt Forum email' : 'Reset your Doubt Forum password', text: `${verify ? 'Verify your email' : 'Reset your password'} using this link:\n\n${link.href}\n\nThis link expires in ${verify ? '24 hours' : '30 minutes'} and can be used once. If you did not request it, ignore this email.` });
}
export function mountEmailRoutes(api, { limiter, wrap, ok, sendEmail }) {
  const enabled = (req, res, next) => verificationRequired() ? next() : next(Object.assign(new Error('Email recovery is not enabled yet. Please contact the forum administrator.'), { status: 503 }));
  const recoveryEnabled = (req, res, next) => publicRecoveryEnabled() || emailTestRecipient() ? next() : enabled(req, res, next);
  const ipLimit = limiter('email-action-ip', 10, 60 * 60 * 1000);
  const addressLimit = limiter('email-action-address', 3, 60 * 60 * 1000, { email: true });
  api.post('/auth/forgot-password', recoveryEnabled, ipLimit, addressLimit, wrap(async (req, res) => {
    const address = email(req.body.email);
    const user = await User.findOne({ email: address, isBanned: false });
    if (user && recoveryAllowed(user.email)) { try { await issueEmail(user, 'reset', sendEmail); } catch { console.error('Email delivery failed: password_reset'); } }
    // Same response for unknown addresses, banned users, and delivery failure.
    ok(res, null, 'If the account is available, a reset link has been sent.');
  }));
  api.post('/auth/reset-password', recoveryEnabled, ipLimit, wrap(async (req, res) => {
    const hash = tokenHash(req.body.token);
    const passwordHash = await bcrypt.hash(password(req.body.password), 12);
    const user = await User.findOneAndUpdate({ resetHash: hash, resetExpires: { $gt: new Date() }, isBanned: false, ...(publicRecoveryEnabled() ? {} : { email: emailTestRecipient() }) }, { $set: { passwordHash }, $unset: { resetHash: 1, resetExpires: 1 }, $inc: { tokenVersion: 1 } });
    if (!user) fail(400, 'This link is invalid or has expired. Request a new one.');
    ok(res, null, 'Password changed. Sign in with your new password.');
  }));
  api.post('/auth/verification-email', enabled, requireUser, limiter('verification-user', 3, 60 * 60 * 1000, { account: true }), wrap(async (req, res) => {
    if (!req.user.emailVerifiedAt) {
      try { await issueEmail(req.user, 'verify', sendEmail); }
      catch { fail(503, 'Could not send your verification email. Please try again later.'); }
    }
    ok(res, null, 'Check your inbox for a verification link.');
  }));
  api.post('/auth/verify-email', enabled, ipLimit, wrap(async (req, res) => {
    const user = await User.findOneAndUpdate({ verificationHash: tokenHash(req.body.token), verificationExpires: { $gt: new Date() }, isBanned: false }, { $set: { emailVerifiedAt: new Date() }, $unset: { verificationHash: 1, verificationExpires: 1 } });
    if (!user) fail(400, 'This link is invalid or has expired. Request a new one.');
    ok(res, null, 'Email verified. You can now post.');
  }));
}
