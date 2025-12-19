import { Request, Response, NextFunction } from 'express';
import {
  BlogPostModel,
  IBlogPostCategory,
} from '../../infrastructure/database/models/BlogPost.model';
import { successResponse } from '../../shared/types/ApiResponse';
import { ValidationError } from '../../shared/errors';

interface CreatePostPayload {
  title?: string;
  slug?: string;
  status?: string;
  excerpt?: string;
  content?: string;
  categories?: string[] | string;
  coverImage?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[] | string;
  ogImage?: string;
  canonicalUrl?: string;
  publishedAt?: string;
}

/**
 * Blog controller that serves posts from MongoDB with a WordPress-like shape.
 */
export class BlogController {
  private readonly mockPosts = [
    {
      id: 1,
      date: new Date().toISOString(),
      date_gmt: new Date().toISOString(),
      guid: { rendered: 'http://guiatv.mock/?p=1' },
      modified: new Date().toISOString(),
      modified_gmt: new Date().toISOString(),
      slug: 'top-10-series-maraton',
      status: 'publish',
      type: 'post',
      link: 'http://guiatv.mock/top-10-series-maraton',
      title: { rendered: 'Top 10 series para maratonear este finde' },
      content: {
        rendered:
          '<p>Descubre las mejores series para ver este fin de semana. Desde thrillers apasionantes hasta comedias ligeras.</p>',
        protected: false,
      },
      excerpt: {
        rendered:
          '<p>Selección rápida con thriller, comedia y true crime listas en streaming.</p>',
        protected: false,
      },
      author: 1,
      featured_media: 10,
      comment_status: 'open',
      ping_status: 'open',
      sticky: false,
      template: '',
      format: 'standard',
      meta: [],
      categories: [1],
      tags: [],
      featured_image: {
        source_url: 'https://picsum.photos/seed/series/800/600',
      },
      categories_name: [
        { id: 1, name: 'Series', slug: 'series' },
      ],
    },
  ];

  public getPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { slug, limit, status, categories, search } = req.query;
      const filters: Record<string, any> = {};
      const limitValue = this.parseNumber(limit, 50);

      if (slug && typeof slug === 'string') {
        filters.slug = slug;
      }

      if (status && typeof status === 'string' && status !== 'all') {
        filters.status = status;
      } else if (!status) {
        filters.status = 'publish';
      }

      if (categories && typeof categories === 'string') {
        const ids = categories
          .split(',')
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isFinite(value));
        if (ids.length) {
          filters['categories.id'] = { $in: ids };
        }
      }

      if (search && typeof search === 'string') {
        filters.$text = { $search: search };
      }

      const hasDbPosts = await BlogPostModel.exists({});
      if (!hasDbPosts && !Object.keys(filters).length) {
        res.json(this.mockPosts);
        return;
      }

      const posts = await BlogPostModel.find(filters)
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(limitValue)
        .lean()
        .exec();

      res.json(posts.map((post) => this.mapPost(post)));
    } catch (error) {
      next(error);
    }
  };

  public createPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const payload = req.body as CreatePostPayload;
      const title = (payload.title || '').trim();
      if (!title) {
        throw new ValidationError('Title is required', [
          { field: 'title', message: 'Required', value: title },
        ]);
      }

      const slug = this.slugify(payload.slug || title);
      const status =
        payload.status && payload.status.toLowerCase() === 'publish'
          ? 'publish'
          : 'draft';
      const categories = this.normalizeCategories(payload.categories);
      const keywords = this.normalizeKeywords(payload.keywords);
      const featuredImage =
        payload.coverImage || payload.featuredImage || payload.ogImage;

      const publishedAt =
        payload.publishedAt && status === 'publish'
          ? new Date(payload.publishedAt)
          : status === 'publish'
          ? new Date()
          : undefined;

      const created = await BlogPostModel.create({
        title,
        slug,
        status,
        excerpt: payload.excerpt,
        content: payload.content,
        categories,
        featuredImage: featuredImage
          ? { sourceUrl: featuredImage }
          : undefined,
        seo: {
          metaTitle: payload.metaTitle,
          metaDescription: payload.metaDescription,
          keywords,
          ogImage: payload.ogImage,
          canonicalUrl: payload.canonicalUrl,
        },
        publishedAt,
      });

      res.status(201).json(
        successResponse({
          post: this.mapPost(created.toObject()),
        })
      );
    } catch (error) {
      next(error);
    }
  };

  public getCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      void req;
      const posts = await BlogPostModel.find({})
        .select({ categories: 1 })
        .lean()
        .exec();

      const categoryMap = new Map<number, any>();
      posts.forEach((post) => {
        (post.categories || []).forEach((category: IBlogPostCategory) => {
          const existing = categoryMap.get(category.id);
          if (existing) {
            existing.count += 1;
          } else {
            categoryMap.set(category.id, {
              id: category.id,
              count: 1,
              description: '',
              link: `http://guiatv.local/blog/categoria/${category.slug}`,
              name: category.name,
              slug: category.slug,
              taxonomy: 'category',
              parent: 0,
              meta: [],
            });
          }
        });
      });

      res.json(Array.from(categoryMap.values()));
    } catch (error) {
      next(error);
    }
  };

  private mapPost(post: any): any {
    return {
      id: post._id || post.id,
      date: post.publishedAt || post.createdAt || new Date().toISOString(),
      date_gmt: post.publishedAt || post.createdAt || new Date().toISOString(),
      modified: post.updatedAt || post.modified || new Date().toISOString(),
      modified_gmt: post.updatedAt || post.modified || new Date().toISOString(),
      slug: post.slug,
      status: post.status,
      type: 'post',
      link: post.seo?.canonicalUrl || `/blog/${post.slug}`,
      title: { rendered: post.title },
      content: { rendered: post.content || '' },
      excerpt: { rendered: post.excerpt || '' },
      categories: (post.categories || []).map((cat: IBlogPostCategory) => cat.id),
      categories_name: post.categories || [],
      featured_image: {
        source_url:
          post.featuredImage?.sourceUrl ||
          post.seo?.ogImage ||
          post.image?.url ||
          '',
        caption: post.featuredImage?.caption || '',
      },
      seo: post.seo,
    };
  }

  private parseNumber(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private slugify(value: string): string {
    return value
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  private normalizeCategories(input?: string[] | string): IBlogPostCategory[] {
    if (!input) return [];
    const list = Array.isArray(input)
      ? input
      : input.split(',').map((item) => item.trim());

    return list
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => {
        const slug = this.slugify(name);
        return {
          id: this.hashCategoryId(slug),
          name,
          slug,
        };
      });
  }

  private normalizeKeywords(input?: string[] | string): string[] {
    if (!input) return [];
    const list = Array.isArray(input)
      ? input
      : input.split(',').map((item) => item.trim());
    return list.filter(Boolean);
  }

  private hashCategoryId(slug: string): number {
    let hash = 0;
    for (let i = 0; i < slug.length; i += 1) {
      hash = (hash << 5) - hash + slug.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
