import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';
import { DateUtils } from '@/shared/utils/dateUtils';
import { l1Cache } from '@/infrastructure/cache/L1Cache';
import {
  buildSearchTokens,
  getGuideGroupSortOrder,
  inferTimeWindow,
  normalizeSportFacet,
  normalizeTvToken,
} from '@/shared/utils/tvMetadata';
import {
  TvReadChannelsResponseDTO,
  TvReadChannelSummaryDTO,
  TvReadItemDTO,
  TvReadItemResponseDTO,
  TvReadResponseDTO,
  TvReadView,
} from '../dto/TvReadDTO';

export interface TvReadQueryParams {
  view: TvReadView;
  date?: string;
  group?: string;
  category?: string;
  sport?: string;
  channelId?: string;
  q?: string;
  limit?: number;
  cursor?: string;
}

const TV_READ_LIMITS: Record<TvReadView, { default: number; max: number }> = {
  now: { default: 120, max: 500 },
  next: { default: 120, max: 500 },
  night: { default: 240, max: 1500 },
  day: { default: 5000, max: 20000 },
  search: { default: 60, max: 200 },
};

export const PRIME_TIME_WINDOW = {
  startMinutes: 21 * 60 + 45,
  endMinutes: 24 * 60 + 30,
  startLabel: '21:45',
  endLabel: '00:30',
} as const;

export function normalizeTvReadView(input: unknown): TvReadView {
  const value = String(input || '').trim().toLowerCase();
  if (value === 'now' || value === 'next' || value === 'night' || value === 'day' || value === 'search') {
    return value;
  }
  return 'day';
}

export function resolveTvReadLimit(
  view: TvReadView,
  requestedLimit?: number
): number {
  const policy = TV_READ_LIMITS[view];
  const parsed = Number(requestedLimit);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return policy.default;
  }

  return Math.max(1, Math.min(policy.max, Math.floor(parsed)));
}

export function applyTvReadTemporalBounds(
  query: Record<string, any>,
  view: TvReadView,
  reference: Date
): Record<string, any> {
  if (view === 'now') {
    const timestamp = reference.toISOString();
    query['airing.start'] = { $lte: timestamp };
    query['airing.end'] = { $gt: timestamp };
  }

  return query;
}

export function scopeChannelSummariesToPage(
  view: TvReadView,
  summaries: TvReadChannelSummaryDTO[],
  pagedItems: TvReadItemDTO[]
): TvReadChannelSummaryDTO[] {
  if (view === 'day') return summaries;
  const channelIds = new Set(pagedItems.map((item) => item.channel.id));
  return summaries.filter((summary) => channelIds.has(summary.channel.id));
}

export function hydrateTvReadItemRuntime(
  item: TvReadItemDTO,
  reference: Date = new Date()
): TvReadItemDTO {
  const start = new Date(item.airing.start);
  const end = new Date(item.airing.end);
  const liveNow =
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    start.getTime() <= reference.getTime() &&
    reference.getTime() < end.getTime();
  const window = inferTimeWindow(start, end, reference);

  return {
    ...item,
    airing: {
      ...item.airing,
      liveNow,
    },
    timingContext: {
      ...item.timingContext,
      start: item.airing.start,
      end: item.airing.end,
      liveNow,
      window: window === 'next' ? 'today' : window,
    },
  };
}

export function isFeaturedTvReadItem(item: TvReadItemDTO): boolean {
  return !item.trustDecision?.featuredSuppressed;
}

export function isConsumerVisibleTvReadItem(item: TvReadItemDTO): boolean {
  if (item.trustDecision?.consumerSuppressed) {
    return false;
  }

  return item.program.titleResolutionState !== 'generic_unresolved' &&
    item.program.titleResolutionState !== 'generic_suppressed';
}

