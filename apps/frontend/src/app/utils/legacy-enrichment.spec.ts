import { CatalogItem } from '../services/catalog.service';
import { fillLegacyGaps, scheduleView } from './legacy-enrichment';

const NOW = Date.parse('2026-10-22T10:00:00Z');
const airing = (channelId: string, start: string, end: string) => ({ channelId, channelName: channelId, start, end, title: 'Peli', catalogId: 'program:1', detailPath: '/peliculas/peli' });
const broadcast = (channelId: string, start: string, end: string) => ({
  airingId: `${channelId}-${start}`, channel: { id: channelId, name: channelId, path: `/canales/${channelId}` }, programmeTitle: 'Peli', start, end,
  startLocal: start, localDate: '2026-10-22', localTime: '12:00', durationMinutes: 120,
});
const item = (over: Partial<CatalogItem> = {}): CatalogItem => ({ catalogId: 'tmdb:movie:1', source: 'tmdb', contentType: 'movie', title: 'Peli', genres: [], primaryPlatforms: [], ...over });
const enrichment = (over: Record<string, unknown> = {}) => ({ version: 1 as const, ...over });

describe('legacy enrichment view', () => {
  it('fills only the genres and runtime the legacy payload lacks', () => {
    const base = item({ enrichment: enrichment({ metadata: { genres: ['Terror'], runtimeMinutes: 147 } }) });
    const filled = fillLegacyGaps(base);
    expect(filled.genres).toEqual(['Terror']);
    expect(filled.durationMinutes).toBe(147);
    const own = item({ genres: ['Drama'], durationMinutes: 90, enrichment: enrichment({ metadata: { genres: ['Terror'], runtimeMinutes: 147 } }) });
    expect(fillLegacyGaps(own)).toBe(own);
    const none = item();
    expect(fillLegacyGaps(none)).toBe(none);
  });

  it('shows the legacy schedule untouched without verified broadcasts, for programmes and for an unreadable schedule', () => {
    expect(scheduleView(item(), NOW).verified).toBeNull();
    const unavailable = { status: 'unavailable' as const, items: [], generatedAt: '', timeZone: 'Europe/Madrid' };
    expect(scheduleView(item({ enrichment: enrichment({ broadcasts: unavailable }) }), NOW).verified).toBeNull();
    const ok = { status: 'ok' as const, items: [broadcast('amc', '2026-10-23T15:00:00Z', '2026-10-23T17:00:00Z')], generatedAt: '', timeZone: 'Europe/Madrid' };
    expect(scheduleView(item({ contentType: 'program', enrichment: enrichment({ broadcasts: ok }) }), NOW).verified).toBeNull();
  });

  it('lists verified broadcasts and keeps every legacy airing they do not contain', () => {
    const verified = { status: 'ok' as const, items: [broadcast('amc', '2026-10-22T15:00:00Z', '2026-10-22T17:00:00Z')], generatedAt: '', timeZone: 'Europe/Madrid' };
    const view = scheduleView(item({
      airings: [
        airing('amc', '2026-10-22T15:00:00.000Z', '2026-10-22T17:00:00.000Z'),   // confirmed: not repeated
        airing('tcm', '2026-10-22T20:00:00.000Z', '2026-10-22T22:00:00.000Z'),   // legacy only: kept
        airing('la2', '2026-10-22T05:00:00.000Z', '2026-10-22T07:00:00.000Z'),   // already ended: dropped
      ],
      enrichment: enrichment({ broadcasts: verified }),
    }), NOW);
    expect(view.verified).toBe(verified);
    expect(view.legacyOnly.map((a) => a.channelId)).toEqual(['tcm']);
  });

  it('an empty verified schedule is an empty state, not a missing section', () => {
    const none = { status: 'none' as const, items: [], generatedAt: '', timeZone: 'Europe/Madrid' };
    const view = scheduleView(item({ enrichment: enrichment({ broadcasts: none }) }), NOW);
    expect(view.verified?.status).toBe('none');
    expect(view.legacyOnly).toEqual([]);
  });
});
