import jwt from 'jsonwebtoken';
import { User } from './models.js';
import { fail } from './validation.js';
export const safeUser = user => ({ _id: user._id, name: user.name, email: user.email, role: user.role, semester: user.semester, isBanned: user.isBanned, createdAt: user.createdAt });
export function tokenFor(user) { return jwt.sign({ ver: user.tokenVersion || 0 }, process.env.JWT_SECRET, { subject: String(user._id), expiresIn: '7d', algorithm: 'HS256' }); }
export async function identify(req, res, next) {
  const header = req.get('authorization');
  if (header) {
    try {
      if (!header.startsWith('Bearer ')) fail(401, 'Please sign in again.');
      const claims = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
      req.user = await User.findById(claims.sub);
      if (!req.user || req.user.isBanned) fail(401, 'This account is unavailable.');
      if ((claims.ver ?? 0) !== (req.user.tokenVersion || 0)) fail(401, 'Please sign in again.');
    } catch { return next(Object.assign(new Error('Your session has expired or the account is unavailable. Please sign in again.'), { status: 401 })); }
  }
  next();
}
export function requireUser(req, res, next) { if (!req.user) return next(Object.assign(new Error('Please sign in to continue.'), { status: 401 })); next(); }
export function requireAdmin(req, res, next) { if (req.user?.role !== 'admin') return next(Object.assign(new Error('Administrator access required.'), { status: 403 })); next(); }
export function owns(user, author) { if (String(user._id) !== String(author) && user.role !== 'admin') fail(403, 'You do not have permission to change this content.'); }