function sortTvItems(left: TvReadItemDTO, right: TvReadItemDTO): number {
  return (
    getGuideGroupSortOrder(left.channel.group) - getGuideGroupSortOrder(right.channel.group) ||
    left.channel.sortOrder - right.channel.sortOrder ||
    String(left.channel.name || '').localeCompare(String(right.channel.name || ''), 'es', {
      sensitivity: 'base',
    }) ||
    new Date(left.airing.start).getTime() - new Date(right.airing.start).getTime()
  );
}

function hasVisualAsset(item: TvReadItemDTO): boolean {
  return Boolean(item.assets?.poster?.url || item.assets?.backdrop?.url);
}

function pickPreferredChannelItem(
  current: TvReadItemDTO | undefined,
  candidate: TvReadItemDTO
): TvReadItemDTO {
  if (!current) {
    return candidate;
  }

  if (hasVisualAsset(current) !== hasVisualAsset(candidate)) {
    return hasVisualAsset(candidate) ? candidate : current;
  }

  if (Boolean(current.program.tmdbId) !== Boolean(candidate.program.tmdbId)) {
    return candidate.program.tmdbId ? candidate : current;
  }

  const currentScore = Number(current.relevance?.score || 0);
  const candidateScore = Number(candidate.relevance?.score || 0);
  if (currentScore !== candidateScore) {
    return candidateScore > currentScore ? candidate : current;
  }

  const currentStart = new Date(current.airing.start).getTime();
  const candidateStart = new Date(candidate.airing.start).getTime();
  if (currentStart !== candidateStart) {
    return candidateStart < currentStart ? candidate : current;
  }

  return current;
}

function airingsOverlap(left: TvReadItemDTO, right: TvReadItemDTO): boolean {
  const leftStart = new Date(left.airing.start).getTime();
  const leftEnd = new Date(left.airing.end).getTime();
  const rightStart = new Date(right.airing.start).getTime();
  const rightEnd = new Date(right.airing.end).getTime();
  return leftStart < rightEnd && rightStart < leftEnd;
}

function buildPrimeTimeRange(dateKey: string): { start: Date; end: Date } {
  const safe = String(dateKey || '').trim();
  const year = Number(safe.slice(0, 4));
  const month = Number(safe.slice(4, 6));
  const day = Number(safe.slice(6, 8));
  const start = new Date(year, month - 1, day, 21, 45, 0, 0);
  const end = new Date(year, month - 1, day + 1, 0, 30, 0, 0);
  return { start, end };
}

function overlapsPrimeTimeWindow(item: TvReadItemDTO, dateKey: string): boolean {
  const window = buildPrimeTimeRange(dateKey);
  const start = new Date(item.airing.start).getTime();
  const end = new Date(item.airing.end).getTime();
  return start < window.end.getTime() && end > window.start.getTime();
}

function startsInsidePrimeTimeWindow(item: TvReadItemDTO, dateKey: string): boolean {
  const window = buildPrimeTimeRange(dateKey);
  const start = new Date(item.airing.start).getTime();
  return start >= window.start.getTime() && start < window.end.getTime();
}

function getPrimeTimeOverlapMinutes(item: TvReadItemDTO, dateKey: string): number {
  const window = buildPrimeTimeRange(dateKey);
  const start = Math.max(new Date(item.airing.start).getTime(), window.start.getTime());
  const end = Math.min(new Date(item.airing.end).getTime(), window.end.getTime());
  return Math.max(0, Math.round((end - start) / 60000));
}

