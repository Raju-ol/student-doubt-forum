import { AuditLog } from './models.js';
import { requireAdmin } from './auth.js';
import { positiveInt } from './validation.js';

// An audit entry must never make the action it describes fail, so errors are
// logged (without the content) and swallowed.
export async function recordAudit(actor, action, summary, { targetType, target } = {}) {
  try {
    await AuditLog.create({ actor: actor._id ?? actor, action, summary: String(summary).slice(0, 300), targetType, target });
  } catch { console.error('Audit entry failed:', action); }
}

export function mountAuditRoutes(admin, { wrap, ok }) {
  admin.get('/audit', requireAdmin, wrap(async (req, res) => {
    const page = positiveInt(req.query.page, 1, 10000);
    const filter = typeof req.query.action === 'string' && /^[a-z]+(\.[a-z]+)?$/.test(req.query.action) ? { action: new RegExp(`^${req.query.action.replace('.', '\\.')}`) } : {};
    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 25).limit(25).populate('actor', 'name role'),
      AuditLog.countDocuments(filter)
    ]);
    ok(res, { items, page, pages: Math.ceil(total / 25), total });
  }));
}
