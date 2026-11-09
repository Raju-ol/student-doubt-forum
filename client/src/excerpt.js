// Plain-text excerpts for cards and profile previews. Deliberately dependency
// free: the feed imports this, and must not pull in the Markdown renderer.
export function markdownToText(source) {
  if (typeof source !== 'string') return '';
  return source
    .replace(/```[\s\S]*?```/g, ' code ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^\s{0,3}([-*_]\s*){3,}$/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
