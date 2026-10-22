/**
 * Phase 3D: the upcoming television broadcasts of one entity, read from the existing EPG read model
 * (`tv_read_airings`). One indexed query per entity (`idx_tvread_tmdbid_date`), no per-airing lookups.
 *
 * An airing is this entity's broadcast only on evidence, never on a similar title:
 *   entity_ref        the airing already carries this entity's id (airing references; written only when that flag is on)
 *   catalogue_media   same TMDB id, same catalogue row (`program.mediaId` equals the one the enrichment validated:
 *                     the row is typed `movie`, so a TV series that reuses the number is excluded) and the same title key
 *   tmdb_title        same TMDB id and the same title key, for an entity not enriched yet (the weaker case, labelled as such)
 * A different catalogue row, a different title key or a different TMDB id is rejected and counted.
 *
 * Times are stored in UTC; the guide speaks peninsular time, so every public time is also given in
 * Europe/Madrid with its UTC offset (CET/CEST, including the 2026-10-25 change). Ended broadcasts are dropped
 * at read time, so the answer is correct whenever it is asked.
 */
import { titleIdentityKey } from '@/domain/services/contentIdentity';
import type { ContentEntityRecord } from '@/domain/repositories/IContentIdentityRepository';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';

export const GUIDE_TIME_ZONE = 'Europe/Madrid';
export const BROADCAST_WINDOW_DAYS = 7;
export const BROADCAST_MAX_ITEMS = 8;
const QUERY_LIMIT = 40;

export type BroadcastEvidence = 'entity_ref' | 'catalogue_media' | 'tmdb_title';

export interface EntityBroadcast {
  airingId: string;
  channel: { id: string; name: string; icon?: string; path: string };
  /** What the programme grid calls it (may differ from the entity title, e.g. a year suffix). */
  programmeTitle: string;
  subtitle?: string;
  start: string;
  end: string;
  /** Europe/Madrid wall clock, ISO with the offset in force at that instant. */
  startLocal: string;
  localDate: string;
  localTime: string;
  durationMinutes: number;
}

export interface EntityBroadcasts {
  /** `none`: the read worked and nothing is scheduled; `unavailable`: it did not work, nothing is claimed either way. */
  status: 'ok' | 'none' | 'unavailable';
  items: EntityBroadcast[];
  generatedAt: string;
  timeZone: typeof GUIDE_TIME_ZONE;
}

/** The read-model fields used here (a projection of `TVReadAiring`). */
export interface AiringRow {
  id: string;
  date: string;
  channel?: { id?: string; name?: string; normalizedName?: string; icon?: string };
  program?: { title?: string; subtitle?: string; tmdbId?: number; mediaId?: string; entityId?: string };
  airing?: { start?: string; end?: string; durationMinutes?: number };
}

export interface IBroadcastReader {
  /** Airings of one TMDB id on the given `YYYYMMDD` dates, earliest first, at most `limit`. */
  findByTmdbId(tmdbId: number, dates: string[], limit: number): Promise<AiringRow[]>;
}

export class MongoBroadcastReader implements IBroadcastReader {
  async findByTmdbId(tmdbId: number, dates: string[], limit: number): Promise<AiringRow[]> {
    return (await TVReadAiringModel.find(
      { 'program.tmdbId': tmdbId, date: { $in: dates } },
      { id: 1, date: 1, 'channel.id': 1, 'channel.name': 1, 'channel.normalizedName': 1, 'channel.icon': 1, 'program.title': 1, 'program.subtitle': 1, 'program.tmdbId': 1, 'program.mediaId': 1, 'program.entityId': 1, 'airing.start': 1, 'airing.end': 1, 'airing.durationMinutes': 1 }
    ).sort({ 'airing.start': 1 }).limit(limit).lean().exec()) as unknown as AiringRow[];
  }
}

// ---------------------------------------------------------------------------------------------
// Europe/Madrid wall clock, independent of the process time zone.

const wallClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: GUIDE_TIME_ZONE, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'longOffset',
});

export function madridParts(instant: Date): { date: string; time: string; second: string; offset: string } {
  const p = Object.fromEntries(wallClock.formatToParts(instant).map((x) => [x.type, x.value]));
  const offset = String(p.timeZoneName).replace('GMT', '') || '+00:00';
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, second: p.second, offset: offset.length === 3 ? `${offset}:00` : offset };
}

