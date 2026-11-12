export function fail(status, message) { const error = new Error(message); error.status = status; error.expose = true; throw error; }
export function text(value, label, min, max) {
  if (typeof value !== 'string') fail(400, `${label} is required.`);
  const result = value.trim();
  if (result.length < min || result.length > max) fail(400, `${label} must be ${min}–${max} characters.`);
  return result;
}
export function semester(value) {
  if (!['string', 'number'].includes(typeof value) || !/^[1-8]$/.test(String(value))) fail(400, 'Choose a semester from 1 to 8.');
  return Number(value);
}
export function email(value) {
  const result = text(value, 'Email', 5, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail(400, 'Enter a valid email address.');
  return result;
}
export function password(value) {
  if (typeof value !== 'string' || value.length < 8 || Buffer.byteLength(value) > 72) fail(400, 'Password must have at least 8 characters and at most 72 bytes.');
  return value;
}
export function tags(value = []) {
  if (!Array.isArray(value) || value.length > 5) fail(400, 'Use up to 5 tags.');
  // Students often type tags as "#java"; the UI prepends its own "#", so strip leading hashes before storing.
  return [...new Set(value.map(tag => text(typeof tag === 'string' ? tag.replace(/^[#\s]+/, '') : tag, 'Tag', 1, 24).toLowerCase()))];
}
export function positiveInt(value, fallback, max) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value) || Number(value) < 1 || Number(value) > max) fail(400, 'Invalid pagination value.');
  return Number(value);
}
export function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
