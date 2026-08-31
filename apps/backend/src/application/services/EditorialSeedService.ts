import { EDITORIAL_SEED_POSTS } from '../data/editorialSeedData';
import {
  BlogPostModel,
  IBlogFaqItem,
  IBlogPostCategory,
  IBlogPostDocument,
} from '../../infrastructure/database/models/BlogPost.model';
import { logger } from '../../shared/utils/logger';

function slugify(value: string): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashCategoryId(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeCategories(categories: string[]): IBlogPostCategory[] {
  return categories
    .map((name) => String(name || '').trim())
    .filter(Boolean)
    .map((name) => {
      const slug = slugify(name);
      return {
        id: hashCategoryId(slug),
        name,
        slug,
      };
    });
}

function normalizeFaqItems(items: Array<{ question?: string; answer?: string }>): IBlogFaqItem[] {
  return (items || [])
    .map((item) => ({
      question: String(item?.question || '').trim(),
      answer: String(item?.answer || '').trim(),
    }))
    .filter((item) => item.question && item.answer);
}

function mapSeedPostToDocument(post: (typeof EDITORIAL_SEED_POSTS)[number]): Partial<IBlogPostDocument> {
  return {
    title: post.title,
    slug: post.slug,
    status: 'publish',
    origin: 'human',
    reviewState: 'approved',
    reviewedBy: 'seed:guiatv-editorial',
    reviewedAt: new Date(post.publishedAt),
    excerpt: post.excerpt,
    content: post.content,
    categories: normalizeCategories(post.categories),
    contentType: post.contentType,
    featured: Boolean(post.featured),
    primaryIntent: post.primaryIntent,
    targetQuery: post.targetQuery,
    relatedPlatformKeys: [...(post.relatedPlatformKeys || [])],
    relatedRouteKeys: [...(post.relatedRouteKeys || [])],
    faqItems: normalizeFaqItems(post.faqItems),
    evergreen: post.evergreen !== false,
    featuredImage: { sourceUrl: post.coverImage },
    author: {
      name: 'Equipo editorial Guia TV',
      id: 'guiatv-editorial',
    },
    seo: {
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      keywords: [...post.keywords],
      ogImage: post.coverImage,
      canonicalUrl: `/editorial/${post.slug}`,
    },
    publishedAt: new Date(post.publishedAt),
  };
}

export async function seedEditorialContent(options?: {
  overwriteExisting?: boolean;
}): Promise<{ inserted: number; updated: number; total: number }> {
  const overwriteExisting = options?.overwriteExisting === true;
  const ops = EDITORIAL_SEED_POSTS.map((post) => {
    const document = mapSeedPostToDocument(post);
    return overwriteExisting
      ? {
          updateOne: {
            filter: { slug: post.slug },
            update: { $set: document, $setOnInsert: { createdAt: new Date() } },
            upsert: true,
          },
        }
      : {
          updateOne: {
            filter: { slug: post.slug },
            update: { $setOnInsert: document },
            upsert: true,
          },
        };
  });

  const result = await BlogPostModel.bulkWrite(ops, { ordered: false });
  return {
    inserted: result.upsertedCount || 0,
    updated: overwriteExisting ? result.modifiedCount || 0 : 0,
    total: EDITORIAL_SEED_POSTS.length,
  };
}

export async function ensureEditorialSeedData(): Promise<void> {
  if (process.env.AUTO_SEED_EDITORIAL_CONTENT === 'false') {
    logger.info('Skipping editorial auto-seed because AUTO_SEED_EDITORIAL_CONTENT=false');
    return;
  }

  const existingCount = await BlogPostModel.countDocuments({}).exec();
  if (existingCount > 0) {
    return;
  }

  const result = await seedEditorialContent();
  logger.info('Editorial seed inserted on empty database', result);
}
