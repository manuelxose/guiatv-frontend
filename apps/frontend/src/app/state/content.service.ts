import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TvDataService } from './tv-data.service';
import {
  DateAlias,
  ProgramLayoutDTO,
  ChannelMetaDTO,
  LayoutsResponse,
} from '../api/models';
import { ApiConfigService } from '../api/api-config.service';
import { normalizePublicImageUrl } from '../utils/media-url';

export type ContentKind = 'movies' | 'series' | 'all';
export type ChannelType = 'TDT' | 'AUTONOMICO' | 'MOVISTAR' | 'CABLE' | 'DEPORTES';
const DEFAULT_CHANNEL_TYPES = ['TDT', 'CABLE', 'MOVISTAR', 'AUTONOMICO', 'OTT'];
const MAIN_FEATURED_CHANNELS = new Set([
  'la_1',
  'la_2',
  'antena_3',
  'cuatro',
  'telecinco',
  'la_sexta',
]);

const MAIN_CHANNEL_ALIASES: Record<string, string> = {
  la1: 'la_1',
  la_1: 'la_1',
  tve1: 'la_1',
  la2: 'la_2',
  la_2: 'la_2',
  tve2: 'la_2',
  antena3: 'antena_3',
  antena_3: 'antena_3',
  cuatro: 'cuatro',
  telecinco: 'telecinco',
  lasexta: 'la_sexta',
  la_sexta: 'la_sexta',
  la6: 'la_sexta',
};

export interface ContentItem {
  id: string;
  title: string;
  start: string;
  end: string;
  durationMinutes: number;
  channel: ChannelMetaDTO;
  category?: string;
  image?: string;
  rating?: number | string;
  description?: string;
  raw: ProgramLayoutDTO;
}

export interface ContentSnapshot {
  date: string;
  items: ContentItem[];
  live: ContentItem[];
  categories: string[];
  featured: ContentItem | null;
}

export interface ChannelGroup {
  id: string;
  name: string;
  type: string;
  programs: ContentItem[];
}

