/**
 * Canonical genre taxonomy — the single source of truth for genre normalization
 * across EPG ingestion (SyncEPGData), TMDB enrichment (TMDBService), the
 * catalog/discovery filters (CatalogService, SearchDiscoveryContent), and
 * chatbot intent detection (ChatbotRecommend, AssistantMemoryService).
 *
 * Canonical `label` values are exactly the strings already persisted in
 * `Program.genreTags` / `CatalogItemDTO.genres` (Spanish, TMDB-derived where
 * applicable). Renaming them would break stored data and API contracts, so
 * new source variants are added here as *aliases* instead of renaming labels.
 *
 * Two directions are modeled separately per genre because TMDB itself is
 * asymmetric (e.g. there is no dedicated "Thriller" TV genre, so a TV
 * discover query for "thriller" reuses the Mystery id):
 *  - `tmdbTagIds`: id(s) whose TMDB response should render as this label
 *    (forward direction, used by `mapTmdbGenreIdsToTags`).
 *  - `tmdbMovieDiscoverId` / `tmdbTvDiscoverId`: id to use when *searching*
 *    TMDB by this genre (reverse direction, used by catalog `discover` calls).
 *    Defaults to the single `tmdbTagIds` entry when only one is given and no
 *    explicit discover id is set.
 */

export interface CanonicalGenreDefinition {
  /** Stable machine id. Not persisted — for internal reference only. */
  id: string;
  /** Canonical display label — the value stored/returned across the app. */
  label: string;
  /** "genre" for true content genres, "type" for the broader Cine/Series buckets. */
  kind: 'genre' | 'type';
  /** TMDB genre id(s) that should render as this label. */
  tmdbTagIds?: number[];
  /** TMDB movie genre id to use for a `discover` query by this genre. */
  tmdbMovieDiscoverId?: number;
  /** TMDB tv genre id to use for a `discover` query by this genre. */
  tmdbTvDiscoverId?: number;
  /** Extra raw source values (ES/EN, plural, composite) that normalize to `label`. */
  aliases: string[];
}

