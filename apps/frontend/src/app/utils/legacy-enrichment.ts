/**
 * Phase 3E: how a legacy catalogue payload and its (optional) verified enrichment combine on screen. Pure.
 * The legacy item is never replaced: gaps are filled for display and structured data only, and the schedule
 * list shows the verified broadcasts first, then any legacy airing the verification did not confirm, so nothing
 * the page listed before disappears.
 */
import type { CatalogItem } from '../services/catalog.service';
import type { EntityBroadcasts } from '../pages/entity-detail/entity-detail.model';
import { splitAiringsByTime } from './catalog';

type Airing = NonNullable<CatalogItem['airings']>[number];

/** The item with the verified genres / runtime filled in where the legacy payload has none. Same object when there is nothing to add. */
export function fillLegacyGaps(item: CatalogItem): CatalogItem {
  const meta = item.enrichment?.metadata;
  if (!meta) return item;
  const genres = !item.genres?.length && meta.genres?.length ? meta.genres : item.genres;
  const durationMinutes = item.durationMinutes === undefined && meta.runtimeMinutes ? meta.runtimeMinutes : item.durationMinutes;
  return genres === item.genres && durationMinutes === item.durationMinutes ? item : { ...item, genres, durationMinutes };
}

export interface ScheduleView {
  /** Verified broadcasts to list (movies and series only); null = show the legacy schedule exactly as before. */
  verified: EntityBroadcasts | null;
  /** Legacy airings (current or upcoming) the verified list does not contain. */
  legacyOnly: Airing[];
}

const slot = (channelId: string, start: string) => `${channelId}|${Date.parse(start)}`;

export function scheduleView(item: CatalogItem, now: number = Date.now()): ScheduleView {
  const broadcasts = item.enrichment?.broadcasts;
  if (!broadcasts || broadcasts.status === 'unavailable' || item.contentType === 'program') return { verified: null, legacyOnly: [] };
  const known = new Set(broadcasts.items.map((b) => slot(b.channel.id, b.start)));
  const { current, upcoming } = splitAiringsByTime(item.airings, now);
  const legacy = current ? [current, ...upcoming] : upcoming;
  return { verified: broadcasts, legacyOnly: legacy.filter((a) => !known.has(slot(a.channelId, a.start))) };
}
