import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { BlogService } from '../../services/blog.service';
import {
  EditorialCategory,
  EditorialCategoryPageState,
  EditorialCategorySection,
  EditorialContentType,
  EditorialFaqItem,
  EditorialHubState,
  EditorialPost,
  EditorialPostPageState,
  EditorialRouteRelationKey,
} from '../models/editorial.models';

const RANKING_CATEGORY_SLUGS = new Set([
  'ranking',
  'rankings',
  'top-10',
  'top10',
  'listas',
  'mejores',
]);

const RANKING_KEYWORDS = [
  'top 10',
  'top10',
  'ranking',
  'rankings',
  'mejores',
  'imprescindibles',
  'lista',
  'listas',
];

const TREND_KEYWORDS = ['tendencia', 'tendencias', 'estrenos', 'esta semana', 'fin de semana'];
const VALID_ROUTE_RELATIONS: readonly EditorialRouteRelationKey[] = [
  'platforms',
  'guide',
  'explore',
  'stats',
  'comparison',
];

@Injectable({ providedIn: 'root' })
export class EditorialService {
  private readonly isBrowser: boolean;
  private readonly posts$: Observable<EditorialPost[]>;

  constructor(
    private readonly blogService: BlogService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.posts$ = this.blogService.getAllPosts().pipe(
      map((posts) => this.adaptPosts(posts || [])),
      catchError(() => of([])),
      shareReplay(1)
    );
  }

  public getPosts(): Observable<EditorialPost[]> {
    return this.posts$;
  }

  public getHubState(): Observable<EditorialHubState> {
    return this.getPosts().pipe(
      map((posts) => {
        const categories = this.extractCategories(posts);
        const rankingPosts = this.getRankingPosts(posts);
        const guidePosts = posts.filter((post) => post.contentType === 'guide');
        const trendPosts = posts.filter((post) => post.contentType === 'trend');
        const categorySections = this.buildCategorySections(
          posts.filter((post) => post.contentType !== 'ranking'),
          categories
        );

        return {
          hero: posts.find((post) => post.featured) ?? posts[0] ?? null,
          guidePosts: guidePosts.slice(0, 6),
          rankingPosts: rankingPosts.slice(0, 8),
          trendPosts: trendPosts.slice(0, 4),
          categorySections,
          categories: categories.slice(0, 8),
        };
      })
    );
  }

  public getRankingsPageState(): Observable<{
    featured: EditorialPost | null;
    posts: EditorialPost[];
    categories: EditorialCategory[];
    sections: EditorialCategorySection[];
  }> {
    return this.getPosts().pipe(
      map((posts) => {
        const rankingPosts = this.getRankingPosts(posts);
        const rankingCategories = this.extractCategories(rankingPosts).filter(
          (category) => category.isRankingCategory
        );

        return {
          featured: rankingPosts.find((post) => post.featured) ?? rankingPosts[0] ?? null,
          posts: rankingPosts,
          categories: rankingCategories,
          sections: this.buildCategorySections(
            rankingPosts,
            rankingCategories,
            3,
            4
          ),
        };
      })
    );
  }

  public getCategoryPageState(
    slug: string
  ): Observable<EditorialCategoryPageState | null> {
    return this.getPosts().pipe(
      map((posts) => {
        const categories = this.extractCategories(posts);
        const category = categories.find((item) => item.slug === slug);
        if (!category) {
          return null;
        }

        const categoryPosts = posts.filter((post) =>
          post.categories.some((item) => item.slug === slug)
        );
        const relatedRankings = categoryPosts
          .filter((post) => post.isRanking)
          .slice(0, 3);

        return {
          category,
          featuredPost: categoryPosts.find((post) => post.featured) ?? categoryPosts[0] ?? null,
          posts: categoryPosts.filter((post) => post.slug !== categoryPosts[0]?.slug),
          relatedRankings,
          siblingCategories: categories
            .filter((item) => item.slug !== slug)
            .slice(0, 8),
        };
      })
    );
  }

