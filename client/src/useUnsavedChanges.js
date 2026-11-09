import { useEffect } from 'react';

export function useUnsavedChanges(dirty) {
  useEffect(() => {
    if (!dirty) return;
    function unload(event) { event.preventDefault(); event.returnValue = ''; }
    function leave(event) {
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || link.hasAttribute('download') || link.target === '_blank') return;
      if (link.href === window.location.href || link.getAttribute('href').startsWith('#')) return;
      if (!window.confirm('Leave this form? Unsaved changes will be lost.')) { event.preventDefault(); event.stopPropagation(); }
    }
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', leave, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', leave, true); };
  }, [dirty]);
}
