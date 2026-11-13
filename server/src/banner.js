import { Setting } from './models.js';
import { requireAdmin } from './auth.js';
import { fail } from './validation.js';
import { recordAudit } from './audit.js';

const KEY = 'banner';
export const BANNER_MAX = 140;

export function mountBannerRoutes(api, admin, { wrap, ok }) {
  // Public: every page shows it. An empty text means there is no banner.
  api.get('/banner', wrap(async (req, res) => {
    const banner = await Setting.findOne({ key: KEY }).select('text updatedAt');
    ok(res, { text: banner?.text || '', updatedAt: banner?.text ? banner.updatedAt : null });
  }));
  admin.put('/banner', requireAdmin, wrap(async (req, res) => {
    if (typeof req.body.text !== 'string') fail(400, 'Send the banner text, or an empty text to remove the banner.');
    const text = req.body.text.replace(/\s+/g, ' ').trim();
    if (text.length > BANNER_MAX) fail(400, `Keep the banner under ${BANNER_MAX} characters.`);
    const banner = await Setting.findOneAndUpdate({ key: KEY }, { $set: { text, updatedBy: req.user._id } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await recordAudit(req.user, text ? 'banner.set' : 'banner.clear', text ? `Set the site banner: “${text}”` : 'Removed the site banner');
    ok(res, { text: banner.text, updatedAt: text ? banner.updatedAt : null }, text ? 'Banner is live.' : 'Banner removed.');
  }));
}
