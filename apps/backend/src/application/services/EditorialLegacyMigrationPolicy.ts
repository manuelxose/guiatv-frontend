import type { EditorialOrigin, EditorialReviewState } from './EditorialReviewPolicy';

export interface LegacyEditorialPost {
  slug?: string;
  status?: 'draft' | 'publish';
  origin?: EditorialOrigin;
  reviewState?: EditorialReviewState;
  author?: { name?: string; id?: string };
  content?: string;
  excerpt?: string;
  featuredImage?: unknown;
  seo?: unknown;
}

export interface LegacyEditorialMigrationPlan {
  status: 'draft' | 'publish';
  origin: EditorialOrigin;
  reviewState: EditorialReviewState;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes: string;
}

export function planLegacyEditorialMigration(
  post: LegacyEditorialPost,
  curatedSlugs: ReadonlySet<string>,
  now = new Date()
): LegacyEditorialMigrationPlan | null {
  const slug = String(post.slug || '').trim();
  if (curatedSlugs.has(slug)) {
    // A draft may have been deliberately withdrawn or edited after an earlier
    // approval. Migration must never promote it back to public status.
    if (post.status !== 'publish') return null;
    if (
      post.reviewState === 'approved' &&
      post.origin === 'human'
    ) return null;
    return {
      status: 'publish',
      origin: 'human',
      reviewState: 'approved',
      reviewedBy: 'migration:curated-editorial-seed',
      reviewedAt: now,
      reviewNotes: 'Curated GuíaTV seed content approved during editorial migration.',
    };
  }

  const serialized = JSON.stringify({
    content: post.content,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    seo: post.seo,
  }).toLowerCase();
  const missingAuthor = !String(post.author?.name || '').trim() || !String(post.author?.id || '').trim();
  const automatedOrigin = serialized.includes('auctorio');

  if (post.status === 'publish' && (missingAuthor || automatedOrigin)) {
    return {
      status: 'draft',
      origin: 'automated-import',
      reviewState: 'rejected',
      reviewedBy: 'migration:adsense-readiness',
      reviewedAt: now,
      reviewNotes: automatedOrigin
        ? 'Quarantined: automated Auctorio publishing origin requires human review.'
        : 'Quarantined: published article has no accountable author.',
    };
  }

  if (post.reviewState === 'approved') return null;
  return post.status === 'publish'
    ? {
        status: 'draft',
        origin: 'legacy',
        reviewState: 'unreviewed',
        reviewNotes: 'Quarantined: legacy publication has not passed the editorial approval gate.',
      }
    : null;
}