  public getPostPageState(slug: string): Observable<EditorialPostPageState | null> {
    return this.getPosts().pipe(
      map((posts) => {
        const post = posts.find((entry) => entry.slug === slug);
        if (!post) {
          return null;
        }

        const categorySlugs = new Set(post.categories.map((category) => category.slug));
        const relatedPosts = posts
          .filter((entry) => entry.slug !== slug)
          .map((entry) => ({
            entry,
            sharedCategories: entry.categories.filter((category) => categorySlugs.has(category.slug)).length,
          }))
          .filter(({ entry, sharedCategories }) =>
            categorySlugs.size ? sharedCategories > 0 : entry.contentType === post.contentType
          )
          .sort((left, right) => right.sharedCategories - left.sharedCategories)
          .map(({ entry }) => entry)
          .slice(0, 3);

        return { post, relatedPosts };
      })
    );
  }

  public getPostBySlug(slug: string): Observable<EditorialPost | null> {
    return this.getPostPageState(slug).pipe(map((state) => state?.post ?? null));
  }

  public searchCategoryBySlug(slug: string): Observable<EditorialCategory | null> {
    return this.getPosts().pipe(
      map((posts) => this.extractCategories(posts).find((item) => item.slug === slug) ?? null)
    );
  }

  private adaptPosts(rawPosts: any[]): EditorialPost[] {
    return [...rawPosts]
      .map((post) => this.adaptPost(post))
      .sort((left, right) => {
        if (left.featured !== right.featured) {
          return left.featured ? -1 : 1;
        }
        return (
          new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
        );
      });
  }

  private adaptPost(rawPost: any): EditorialPost {
    const categories = Array.isArray(rawPost?.categories_name)
      ? rawPost.categories_name.map((category: any) => this.adaptCategory(category))
      : [];
    const contentType = this.resolveContentType(rawPost, categories);
    const rankingReason = this.getRankingReason(rawPost, categories, contentType);
    const excerptHtml = this.ensureString(rawPost?.excerpt?.rendered || rawPost?.excerpt);
    const contentHtml = this.ensureString(rawPost?.content?.rendered || rawPost?.content);
    const title = this.ensureString(rawPost?.title?.rendered || rawPost?.title);

    return {
      id: String(rawPost?.id || ''),
      slug: String(rawPost?.slug || '').trim(),
      title,
      excerptHtml,
      excerptText: this.stripHtml(excerptHtml),
      contentHtml,
      coverImage: this.normalizeCoverImage(
        rawPost?.featured_image?.source_url || rawPost?.seo?.ogImage
      ),
      publishedAt: String(rawPost?.date || rawPost?.publishedAt || new Date().toISOString()),
      modifiedAt: String(
        rawPost?.modified || rawPost?.updatedAt || rawPost?.date || new Date().toISOString()
      ),
      readingMinutes: this.calculateReadingTime(contentHtml),
      canonicalPath: `/editorial/${rawPost?.slug}`,
      categories,
      primaryCategory: categories[0] ?? null,
      contentType,
      featured: Boolean(rawPost?.featured),
      primaryIntent: this.ensureString(rawPost?.primaryIntent) || null,
      targetQuery: this.ensureString(rawPost?.targetQuery) || null,
      relatedPlatformKeys: this.normalizeStringArray(rawPost?.relatedPlatformKeys),
      relatedRouteKeys: this.normalizeRouteKeys(rawPost?.relatedRouteKeys),
      faqItems: this.normalizeFaqItems(rawPost?.faqItems),
      evergreen: rawPost?.evergreen !== false,
      isRanking: contentType === 'ranking' || rankingReason !== 'none',
      rankingReason,
      metaTitle: this.ensureString(rawPost?.seo?.metaTitle) || null,
      metaDescription: this.ensureString(rawPost?.seo?.metaDescription) || null,
      raw: rawPost,
    };
  }

  private normalizeCoverImage(value: unknown): string {
    const image = String(value || '').trim();
    if (
      !image ||
      image.endsWith('/assets/images/blog-og-image.jpg') ||
      image.endsWith('/assets/images/top10-og-image.jpg')
    ) {
      return '/assets/images/blog-og-image.webp';
    }
    return image;
  }

  private adaptCategory(rawCategory: any): EditorialCategory {
    const slug = this.normalizeSlug(rawCategory?.slug || rawCategory?.name || '');
    return {
      id: Number(rawCategory?.id || 0),
      name: this.ensureString(rawCategory?.name) || 'Categoria',
      slug,
      description: this.ensureString(rawCategory?.description),
      count: Number(rawCategory?.count || 0),
      canonicalPath: `/editorial/categoria/${slug}`,
      isRankingCategory: this.isRankingCategory(rawCategory),
    };
  }