/**
 * ContentService - Unified service for content filtering, transformation and queries
 * Replaces TvGuideService functionality with cleaner API
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private cachedLayouts: LayoutsResponse | null = null;
  private cachedDate: string = '';

  constructor(
    private tvData: TvDataService,
    private apiConfig: ApiConfigService
  ) {}

  /**
   * Load content filtered by type (movies | series | all) from canonical TV reads.
   */
  loadContent(
    kind: ContentKind,
    date: DateAlias = 'today'
  ): Observable<ContentSnapshot> {
    return this.tvData
      .loadLayouts(date, {
        fields: 'full',
        channelTypes: DEFAULT_CHANNEL_TYPES,
      })
      .pipe(
        map((resp) => {
          const items = (resp?.channels || []).flatMap((entry) =>
            (entry.programs || []).map((p) =>
              this.toContentItem(p, entry.channel as ChannelMetaDTO)
            )
          );

          const filtered = this.filterByKind(items, kind);
          const categories = this.extractCategories(filtered);
          const live = filtered.filter((i) => this.isLive(i.start, i.end));
          const featured = this.pickFeatured(filtered, kind);

          // Cache layout snapshot for helper methods
          this.cachedLayouts = resp;
          this.cachedDate = resp.date;

          return {
            date: resp.date,
            items: filtered,
            live,
            categories,
            featured,
          };
        })
      );
  }

  /**
   * Get programs by channel ID or name
   */
  getProgramsByChannel(channelIdOrName: string): ContentItem[] {
    if (!this.cachedLayouts) return [];
    const token = this.normalizeChannelToken(channelIdOrName);

    const channelEntry = this.cachedLayouts.channels.find(
      (entry) => {
        const normalized = this.normalizeChannel(
          entry.channel,
          (entry.programs || [])[0]
        );
        return this.getChannelTokens(normalized).includes(token);
      }
    );

    if (!channelEntry) return [];

    return channelEntry.programs.map((p) =>
      this.toContentItem(p, channelEntry.channel)
    );
  }

  /**
   * Get programs filtered by category
   */
  getProgramsByCategory(category: string, channelId?: string): ContentItem[] {
    if (!this.cachedLayouts) return [];

    const allPrograms = (this.cachedLayouts.channels || []).flatMap((entry) =>
      (entry.programs || []).map((p) => this.toContentItem(p, entry.channel))
    );

    return allPrograms.filter((item) => {
      const matchCategory = this.matchesCategory(item, category);
      const matchChannel = !channelId || item.channel.id === channelId;
      return matchCategory && matchChannel;
    });
  }

  /**
   * Get channels grouped by type
   */
  getChannelsByType(type: ChannelType): ChannelGroup[] {
    if (!this.cachedLayouts) return [];

    return this.cachedLayouts.channels
      .filter((entry) => {
        const normalized = this.normalizeChannel(entry.channel, (entry.programs || [])[0]);
        const channelType = (normalized.type || '').toUpperCase();
        if (type === 'DEPORTES') {
          // Special case: return first 10 channels for sports
          return true;
        }
        return channelType === type;
      })
      .slice(0, type === 'DEPORTES' ? 10 : undefined)
      .map((entry) => {
        const channel = this.normalizeChannel(entry.channel, (entry.programs || [])[0]);
        return {
          id: channel.id,
          name: channel.name,
          type: channel.type || 'UNKNOWN',
          programs: entry.programs.map((p) =>
            this.toContentItem(p, channel)
          ),
        };
      });
  }

  /**
   * Get all available categories from current content
   */
  getAllCategories(): string[] {
    if (!this.cachedLayouts) return [];

    const allPrograms = (this.cachedLayouts.channels || []).flatMap((entry) =>
      (entry.programs || []).map((p) => this.toContentItem(p, entry.channel))
    );

    return this.extractCategories(allPrograms);
  }

  /**
   * Get currently live programs optionally filtered by kind
   */
  getLivePrograms(kind?: ContentKind): ContentItem[] {
    if (!this.cachedLayouts) return [];

    const allPrograms = (this.cachedLayouts.channels || []).flatMap((entry) =>
      (entry.programs || []).map((p) => this.toContentItem(p, entry.channel))
    );

    let filtered = allPrograms.filter((i) => this.isLive(i.start, i.end));

    if (kind && kind !== 'all') {
      filtered = this.filterByKind(filtered, kind);
    }

    return filtered;
  }

  /**
   * Clear cache (useful for forced refresh)
   */
  clearCache(): void {
    this.cachedLayouts = null;
    this.cachedDate = '';
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  private toContentItem(
    program: ProgramLayoutDTO,
    channel?: ChannelMetaDTO
  ): ContentItem {
    const safeChannel = this.normalizeChannel(channel, program);
    const image = this.resolveProgramImage(program);
    const title =
      typeof program.title === 'object' ? program.title.value : program.title;
    const category = program.category;
    const rating = program.rating ? Number(program.rating) : program.rating;

    return {
      id: program.id,
      title,
      start: program.start,
      end: program.end,
      durationMinutes: program.durationMinutes,
      channel: safeChannel,
      category: category || undefined,
      image,
      rating,
      description: program.description,
      raw: program,
    };
  }

  private normalizeChannel(
    channel?: Partial<ChannelMetaDTO>,
    program?: ProgramLayoutDTO
  ): ChannelMetaDTO {
    const channelId = String(channel?.id || program?.channelId || '').trim();
    const cached = this.tvData.getCachedChannelMeta(channelId);
    return {
      id: channelId || cached?.id || '',
      name:
        String(channel?.name || cached?.name || channelId || 'Canal desconocido').trim() ||
        'Canal desconocido',
      normalizedName:
        String(channel?.normalizedName || cached?.normalizedName || '').trim() ||
        undefined,
      aliases:
        Array.isArray(channel?.aliases) && channel.aliases.length
          ? [...channel.aliases]
          : cached?.aliases,
      sourceIds:
        Array.isArray(channel?.sourceIds) && channel.sourceIds.length
          ? [...channel.sourceIds]
          : cached?.sourceIds,
      icon:
        (channel?.icon as string | null | undefined) ||
        cached?.icon ||
        undefined,
      type: String(channel?.type || cached?.type || '').trim() || undefined,
      country:
        String(channel?.country || cached?.country || '').trim() || undefined,
      countryCode:
        String(channel?.countryCode || cached?.countryCode || '').trim() ||
        undefined,
      region:
        String(channel?.region || cached?.region || '').trim() || undefined,
      description:
        String(channel?.description || cached?.description || '').trim() ||
        undefined,
    };
  }

  /**
   * Normaliza URLs de imagen, añadiendo host base para rutas /storage o relativas.
   */
  private resolveImage(img?: string | null): string | undefined {
    if (!img) return undefined;
    return normalizePublicImageUrl(img, this.apiConfig.getAssetBaseUrl());
  }

  private resolveProgramImage(program: ProgramLayoutDTO): string | undefined {
    const rawProgram = program as any;
    const candidates = [
      program.image,
      rawProgram?.poster,
      rawProgram?.background,
      rawProgram?.icon,
    ];

    for (const candidate of candidates) {
      const normalized = this.resolveImage(candidate);
      if (this.hasValidImageUrl(normalized)) return normalized;
    }

    return undefined;
  }

  private hasValidImageUrl(url?: string | null): boolean {
    const value = String(url || '').trim();
    if (!value) return false;
    if (value.includes('undefined') || value.includes('null')) return false;
    return /^(https?:\/\/|\/|data:image\/)/i.test(value);
  }

  private filterByKind(items: ContentItem[], kind: ContentKind): ContentItem[] {
    if (kind === 'all') return items;
    return items.filter((i) =>
      kind === 'movies' ? this.isMovie(i) : this.isSeries(i)
    );
  }

  private isLive(start: string, end: string): boolean {
    const now = Date.now();
    const s = new Date(start).getTime();
    let e = new Date(end).getTime();
    if (e <= s) e += 24 * 60 * 60 * 1000; // cross midnight
    return now >= s && now <= e;
  }

  private isMovie(item: ContentItem): boolean {
    const cat = (item.category || '').toLowerCase();
    return cat.includes('cine') || cat.includes('movie') || cat.includes('pel');
  }

  private isSeries(item: ContentItem): boolean {
    const cat = (item.category || '').toLowerCase();
    return cat.includes('series') || cat === 'serie';
  }

  private matchesCategory(item: ContentItem, category: string): boolean {
    const cat = (item.category || '').toLowerCase();
    return cat.includes(category.toLowerCase());
  }

  private extractCategories(items: ContentItem[]): string[] {
    return Array.from(
      new Set(
        items
          .map((i) => this.getSecondaryCategory(i.raw.category))
          .filter(Boolean) as string[]
      )
    );
  }

  private getSecondaryCategory(category?: string): string | null {
    if (!category) return null;
    const parts = category.split(',');
    return parts[1]?.trim() || parts[0]?.trim() || null;
  }

  private pickFeatured(items: ContentItem[], kind: ContentKind): ContentItem | null {
    if (!items.length) return null;

    if (kind === 'movies') {
      const eligible = items
        .filter((item) => this.isMainFeaturedChannel(item.channel))
        .filter((item) => this.hasValidImageUrl(item.image))
        .sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        );

      // No fallback to non-main channels for Home featured.
      return eligible[0] || null;
    }

    const upcoming = [...items].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    return upcoming[0] || null;
  }

  private isMainFeaturedChannel(channel?: ChannelMetaDTO): boolean {
    const tokens = this.getChannelTokens(channel);

    return tokens.some((token) => {
      const canonical = MAIN_CHANNEL_ALIASES[token] || token;
      return MAIN_FEATURED_CHANNELS.has(canonical);
    });
  }

  private getChannelTokens(channel?: Partial<ChannelMetaDTO>): string[] {
    return Array.from(
      new Set(
        [
          channel?.id,
          channel?.name,
          channel?.normalizedName,
          ...(Array.isArray(channel?.aliases) ? channel.aliases : []),
          ...(Array.isArray(channel?.sourceIds) ? channel.sourceIds : []),
        ]
          .map((value) => this.normalizeChannelToken(value))
          .filter(Boolean)
      )
    );
  }

  private normalizeChannelToken(value?: string | null): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
