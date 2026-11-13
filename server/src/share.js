import mongoose from 'mongoose';
import { Doubt } from './models.js';

// Link-preview bots do not run JavaScript, so they cannot read the single-page
// app. vercel.json sends only these user agents to this route; keep the two
// lists in step.
export const CRAWLER = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|Slackbot|TelegramBot|Discordbot|LinkedInBot|SkypeUriPreview/i;

const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

// A one-line plain-text summary of a Markdown question body.
export function summarize(markdown, max = 180) {
  const plain = String(markdown ?? '')
    .replace(/```[\s\S]*?```/g, ' ').replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~$]/g, '').replace(/\s+/g, ' ').trim();
  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain;
}

export function sharePage({ origin, doubt }) {
  const url = `${origin}/doubts/${doubt._id}`;
  const image = doubt.images?.[0]?.url || `${origin}/illustrations/hero-explore.png`;
  const title = `${doubt.title} · Doubt Forum`;
  const description = summarize(doubt.body) || 'A doubt on Doubt Forum. No doubt is too small. Ask it.';
  const tags = [
    ['property', 'og:type', 'article'], ['property', 'og:site_name', 'Doubt Forum'], ['property', 'og:url', url],
    ['property', 'og:title', title], ['property', 'og:description', description], ['property', 'og:image', image],
    ['name', 'twitter:card', doubt.images?.[0]?.url ? 'summary_large_image' : 'summary'],
    ['name', 'twitter:title', title], ['name', 'twitter:description', description], ['name', 'description', description]
  ];
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><title>${escapeHtml(title)}</title><link rel="canonical" href="${escapeHtml(url)}"/>${tags.map(([kind, key, value]) => `<meta ${kind}="${key}" content="${escapeHtml(value)}"/>`).join('')}</head><body><a href="${escapeHtml(url)}">${escapeHtml(doubt.title)}</a></body></html>`;
}

export function mountSharePage(app) {
  // Only crawlers get this page; everyone else falls through to the app.
  app.get('/doubts/:id', async (req, res, next) => {
    if (!CRAWLER.test(req.get('user-agent') || '')) return next();
    try {
      const doubt = mongoose.isObjectIdOrHexString(req.params.id) ? await Doubt.findById(req.params.id).select('title body images') : null;
      if (!doubt) return res.status(404).type('html').send('<!doctype html><title>Question not found · Doubt Forum</title>');
      res.set('Cache-Control', 'public, max-age=300').type('html').send(sharePage({ origin: `${req.protocol}://${req.get('host')}`, doubt }));
    } catch (error) { next(error); }
  });
}