export const CANONICAL_GENRES: CanonicalGenreDefinition[] = [
  {
    id: 'action', label: 'Acción', kind: 'genre',
    tmdbTagIds: [28, 10759], tmdbMovieDiscoverId: 28, tmdbTvDiscoverId: 10759,
    aliases: ['accion', 'action', 'cine de accion', 'acción y aventura', 'action & adventure', 'action and adventure'],
  },
  {
    id: 'adventure', label: 'Aventura', kind: 'genre',
    tmdbTagIds: [12], tmdbMovieDiscoverId: 12, tmdbTvDiscoverId: 10759,
    aliases: ['aventura', 'aventuras', 'adventure'],
  },
  {
    id: 'comedy', label: 'Comedia', kind: 'genre',
    tmdbTagIds: [35], tmdbMovieDiscoverId: 35, tmdbTvDiscoverId: 35,
    aliases: ['comedia', 'comedias', 'comedy', 'comedies'],
  },
  {
    id: 'drama', label: 'Drama', kind: 'genre',
    tmdbTagIds: [18], tmdbMovieDiscoverId: 18, tmdbTvDiscoverId: 18,
    aliases: ['drama', 'dramas'],
  },
  {
    id: 'thriller', label: 'Suspense', kind: 'genre',
    tmdbTagIds: [53], tmdbMovieDiscoverId: 53, tmdbTvDiscoverId: 9648,
    aliases: ['thriller', 'thrillers', 'suspense', 'suspenso'],
  },
  {
    id: 'horror', label: 'Terror', kind: 'genre',
    tmdbTagIds: [27], tmdbMovieDiscoverId: 27,
    aliases: ['terror', 'horror', 'miedo'],
  },
  {
    id: 'crime', label: 'Crimen', kind: 'genre',
    tmdbTagIds: [80], tmdbMovieDiscoverId: 80, tmdbTvDiscoverId: 80,
    aliases: ['crimen', 'crime', 'policiaco', 'policíaco', 'policíaca', 'policial'],
  },
  {
    id: 'mystery', label: 'Misterio', kind: 'genre',
    tmdbTagIds: [9648], tmdbMovieDiscoverId: 9648, tmdbTvDiscoverId: 9648,
    aliases: ['misterio', 'mystery'],
  },
  {
    id: 'romance', label: 'Romance', kind: 'genre',
    tmdbTagIds: [10749], tmdbMovieDiscoverId: 10749,
    aliases: ['romance', 'romantica', 'romántica', 'romanticas', 'románticas', 'romantico', 'romántico'],
  },
  {
    id: 'scifi', label: 'Ciencia ficción', kind: 'genre',
    tmdbTagIds: [878, 10765], tmdbMovieDiscoverId: 878, tmdbTvDiscoverId: 10765,
    aliases: ['ciencia ficcion', 'ciencia ficción', 'cienciaficcion', 'sci-fi', 'scifi', 'sci fi', 'science fiction'],
  },
  {
    id: 'fantasy', label: 'Fantasía', kind: 'genre',
    tmdbTagIds: [14], tmdbMovieDiscoverId: 14,
    aliases: ['fantasia', 'fantasía', 'fantasy'],
  },
  {
    id: 'war', label: 'Guerra', kind: 'genre',
    tmdbTagIds: [10752], tmdbMovieDiscoverId: 10752, tmdbTvDiscoverId: 10768,
    aliases: ['guerra', 'belico', 'bélico', 'bélica', 'war'],
  },
  {
    id: 'western', label: 'Western', kind: 'genre',
    tmdbTagIds: [37], tmdbMovieDiscoverId: 37,
    aliases: ['western', 'oeste'],
  },
  {
    id: 'animation', label: 'Animación', kind: 'genre',
    tmdbTagIds: [16], tmdbMovieDiscoverId: 16, tmdbTvDiscoverId: 16,
    aliases: ['animacion', 'animación', 'animation', 'anime', 'dibujos animados'],
  },
  {
    id: 'family', label: 'Familia', kind: 'genre',
    tmdbTagIds: [10751], tmdbMovieDiscoverId: 10751, tmdbTvDiscoverId: 10751,
    aliases: ['familia', 'familiar', 'family'],
  },
  {
    id: 'kids', label: 'Infantil', kind: 'genre',
    tmdbTagIds: [10762], tmdbTvDiscoverId: 10762,
    aliases: ['infantil', 'kids', 'niños', 'ninos', 'para niños'],
  },
  {
    id: 'documentary', label: 'Documental', kind: 'genre',
    tmdbTagIds: [99], tmdbMovieDiscoverId: 99, tmdbTvDiscoverId: 99,
    aliases: ['documental', 'documentales', 'documentary'],
  },
  {
    id: 'history', label: 'Historia', kind: 'genre',
    tmdbTagIds: [36], tmdbMovieDiscoverId: 36,
    aliases: ['historia', 'history'],
  },
  {
    id: 'music', label: 'Música', kind: 'genre',
    tmdbTagIds: [10402], tmdbMovieDiscoverId: 10402,
    aliases: ['musica', 'música', 'music', 'musical'],
  },
  {
    id: 'reality', label: 'Reality', kind: 'genre',
    tmdbTagIds: [10764], tmdbTvDiscoverId: 10764,
    aliases: ['reality', 'reality show', 'telerrealidad'],
  },
  {
    id: 'sports', label: 'Deportes', kind: 'genre',
    aliases: ['deportes', 'deporte', 'sport', 'sports', 'futbol', 'fútbol'],
  },
  {
    id: 'news', label: 'Noticias', kind: 'genre',
    tmdbTagIds: [10763], tmdbTvDiscoverId: 10763,
    aliases: ['noticias', 'news', 'informativo', 'informativos'],
  },
  {
    id: 'politics', label: 'Política', kind: 'genre',
    tmdbTagIds: [10768], tmdbTvDiscoverId: 10768,
    aliases: ['politica', 'política', 'war and politics', 'war & politics'],
  },
  {
    id: 'soap', label: 'Telenovela', kind: 'genre',
    tmdbTagIds: [10766], tmdbTvDiscoverId: 10766,
    aliases: ['telenovela', 'soap', 'soap opera'],
  },
  {
    id: 'talkshow', label: 'Talk show', kind: 'genre',
    tmdbTagIds: [10767], tmdbTvDiscoverId: 10767,
    aliases: ['talk show', 'talkshow', 'talk'],
  },
  {
    id: 'tvmovie', label: 'TV Movie', kind: 'genre',
    tmdbMovieDiscoverId: 10770,
    aliases: ['tvmovie', 'tv movie', 'telefilm'],
  },
  // ─── Content-type buckets ─────────────────────────────────────────────
  // Not TMDB genres, but the same detection/filter pipeline (chatbot intent,
  // CatalogItemDTO.genres, catalog filters) has always treated them as
  // filterable "genre" values alongside true genres — preserved as-is.
  {
    id: 'cinema', label: 'Cine', kind: 'type',
    aliases: ['cine'],
  },
  {
    id: 'series_type', label: 'Series', kind: 'type',
    aliases: ['series', 'serie'],
  },
];

