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

export type ContentKind = 'movies' | 'series' | 'all';
export type ChannelType = 'TDT' | 'AUTONOMICO' | 'MOVISTAR' | 'CABLE' | 'DEPORTES';
const DEFAULT_CHANNEL_TYPES = ['TDT', 'CABLE', 'MOVISTAR', 'AUTONOMICO', 'OTT'];

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
   * Load content filtered by type (movies | series | all) from /v2/layouts/{date}
   */
  loadContent(
    kind: ContentKind,
    date: DateAlias = 'today'
  ): Observable<ContentSnapshot> {
    return this.tvData
      .loadPrograms({
        date,
        // Usar full para obtener imágenes/posters necesarias en banner/destacadas
        fields: 'full',
        limit: 5000,
        channelTypes: DEFAULT_CHANNEL_TYPES,
      })
      .pipe(
        map((resp) => {
          const channelMap = new Map(
            (resp?.channels || []).map((c) => [c.id, c])
          );

          const items = (resp?.programs || []).map((p) => {
            const channelMeta = channelMap.get(p.channelId) as
              | ChannelMetaDTO
              | undefined;
            return this.toContentItem(p, channelMeta);
          });

          const filtered = this.filterByKind(items, kind);
          const categories = this.extractCategories(filtered);
          const live = filtered.filter((i) => this.isLive(i.start, i.end));
          const featured = this.pickFeatured(filtered);

          // Cache minimal structure for other methods
          this.cachedLayouts = {
            date: resp.date,
            timeSlots: resp.timeSlots || [],
            channels: (resp.channels || []).map((c) => ({
              channel: c,
              programs: (resp.programs || []).filter(
                (p) => p.channelId === c.id
              ) as any,
            })),
          } as any;
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

    const channelEntry = this.cachedLayouts.channels.find(
      (entry) =>
        entry.channel.id === channelIdOrName ||
        entry.channel.name.toLowerCase() === channelIdOrName.toLowerCase()
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
        const channelType = (entry.channel.type || '').toUpperCase();
        if (type === 'DEPORTES') {
          // Special case: return first 10 channels for sports
          return true;
        }
        return channelType === type;
      })
      .slice(0, type === 'DEPORTES' ? 10 : undefined)
      .map((entry) => ({
        id: entry.channel.id,
        name: entry.channel.name,
        type: entry.channel.type || 'UNKNOWN',
        programs: entry.programs.map((p) =>
          this.toContentItem(p, entry.channel)
        ),
      }));
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
    const safeChannel = channel || { id: program.channelId, name: '' } as any;
    const image = this.resolveImage(program.image);
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

  /**
   * Normaliza URLs de imagen, añadiendo host base para rutas /storage o relativas.
   */
  private resolveImage(img?: string | null): string | undefined {
    if (!img) return undefined;
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
      return img;
    }

    const base = this.apiConfig.getAssetBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '');
    if (img.startsWith('/')) {
      return `${base}${img}`;
    }

    // cualquier otra ruta relativa
    return `${base}/${img}`;
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

  private pickFeatured(items: ContentItem[]): ContentItem | null {
    if (!items.length) return null;

    // Prefer highest rating; fallback to first upcoming
    const rated = [...items].filter((i) => typeof i.rating === 'number');
    if (rated.length) {
      return rated.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))[0];
    }

    const upcoming = [...items].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    return upcoming[0] || null;
  }
}
