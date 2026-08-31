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