// ─── Normalization ──────────────────────────────────────────────────────────

/** Lowercase, strip diacritics, collapse punctuation to single spaces, trim. */
export function normalizeGenreToken(value: string | undefined | null): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface AliasEntry {
  normalizedAlias: string;
  label: string;
}

function buildAliasIndex(): AliasEntry[] {
  const seen = new Map<string, string>();
  for (const def of CANONICAL_GENRES) {
    for (const raw of [def.label, ...def.aliases]) {
      const normalized = normalizeGenreToken(raw);
      if (!normalized) continue;
      if (!seen.has(normalized)) {
        seen.set(normalized, def.label);
      }
    }
  }
  return Array.from(seen.entries())
    .map(([normalizedAlias, label]) => ({ normalizedAlias, label }))
    // Longest alias first so composite phrases ("ciencia ficcion") win over
    // any shorter alias that might otherwise be a substring of another word.
    .sort((a, b) => b.normalizedAlias.length - a.normalizedAlias.length);
}

const ALIAS_INDEX = buildAliasIndex();
const LABEL_LOOKUP = new Map(ALIAS_INDEX.map((entry) => [entry.normalizedAlias, entry.label]));

/** All canonical genre labels (includes the Cine/Series content-type buckets). */
export const CANONICAL_GENRE_LABELS: string[] = CANONICAL_GENRES.map((def) => def.label);

/** Canonical genre labels excluding the Cine/Series content-type buckets. */
export const CANONICAL_TRUE_GENRE_LABELS: string[] = CANONICAL_GENRES
  .filter((def) => def.kind === 'genre')
  .map((def) => def.label);

/**
 * Resolves a single raw source value (EPG category, TMDB tag, user text) to
 * its canonical label. Falls back to splitting on common composite
 * separators (`&`, `/`, `,`, `|`, " y ", " and ") and resolving the first
 * recognized part. Returns undefined when nothing is recognized so callers
 * can decide how to handle unknown values (e.g. keep the original string).
 */
export function normalizeGenreLabel(raw: string | undefined | null): string | undefined {
  const normalized = normalizeGenreToken(raw);
  if (!normalized) return undefined;

  const exact = LABEL_LOOKUP.get(normalized);
  if (exact) return exact;

  const parts = String(raw)
    .split(/&|\/|\\|\||,|\by\b|\band\b/i)
    .map((part) => normalizeGenreToken(part))
    .filter(Boolean);

  for (const part of parts) {
    const match = LABEL_LOOKUP.get(part);
    if (match) return match;
  }
  return undefined;
}

/**
 * Normalizes a raw genre value (or list of values) into canonical labels.
 * Unrecognized values are preserved (trimmed) rather than dropped, so
 * already-working data that predates this taxonomy keeps flowing.
 */
