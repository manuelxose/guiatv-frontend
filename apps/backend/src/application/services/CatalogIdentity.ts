import { CatalogContentType } from '../dto/CatalogDTO';

export interface ParsedCatalogId {
  source: 'program' | 'tmdb';
  contentType: CatalogContentType;
  raw: string;
  programId?: string;
  tmdbId?: number;
  tmdbType?: 'movie' | 'tv';
}

export function buildProgramCatalogId(programId: string): string {
  return `program:${String(programId || '').trim()}`;
}

export function buildTmdbCatalogId(
  contentType: 'movie' | 'tv',
  tmdbId: number
): string {
  return `tmdb:${contentType}:${Number(tmdbId)}`;
}

export function parseCatalogId(value: string): ParsedCatalogId | null {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  if (raw.startsWith('program:')) {
    const programId = raw.slice('program:'.length).trim();
    return programId
      ? {
          source: 'program',
          contentType: 'program',
          raw,
          programId,
        }
      : null;
  }

  if (raw.startsWith('tmdb:movie:')) {
    const tmdbId = Number(raw.slice('tmdb:movie:'.length));
    return Number.isFinite(tmdbId) && tmdbId > 0
      ? {
          source: 'tmdb',
          contentType: 'movie',
          raw,
          tmdbId,
          tmdbType: 'movie',
        }
      : null;
  }

  if (raw.startsWith('tmdb:tv:')) {
    const tmdbId = Number(raw.slice('tmdb:tv:'.length));
    return Number.isFinite(tmdbId) && tmdbId > 0
      ? {
          source: 'tmdb',
          contentType: 'series',
          raw,
          tmdbId,
          tmdbType: 'tv',
        }
      : null;
  }

  return null;
}

export function normalizeInteractionContentId(input: {
  contentId?: string;
  contentType?: string;
  tmdbId?: number;
}): string {
  const raw = String(input.contentId || '').trim();
  if (raw.startsWith('program:') || raw.startsWith('tmdb:movie:') || raw.startsWith('tmdb:tv:')) {
    return raw;
  }

  if (typeof input.tmdbId === 'number' && Number.isFinite(input.tmdbId) && input.tmdbId > 0) {
    if (input.contentType === 'series') {
      return buildTmdbCatalogId('tv', input.tmdbId);
    }
    if (input.contentType === 'movie') {
      return buildTmdbCatalogId('movie', input.tmdbId);
    }
  }

  if (raw) {
    return buildProgramCatalogId(raw);
  }

  return raw;
}
