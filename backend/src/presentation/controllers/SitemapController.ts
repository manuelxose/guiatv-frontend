import { Request, Response, NextFunction } from 'express';
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { IProgramRepository } from '../../domain/repositories/IProgramRepository';
import { BlogPostModel } from '../../infrastructure/database/models/BlogPost.model';

type Changefreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

interface SitemapUrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: Changefreq;
  priority?: number;
}

const DEFAULT_BASE_URL = 'https://guiaprogramaciontv.com';
const CACHE_TTL_MS = Number(process.env.SITEMAP_CACHE_TTL_MS) || 15 * 60 * 1000;

let cachedXml: { value: string; expiresAt: number } | null = null;
let inflight: Promise<string> | null = null;

export class SitemapController {
  constructor(
    private readonly channelRepository: IChannelRepository,
    private readonly programRepository: IProgramRepository
  ) {}

  async getSitemap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const xml = await this.getCachedXml();
      const maxAgeSec = Math.max(60, Math.floor(CACHE_TTL_MS / 1000));

      res.set('Content-Type', 'application/xml; charset=UTF-8');
      res.set('Cache-Control', `public, max-age=${maxAgeSec}, stale-while-revalidate=${maxAgeSec}`);
      res.set('Pragma', '');
      res.set('Expires', new Date(Date.now() + maxAgeSec * 1000).toUTCString());
      res.status(200).send(xml);
    } catch (error) {
      next(error);
    }
  }

  private async getCachedXml(): Promise<string> {
    const now = Date.now();
    if (cachedXml && cachedXml.expiresAt > now) {
      return cachedXml.value;
    }

    if (inflight) {
      return inflight;
    }

    inflight = this.buildXml()
      .then((xml) => {
        cachedXml = { value: xml, expiresAt: Date.now() + CACHE_TTL_MS };
        inflight = null;
        return xml;
      })
      .catch((error) => {
        inflight = null;
        throw error;
      });

    return inflight;
  }

  private async buildXml(): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const today = new Date();
    const todayYmd = this.formatYmd(today);
    const todayIso = this.formatDate(today);

    const urls: SitemapUrlEntry[] = this.getStaticUrls(todayIso);

    const channels = await this.channelRepository.findAll({ isActive: true });
    channels.forEach((channel) => {
      const slug = channel.normalizedName;
      if (!slug) return;
      urls.push({
        loc: `/programacion-tv/ver-canal/${slug}`,
        lastmod: todayIso,
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

    const programs = await this.programRepository.findByDate(todayYmd, 'minimal');
    const seenProgramSlugs = new Set<string>();
    programs.forEach((program) => {
      const slug = this.slugify(program.title);
      if (!slug || seenProgramSlugs.has(slug)) return;
      seenProgramSlugs.add(slug);
      urls.push({
        loc: `/programas/${slug}`,
        lastmod: this.formatDate(program.startTime),
        changefreq: 'daily',
        priority: 0.6,
      });
    });

    const posts = await BlogPostModel.find({ status: 'publish' })
      .select({ slug: 1, publishedAt: 1, updatedAt: 1, categories: 1 })
      .lean()
      .exec();

    const categorySlugs = new Set<string>();
    posts.forEach((post) => {
      if (post.slug) {
        const lastmod = post.updatedAt || post.publishedAt || today;
        urls.push({
          loc: `/blog/${post.slug}`,
          lastmod: this.formatDate(lastmod),
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
      (post.categories || []).forEach((category: any) => {
        if (category?.slug) {
          categorySlugs.add(category.slug);
        }
      });
    });

    categorySlugs.forEach((slug) => {
      urls.push({
        loc: `/blog/categoria/${slug}`,
        lastmod: todayIso,
        changefreq: 'weekly',
        priority: 0.5,
      });
    });

    return this.renderXml(baseUrl, urls);
  }

  private getStaticUrls(today: string): SitemapUrlEntry[] {
    return [
      { loc: '/', lastmod: today, changefreq: 'daily', priority: 1.0 },
      { loc: '/programacion-tv/que-ver-hoy', lastmod: today, changefreq: 'daily', priority: 0.9 },
      { loc: '/programacion-tv/en-directo', lastmod: today, changefreq: 'hourly', priority: 0.9 },
      { loc: '/programacion-tv/peliculas', lastmod: today, changefreq: 'daily', priority: 0.9 },
      { loc: '/programacion-tv/series', lastmod: today, changefreq: 'daily', priority: 0.9 },
      { loc: '/programacion-tv/guia-canales', lastmod: today, changefreq: 'daily', priority: 0.9 },
      { loc: '/blog', lastmod: today, changefreq: 'daily', priority: 0.8 },
      { loc: '/blog/top10', lastmod: today, changefreq: 'weekly', priority: 0.7 },
      { loc: '/avisolegal', lastmod: today, changefreq: 'monthly', priority: 0.3 },
      { loc: '/privacidad', lastmod: today, changefreq: 'monthly', priority: 0.3 },
      { loc: '/cookies', lastmod: today, changefreq: 'monthly', priority: 0.3 },
      { loc: '/terminos', lastmod: today, changefreq: 'monthly', priority: 0.3 },
      { loc: '/accesibilidad', lastmod: today, changefreq: 'monthly', priority: 0.3 },
      { loc: '/sitemap', lastmod: today, changefreq: 'weekly', priority: 0.4 },
    ];
  }

  private renderXml(baseUrl: string, urls: SitemapUrlEntry[]): string {
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

    urls.forEach((url) => {
      const loc = this.escapeXml(this.joinUrl(baseUrl, url.loc));
      lines.push('  <url>');
      lines.push(`    <loc>${loc}</loc>`);
      if (url.lastmod) {
        lines.push(`    <lastmod>${url.lastmod}</lastmod>`);
      }
      if (url.changefreq) {
        lines.push(`    <changefreq>${url.changefreq}</changefreq>`);
      }
      if (url.priority !== undefined) {
        lines.push(`    <priority>${url.priority.toFixed(1)}</priority>`);
      }
      lines.push('  </url>');
    });

    lines.push('</urlset>');
    return lines.join('\n');
  }

  private getBaseUrl(): string {
    const envUrl =
      process.env.SITE_URL ||
      process.env.PUBLIC_SITE_URL ||
      process.env.APP_BASE_URL;
    if (envUrl && typeof envUrl === 'string') {
      return envUrl.replace(/\/+$/, '');
    }
    return DEFAULT_BASE_URL;
  }

  private joinUrl(baseUrl: string, path: string): string {
    if (!path) return baseUrl;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    if (!path.startsWith('/')) {
      return `${baseUrl}/${path}`;
    }
    return `${baseUrl}${path}`;
  }

  private formatDate(date: Date | string): string {
    const value = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(value.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return value.toISOString().split('T')[0];
  }

  private formatYmd(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private slugify(value: string): string {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
