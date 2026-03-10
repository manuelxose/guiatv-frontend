import { Request, Response, NextFunction } from 'express';
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { IProgramRepository } from '../../domain/repositories/IProgramRepository';
import { BlogPostModel } from '../../infrastructure/database/models/BlogPost.model';
import { TMDBService } from '../../infrastructure/external/TMDBService';
import { CATALOG_PLATFORM_REGISTRY } from '../../application/dto/CatalogDTO';
import { ChannelType } from '../../domain/entities/Channel';

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
const CACHE_TTL_MS = Number(process.env.SITEMAP_CACHE_TTL_MS) || 5 * 60 * 1000;

/** Channel types included in the sitemap (curated subset) */
const INDEXABLE_CHANNEL_TYPES: ReadonlySet<ChannelType> = new Set<ChannelType>([
  'TDT',
  'Autonomico',
]);

const cache = new Map<string, { value: string; expiresAt: number }>();
const inflightMap = new Map<string, Promise<string>>();

export const invalidateSitemapCache = (): void => {
  cache.clear();
  inflightMap.clear();
};

export class SitemapController {
  constructor(
    private readonly channelRepository: IChannelRepository,
    private readonly programRepository: IProgramRepository,
    private readonly tmdbService?: TMDBService
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Public route handlers                                              */
  /* ------------------------------------------------------------------ */

  /** GET /sitemap.xml — sitemap index */
  async getSitemapIndex(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const xml = await this.getCached('index', () => this.buildSitemapIndex());
      this.sendXml(res, xml);
    } catch (error) { next(error); }
  }