function pickPreferredPrimeTimeItem(
  current: TvReadItemDTO | undefined,
  candidate: TvReadItemDTO,
  dateKey: string
): TvReadItemDTO {
  if (!current) {
    return candidate;
  }

  if (
    startsInsidePrimeTimeWindow(current, dateKey) !==
    startsInsidePrimeTimeWindow(candidate, dateKey)
  ) {
    return startsInsidePrimeTimeWindow(candidate, dateKey) ? candidate : current;
  }

  if (hasVisualAsset(current) !== hasVisualAsset(candidate)) {
    return hasVisualAsset(candidate) ? candidate : current;
  }

  if (Boolean(current.program.tmdbId) !== Boolean(candidate.program.tmdbId)) {
    return candidate.program.tmdbId ? candidate : current;
  }

  const currentScore = Number(current.relevance?.score || 0);
  const candidateScore = Number(candidate.relevance?.score || 0);
  if (currentScore !== candidateScore) {
    return candidateScore > currentScore ? candidate : current;
  }

  const currentOverlap = getPrimeTimeOverlapMinutes(current, dateKey);
  const candidateOverlap = getPrimeTimeOverlapMinutes(candidate, dateKey);
  if (currentOverlap !== candidateOverlap) {
    return candidateOverlap > currentOverlap ? candidate : current;
  }

  const currentStart = new Date(current.airing.start).getTime();
  const candidateStart = new Date(candidate.airing.start).getTime();
  return candidateStart < currentStart ? candidate : current;
}

export function selectCurrentTvItems(items: TvReadItemDTO[]): TvReadItemDTO[] {
  const liveByChannel = new Map<string, TvReadItemDTO>();
  items.forEach((item) => {
    if (!item.airing.liveNow || !isFeaturedTvReadItem(item)) {
      return;
    }
    const current = liveByChannel.get(item.channel.id);
    liveByChannel.set(item.channel.id, pickPreferredChannelItem(current, item));
  });

  return Array.from(liveByChannel.values()).sort(sortTvItems);
}

export function selectNextTvItems(
  items: TvReadItemDTO[],
  reference: Date
): TvReadItemDTO[] {
  const nextByChannel = new Map<string, TvReadItemDTO>();
  items.forEach((item) => {
    if (!isFeaturedTvReadItem(item)) {
      return;
    }
    const start = new Date(item.airing.start).getTime();
    if (start <= reference.getTime()) return;

    const current = nextByChannel.get(item.channel.id);
    if (!current) {
      nextByChannel.set(item.channel.id, item);
      return;
    }

    const currentStart = new Date(current.airing.start).getTime();
    if (start < currentStart) {
      nextByChannel.set(item.channel.id, item);
      return;
    }

    if (start === currentStart || airingsOverlap(current, item)) {
      nextByChannel.set(item.channel.id, pickPreferredChannelItem(current, item));
    }
  });

  return Array.from(nextByChannel.values()).sort(sortTvItems);
}

export function selectPrimeTimeTvItems(
  items: TvReadItemDTO[],
  dateKey: string,
  options: { uniquePerChannel?: boolean; requireStartInsideWindow?: boolean } = {}
): TvReadItemDTO[] {
  const candidates = items.filter((item) => {
    if (!isFeaturedTvReadItem(item)) {
      return false;
    }

    if (options.requireStartInsideWindow) {
      return startsInsidePrimeTimeWindow(item, dateKey);
    }

    return overlapsPrimeTimeWindow(item, dateKey);
  });

  if (options.uniquePerChannel === false) {
    return [...candidates].sort(sortTvItems);
  }

  const byChannel = new Map<string, TvReadItemDTO>();
  candidates.forEach((item) => {
    const current = byChannel.get(item.channel.id);
    byChannel.set(item.channel.id, pickPreferredPrimeTimeItem(current, item, dateKey));
  });

  return Array.from(byChannel.values()).sort(sortTvItems);
}

export class TvReadQueryService {
  constructor(private readonly cacheRepository: ICacheRepository) {}

