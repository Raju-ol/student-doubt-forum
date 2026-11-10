// External self-hosted script runs before styles/app paint and respects CSP.
(() => {
  let preference = 'system';
  try { preference = localStorage.getItem('forum-theme') || 'system'; } catch {}
  if (!['system', 'light', 'dark', 'bento'].includes(preference)) preference = 'system';
  document.documentElement.dataset.theme = preference === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' : preference;
})();
