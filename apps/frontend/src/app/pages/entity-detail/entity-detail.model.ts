/**
 * Public entity read model (`GET /v2/entities/resolve`) and the pure helpers its page needs: runtime and
 * broadcast formatting in the guide's time zone, and structured data built only from the facts the API sends.
 * Nothing here invents a value: an absent field produces no output.
 */
export const GUIDE_TIME_ZONE = 'Europe/Madrid';

export interface EntityBroadcast {
  airingId: string;
  channel: { id: string; name: string; icon?: string; path: string };
  programmeTitle: string;
  subtitle?: string;
  start: string;
  end: string;
  startLocal: string;
  localDate: string;
  localTime: string;
  durationMinutes: number;
}

export interface EntityBroadcasts {
  status: 'ok' | 'none' | 'unavailable';
  items: EntityBroadcast[];
  generatedAt: string;
  timeZone: string;
}

export interface PublicEntity {
  entityId: string;
  kind: string;
  title: string;
  canonicalPath: string;
  originalTitle?: string;
  year?: number;
  synopsis?: string;
  genres?: string[];
  runtimeMinutes?: number;
  tmdbId?: number;
  images?: { poster?: string; backdrop?: string };
  credits?: { directors: string[]; cast: Array<{ name: string; character?: string }> };
  attribution?: { source: 'tmdb'; updatedAt: string; notice: string };
  broadcasts?: EntityBroadcasts;
}

export const KIND_LABEL: Record<string, string> = { movie: 'Película', series: 'Serie', show: 'Programa', event: 'Evento' };
export const kindLabel = (kind: string) => KIND_LABEL[kind] ?? 'Ficha';

/** The only paths an entity may declare as canonical; anything else is a malformed response. */
export const ENTITY_CANONICAL_PATH = /^\/(peliculas|series|programas)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 147 -> "2 h 27 min", 120 -> "2 h", 45 -> "45 min". */
export function formatRuntime(minutes: number | undefined): string | null {
  if (!Number.isInteger(minutes) || (minutes as number) <= 0) return null;
  const h = Math.floor((minutes as number) / 60);
  const m = (minutes as number) % 60;
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

/** 147 -> "PT2H27M" (ISO 8601 duration for structured data). */
export function isoDuration(minutes: number | undefined): string | null {
  if (!Number.isInteger(minutes) || (minutes as number) <= 0) return null;
  const h = Math.floor((minutes as number) / 60);
  const m = (minutes as number) % 60;
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}`;
}

const dayFormat = new Intl.DateTimeFormat('es-ES', { timeZone: GUIDE_TIME_ZONE, weekday: 'short', day: 'numeric', month: 'short' });
const longFormat = new Intl.DateTimeFormat('es-ES', { timeZone: GUIDE_TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
const ymdFormat = new Intl.DateTimeFormat('en-CA', { timeZone: GUIDE_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

const madridYmd = (instant: Date) => ymdFormat.format(instant);
/** Whole Madrid calendar days from `from` to `to`. */
export function madridDaysBetween(from: Date, to: Date): number {
  const [fy, fm, fd] = madridYmd(from).split('-').map(Number);
  const [ty, tm, td] = madridYmd(to).split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export interface BroadcastDisplay {
  /** "Hoy", "Mañana" or "sáb 25 oct". */
  day: string;
  /** Wall clock in Madrid, "21:30". */
  time: string;
  /** Screen-reader text with the zone: "sábado, 25 de octubre, 02:30 CET". */
  full: string;
  duration: string | null;
}

export function broadcastDisplay(b: EntityBroadcast, now: Date): BroadcastDisplay {
  const start = new Date(b.start);
  const days = madridDaysBetween(now, start);
  return {
    day: days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : dayFormat.format(start).replace(/,/g, ''),
    time: b.localTime,
    full: longFormat.format(start),
    duration: formatRuntime(b.durationMinutes),
  };
}

export type BroadcastState = 'live' | 'soon' | 'upcoming' | 'ended';

/** Relative timing against `now`; never negative: an ended broadcast says so (the API drops them, a stale page may not). */
export function broadcastTiming(b: Pick<EntityBroadcast, 'start' | 'end'>, now: Date): { state: BroadcastState; text: string } {
  const start = new Date(b.start);
  const n = now.getTime();
  if (n >= Date.parse(b.end)) return { state: 'ended', text: 'Finalizada' };
  if (n >= start.getTime()) return { state: 'live', text: 'En emisión ahora' };
  const minutes = Math.max(1, Math.round((start.getTime() - n) / 60_000));
  if (minutes < 60) return { state: 'soon', text: `en ${minutes} min` };
  if (minutes < 360) return { state: 'soon', text: `en ${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}` };
  const days = madridDaysBetween(now, start);
  return { state: 'upcoming', text: days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días` };
}

const clean = (value: string | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();

/**
 * schema.org Movie from the facts the API holds, plus its upcoming broadcasts as `publication` events. Only
 * what is present is emitted: no rating, no language and no date the source does not state. Null for anything
 * that is not a film.
 */
export function buildMovieSchema(entity: PublicEntity, baseUrl: string): Record<string, unknown> | null {
  if (entity.kind !== 'movie') return null;
  const schema: Record<string, unknown> = { '@context': 'https://schema.org', '@type': 'Movie', name: entity.title, url: `${baseUrl}${entity.canonicalPath}` };
  const original = clean(entity.originalTitle);
  if (original && original !== entity.title) schema['alternateName'] = original;
  if (clean(entity.synopsis)) schema['description'] = clean(entity.synopsis);
  if (entity.images?.poster) schema['image'] = entity.images.poster;
  if (entity.genres?.length) schema['genre'] = entity.genres;
  if (entity.year) schema['datePublished'] = String(entity.year);
  const duration = isoDuration(entity.runtimeMinutes);
  if (duration) schema['duration'] = duration;
  if (entity.credits?.directors.length) schema['director'] = entity.credits.directors.map((name) => ({ '@type': 'Person', name }));
  if (entity.credits?.cast.length) schema['actor'] = entity.credits.cast.map((c) => ({ '@type': 'Person', name: c.name }));
  const upcoming = entity.broadcasts?.status === 'ok' ? entity.broadcasts.items : [];
  if (upcoming.length) {
    schema['publication'] = upcoming.map((b) => ({
      '@type': 'BroadcastEvent',
      name: `${b.programmeTitle} en ${b.channel.name}`,
      startDate: b.startLocal,
      endDate: b.end,
      isLiveBroadcast: false,
      publishedOn: { '@type': 'BroadcastService', name: b.channel.name, url: `${baseUrl}${b.channel.path}` },
    }));
  }
  return schema;
}