  private extractCategories(posts: EditorialPost[]): EditorialCategory[] {
    const categories = new Map<string, EditorialCategory>();

    posts.forEach((post) => {
      post.categories.forEach((category) => {
        const existing = categories.get(category.slug);
        if (existing) {
          existing.count += 1;
          return;
        }

        categories.set(category.slug, { ...category, count: category.count || 1 });
      });
    });

    return Array.from(categories.values()).sort((left, right) => {
      if (left.isRankingCategory !== right.isRankingCategory) {
        return left.isRankingCategory ? 1 : -1;
      }
      return right.count - left.count;
    });
  }

  private buildCategorySections(
    posts: EditorialPost[],
    categories: EditorialCategory[],
    maxSections = 3,
    postsPerSection = 3
  ): EditorialCategorySection[] {
    return categories
      .filter((category) => !category.isRankingCategory)
      .map((category) => ({
        category,
        posts: posts
          .filter((post) => post.categories.some((item) => item.slug === category.slug))
          .slice(0, postsPerSection),
      }))
      .filter((section) => section.posts.length > 0)
      .slice(0, maxSections);
  }

  private getRankingPosts(posts: EditorialPost[]): EditorialPost[] {
    return posts.filter((post) => post.contentType === 'ranking' || post.isRanking);
  }

  private resolveContentType(
    rawPost: any,
    categories: EditorialCategory[]
  ): EditorialContentType {
    const explicit = this.ensureString(rawPost?.contentType).toLowerCase() as EditorialContentType;
    if (explicit === 'guide' || explicit === 'ranking' || explicit === 'trend') {
      return explicit;
    }

    if (categories.some((category) => category.isRankingCategory)) {
      return 'ranking';
    }

    const haystack = `${this.ensureString(rawPost?.slug)} ${this.ensureString(
      rawPost?.title?.rendered || rawPost?.title
    )}`.toLowerCase();
    if (RANKING_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
      return 'ranking';
    }
    if (TREND_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
      return 'trend';
    }
    return 'guide';
  }

  private getRankingReason(
    rawPost: any,
    categories: EditorialCategory[],
    contentType: EditorialContentType
  ): 'type' | 'category' | 'keyword' | 'none' {
    if (contentType === 'ranking' && this.ensureString(rawPost?.contentType)) {
      return 'type';
    }
    if (categories.some((category) => category.isRankingCategory)) {
      return 'category';
    }

    const haystack = `${this.ensureString(rawPost?.slug)} ${this.ensureString(
      rawPost?.title?.rendered || rawPost?.title
    )}`.toLowerCase();

    return RANKING_KEYWORDS.some((keyword) => haystack.includes(keyword))
      ? 'keyword'
      : 'none';
  }

  private isRankingCategory(rawCategory: any): boolean {
    const slug = this.normalizeSlug(rawCategory?.slug || rawCategory?.name || '');
    if (RANKING_CATEGORY_SLUGS.has(slug)) {
      return true;
    }

    return RANKING_KEYWORDS.some((keyword) => slug.includes(this.normalizeSlug(keyword)));
  }

  private normalizeFaqItems(value: any): EditorialFaqItem[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => ({
        question: this.ensureString(item?.question),
        answer: this.ensureString(item?.answer),
      }))
      .filter((item) => item.question && item.answer);
  }

  private normalizeRouteKeys(value: any): EditorialRouteRelationKey[] {
    const valid = new Set(VALID_ROUTE_RELATIONS);
    return this.normalizeStringArray(value).filter(
      (item): item is EditorialRouteRelationKey => valid.has(item as EditorialRouteRelationKey)
    );
  }

  private normalizeStringArray(value: any): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  private normalizeSlug(value: string): string {
    return String(value || '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private stripHtml(value: string): string {
    return String(value || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private ensureString(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    if (value == null) {
      return '';
    }
    if (typeof value === 'object') {
      if (typeof value.rendered === 'string') {
        return value.rendered;
      }
      if (typeof value.value === 'string') {
        return value.value;
      }
    }
    return String(value);
  }

  private calculateReadingTime(contentHtml: string): number {
    const words = this.stripHtml(contentHtml).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }
}
