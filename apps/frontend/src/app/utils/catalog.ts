export type CatalogSource = 'program' | 'tmdb';
export type CatalogContentType = 'movie' | 'series' | 'program';

export function buildProgramCatalogId(programId: string): string {
  return `program:${String(programId || '').trim()}`;
}

export function buildTmdbCatalogId(
  type: 'movie' | 'tv',
  tmdbId: number
): string {
  return `tmdb:${type}:${Number(tmdbId)}`;
}

export function parseCatalogId(value: string): {
  source: CatalogSource;
  contentType: CatalogContentType;
  programId?: string;
  tmdbId?: number;
} | null {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  if (raw.startsWith('program:')) {
    const programId = raw.slice('program:'.length).trim();
    return programId
      ? { source: 'program', contentType: 'program', programId }
      : null;
  }

  if (raw.startsWith('tmdb:movie:')) {
    const tmdbId = Number(raw.slice('tmdb:movie:'.length));
    return Number.isFinite(tmdbId)
      ? { source: 'tmdb', contentType: 'movie', tmdbId }
      : null;
  }

  if (raw.startsWith('tmdb:tv:')) {
    const tmdbId = Number(raw.slice('tmdb:tv:'.length));
    return Number.isFinite(tmdbId)
      ? { source: 'tmdb', contentType: 'series', tmdbId }
      : null;
  }

  return null;
}

export function normalizeCatalogInteractionId(input: {
  contentId?: string;
  contentType?: CatalogContentType;
  tmdbId?: number;
}): string {
  const raw = String(input.contentId || '').trim();
  if (
    raw.startsWith('program:') ||
    raw.startsWith('tmdb:movie:') ||
    raw.startsWith('tmdb:tv:')
  ) {
    return raw;
  }

  if (typeof input.tmdbId === 'number' && Number.isFinite(input.tmdbId)) {
    if (input.contentType === 'series') {
      return buildTmdbCatalogId('tv', input.tmdbId);
    }
    if (input.contentType === 'movie') {
      return buildTmdbCatalogId('movie', input.tmdbId);
    }
  }

  return buildProgramCatalogId(raw);
}

