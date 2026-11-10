import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { requireUser, safeUser, tokenFor } from './auth.js';
import { User } from './models.js';
import { email, fail, password } from './validation.js';

const client = new OAuth2Client();
const clientId = () => process.env.GOOGLE_CLIENT_ID?.trim() || '';

export async function verifyGoogleIdentity(credential) {
  const audience = clientId();
  if (!audience) fail(503, 'Google sign-in is not configured.');
  if (typeof credential !== 'string' || credential.length > 8192) fail(400, 'Choose your Google account to continue.');

  let claims;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience });
    claims = ticket.getPayload();
  } catch {
    fail(401, 'Google sign-in could not be verified. Please try again.');
  }
  if (!claims?.sub || claims.email_verified !== true) fail(403, 'Choose a Google account with a verified email address.');
  const address = email(claims.email);
  return {
    subject: claims.sub,
    email: address,
    name: claims.name?.trim().slice(0, 60) || 'Forum member',
    // Google can vouch for the current mailbox for Gmail and Workspace.
    authoritativeEmail: address.endsWith('@gmail.com') || Boolean(claims.hd),
  };
}

function findGoogleUser(subject) {
  return User.findOne({ googleSubject: subject }).select('+googleSubject');
}

export function mountGoogleRoutes(api, { authLimit, wrap, ok, googleIdentity }) {
  api.get('/auth/google/config', (req, res) => ok(res, { clientId: clientId() }));

  api.post('/auth/google', authLimit, wrap(async (req, res) => {
    if (!req.is('application/json')) fail(415, 'Send a JSON request.');
    const identity = await googleIdentity(req.body.credential);
    let user = await findGoogleUser(identity.subject);
    let created = false;
    if (!user) {
      try {
        user = await User.create({
          googleSubject: identity.subject,
          email: identity.email,
          name: identity.name,
          reputation: 0,
          emailVerifiedAt: identity.authoritativeEmail ? new Date() : null,
        });
        created = true;
      } catch (error) {
        if (error.code !== 11000) throw error;
        // Concurrent signups may have created this identity while we waited.
        user = await findGoogleUser(identity.subject);
        if (!user) fail(409, 'An account already uses this email. Sign in with your password and link Google from Account settings.');
      }
    }
    if (user.isDeleted || user.isBanned) fail(403, 'Your account is unavailable.');
    ok(res, { user: safeUser(user), token: tokenFor(user) }, created ? 'Welcome to Doubt Forum!' : 'Welcome back!', created ? 201 : 200);
  }));

  api.post('/auth/google/link', authLimit, requireUser, wrap(async (req, res) => {
    const user = await User.findById(req.user._id).select('+passwordHash +googleSubject');
    if (!user?.passwordHash || !await bcrypt.compare(password(req.body.password), user.passwordHash)) fail(401, 'Password is incorrect.');
    if (user.googleSubject) fail(409, 'A Google account is already linked to this profile.');
    const identity = await googleIdentity(req.body.credential);
    if (user.email !== identity.email) fail(400, 'Choose the Google account with the same email as your forum profile.');
    const fields = { googleSubject: identity.subject };
    if (identity.authoritativeEmail && !user.emailVerifiedAt) fields.emailVerifiedAt = new Date();
    let linked;
    try {
      linked = await User.findOneAndUpdate({
        _id: user._id,
        passwordHash: user.passwordHash,
        googleSubject: { $exists: false },
        isBanned: { $ne: true },
        isDeleted: { $ne: true },
      }, { $set: fields }, { new: true }).select('+googleSubject');
    } catch (error) {
      if (error.code !== 11000) throw error;
      fail(409, 'This Google account is already linked to a profile.');
    }
    if (!linked) fail(409, 'Your account changed. Refresh and try again.');
    ok(res, safeUser(linked), 'Google account linked.');
  }));
}
