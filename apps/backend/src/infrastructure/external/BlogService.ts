import axios, { AxiosInstance } from 'axios';
import { BlogPostDTO } from '@/application/dto/MediaDTO';
import { logger } from '@/shared/utils/logger';

export interface BlogServiceConfig {
  baseUrl: string;
  timeoutMs?: number;
}

/**
 * Very small HTTP client for editorial/blog posts.
 * Expects an endpoint that returns an array of posts with title/slug/excerpt/image/publishedAt.
 */
export class BlogService {
  private readonly client: AxiosInstance;
  private readonly log = logger.child('BlogService');

  constructor(config: BlogServiceConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeoutMs || 5000,
    });
  }

  async getHighlights(limit = 4): Promise<BlogPostDTO[]> {
    try {
      const response = await this.client.get('/posts', {
        params: { limit },
      });

      const payload = Array.isArray(response.data)
        ? response.data
        : Array.isArray((response.data as any)?.posts)
          ? (response.data as any).posts
          : [];
      if (!payload.length) return [];

      return payload
        .slice(0, limit)
        .map((post: any) => this.mapPost(post))
        .filter(Boolean) as BlogPostDTO[];
    } catch (error) {
      this.log.warn('Unable to fetch blog highlights', { error });
      return [];
    }
  }

  private mapPost(raw: any): BlogPostDTO | null {
    if (!raw) return null;

    const title = raw.title?.rendered || raw.title || raw.name || '';
    const slug = raw.slug || raw.id || raw._id || '';
    if (!title || !slug) return null;

    return {
      title: String(title),
      slug: String(slug),
      excerpt:
        typeof raw.excerpt === 'string'
          ? raw.excerpt
          : raw.excerpt?.rendered || raw.summary || undefined,
      image:
        raw.image?.url || raw.featuredImage || raw.featured_image
          ? {
              url:
                raw.image?.url ||
                raw.featuredImage ||
                raw.featured_image ||
                '',
              aspectRatio: 1.6,
            }
          : undefined,
      publishedAt: raw.publishedAt || raw.published_at || raw.date || undefined,
    };
  }
}
