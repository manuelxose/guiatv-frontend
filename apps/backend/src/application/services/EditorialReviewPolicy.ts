export type EditorialOrigin = 'human' | 'ai-assisted' | 'automated-import' | 'legacy';
export type EditorialReviewState = 'unreviewed' | 'in-review' | 'approved' | 'rejected';

export const PUBLIC_EDITORIAL_FILTER = Object.freeze({
  status: 'publish' as const,
  reviewState: 'approved' as const,
});

interface ApprovableEditorialPost {
  title?: string;
  excerpt?: string;
  content?: string;
  author?: { name?: string; id?: string };
  seo?: { metaTitle?: string; metaDescription?: string };
  categories?: Array<{ name?: string; slug?: string }>;
  publishedAt?: Date;
}

function visibleWordCount(html: string | undefined): number {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function visibleText(html: string | undefined): string {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Phase 5 content-quality gate: Editorial exists for cine/series/TV/streaming,
// not general news. This is a defense-in-depth allowlist check at the
// publish boundary — the actual topic selection happens upstream in the
// content-ai-platform ingestion pipeline (see docs/content-source.md) which
// is out of this repo's scope, but nothing should reach the public Editorial
// feed without at least one entertainment-domain signal, regardless of what
// produced or approved it upstream.
const ENTERTAINMENT_SIGNAL_KEYWORDS = [
  'cine', 'pelicula', 'película', 'film', 'largometraje', 'documental',
  'serie', 'series', 'temporada', 'episodio', 'capitulo', 'capítulo',
  'estreno', 'preestreno', 'taquilla', 'rodaje', 'guion', 'guión',
  'streaming', 'plataforma', 'netflix', 'hbo', 'max', 'disney', 'prime video',
  'movistar plus', 'skyshowtime', 'filmin', 'apple tv', 'atresplayer', 'rtve play',
  'television', 'televisión', 'parrilla', 'audiencia', 'programacion', 'programación',
  'canal', 'cadena', 'actor', 'actriz', 'director', 'directora', 'reparto',
  'trailer', 'tráiler', 'oscar', 'goya', 'emmy', 'festival de cine', 'critica', 'crítica',
];

function hasEntertainmentSignal(post: ApprovableEditorialPost): boolean {
  const categoryHaystack = (post.categories || [])
    .map((category) => `${category?.name || ''} ${category?.slug || ''}`)
    .join(' ')
    .toLowerCase();
  if (ENTERTAINMENT_SIGNAL_KEYWORDS.some((keyword) => categoryHaystack.includes(keyword))) {
    return true;
  }

  const contentHaystack = `${post.title || ''} ${post.excerpt || ''} ${visibleText(post.content).slice(0, 4000)}`.toLowerCase();
  return ENTERTAINMENT_SIGNAL_KEYWORDS.some((keyword) => contentHaystack.includes(keyword));
}

export function assertEditorialPostCanBeApproved(post: ApprovableEditorialPost): void {
  const failures: string[] = [];
  if (!String(post.title || '').trim()) failures.push('title');
  if (!String(post.excerpt || '').trim()) failures.push('excerpt');
  if (visibleWordCount(post.content) < 250) failures.push('contenido (mínimo 250 palabras útiles)');
  if (!String(post.author?.name || '').trim() || !String(post.author?.id || '').trim()) {
    failures.push('author');
  }
  if (!String(post.seo?.metaTitle || '').trim()) failures.push('seo.metaTitle');
  if (!String(post.seo?.metaDescription || '').trim()) failures.push('seo.metaDescription');
  if (!hasEntertainmentSignal(post)) {
    failures.push('relevancia editorial (sin señales de cine, series, TV o streaming)');
  }

  if (failures.length) {
    throw new Error(`Editorial approval rejected: ${failures.join(', ')}`);
  }
}

export function buildEditorialApproval(
  post: ApprovableEditorialPost,
  reviewer: string,
  now = new Date()
): {
  status: 'publish';
  reviewState: 'approved';
  reviewedBy: string;
  reviewedAt: Date;
  publishedAt: Date;
} {
  const normalizedReviewer = String(reviewer || '').trim();
  if (!normalizedReviewer) throw new Error('Editorial reviewer is required');
  assertEditorialPostCanBeApproved(post);
  return {
    status: 'publish',
    reviewState: 'approved',
    reviewedBy: normalizedReviewer,
    reviewedAt: now,
    publishedAt: post.publishedAt || now,
  };
}
