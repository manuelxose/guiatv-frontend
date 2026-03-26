import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';
import { DateUtils } from '@/shared/utils/dateUtils';
import { l1Cache } from '@/infrastructure/cache/L1Cache';
import {
  buildSearchTokens,
  inferTimeWindow,
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
  channelId?: string;
  q?: string;
  limit?: number;
  cursor?: string;
}

const TV_READ_LIMITS: Record<TvReadView, { default: number; max: number }> = {
  now: { default: 120, max: 500 },
  next: { default: 120, max: 500 },
  night: { default: 240, max: 1500 },
  day: { default: 5000, max: 5000 },
  search: { default: 60, max: 200 },
};

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
    left.channel.sortOrder - right.channel.sortOrder ||
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

export class TvReadQueryService {
  constructor(private readonly cacheRepository: ICacheRepository) {}

  async query(params: TvReadQueryParams): Promise<TvReadResponseDTO> {
    const date = DateUtils.parseDateAlias(params.date || 'today');
    const view = normalizeTvReadView(params.view);
    const limit = resolveTvReadLimit(view, params.limit);
    const offset = Number(params.cursor || '0') || 0;
    const cacheKey = `tv:read:${date}:${view}:${params.group || 'all'}:${params.category || 'all'}:${params.channelId || 'all'}:${params.q || ''}:${limit}:${offset}`;
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
      l1Cache.set(cacheKey, cached, this.resolveTtlMs(view));
      const hydrated = this.hydrateResponseRuntimeState(cached);
      return {
        ...hydrated,
        meta: { ...hydrated.meta, cached: true },
      };
    }

    const baseQuery: Record<string, any> = { date };
    const andClauses: Record<string, any>[] = [];

    if (params.group) baseQuery['channel.group'] = params.group;
    if (params.category) baseQuery['program.editorialCategory'] = params.category;
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

    const reference = new Date();
    const allMatching = rawItems
      .map((item) => hydrateTvReadItemRuntime(item, reference))
      .filter((item) => isConsumerVisibleTvReadItem(item));
    const items = this.applyViewTransform(view, allMatching, reference);
    const channelSummaries = this.buildChannelSummaries(
      allMatching,
      params.group,
      params.channelId,
      reference
    );
    const paged = items.slice(offset, offset + limit);
    const response: TvReadResponseDTO = {
      date,
      view,
      items: paged,
      channels: channelSummaries,
      filters: {
        group: params.group,
        category: params.category,
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
    l1Cache.set(cacheKey, response, this.resolveTtlMs(view));
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
    reference: Date
  ): TvReadItemDTO[] {
    if (view === 'now') {
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

    if (view === 'next') {
      const nextByChannel = new Map<string, TvReadItemDTO>();
      items.forEach((item) => {
        if (!isFeaturedTvReadItem(item)) {
          return;
        }
        const start = new Date(item.airing.start).getTime();
        if (start <= reference.getTime()) return;
        const current = nextByChannel.get(item.channel.id);
        if (!current || start < new Date(current.airing.start).getTime()) {
          nextByChannel.set(item.channel.id, item);
        }
      });
      return Array.from(nextByChannel.values()).sort(sortTvItems);
    }

    if (view === 'night') {
      return items
        .filter((item) => item.airing.partOfDay === 'noche' && isFeaturedTvReadItem(item))
        .sort(sortTvItems);
    }

    return items.sort(sortTvItems);
  }

  private buildChannelSummaries(
    items: TvReadItemDTO[],
    group?: string,
    channelId?: string,
    reference: Date = new Date()
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
      if (item.airing.liveNow && isFeaturedTvReadItem(item) && !current.current) {
        current.current = item;
        current.counts.live += 1;
      }
      if (
        !current.next &&
        isFeaturedTvReadItem(item) &&
        new Date(item.airing.start).getTime() > reference.getTime()
      ) {
        current.next = item;
      }
      if (item.airing.partOfDay === 'noche' && isFeaturedTvReadItem(item)) {
        current.tonight = [...(current.tonight || []), item].slice(0, 6);
        current.counts.tonight += 1;
      }

      map.set(item.channel.id, current);
    });

    return Array.from(map.values()).sort(
      (left, right) => left.channel.sortOrder - right.channel.sortOrder
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
      reference
    );

    return {
      ...response,
      items: this.applyViewTransform(response.view, hydratedItems, reference),
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
}
