import { Request, Response, NextFunction } from 'express';
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { IProgramRepository } from '../../domain/repositories/IProgramRepository';
import { BlogPostModel } from '../../infrastructure/database/models/BlogPost.model';
import { TMDBService } from '../../infrastructure/external/TMDBService';
import { ChannelType } from '../../domain/entities/Channel';
import { FootballQueryService } from '../../application/sports/services/FootballQueryService';
import { buildLegacyProgramSlug, normalizeTvToken } from '../../shared/utils/tvMetadata';
import { TvReadQueryService } from '../../application/services/TvReadQueryService';
import { PUBLIC_EDITORIAL_FILTER } from '../../application/services/EditorialReviewPolicy';

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
// Was 5 minutes - far shorter than this content needs (the streaming
// sitemap declares changefreq:'weekly' for its own URLs) and far shorter
// than its build cost justifies: appendStreamingContent() can make up to
// 78 sequential TMDB calls (13 platforms x up to 3 pages x movies+TV).
// In-flight dedup (inflightMap below) already prevents concurrent
// requests from each re-running that build, but a 5-minute TTL still
// meant it re-ran ~12x/hour under any steady traffic, plus once per
// guiatv-api restart (this is an in-process Map, not Redis-backed, so it
// doesn't survive a restart) - a real contributor to memory pressure
// during this session's residual-OOM investigation
// (docs/rebuild-scoreboard.md). 6h keeps the sitemap far fresher than its
// own declared weekly changefreq while cutting rebuild frequency ~72x.
const CACHE_TTL_MS = Number(process.env.SITEMAP_CACHE_TTL_MS) || 6 * 60 * 60 * 1000;

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
    _tmdbService?: TMDBService,
    _footballQueryService?: FootballQueryService,
    private readonly tvReadQueryService?: Pick<
      TvReadQueryService,
      'getChannels' | 'getIndexableProgramSitemapRows'
    >
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

  /** GET /sitemap-football.xml — competitions, matches, teams (spec §79-81). */
  async getFootballSitemap(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const xml = await this.getCached('football', () => this.buildFootballSitemap());
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

    if (this.tvReadQueryService) {
      const directory = await this.tvReadQueryService.getChannels('today');
      for (const entry of directory.channels) {
        const channel = entry.channel;
        if (channel.group !== 'tdt' && channel.group !== 'autonomico') continue;
        const slug = channel.normalizedName || normalizeTvToken(channel.name);
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

    // Compatibility fallback for installations without the public TV read
    // model. Production injects tvReadQueryService above so sitemap eligibility
    // uses the same consumer-visible rows as the channel detail surface.
    const todayYmd = this.formatYmd(new Date());
    const [channels, programsToday] = await Promise.all([
      this.channelRepository.findAll({ isActive: true }),
      this.programRepository.findByDate(todayYmd, 'minimal'),
    ]);
    const scheduledChannelIds = new Set(
      programsToday.flatMap((program) => [
        normalizeTvToken(program.channelId),
        normalizeTvToken(program.canonicalChannelId),
      ])
    );

    for (const channel of channels) {
      if (!INDEXABLE_CHANNEL_TYPES.has(channel.type)) continue;
      const slug = channel.normalizedName;
      if (!slug) continue;
      const channelIdentifiers = [channel.id, slug, ...channel.aliases, ...channel.sourceIds]
        .map((value) => normalizeTvToken(value));
      if (!channelIdentifiers.some((identifier) => scheduledChannelIds.has(identifier))) continue;
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

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowYmd = this.formatYmd(tomorrow);

    const urls: SitemapUrlEntry[] = [];
    const seenSlugs = new Set<string>();

    if (this.tvReadQueryService) {
      const rows = await this.tvReadQueryService.getIndexableProgramSitemapRows([
        todayYmd,
        tomorrowYmd,
      ]);
      for (const row of rows) {
        const slug = buildLegacyProgramSlug(row.title);
        if (!slug || seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);
        urls.push({
          loc: `/programas/${slug}`,
          lastmod: this.formatDate(row.start),
          changefreq: 'daily',
          priority: 0.6,
        });
      }
      return this.renderUrlset(urls);
    }

    // Compatibility fallback for installations that have not enabled the TV
    // read model. Production uses the branch above, matching the collection
    // queried by the public slug resolver.
    const [programsToday, programsTomorrow] = await Promise.all([
      this.programRepository.findByDate(todayYmd, 'minimal'),
      this.programRepository.findByDate(tomorrowYmd, 'minimal'),
    ]);
    const allPrograms = [...programsToday, ...programsTomorrow];

    for (const program of allPrograms) {
      // Only include TMDB-enriched programs (not ephemeral EPG-only)
      if (!program.tmdbId) continue;
      const slug = buildLegacyProgramSlug(program.title);
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

    const posts = await BlogPostModel.find(PUBLIC_EDITORIAL_FILTER)
      .select({ slug: 1, publishedAt: 1, updatedAt: 1, categories: 1 })
      .lean()
      .exec();

    const categoryCounts = new Map<string, number>();
    for (const post of posts) {
      if (post.slug) {
        const lastmod = post.updatedAt || post.publishedAt || new Date();
        urls.push({
          loc: `/editorial/${post.slug}`,
          lastmod: this.formatDate(lastmod),
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
      const postCategorySlugs = new Set<string>();
      for (const category of (post.categories || []) as any[]) {
        if (category?.slug) postCategorySlugs.add(category.slug);
      }
      for (const slug of postCategorySlugs) {
        categoryCounts.set(slug, (categoryCounts.get(slug) || 0) + 1);
      }
    }

    for (const [slug, count] of categoryCounts) {
      if (count < 3) continue;
      urls.push({
        loc: `/editorial/categoria/${slug}`,
        lastmod: todayIso,
        changefreq: 'weekly',
        priority: 0.5,
      });
    }
    return this.renderUrlset(urls);
  }

  /** Provider-only detail pages stay discoverable to users but are not SEO inventory. */
  private async buildFootballSitemap(): Promise<string> {
    return this.renderUrlset([]);
  }

  private async buildStreamingSitemap(): Promise<string> {
    const todayIso = this.formatDate(new Date());

    // Keep this child sitemap non-empty: Search Console rejects an empty
    // urlset even though it is well-formed XML. These are stable, public
    // streaming surfaces; provider-only catalogue detail pages stay out
    // until they have a guaranteed indexable resolver.
    return this.renderUrlset([
      { loc: '/plataformas', lastmod: todayIso, changefreq: 'daily', priority: 0.9 },
      { loc: '/comparador-streaming', lastmod: todayIso, changefreq: 'weekly', priority: 0.8 },
      { loc: '/programacion-tv/peliculas', lastmod: todayIso, changefreq: 'daily', priority: 0.9 },
      { loc: '/programacion-tv/series', lastmod: todayIso, changefreq: 'daily', priority: 0.9 },
    ]);
  }

  /* ------------------------------------------------------------------ */
  /*  Static URL definitions                                             */
  /* ------------------------------------------------------------------ */

  private getStaticUrls(today: string): SitemapUrlEntry[] {
    return [
      { loc: '/', lastmod: today, changefreq: 'daily', priority: 1.0 },
      { loc: '/programacion-tv/que-ver-hoy', lastmod: today, changefreq: 'daily', priority: 0.9 },
      // NOTE: /programacion-tv/en-directo is excluded — it redirects to /guia-canales (301)
      { loc: '/programacion-tv/guia-canales', lastmod: today, changefreq: 'hourly', priority: 0.9 },
      { loc: '/canales', lastmod: today, changefreq: 'hourly', priority: 0.8 },
      { loc: '/programacion-tv/peliculas', lastmod: today, changefreq: 'daily', priority: 0.9 },
      { loc: '/programacion-tv/series', lastmod: today, changefreq: 'daily', priority: 0.9 },
      { loc: '/plataformas', lastmod: today, changefreq: 'daily', priority: 0.9 },
      { loc: '/deportes/futbol', lastmod: today, changefreq: 'hourly', priority: 0.9 },
      { loc: '/deportes/futbol/partidos-hoy', lastmod: today, changefreq: 'hourly', priority: 0.8 },
      { loc: '/deportes/futbol/en-directo', lastmod: today, changefreq: 'hourly', priority: 0.8 },
      { loc: '/deportes/futbol/competiciones', lastmod: today, changefreq: 'daily', priority: 0.8 },
      { loc: '/deportes/futbol/noticias', lastmod: today, changefreq: 'daily', priority: 0.7 },
      { loc: '/comparador-streaming', lastmod: today, changefreq: 'weekly', priority: 0.8 },
      { loc: '/editorial', lastmod: today, changefreq: 'daily', priority: 0.8 },
      { loc: '/editorial/rankings', lastmod: today, changefreq: 'weekly', priority: 0.7 },
      { loc: '/sobre-nosotros', lastmod: today, changefreq: 'monthly', priority: 0.6 },
      { loc: '/prensa', lastmod: today, changefreq: 'monthly', priority: 0.5 },
      { loc: '/developers', lastmod: today, changefreq: 'monthly', priority: 0.5 },
      { loc: '/embed', lastmod: today, changefreq: 'monthly', priority: 0.4 },
      { loc: '/avisolegal', lastmod: today, changefreq: 'monthly', priority: 0.3 },
      { loc: '/privacidad', lastmod: today, changefreq: 'monthly', priority: 0.3 },
      { loc: '/cookies', lastmod: today, changefreq: 'monthly', priority: 0.3 },
      { loc: '/terminos', lastmod: today, changefreq: 'monthly', priority: 0.3 },
      { loc: '/accesibilidad', lastmod: today, changefreq: 'monthly', priority: 0.3 },
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
  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
