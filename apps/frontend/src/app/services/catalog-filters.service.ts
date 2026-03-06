import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import {
  CatalogAvailability,
  CatalogContentType,
  CatalogQuery,
  CatalogSort,
} from './catalog.service';

const STORAGE_KEY = 'gtv.catalog.filters';

export interface CatalogDiscoveryDefaults {
  types: CatalogContentType[];
  availability: CatalogAvailability[];
  platforms: string[];
  sort: CatalogSort;
}

@Injectable({ providedIn: 'root' })
export class CatalogFiltersService {
  private readonly isBrowser = typeof window !== 'undefined';

  fromQueryParams(params: Params, defaults?: Partial<CatalogQuery>): CatalogQuery {
    const types = this.readCsv(params['types']);
    const genres = this.readCsv(params['genres']);
    const platforms = this.readCsv(params['platforms']);
    const availability = this.readCsv(params['availability']);
    return {
      q: this.readString(params['q']) || defaults?.q || '',
      types: (types.length ? types : defaults?.types || []) as CatalogContentType[],
      genres: genres.length ? genres : defaults?.genres || [],
      platforms: platforms.length ? platforms : defaults?.platforms || [],
      availability: (availability.length
        ? availability
        : defaults?.availability || []) as CatalogAvailability[],
      date: this.readString(params['date']) || defaults?.date,
      timeSlot: this.readString(params['timeSlot']) || defaults?.timeSlot,
      sort: (this.readString(params['sort']) as CatalogSort) || defaults?.sort || 'popular',
      page: Number(params['page'] || defaults?.page || 1),
      limit: Number(params['limit'] || defaults?.limit || 24),
    };
  }

  toQueryParams(filters: CatalogQuery): Params {
    return {
      q: filters.q || null,
      types: filters.types?.length ? filters.types.join(',') : null,
      genres: filters.genres?.length ? filters.genres.join(',') : null,
      platforms: filters.platforms?.length ? filters.platforms.join(',') : null,
      availability: filters.availability?.length
        ? filters.availability.join(',')
        : null,
      date: filters.date || null,
      timeSlot: filters.timeSlot || null,
      sort: filters.sort || null,
      page: filters.page && filters.page > 1 ? filters.page : null,
      limit: filters.limit && filters.limit !== 24 ? filters.limit : null,
    };
  }

  remember(filters: CatalogQuery): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // ignore storage failures
    }
  }

  restore(): CatalogQuery | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  toDiscoveryDefaults(filters: CatalogQuery): CatalogDiscoveryDefaults {
    return {
      types: (filters.types || []) as CatalogContentType[],
      availability: (filters.availability || []) as CatalogAvailability[],
      platforms: filters.platforms || [],
      sort: (filters.sort || 'popular') as CatalogSort,
    };
  }

  private readString(value: unknown): string {
    return String(value || '').trim();
  }

  private readCsv(value: unknown): string[] {
    const raw = this.readString(value);
    if (!raw) {
      return [];
    }
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