  /** GET /sitemap-static.xml */
  async getStaticSitemap(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const xml = await this.getCached('static', () => this.buildStaticSitemap());
      this.sendXml(res, xml);
    } catch (error) { next(error); }
  }

  /** GET /sitemap-channels.xml */
  async getChannelsSitemap(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const xml = await this.getCached('channels', () => this.buildChannelsSitemap());
      this.sendXml(res, xml);
    } catch (error) { next(error); }
  }

  /** GET /sitemap-programs.xml */
  async getProgramsSitemap(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const xml = await this.getCached('programs', () => this.buildProgramsSitemap());
      this.sendXml(res, xml);
    } catch (error) { next(error); }
  }

  /** GET /sitemap-blog.xml */
  async getBlogSitemap(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const xml = await this.getCached('blog', () => this.buildBlogSitemap());
      this.sendXml(res, xml);
    } catch (error) { next(error); }
  }

  /** GET /sitemap-streaming.xml */
  async getStreamingSitemap(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const xml = await this.getCached('streaming', () => this.buildStreamingSitemap());
      this.sendXml(res, xml);
    } catch (error) { next(error); }
  }

  /** @deprecated — kept for backwards compat; now returns sitemap index */
  async getSitemap(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.getSitemapIndex(req, res, next);
  }

  /* ------------------------------------------------------------------ */
  /*  Cache layer                                                        */
  /* ------------------------------------------------------------------ */

  private async getCached(key: string, builder: () => Promise<string>): Promise<string> {
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) return cached.value;

    const existing = inflightMap.get(key);
    if (existing) return existing;

    const promise = builder()
      .then((xml) => {
        cache.set(key, { value: xml, expiresAt: Date.now() + CACHE_TTL_MS });
        inflightMap.delete(key);
        return xml;
      })
      .catch((err) => {
        inflightMap.delete(key);
        throw err;
      });
    inflightMap.set(key, promise);
    return promise;
  }

  private sendXml(res: Response, xml: string): void {
    const maxAgeSec = Math.max(60, Math.floor(CACHE_TTL_MS / 1000));
    res.set('Content-Type', 'application/xml; charset=UTF-8');
    res.set('Cache-Control', `public, max-age=${maxAgeSec}, stale-while-revalidate=${maxAgeSec}`);
    res.set('Pragma', '');
    res.set('Expires', new Date(Date.now() + maxAgeSec * 1000).toUTCString());
    res.status(200).send(xml);
  }

  /* ------------------------------------------------------------------ */
  /*  Sitemap index builder                                              */
  /* ------------------------------------------------------------------ */

  private async buildSitemapIndex(): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const todayIso = this.formatDate(new Date());

    const subs = [
      'sitemap-static.xml',
      'sitemap-channels.xml',
      'sitemap-programs.xml',
      'sitemap-blog.xml',
    ];
    if (this.tmdbService) subs.push('sitemap-streaming.xml');

    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];
    for (const file of subs) {
      lines.push('  <sitemap>');
      lines.push(`    <loc>${this.escapeXml(`${baseUrl}/${file}`)}</loc>`);
      lines.push(`    <lastmod>${todayIso}</lastmod>`);
      lines.push('  </sitemap>');
    }
    lines.push('</sitemapindex>');
    return lines.join('\n');
  }

  /* ------------------------------------------------------------------ */
  /*  Sub-sitemap builders                                               */
  /* ------------------------------------------------------------------ */

  private async buildStaticSitemap(): Promise<string> {
    const todayIso = this.formatDate(new Date());
    return this.renderUrlset(this.getStaticUrls(todayIso));
  }

  private async buildChannelsSitemap(): Promise<string> {
    const todayIso = this.formatDate(new Date());
    const urls: SitemapUrlEntry[] = [];

    const channels = await this.channelRepository.findAll({ isActive: true });
    for (const channel of channels) {
      if (!INDEXABLE_CHANNEL_TYPES.has(channel.type)) continue;
      const slug = channel.normalizedName;
      if (!slug) continue;
      urls.push({
        loc: `/canales/${slug}`,
        lastmod: todayIso,
        changefreq: 'weekly',
        priority: 0.7,
      });
    }
    return this.renderUrlset(urls);
  }

  private async buildProgramsSitemap(): Promise<string> {
    const today = new Date();
    const todayYmd = this.formatYmd(today);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayYmd = this.formatYmd(yesterday);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowYmd = this.formatYmd(tomorrow);

    const [programsYesterday, programsToday, programsTomorrow] = await Promise.all([
      this.programRepository.findByDate(yesterdayYmd, 'minimal'),
      this.programRepository.findByDate(todayYmd, 'minimal'),
      this.programRepository.findByDate(tomorrowYmd, 'minimal'),
    ]);

    const urls: SitemapUrlEntry[] = [];
    const seenSlugs = new Set<string>();
    const allPrograms = [...programsYesterday, ...programsToday, ...programsTomorrow];

    for (const program of allPrograms) {
      // Only include TMDB-enriched programs (not ephemeral EPG-only)
      if (!program.tmdbId) continue;
      const slug = this.slugify(program.title);
      if (!slug || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);
      urls.push({
        loc: `/programas/${slug}`,
        lastmod: this.formatDate(program.startTime),
        changefreq: 'daily',
        priority: 0.6,
      });
    }
    return this.renderUrlset(urls);
  }

  private async buildBlogSitemap(): Promise<string> {
    const todayIso = this.formatDate(new Date());
    const urls: SitemapUrlEntry[] = [];

    const posts = await BlogPostModel.find({ status: 'publish' })
      .select({ slug: 1, publishedAt: 1, updatedAt: 1, categories: 1 })
      .lean()
      .exec();

    const categorySlugs = new Set<string>();
    for (const post of posts) {
      if (post.slug) {
        const lastmod = post.updatedAt || post.publishedAt || new Date();
        urls.push({
          loc: `/blog/${post.slug}`,
          lastmod: this.formatDate(lastmod),
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
      for (const category of (post.categories || []) as any[]) {
        if (category?.slug) categorySlugs.add(category.slug);
      }
    }

    for (const slug of categorySlugs) {
      urls.push({
        loc: `/blog/categoria/${slug}`,
        lastmod: todayIso,
        changefreq: 'weekly',
        priority: 0.5,
      });
    }
    return this.renderUrlset(urls);
  }

  private async buildStreamingSitemap(): Promise<string> {
    const todayIso = this.formatDate(new Date());
    const urls: SitemapUrlEntry[] = [];

    if (this.tmdbService) {
      try {
        await this.appendStreamingContent(urls, todayIso);
      } catch (err) {
        console.error('[Sitemap] Error fetching streaming content:', err);
      }
    }
    return this.renderUrlset(urls);
  }

  /* ------------------------------------------------------------------ */
  /*  Static URL definitions                                             */
  /* ------------------------------------------------------------------ */

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
      { loc: '/plataformas', lastmod: today, changefreq: 'daily', priority: 0.9 },
    ];
  }

  /* ------------------------------------------------------------------ */
  /*  XML rendering                                                      */
  /* ------------------------------------------------------------------ */

  private renderUrlset(urls: SitemapUrlEntry[]): string {
    const baseUrl = this.getBaseUrl();
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];

    for (const url of urls) {
      const loc = this.escapeXml(this.joinUrl(baseUrl, url.loc));
      lines.push('  <url>');
      lines.push(`    <loc>${loc}</loc>`);
      if (url.lastmod) lines.push(`    <lastmod>${url.lastmod}</lastmod>`);
      if (url.changefreq) lines.push(`    <changefreq>${url.changefreq}</changefreq>`);
      if (url.priority !== undefined) lines.push(`    <priority>${url.priority.toFixed(1)}</priority>`);
      lines.push('  </url>');
    }

    lines.push('</urlset>');
    return lines.join('\n');
  }

  /* ------------------------------------------------------------------ */
  /*  Streaming content (TMDB)                                           */
  /* ------------------------------------------------------------------ */

  private async appendStreamingContent(urls: SitemapUrlEntry[], todayIso: string): Promise<void> {
    const seenIds = new Set<string>();
    const MAX_PAGES = 3;

    for (const platform of CATALOG_PLATFORM_REGISTRY) {
      const discoverOpts = {
        withWatchProviders: [platform.tmdbProviderId],
        sortBy: 'popularity.desc' as const,
        region: 'ES',
        watchMonetizationTypes: ['flatrate' as const],
      };

      for (let page = 1; page <= MAX_PAGES; page++) {
        try {
          const moviePage = await this.tmdbService!.discoverMovies({ ...discoverOpts, page });
          for (const movie of moviePage.results) {
            const catalogId = `tmdb:movie:${movie.id}`;
            if (seenIds.has(catalogId)) continue;
            seenIds.add(catalogId);

            const slug = this.slugify(movie.title || movie.name || `movie-${movie.id}`);
            if (slug) {
              urls.push({
                loc: `/peliculas/${slug}`,
                lastmod: todayIso,
                changefreq: 'weekly',
                priority: 0.6,
              });
            }
          }
          if (page >= moviePage.total_pages) break;
        } catch { break; }
      }

      for (let page = 1; page <= MAX_PAGES; page++) {
        try {
          const tvPage = await this.tmdbService!.discoverTV({ ...discoverOpts, page });
          for (const show of tvPage.results) {
            const catalogId = `tmdb:tv:${show.id}`;
            if (seenIds.has(catalogId)) continue;
            seenIds.add(catalogId);

            const slug = this.slugify(show.name || show.title || `serie-${show.id}`);
            if (slug) {
              urls.push({
                loc: `/series/${slug}`,
                lastmod: todayIso,
                changefreq: 'weekly',
                priority: 0.6,
              });
            }
          }
          if (page >= tvPage.total_pages) break;
        } catch { break; }
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Utilities                                                          */
  /* ------------------------------------------------------------------ */

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
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  }

  private formatDate(date: Date | string): string {
    const value = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(value.getTime())) return new Date().toISOString().split('T')[0];
    return value.toISOString().split('T')[0];
  }

  private formatYmd(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /** Matches Channel.normalizedName: NFD-normalize to strip diacritics */
  private slugify(value: string): string {
    return String(value || '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
