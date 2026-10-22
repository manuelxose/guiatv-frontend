import {
  broadcastDisplay, broadcastTiming, buildMovieSchema, EntityBroadcast, formatRuntime, isoDuration, madridDaysBetween, PublicEntity,
} from './entity-detail.model';

const broadcast = (over: Partial<EntityBroadcast> = {}): EntityBroadcast => ({
  airingId: 'a1', channel: { id: 'amc', name: 'AMC', path: '/canales/amc' }, programmeTitle: 'La cura del bienestar',
  start: '2026-10-23T15:29:00.000Z', end: '2026-10-23T17:53:00.000Z', startLocal: '2026-10-23T17:29:00+02:00', localDate: '2026-10-23', localTime: '17:29', durationMinutes: 144, ...over,
});

const entity = (over: Partial<PublicEntity> = {}): PublicEntity => ({
  entityId: 'ce_1', kind: 'movie', title: 'La cura del bienestar', canonicalPath: '/peliculas/la-cura-del-bienestar', originalTitle: 'A Cure for Wellness', year: 2017,
  synopsis: 'Un joven ejecutivo viaja a un centro de bienestar.', genres: ['Terror', 'Misterio'], runtimeMinutes: 147, tmdbId: 340837,
  images: { poster: 'https://image.tmdb.org/t/p/w500/p.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/b.jpg' },
  credits: { directors: ['Gore Verbinski'], cast: [{ name: 'Dane DeHaan', character: 'Lockhart' }] },
  broadcasts: { status: 'ok', items: [broadcast()], generatedAt: '2026-10-22T10:00:00.000Z', timeZone: 'Europe/Madrid' }, ...over,
});