export function normalizeGenreList(
  raw: string | Array<string | undefined | null> | undefined | null
): string[] {
  const values = Array.isArray(raw) ? raw : [raw];
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    for (const part of String(value).split(/[\\/|,]/)) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const canonical = normalizeGenreLabel(trimmed) || trimmed;
      const dedupeKey = normalizeGenreToken(canonical);
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        result.push(canonical);
      }
    }
  }
  return result;
}

/** True when two raw genre values normalize to the same canonical genre. */
export function genreLabelsMatch(a: string | undefined | null, b: string | undefined | null): boolean {
  const left = normalizeGenreLabel(a) ?? normalizeGenreToken(a);
  const right = normalizeGenreLabel(b) ?? normalizeGenreToken(b);
  return Boolean(left) && left === right;
}

export interface GenreTextMatch {
  /** Canonical display label, e.g. "Suspense". */
  label: string;
  /** The normalized alias actually found in the text, e.g. "thrillers". */
  matchedAlias: string;
}

/**
 * Scans freeform text (e.g. a chatbot message) for genre mentions in Spanish
 * or English, including composites, and returns the canonical label plus the
 * literal alias that matched (useful for negation-proximity checks, e.g.
 * "sin thrillers"). Mirrors the whole-word matching used by
 * `findCanonicalChannelInText`.
 */
export function findGenreMatchesInText(text: string | undefined | null): GenreTextMatch[] {
  const normalized = normalizeGenreToken(text);
  if (!normalized) return [];

  const padded = ` ${normalized} `;
  const found: GenreTextMatch[] = [];
  const seen = new Set<string>();

  for (const { normalizedAlias, label } of ALIAS_INDEX) {
    if (seen.has(label)) continue;
    const matches =
      normalized === normalizedAlias ||
      padded.includes(` ${normalizedAlias} `) ||
      padded.startsWith(`${normalizedAlias} `) ||
      padded.endsWith(` ${normalizedAlias}`);
    if (matches) {
      found.push({ label, matchedAlias: normalizedAlias });
      seen.add(label);
    }
  }
  return found;
}

/** Same as `findGenreMatchesInText`, returning just the canonical labels. */
export function findGenresInText(text: string | undefined | null): string[] {
  return findGenreMatchesInText(text).map((match) => match.label);
}

// ─── TMDB forward mapping (id → display tag) ────────────────────────────────

function buildTmdbTagTable(): Record<number, string> {
  const table: Record<number, string> = {};
  for (const def of CANONICAL_GENRES) {
    for (const id of def.tmdbTagIds || []) {
      table[id] = def.label;
    }
  }
  return table;
}

export const TMDB_GENRE_TAGS: Record<number, string> = buildTmdbTagTable();

/** Maps TMDB genre_ids (movie or tv) to canonical display tags. */
export function mapTmdbGenreIdsToTags(genreIds?: number[]): string[] {
  return Array.from(new Set(
    (genreIds || [])
      .map((genreId) => TMDB_GENRE_TAGS[Number(genreId)])
      .filter((genre): genre is string => Boolean(genre))
  ));
}

// ─── TMDB reverse mapping (alias → discover id), for `discover` queries ────

function buildDiscoverTable(kind: 'tmdbMovieDiscoverId' | 'tmdbTvDiscoverId'): Record<string, number> {
  const table: Record<string, number> = {};
  for (const def of CANONICAL_GENRES) {
    const id = def[kind];
    if (typeof id !== 'number') continue;
    for (const raw of [def.label, ...def.aliases]) {
      // Key format matches CatalogService's own token normalizer (space-
      // separated, not collapsed), so `mapGenreNamesToIds` keeps working
      // unchanged against these tables.
      const key = normalizeGenreToken(raw);
      if (key) table[key] = id;
    }
  }
  return table;
}

/** Canonical alias → TMDB movie genre id, for `discover` queries. */
export const MOVIE_GENRE_NAME_TO_TMDB_ID: Record<string, number> = buildDiscoverTable('tmdbMovieDiscoverId');
/** Canonical alias → TMDB tv genre id, for `discover` queries. */
export const TV_GENRE_NAME_TO_TMDB_ID: Record<string, number> = buildDiscoverTable('tmdbTvDiscoverId');
