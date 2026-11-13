const TIME_UNITS = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
// "2 hours ago" style label; anything under a minute is "just now".
export function timeAgo(value, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));
  if (Number.isNaN(seconds)) return '';
  for (const [unit, size] of TIME_UNITS) if (seconds >= size) { const count = Math.floor(seconds / size); return `${count} ${unit}${count === 1 ? '' : 's'} ago`; }
  return 'just now';
}
export function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