  async query(params: TvReadQueryParams): Promise<TvReadResponseDTO> {
    const date = DateUtils.parseDateAlias(params.date || 'today');
    const view = normalizeTvReadView(params.view);
    const group =
      normalizeTvToken(params.group, ' ') === 'all' ? undefined : params.group;
    const category =
      normalizeTvToken(params.category, ' ') === 'all' ? undefined : params.category;
    const sport = normalizeSportFacet(params.sport);
    const limit = resolveTvReadLimit(view, params.limit);
    const offset = Number(params.cursor || '0') || 0;
    const cacheKey = `tv:read:${date}:${view}:${group || 'all'}:${category || 'all'}:${sport || 'all'}:${params.channelId || 'all'}:${params.q || ''}:${limit}:${offset}`;
    const l1Cached = l1Cache.get(cacheKey) as TvReadResponseDTO | undefined;
    if (l1Cached) {
      const hydrated = this.hydrateResponseRuntimeState(l1Cached);
      return {
        ...hydrated,
        meta: { ...hydrated.meta, cached: true },
      };
    }

    const cached = await this.cacheRepository.get<TvReadResponseDTO>(cacheKey);
    if (cached) {
      // Skip the in-process L1 cache for 'day' view: it can hold up to
      // TV_READ_LIMITS.day.max (20000) items in a single response, and
      // L1Cache is bounded by entry COUNT (200), not byte size - a handful
      // of these can dominate guiatv-api's own Node heap. Redis (above)
      // stays the cache for this view; only the small-response views
      // (now/next/night/search) get the extra in-process hot-path cache.
      // See docs/rebuild-scoreboard.md's residual-OOM investigation.
      if (view !== 'day') {
        l1Cache.set(cacheKey, cached, this.resolveTtlMs(view));
      }
      const hydrated = this.hydrateResponseRuntimeState(cached);
      return {
        ...hydrated,
        meta: { ...hydrated.meta, cached: true },
      };
    }

    const reference = new Date();
    const baseQuery = applyTvReadTemporalBounds({ date }, view, reference);
    const andClauses: Record<string, any>[] = [];

    if (group) baseQuery['channel.group'] = group;
    if (category) baseQuery['program.editorialCategory'] = category;
    if (params.channelId) {
      andClauses.push(this.buildChannelFilterClause(params.channelId));
    }

    if (params.q) {
      const tokens = buildSearchTokens([params.q]);
      andClauses.push({
        $or: [
          { searchTokens: { $in: tokens } },
          { 'program.title': new RegExp(this.escapeRegex(String(params.q)), 'i') },
          { 'channel.name': new RegExp(this.escapeRegex(String(params.q)), 'i') },
        ],
      });
    }

    if (view === 'night') {
      baseQuery['airing.partOfDay'] = 'noche';
    }

    if (andClauses.length) {
      baseQuery.$and = andClauses;
    }

    const rawItems = (await TVReadAiringModel.find(baseQuery)
      .sort({ 'channel.sortOrder': 1, 'airing.start': 1 })
      .lean()
      .exec()) as unknown as TvReadItemDTO[];

    const allMatching = rawItems
      .map((item) => hydrateTvReadItemRuntime(item, reference))
      .filter((item) => isConsumerVisibleTvReadItem(item));
    const filteredMatching = this.applySportFilter(allMatching, sport);
    const items = this.applyViewTransform(view, filteredMatching, reference, date);
    const allChannelSummaries = this.buildChannelSummaries(
      filteredMatching,
      group,
      params.channelId,
      reference,
      date
    );
    const paged = items.slice(offset, offset + limit);
    const channelSummaries = scopeChannelSummariesToPage(view, allChannelSummaries, paged);
    const response: TvReadResponseDTO = {
      date,
      view,
      items: paged,
      channels: channelSummaries,
      filters: {
        group,
        category,
        sport,
        channelId: params.channelId,
        q: params.q,
      },
      meta: {
        total: items.length,
        limit,
        nextCursor: offset + limit < items.length ? String(offset + limit) : undefined,
        generatedAt: new Date().toISOString(),
      },
    };

    await this.cacheRepository.set(cacheKey, response, this.resolveTtlSeconds(view));
    if (view !== 'day') {
      l1Cache.set(cacheKey, response, this.resolveTtlMs(view));
    }
    return response;
  }

  async getChannels(dateAliasOrDate: string, group?: string): Promise<TvReadChannelsResponseDTO> {
    const response = await this.query({
      view: 'day',
      date: dateAliasOrDate,
      group,
      limit: 5000,
    });

    return {
      date: response.date,
      group,
      channels: response.channels,
      meta: {
        total: response.channels.length,
        cached: response.meta.cached,
        generatedAt: response.meta.generatedAt,
      },
    };
  }

