import jwt from 'jsonwebtoken';
import { verificationRequired } from './email-policy.js';
import { User } from './models.js';
import { fail } from './validation.js';
import { effectiveLevel } from './academics.js';
export const safeUser = user => ({ _id: user._id, name: user.name, email: user.email, googleLinked: Boolean(user.googleSubject), emailVerified: Boolean(user.emailVerifiedAt), verificationRequired: verificationRequired(), role: user.role, teacherSubjects: user.teacherSubjects || undefined, semester: user.semester, academicLevel: effectiveLevel(user), institution: user.institution || null, isBanned: user.isBanned, createdAt: user.createdAt });
export function tokenFor(user) { return jwt.sign({ ver: user.tokenVersion || 0 }, process.env.JWT_SECRET, { subject: String(user._id), expiresIn: '7d', algorithm: 'HS256' }); }
export async function identify(req, res, next) {
  const header = req.get('authorization');
  if (header) {
    let claims;
    try {
      if (!header.startsWith('Bearer ')) fail(401, 'Please sign in again.');
      claims = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
      if (typeof claims.sub !== 'string' || !/^[a-f\d]{24}$/i.test(claims.sub)) fail(401, 'Please sign in again.');
    } catch { return next(Object.assign(new Error('Your session has expired or the account is unavailable. Please sign in again.'), { status: 401 })); }
    try {
      req.user = await User.findById(claims.sub).select('+googleSubject');
    } catch { return next(Object.assign(new Error('Account service is temporarily unavailable. Please try again shortly.'), { status: 503 })); }
    if (!req.user || req.user.isBanned || req.user.isDeleted || (claims.ver ?? 0) !== (req.user.tokenVersion || 0)) {
      return next(Object.assign(new Error('Your session has expired or the account is unavailable. Please sign in again.'), { status: 401 }));
    }
  }
  next();
}
export function requireUser(req, res, next) { if (!req.user) return next(Object.assign(new Error('Please sign in to continue.'), { status: 401 })); next(); }
export function requireAdmin(req, res, next) { if (req.user?.role !== 'admin') return next(Object.assign(new Error('Administrator access required.'), { status: 403 })); next(); }
export function requireModerator(req, res, next) { if (!['admin', 'moderator'].includes(req.user?.role)) return next(Object.assign(new Error('Moderator access required.'), { status: 403 })); next(); }
export function owns(user, author) { if (String(user._id) !== String(author) && user.role !== 'admin') fail(403, 'You do not have permission to change this content.'); }