/** `YYYYMMDD` of the Madrid day `offsetDays` from `instant`'s Madrid day. */
export function madridDay(instant: Date, offsetDays = 0): string {
  const [y, m, d] = madridParts(instant).date.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return `${shifted.getUTCFullYear()}${String(shifted.getUTCMonth() + 1).padStart(2, '0')}${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

export const broadcastLocalIso = (instant: Date) => {
  const w = madridParts(instant);
  return `${w.date}T${w.time}:${w.second}${w.offset}`;
};

// ---------------------------------------------------------------------------------------------

export interface BroadcastSelection {
  items: EntityBroadcast[];
  /** Evidence of each kept airing, by airing id (internal: reports, not the public DTO). */
  evidence: Record<string, BroadcastEvidence>;
  rejected: Record<string, number>;
  /** Rows sharing the TMDB id on today or tomorrow, kept or not: the legacy page lists these (see `legacyIndexableNow`). */
  legacyWindowRows: number;
}

const channelPath = (channel: NonNullable<AiringRow['channel']>) => `/canales/${encodeURIComponent(String(channel.normalizedName || channel.id).replace(/_/g, '-'))}`;

/** Pure: which rows are this entity's upcoming broadcasts at `now`. */
export function selectBroadcasts(entity: Pick<ContentEntityRecord, 'entityId' | 'title' | 'originalTitle' | 'externalIds' | 'metadata'>, rows: AiringRow[], now: Date, max = BROADCAST_MAX_ITEMS): BroadcastSelection {
  const tmdbId = entity.externalIds?.tmdb?.type === 'movie' ? entity.externalIds.tmdb.id : undefined;
  const keys = new Set([titleIdentityKey(entity.title), titleIdentityKey(entity.originalTitle)].filter((k): k is string => Boolean(k)));
  const mediaId = entity.metadata?.enrichment?.mediaId;
  const rejected: Record<string, number> = {};
  const reject = (reason: string) => { rejected[reason] = (rejected[reason] ?? 0) + 1; };
  const evidence: Record<string, BroadcastEvidence> = {};
  const seen = new Set<string>();
  const kept: Array<EntityBroadcast & { at: number }> = [];
  const today = madridDay(now);
  const tomorrow = madridDay(now, 1);
  let legacyWindowRows = 0;

  for (const row of rows) {
    const program = row.program ?? {};
    if (tmdbId === undefined || program.tmdbId !== tmdbId) { reject('tmdb_id_differs'); continue; }
    if (row.date === today || row.date === tomorrow) legacyWindowRows++;
    const start = new Date(row.airing?.start ?? '');
    const end = new Date(row.airing?.end ?? '');
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) { reject('invalid_times'); continue; }
    if (end <= now) { reject('already_ended'); continue; }
    if (!row.channel?.id || !row.channel.name) { reject('no_channel'); continue; }

    let how: BroadcastEvidence;
    if (program.entityId === entity.entityId) how = 'entity_ref';
    else if (program.entityId) { reject('other_entity_ref'); continue; }
    else {
      const titleKey = titleIdentityKey(program.title);
      if (!titleKey || !keys.has(titleKey)) { reject('title_key_differs'); continue; }
      if (program.mediaId && mediaId && program.mediaId !== mediaId) { reject('other_catalogue_row'); continue; }
      how = program.mediaId && mediaId ? 'catalogue_media' : 'tmdb_title';
    }
    const slot = `${row.channel.id}|${start.toISOString()}`;
    if (seen.has(slot)) { reject('duplicate_slot'); continue; }
    seen.add(slot);
    const local = madridParts(start);
    evidence[row.id] = how;
    kept.push({
      at: start.getTime(),
      airingId: row.id,
      channel: { id: row.channel.id, name: row.channel.name, ...(row.channel.icon ? { icon: row.channel.icon } : {}), path: channelPath(row.channel) },
      programmeTitle: String(program.title),
      ...(program.subtitle ? { subtitle: String(program.subtitle) } : {}),
      start: start.toISOString(), end: end.toISOString(), startLocal: broadcastLocalIso(start), localDate: local.date, localTime: local.time,
      durationMinutes: Math.round((end.getTime() - start.getTime()) / 60_000),
    });
  }
  kept.sort((a, b) => a.at - b.at || a.channel.id.localeCompare(b.channel.id));
  return { items: kept.slice(0, max).map(({ at: _at, ...item }) => item), evidence, rejected, legacyWindowRows };
}

export class EntityBroadcastService {
  constructor(private readonly reader: IBroadcastReader = new MongoBroadcastReader(), private readonly clock: () => Date = () => new Date()) {}

  /**
   * `legacyIndexableNow`: the legacy page for this work lists an airing today or tomorrow, which is exactly when it
   * turns `index, follow` (`catalogRobotsPolicy`). Counted on the TMDB id alone, as the legacy lookup does, so it is
   * never narrower than the legacy rule. A failed read says `unknown`, and callers treat unknown as indexable.
   */
  async forEntity(entity: ContentEntityRecord): Promise<{ broadcasts: EntityBroadcasts; legacyIndexableNow: boolean | 'unknown'; selection?: BroadcastSelection }> {
    const now = this.clock();
    const base = { generatedAt: now.toISOString(), timeZone: GUIDE_TIME_ZONE } as const;
    const tmdb = entity.externalIds?.tmdb;
    if (!tmdb || tmdb.type !== 'movie') return { broadcasts: { status: 'none', items: [], ...base }, legacyIndexableNow: false };
    try {
      const dates = Array.from({ length: BROADCAST_WINDOW_DAYS + 2 }, (_, i) => madridDay(now, i - 1));
      const rows = await this.reader.findByTmdbId(tmdb.id, dates, QUERY_LIMIT);
      const selection = selectBroadcasts(entity, rows, now);
      return {
        broadcasts: { status: selection.items.length ? 'ok' : 'none', items: selection.items, ...base },
        legacyIndexableNow: selection.legacyWindowRows > 0,
        selection,
      };
    } catch {
      return { broadcasts: { status: 'unavailable', items: [], ...base }, legacyIndexableNow: 'unknown' };
    }
  }
}
