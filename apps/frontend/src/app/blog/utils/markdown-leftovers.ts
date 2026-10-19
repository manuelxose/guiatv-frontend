/**
 * Some AI-assisted posts were stored with Markdown tokens inside HTML (`<p>### Title</p>`, `**bold**`),
 * which render as literal characters. Convert them at render time; new content is rejected at approval
 * (apps/backend EditorialReviewPolicy), so this only repairs already-published posts.
 */
export function markdownLeftoversToHtml(html: string): string {
  return html
    .replace(/<p>\s*(#{2,3})\s+([^<]+?)\s*<\/p>/g, (_m, hashes: string, label: string) => {
      const level = hashes.length;
      return `<h${level}>${label}</h${level}>`;
    })
    .replace(/\*\*([^*<>\n]+?)\*\*/g, '<strong>$1</strong>');
}