  async getGroupChannelCounts(dateAliasOrDate: string): Promise<Record<string, number>> {
    const date = DateUtils.parseDateAlias(dateAliasOrDate || 'today');
    const rows = await TVReadAiringModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          date,
          'channel.group': { $type: 'string', $ne: '' },
          'channel.id': { $type: 'string', $ne: '' },
          'trustDecision.consumerSuppressed': { $ne: true },
          'program.titleResolutionState': {
            $nin: ['generic_unresolved', 'generic_suppressed'],
          },
        },
      },
      { $group: { _id: { group: '$channel.group', channelId: '$channel.id' } } },
      { $group: { _id: '$_id.group', count: { $sum: 1 } } },
    ]).exec();

    return Object.fromEntries(
      rows.map((row) => [normalizeTvToken(row._id, ' '), row.count])
    );
  }

  async getChannelDetail(
    channelId: string,
    dateAliasOrDate: string,
    view: TvReadView = 'day'
  ): Promise<TvReadResponseDTO> {
    return this.query({
      view,
      date: dateAliasOrDate,
      channelId,
      limit: 1000,
    });
  }

  async getItem(airingId: string): Promise<TvReadItemResponseDTO> {
    const cacheKey = `tv:read:item:${airingId}`;
    const l1Cached = l1Cache.get(cacheKey) as TvReadItemResponseDTO | undefined;
    if (l1Cached) {
      return this.hydrateItemResponseRuntimeState(l1Cached, true);
    }

    const cached = await this.cacheRepository.get<TvReadItemResponseDTO>(cacheKey);
    if (cached) {
      l1Cache.set(cacheKey, cached, 30 * 60_000);
      return this.hydrateItemResponseRuntimeState(cached, true);
    }

    const item = (await TVReadAiringModel.findOne({ id: airingId }).lean().exec()) as unknown as TvReadItemDTO | null;
    if (!item || !isConsumerVisibleTvReadItem(item)) {
      throw new Error(`TV read item not found: ${airingId}`);
    }

    const relatedChannelItems = (await TVReadAiringModel.find({
      date: item.airing.date,
      'channel.id': item.channel.id,
      id: { $ne: item.id },
    })
      .sort({ 'airing.start': 1 })
      .limit(12)
      .lean()
      .exec()) as unknown as TvReadItemDTO[];

    const response: TvReadItemResponseDTO = {
      item,
      relatedChannelItems: relatedChannelItems.filter((entry) =>
        isConsumerVisibleTvReadItem(entry)
      ),
      meta: {
        generatedAt: new Date().toISOString(),
      },
    };
    await this.cacheRepository.set(cacheKey, response, 30 * 60);
    l1Cache.set(cacheKey, response, 30 * 60_000);
    return this.hydrateItemResponseRuntimeState(response, false);
  }

  private applyViewTransform(
    view: TvReadView,
    items: TvReadItemDTO[],
    reference: Date,
    dateKey: string
  ): TvReadItemDTO[] {
    if (view === 'now') {
      return selectCurrentTvItems(items);
    }

    if (view === 'next') {
      return selectNextTvItems(items, reference);
    }

    if (view === 'night') {
      return selectPrimeTimeTvItems(items, dateKey, { requireStartInsideWindow: true });
    }

    return items.sort(sortTvItems);
  }

  private buildChannelSummaries(
    items: TvReadItemDTO[],
    group?: string,
    channelId?: string,
    reference: Date = new Date(),
    dateKey?: string
  ): TvReadChannelSummaryDTO[] {
    const map = new Map<string, TvReadChannelSummaryDTO>();
    const sortedItems = [...items].sort(sortTvItems);

    sortedItems.forEach((item) => {
      if (group && item.channel.group !== group) return;
      if (channelId && !this.channelMatches(item.channel, channelId)) return;

      const current = map.get(item.channel.id) || {
        channel: item.channel,
        current: undefined,
        next: undefined,
        tonight: [],
        counts: { total: 0, live: 0, tonight: 0 },
      };

      current.counts.total += 1;
      if (item.airing.liveNow && isFeaturedTvReadItem(item)) {
        const preferredCurrent = pickPreferredChannelItem(current.current, item);
        if (!current.current) {
          current.counts.live += 1;
        }
        current.current = preferredCurrent;
      }
      if (isFeaturedTvReadItem(item) && new Date(item.airing.start).getTime() > reference.getTime()) {
        const preferredNext = pickPreferredChannelItem(current.next, item);
        if (
          !current.next ||
          new Date(item.airing.start).getTime() < new Date(current.next.airing.start).getTime() ||
          airingsOverlap(current.next, item)
        ) {
          current.next = preferredNext;
        }
      }
      if (dateKey && overlapsPrimeTimeWindow(item, dateKey) && isFeaturedTvReadItem(item)) {
        current.tonight = [...(current.tonight || []), item].slice(0, 6);
        current.counts.tonight += 1;
      }

      map.set(item.channel.id, current);
    });

    return Array.from(map.values()).sort(
      (left, right) =>
        getGuideGroupSortOrder(left.channel.group) - getGuideGroupSortOrder(right.channel.group) ||
        left.channel.sortOrder - right.channel.sortOrder ||
        String(left.channel.name || '').localeCompare(String(right.channel.name || ''), 'es', {
          sensitivity: 'base',
        })
    );
  }

  private buildChannelFilterClause(channelId: string): Record<string, any> {
    const raw = String(channelId || '').trim();
    const normalized = normalizeTvToken(raw);
    const values = Array.from(new Set([raw, normalized].filter(Boolean)));

    return {
      $or: [
        { 'channel.id': { $in: values } },
        { 'channel.normalizedName': { $in: values } },
        { 'channel.aliases': { $in: values } },
        { 'channel.sourceIds': { $in: values } },
      ],
    };
  }

  private channelMatches(channel: TvReadItemDTO['channel'], channelId: string): boolean {
    const raw = String(channelId || '').trim();
    const normalized = normalizeTvToken(raw);
    return [
      channel.id,
      channel.normalizedName,
      ...(channel.aliases || []),
      ...(channel.sourceIds || []),
    ].some((candidate) => {
      const safe = String(candidate || '').trim();
      return safe === raw || safe === normalized;
    });
  }

  private hydrateResponseRuntimeState(
    response: TvReadResponseDTO
  ): TvReadResponseDTO {
    const reference = new Date();
    const hydratedItems = response.items.map((item) =>
      hydrateTvReadItemRuntime(item, reference)
    );
    const channels = this.buildChannelSummaries(
      hydratedItems,
      response.filters.group,
      response.filters.channelId,
      reference,
      response.date
    );

    return {
      ...response,
      items: this.applyViewTransform(response.view, hydratedItems, reference, response.date),
      channels,
    };
  }

  private hydrateItemResponseRuntimeState(
    response: TvReadItemResponseDTO,
    cached: boolean
  ): TvReadItemResponseDTO {
    const reference = new Date();
    return {
      item: hydrateTvReadItemRuntime(response.item, reference),
      relatedChannelItems: response.relatedChannelItems.map((item) =>
        hydrateTvReadItemRuntime(item, reference)
      ),
      meta: {
        ...response.meta,
        cached,
      },
    };
  }

  private resolveTtlSeconds(view: TvReadView): number {
    if (view === 'now') return 60;
    if (view === 'next') return 120;
    return 15 * 60;
  }

  private resolveTtlMs(view: TvReadView): number {
    return this.resolveTtlSeconds(view) * 1000;
  }

  private escapeRegex(value: string): string {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private applySportFilter(
    items: TvReadItemDTO[],
    sport: ReturnType<typeof normalizeSportFacet>
  ): TvReadItemDTO[] {
    if (!sport || sport === 'all') {
      return items;
    }

    return items.filter(
      (item) => normalizeSportFacet(item.program.sportFacet) === sport
    );
  }
}
