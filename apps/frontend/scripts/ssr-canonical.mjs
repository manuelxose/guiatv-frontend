// Canonical policy for server-rendered HTML (Phase 2D-0). Imported by ssr-server.mjs; tested by ssr-canonical.test.mjs.
//
// - The canonical Angular rendered wins: it is the page's own decision (e.g. a legacy match slug names the current one).
// - An indexable 200 page that rendered none gets a self-canonical for the path (the pre-2D-0 behaviour for such pages).
// - Error responses (>= 400), redirects and noindex pages get none added; error responses have any canonical removed.
// - Never more than one canonical tag.

const CANONICAL_TAG = /<link\b[^>]*\brel=["']canonical["'][^>]*>/gi;
const NOINDEX_META = /<meta\s+name="robots"\s+content="[^"]*\bnoindex\b[^"]*"/i;

/** @returns {{ html: string, fallback: boolean }} */
export function finalizeCanonical(html, { baseUrl, pathname, statusCode }) {
  if (statusCode >= 400) return { html: html.replace(CANONICAL_TAG, ''), fallback: false };

  let seen = false;
  const deduped = html.replace(CANONICAL_TAG, (tag) => (seen ? '' : ((seen = true), tag)));
  if (seen || statusCode !== 200 || NOINDEX_META.test(deduped)) return { html: deduped, fallback: false };

  return {
    // The path comes from the request: encode anything that could break out of the attribute.
    html: deduped.replace('</head>', `<link rel="canonical" href="${baseUrl}${pathname.replace(/["'<>&\s]/g, encodeURIComponent)}"></head>`),
    fallback: true,
  };
}