describe('entity-detail model', () => {
  it('formats runtimes and ISO durations, and refuses nonsense', () => {
    expect(formatRuntime(147)).toBe('2 h 27 min');
    expect(formatRuntime(120)).toBe('2 h');
    expect(formatRuntime(45)).toBe('45 min');
    expect([formatRuntime(0), formatRuntime(-5), formatRuntime(undefined), formatRuntime(90.5)]).toEqual([null, null, null, null]);
    expect(isoDuration(147)).toBe('PT2H27M');
    expect(isoDuration(120)).toBe('PT2H');
    expect(isoDuration(45)).toBe('PT45M');
    expect(isoDuration(0)).toBeNull();
  });

  it('counts Madrid calendar days, not 24-hour blocks', () => {
    expect(madridDaysBetween(new Date('2026-10-21T23:30:00Z'), new Date('2026-10-22T10:00:00Z'))).toBe(0); // both are the 22nd in Madrid
    expect(madridDaysBetween(new Date('2026-10-22T10:00:00Z'), new Date('2026-10-23T08:00:00Z'))).toBe(1);
    // the clock change: the 25th has 25 hours, the 26th is still one calendar day later
    expect(madridDaysBetween(new Date('2026-10-24T20:00:00Z'), new Date('2026-10-25T20:00:00Z'))).toBe(1);
    expect(madridDaysBetween(new Date('2026-10-25T00:30:00Z'), new Date('2026-10-26T00:30:00Z'))).toBe(1);
  });

  it('describes when a broadcast starts: live, minutes, hours, today, tomorrow, days', () => {
    const b = (start: string, end: string) => ({ start, end });
    const now = new Date('2026-10-22T10:00:00Z');
    expect(broadcastTiming(b('2026-10-22T09:00:00Z', '2026-10-22T11:00:00Z'), now)).toEqual({ state: 'live', text: 'En emisión ahora' });
    expect(broadcastTiming(b('2026-10-22T08:00:00Z', '2026-10-22T10:00:00Z'), now)).toEqual({ state: 'ended', text: 'Finalizada' });
    expect(broadcastTiming(b('2026-10-22T10:20:00Z', '2026-10-22T12:00:00Z'), now)).toEqual({ state: 'soon', text: 'en 20 min' });
    expect(broadcastTiming(b('2026-10-22T10:00:20Z', '2026-10-22T12:00:00Z'), now).text).toBe('en 1 min');
    expect(broadcastTiming(b('2026-10-22T13:30:00Z', '2026-10-22T15:00:00Z'), now)).toEqual({ state: 'soon', text: 'en 3 h 30 min' });
    expect(broadcastTiming(b('2026-10-22T16:00:00Z', '2026-10-22T18:00:00Z'), now)).toEqual({ state: 'upcoming', text: 'hoy' });
    expect(broadcastTiming(b('2026-10-23T16:00:00Z', '2026-10-23T18:00:00Z'), now)).toEqual({ state: 'upcoming', text: 'mañana' });
    expect(broadcastTiming(b('2026-10-26T20:00:00Z', '2026-10-26T22:00:00Z'), now)).toEqual({ state: 'upcoming', text: 'en 4 días' });
  });

  it('shows the Madrid day and wall clock, with the zone for screen readers (CET/CEST)', () => {
    const now = new Date('2026-10-22T10:00:00Z');
    const summer = broadcastDisplay(broadcast(), now);
    expect([summer.day, summer.time, summer.duration]).toEqual(['Mañana', '17:29', '2 h 24 min']);
    expect(summer.full).toContain('CEST');
    const winter = broadcastDisplay(broadcast({ start: '2026-10-25T01:30:00.000Z', localTime: '02:30', startLocal: '2026-10-25T02:30:00+01:00' }), now);
    expect(winter.full).toContain('CET');
    expect(winter.full).not.toContain('CEST');
    expect(winter.day).toMatch(/dom.*25.*oct/i);
  });

  it('builds a Movie only from facts the API sent, with valid schema.org properties', () => {
    const schema = buildMovieSchema(entity(), 'https://guiaprogramaciontv.com')!;
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Movie');
    expect(schema['url']).toBe('https://guiaprogramaciontv.com/peliculas/la-cura-del-bienestar');
    expect(schema['alternateName']).toBe('A Cure for Wellness');
    expect(schema['datePublished']).toBe('2017');
    expect(schema['duration']).toBe('PT2H27M');
    expect(schema['genre']).toEqual(['Terror', 'Misterio']);
    expect(schema['director']).toEqual([{ '@type': 'Person', name: 'Gore Verbinski' }]);
    expect(schema['actor']).toEqual([{ '@type': 'Person', name: 'Dane DeHaan' }]);
    const [event] = schema['publication'] as Array<Record<string, any>>;
    expect(event['@type']).toBe('BroadcastEvent');
    expect(event['startDate']).toBe('2026-10-23T17:29:00+02:00');
    expect(event['endDate']).toBe('2026-10-23T17:53:00.000Z');
    expect(event['isLiveBroadcast']).toBe(false);
    expect(event['publishedOn']).toEqual({ '@type': 'BroadcastService', name: 'AMC', url: 'https://guiaprogramaciontv.com/canales/amc' });

    // Only properties schema.org defines on these types are used.
    const movie = new Set(['@context', '@type', 'name', 'url', 'alternateName', 'description', 'image', 'genre', 'datePublished', 'duration', 'director', 'actor', 'publication']);
    expect(Object.keys(schema).filter((k) => !movie.has(k))).toEqual([]);
    expect(Object.keys(event).filter((k) => !['@type', 'name', 'startDate', 'endDate', 'isLiveBroadcast', 'publishedOn'].includes(k))).toEqual([]);
    // Nothing the source did not state: no rating, no language, no ID.
    for (const invented of ['aggregateRating', 'inLanguage', 'sameAs', 'review']) expect(invented in schema).toBeFalse();
  });

  it('omits what is missing and everything for non-films or when the schedule is unknown', () => {
    const bare = buildMovieSchema({ entityId: 'x', kind: 'movie', title: 'Sin datos', canonicalPath: '/peliculas/sin-datos' }, 'https://x.test')!;
    expect(Object.keys(bare).sort()).toEqual(['@context', '@type', 'name', 'url']);
    expect(buildMovieSchema(entity({ kind: 'series' }), 'https://x.test')).toBeNull();
    expect('publication' in buildMovieSchema(entity({ broadcasts: { status: 'unavailable', items: [], generatedAt: '', timeZone: 'Europe/Madrid' } }), 'https://x.test')!).toBeFalse();
    expect('alternateName' in buildMovieSchema(entity({ originalTitle: 'La cura del bienestar' }), 'https://x.test')!).toBeFalse();
  });
});
