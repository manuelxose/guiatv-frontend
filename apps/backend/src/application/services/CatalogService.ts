import { IChannelRepository } from '@/domain/repositories/IChannelRepository';
import { IProgramRepository } from '@/domain/repositories/IProgramRepository';
import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import { Program } from '@/domain/entities/Program';
import {
  CatalogAiringDTO,
  CatalogContentType,
  CatalogDetailDTO,
  CatalogItemDTO,
  CatalogPlatformDTO,
  CatalogProviderDTO,
  CatalogQueryResultDTO,
  CatalogSuggestionDTO,
  CatalogWhereToWatchDTO,
  CATALOG_PLATFORM_NAME_MAP,
  CATALOG_PLATFORM_REGISTRY,
} from '../dto/CatalogDTO';
import {
  buildProgramCatalogId,
  buildTmdbCatalogId,
  normalizeInteractionContentId,
  parseCatalogId,
} from './CatalogIdentity';
import {
  TMDBDetailResult,
  TMDBResult,
  TMDBService,
} from '@/infrastructure/external/TMDBService';
import {
  StreamingProvidersService,
  WatchProvidersResult,
} from '@/infrastructure/external/StreamingProvidersService';
import { IUserContentInteractionRepository } from '@/domain/repositories/IUserContentInteractionRepository';
import { DateUtils } from '@/shared/utils/dateUtils';
import { NotFoundError } from '@/shared/errors';
import { UserListItemModel } from '@/infrastructure/database/models/UserListItem.model';
import { UserListModel } from '@/infrastructure/database/models/UserList.model';
import { UserContentInteractionModel } from '@/infrastructure/database/models/UserContentInteraction.model';
import { UserFollowModel } from '@/infrastructure/database/models/UserFollow.model';
import { UserProfileModel } from '@/infrastructure/database/models/UserProfile.model';

export interface CatalogQueryParams {
  userId?: string;
  q?: string;
  types?: string[];
  genres?: string[];
  platforms?: string[];
  availability?: string[];
  date?: string;
  timeSlot?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ResolveRecommendationInput {
  title: string;
  type?: 'movie' | 'series' | 'program';
  platform?: string;
  channel?: string;
}

interface CatalogPreferences {
  favoriteGenres: Set<string>;
  preferredPlatforms: Set<string>;
  excludeSeen: Set<string>;
}

const MOVIE_GENRE_IDS: Record<string, number> = {
  accion: 28,
  aventura: 12,
  animacion: 16,
  comedia: 35,
  crimen: 80,
  documental: 99,
  drama: 18,
  familia: 10751,
  fantasia: 14,
  historia: 36,
  terror: 27,
  musica: 10402,
  misterio: 9648,
  romance: 10749,
  'ciencia ficcion': 878,
  scifi: 878,
  suspenso: 53,
  suspense: 53,
  tvmovie: 10770,
  thriller: 53,
  guerra: 10752,
  western: 37,
};

const TV_GENRE_IDS: Record<string, number> = {
  accion: 10759,
  aventura: 10759,
  animacion: 16,
  comedia: 35,
  crimen: 80,
  documental: 99,
  drama: 18,
  familia: 10751,
  infantil: 10762,
  kids: 10762,
  misterio: 9648,
  noticias: 10763,
  reality: 10764,
  cienciaficcion: 10765,
  'ciencia ficcion': 10765,
  scifi: 10765,
  soap: 10766,
  talk: 10767,
  guerra: 10768,
  politica: 10768,
  suspense: 9648,
  thriller: 9648,
};

export class CatalogService {
  private readonly ttlSeconds = 600;
  private readonly suggestionTtlSeconds = 300;

  constructor(
    private readonly programRepository: IProgramRepository,
    private readonly channelRepository: IChannelRepository,
    private readonly cacheRepository: ICacheRepository,
    private readonly tmdbService: TMDBService,
    private readonly streamingProvidersService: StreamingProvidersService,
    private readonly interactionRepository: IUserContentInteractionRepository
  ) {}

  getPlatforms(): CatalogPlatformDTO[] {
    return CATALOG_PLATFORM_REGISTRY;
  }

  async query(params: CatalogQueryParams): Promise<CatalogQueryResultDTO> {
    const normalized = this.normalizeQuery(params);
    const cacheKey = `catalog:query:${JSON.stringify(normalized)}`;
    const cached = await this.cacheRepository.get<CatalogQueryResultDTO>(cacheKey);
    if (cached) {
      return cached;
    }

    const [channelMap, preferences, programItems, streamingItems] = await Promise.all([
      this.loadChannelMap(),
      this.loadPreferences(normalized.userId),
      this.loadProgramItems(normalized),
      this.loadStreamingItems(normalized),
    ]);

    const merged = this.mergeItems(
      [...programItems, ...streamingItems],
      channelMap
    );
    const scored = merged
      .map((item) => ({
        item,
        score: this.computeScore(item, normalized.sort, preferences),
      }))
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'es'))
      .map((entry) => entry.item)
      .filter((item) => this.matchesAvailability(item, normalized.availability))
      .filter((item) => this.matchesPlatforms(item, normalized.platforms))
      .filter((item) => this.matchesGenres(item, normalized.genres))
      .filter((item) => this.matchesSeenFilter(item, normalized.sort, preferences));

    const total = scored.length;
    const startIndex = (normalized.page - 1) * normalized.limit;
    const paged = scored.slice(startIndex, startIndex + normalized.limit);
    const withInteractions = await this.attachUserInteractions(
      paged,
      normalized.userId
    );

    const response: CatalogQueryResultDTO = {
      items: withInteractions,
      meta: {
        page: normalized.page,
        limit: normalized.limit,
        total,
        hasMore: startIndex + normalized.limit < total,
      },
      availableGenres: Array.from(
        new Set(
          scored.flatMap((item) => item.genres).map((genre) => String(genre || '').trim())
        )
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'es')),
      availablePlatforms: this.getPlatforms(),
    };

    await this.cacheRepository.set(cacheKey, response, this.ttlSeconds);
    return response;
  }

  async suggest(
    q: string,
    userId?: string,
    limit: number = 8
  ): Promise<CatalogSuggestionDTO[]> {
    const normalizedQuery = String(q || '').trim();
    if (!normalizedQuery) {
      return [];
    }

    const cacheKey = `catalog:suggest:${normalizedQuery.toLowerCase()}:${userId || 'anon'}:${limit}`;
    const cached = await this.cacheRepository.get<CatalogSuggestionDTO[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.query({
      userId,
      q: normalizedQuery,
      limit,
      page: 1,
      sort: 'popular',
    });

    const suggestions = result.items.slice(0, limit).map((item) => ({
      catalogId: item.catalogId,
      source: item.source,
      contentType: item.contentType,
      title: item.title,
      subtitle:
        item.source === 'program'
          ? item.channel?.name || item.start
          : item.primaryPlatforms[0] || item.genres[0],
      image: item.image,
      primaryPlatforms: item.primaryPlatforms,
    }));

    await this.cacheRepository.set(cacheKey, suggestions, this.suggestionTtlSeconds);
    return suggestions;
  }

  async getDetail(
    catalogId: string,
    userId?: string
  ): Promise<CatalogDetailDTO> {
    const parsed = parseCatalogId(catalogId);
    if (!parsed) {
      throw new NotFoundError('Catalog item', catalogId);
    }

    if (parsed.source === 'program' && parsed.programId) {
      return this.getProgramDetail(parsed.programId, userId);
    }

    if (parsed.source === 'tmdb' && parsed.tmdbId && parsed.tmdbType) {
      return this.getTmdbDetail(parsed.tmdbId, parsed.tmdbType, userId);
    }

    throw new NotFoundError('Catalog item', catalogId);
  }

  async resolveRecommendation(
    input: ResolveRecommendationInput
  ): Promise<CatalogItemDTO | null> {
    const query = String(input.title || '').trim();
    if (!query) {
      return null;
    }

    const items = await this.query({
      q: query,
      limit: 6,
      page: 1,
      types: input.type ? [input.type] : undefined,
      platforms: input.platform ? [input.platform] : undefined,
      availability: input.channel ? ['live'] : undefined,
      sort: input.channel ? 'airtime' : 'popular',
    });

    return (
      items.items.find((item) => {
        if (input.type && item.contentType !== input.type) {
          return false;
        }
        if (
          input.channel &&
          !String(item.channel?.name || '')
            .toLowerCase()
            .includes(String(input.channel).toLowerCase())
        ) {
          return false;
        }
        return this.normalizeToken(item.title) === this.normalizeToken(query);
      }) ||
      items.items[0] ||
      null
    );
  }

  private async loadProgramItems(
    query: Required<CatalogQueryParams>
  ): Promise<CatalogItemDTO[]> {
    if (
      !query.types.includes('program') &&
      !query.types.includes('movie') &&
      !query.types.includes('series')
    ) {
      return [];
    }

    const includePrograms =
      !query.availability.length || query.availability.includes('live');
    const includeProgramStreaming =
      query.availability.some((value) =>
        ['streaming', 'free', 'flatrate', 'rent', 'buy'].includes(value)
      ) || !query.availability.length;

    if (!includePrograms && !includeProgramStreaming) {
      return [];
    }

    const programs = query.q
      ? (await this.programRepository.search({
          date: query.date,
          text: query.q,
          limit: 180,
          fields: 'full',
        })).items
      : await this.programRepository.findByDate(query.date, 'full');

    const filtered = programs
      .filter((program) => {
        const type = this.inferProgramContentType(program);
        if (!query.types.includes('program') && type === 'program') {
          return false;
        }
        if (!query.types.includes(type)) {
          return false;
        }
        if (query.timeSlot && !this.programMatchesTimeSlot(program, query.timeSlot)) {
          return false;
        }
        if (query.q && !this.programMatchesQuery(program, query.q)) {
          return false;
        }
        return true;
      })
      .slice(0, 160);

    const channelMap = await this.loadChannelMap();
    const withProviders = await Promise.all(
      filtered.map(async (program) => {
        const whereToWatch = includeProgramStreaming
          ? await this.resolveProgramProviders(program)
          : undefined;
        return this.mapProgramToCatalogItem(program, channelMap, whereToWatch);
      })
    );

    return withProviders.filter((item) => {
      if (!includePrograms && item.liveNow) {
        return false;
      }
      return true;
    });
  }

  private async loadStreamingItems(
    query: Required<CatalogQueryParams>
  ): Promise<CatalogItemDTO[]> {
    const includeStreaming =
      !query.availability.length ||
      query.availability.some((value) =>
        ['streaming', 'free', 'flatrate', 'rent', 'buy'].includes(value)
      );

    if (!includeStreaming) {
      return [];
    }

    const tmdbTypes = query.types.filter((type) => type === 'movie' || type === 'series');
    if (!tmdbTypes.length) {
      return [];
    }

    const providerIds = query.platforms
      .map((platform) => this.findPlatform(platform)?.tmdbProviderId)
      .filter((value): value is number => typeof value === 'number');
    const monetizationTypes = this.mapAvailabilityToWatchTypes(query.availability);
    const movieGenreIds = this.mapGenreNamesToIds(query.genres, 'movie');
    const tvGenreIds = this.mapGenreNamesToIds(query.genres, 'tv');

    const requests: Array<Promise<CatalogItemDTO[]>> = [];
    if (tmdbTypes.includes('movie')) {
      requests.push(
        this.loadTmdbTypeItems('movie', {
          q: query.q,
          page: query.page,
          sort: query.sort,
          providerIds,
          monetizationTypes,
          genreIds: movieGenreIds,
        })
      );
    }
    if (tmdbTypes.includes('series')) {
      requests.push(
        this.loadTmdbTypeItems('tv', {
          q: query.q,
          page: query.page,
          sort: query.sort,
          providerIds,
          monetizationTypes,
          genreIds: tvGenreIds,
        })
      );
    }

    const chunks = await Promise.all(requests);
    return chunks.flat();
  }

  private async loadTmdbTypeItems(
    type: 'movie' | 'tv',
    params: {
      q?: string;
      page: number;
      sort: string;
      providerIds: number[];
      monetizationTypes: Array<'flatrate' | 'free' | 'rent' | 'buy'>;
      genreIds: number[];
    }
  ): Promise<CatalogItemDTO[]> {
    const items = params.q
      ? type === 'movie'
        ? await this.tmdbService.searchMovies(params.q, { page: params.page, limit: 24 })
        : await this.tmdbService.searchTV(params.q, { page: params.page, limit: 24 })
      : (
          type === 'movie'
            ? await this.tmdbService.discoverMovies({
                page: params.page,
                sortBy: this.mapSortToTmdb(params.sort, type),
                withWatchProviders: params.providerIds,
                withGenres: params.genreIds,
                watchMonetizationTypes: params.monetizationTypes,
              })
            : await this.tmdbService.discoverTV({
                page: params.page,
                sortBy: this.mapSortToTmdb(params.sort, type),
                withWatchProviders: params.providerIds,
                withGenres: params.genreIds,
                watchMonetizationTypes: params.monetizationTypes,
              })
        ).results;

    const withProviders = await Promise.all(
      items.slice(0, 36).map(async (entry) => {
        const whereToWatch =
          type === 'movie'
            ? await this.streamingProvidersService.getMovieProviders(entry.id)
            : await this.streamingProvidersService.getTVProviders(entry.id);
        return this.mapTmdbToCatalogItem(entry, type, whereToWatch || undefined);
      })
    );

    return withProviders.filter(Boolean) as CatalogItemDTO[];
  }

  private async getProgramDetail(
    programId: string,
    userId?: string
  ): Promise<CatalogDetailDTO> {
    const program = await this.programRepository.findById(programId);
    if (!program) {
      throw new NotFoundError('Program', programId);
    }

    const channelMap = await this.loadChannelMap();
    const whereToWatch = await this.resolveProgramProviders(program);
    const item = this.mapProgramToCatalogItem(program, channelMap, whereToWatch);
    const tmdbType = this.inferTmdbTypeFromContentType(item.contentType);
    const tmdbDetail =
      tmdbType && item.tmdbId
        ? tmdbType === 'movie'
          ? await this.tmdbService.getMovieById(item.tmdbId)
          : await this.tmdbService.getTVById(item.tmdbId)
        : null;

    const [userInteraction, related, socialSummary, airings] = await Promise.all([
      this.loadSingleUserInteraction(userId, item.catalogId),
      this.loadRelatedForProgram(program, channelMap),
      this.loadSocialSummary(userId, item),
      this.loadAiringsForProgram(program, channelMap),
    ]);

    return {
      ...item,
      synopsis: tmdbDetail?.overview || item.synopsis,
      image: item.image || this.tmdbService.getImageUrl(tmdbDetail?.poster_path || null),
      backdrop:
        item.backdrop || this.tmdbService.getImageUrl(tmdbDetail?.backdrop_path || null, 'original'),
      cast: this.mapCast(tmdbDetail),
      director: this.extractDirector(tmdbDetail),
      related,
      socialSummary,
      airings,
      userInteraction: userInteraction || item.userInteraction,
    };
  }

  private async getTmdbDetail(
    tmdbId: number,
    type: 'movie' | 'tv',
    userId?: string
  ): Promise<CatalogDetailDTO> {
    const detail =
      type === 'movie'
        ? await this.tmdbService.getMovieById(tmdbId)
        : await this.tmdbService.getTVById(tmdbId);
    if (!detail) {
      throw new NotFoundError('TMDB content', String(tmdbId));
    }

    const providers =
      type === 'movie'
        ? await this.streamingProvidersService.getMovieProviders(tmdbId)
        : await this.streamingProvidersService.getTVProviders(tmdbId);
    const item = this.mapTmdbToCatalogItem(detail, type, providers || undefined);
    const channelMap = await this.loadChannelMap();
    const [airings, related, socialSummary, userInteraction] = await Promise.all([
      this.loadAiringsForTmdb(detail, item.contentType, channelMap),
      this.loadRelatedForTmdb(detail, type),
      this.loadSocialSummary(userId, item),
      this.loadSingleUserInteraction(userId, item.catalogId),
    ]);

    return {
      ...item,
      cast: this.mapCast(detail),
      director: this.extractDirector(detail),
      airings,
      related,
      socialSummary,
      userInteraction,
    };
  }

  private mapProgramToCatalogItem(
    program: Program,
    channelMap: Map<string, any>,
    providers?: CatalogWhereToWatchDTO
  ): CatalogItemDTO {
    const channel = channelMap.get(program.channelId);
    const contentType = this.inferProgramContentType(program);
    const title = String(program.title || '').trim();
    const start = program.startTime.toISOString();
    const end = program.endTime.toISOString();

    return {
      catalogId: buildProgramCatalogId(program.id),
      source: 'program',
      contentType,
      title,
      synopsis: program.description,
      image: program.image,
      backdrop: program.image,
      genres: this.extractProgramGenres(program),
      tmdbId: program.tmdbId,
      rating: program.rating ? Number(program.rating) : undefined,
      releaseYear: program.year ? Number(program.year) : undefined,
      durationMinutes: program.duration,
      start,
      end,
      liveNow: this.isLive(program.startTime, program.endTime),
      primaryPlatforms: this.extractPrimaryPlatforms(providers),
      whereToWatch: providers,
      channel: channel
        ? {
            id: channel.id,
            name: channel.name,
            icon: channel.icon || undefined,
          }
        : undefined,
      airings: channel
        ? [
            {
              channelId: channel.id,
              channelName: channel.name,
              channelIcon: channel.icon || undefined,
              start,
              end,
            },
          ]
        : undefined,
    };
  }

  private mapTmdbToCatalogItem(
    entry: TMDBResult,
    type: 'movie' | 'tv',
    providers?: WatchProvidersResult
  ): CatalogItemDTO {
    const whereToWatch = providers ? this.mapWatchProviders(providers) : undefined;
    const contentType: CatalogContentType = type === 'movie' ? 'movie' : 'series';

    return {
      catalogId: buildTmdbCatalogId(type, entry.id),
      source: 'tmdb',
      contentType,
      title: entry.title || entry.name || '',
      synopsis: entry.overview || '',
      image: this.tmdbService.getImageUrl(entry.poster_path),
      backdrop: this.tmdbService.getImageUrl(entry.backdrop_path, 'original'),
      genres: [],
      tmdbId: entry.id,
      rating: typeof entry.vote_average === 'number' ? entry.vote_average : undefined,
      releaseYear: this.extractYear(entry.release_date || entry.first_air_date),
      liveNow: false,
      primaryPlatforms: this.extractPrimaryPlatforms(whereToWatch),
      whereToWatch,
    };
  }

  private mergeItems(items: CatalogItemDTO[], channelMap: Map<string, any>): CatalogItemDTO[] {
    const merged = new Map<string, CatalogItemDTO>();

    items.forEach((item) => {
      const key = item.tmdbId ? `${item.contentType}:${item.tmdbId}` : item.catalogId;
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, item);
        return;
      }

      const preferred =
        item.source === 'program' && (item.liveNow || !existing.liveNow)
          ? item
          : existing;
      const secondary = preferred === item ? existing : item;

      merged.set(key, {
        ...preferred,
        image: preferred.image || secondary.image,
        backdrop: preferred.backdrop || secondary.backdrop,
        synopsis: preferred.synopsis || secondary.synopsis,
        genres: Array.from(new Set([...(preferred.genres || []), ...(secondary.genres || [])])),
        primaryPlatforms: Array.from(
          new Set([...(preferred.primaryPlatforms || []), ...(secondary.primaryPlatforms || [])])
        ),
        whereToWatch: preferred.whereToWatch || secondary.whereToWatch,
        airings: this.mergeAirings(preferred.airings, secondary.airings),
        channel:
          preferred.channel ||
          secondary.channel ||
          (preferred.source === 'program' && preferred.airings?.[0]
            ? {
                id: preferred.airings[0].channelId,
                name: preferred.airings[0].channelName,
                icon: preferred.airings[0].channelIcon,
              }
            : undefined),
      });
    });

    return Array.from(merged.values()).map((item) => {
      if (!item.channel && item.airings?.length) {
        const first = item.airings[0];
        const channel = channelMap.get(first.channelId);
        return {
          ...item,
          channel: {
            id: first.channelId,
            name: first.channelName,
            icon: first.channelIcon || channel?.icon || undefined,
          },
        };
      }
      return item;
    });
  }

  private async loadAiringsForProgram(
    program: Program,
    channelMap: Map<string, any>
  ): Promise<CatalogAiringDTO[]> {
    const matches = await this.findProgramMatches(program.title, program.tmdbId);
    return matches.map((entry) => this.mapAiring(entry, channelMap));
  }

  private async loadAiringsForTmdb(
    detail: TMDBDetailResult,
    contentType: CatalogContentType,
    channelMap: Map<string, any>
  ): Promise<CatalogAiringDTO[]> {
    const title = detail.title || detail.name || '';
    const matches = await this.findProgramMatches(
      title,
      detail.id,
      contentType === 'series' ? 'series' : 'movie'
    );
    return matches.map((entry) => this.mapAiring(entry, channelMap));
  }

  private async loadRelatedForProgram(
    program: Program,
    channelMap: Map<string, any>
  ): Promise<CatalogItemDTO[]> {
    const programs = await this.programRepository.findByDate(program.date, 'full');
    return programs
      .filter((entry) => entry.id !== program.id)
      .filter((entry) => {
        if (program.genre && entry.genre) {
          return this.normalizeToken(program.genre).includes(this.normalizeToken(entry.genre)) ||
            this.normalizeToken(entry.genre).includes(this.normalizeToken(program.genre));
        }
        return true;
      })
      .slice(0, 8)
      .map((entry) => this.mapProgramToCatalogItem(entry, channelMap));
  }

  private async loadRelatedForTmdb(
    detail: TMDBDetailResult,
    type: 'movie' | 'tv'
  ): Promise<CatalogItemDTO[]> {
    const topGenreIds = (detail.genres || []).slice(0, 2).map((genre) => genre.id);
    const discovered =
      type === 'movie'
        ? await this.tmdbService.discoverMovies({
            withGenres: topGenreIds,
            page: 1,
            sortBy: 'popularity.desc',
          })
        : await this.tmdbService.discoverTV({
            withGenres: topGenreIds,
            page: 1,
            sortBy: 'popularity.desc',
          });

    const providers = await Promise.all(
      discovered.results
        .filter((item) => item.id !== detail.id)
        .slice(0, 8)
        .map(async (item) => {
          const watch =
            type === 'movie'
              ? await this.streamingProvidersService.getMovieProviders(item.id)
              : await this.streamingProvidersService.getTVProviders(item.id);
          return this.mapTmdbToCatalogItem(item, type, watch || undefined);
        })
    );

    return providers;
  }

  private async attachUserInteractions(
    items: CatalogItemDTO[],
    userId?: string
  ): Promise<CatalogItemDTO[]> {
    if (!userId || !items.length) {
      return items;
    }

    const interactionMap = await this.loadInteractionMap(
      userId,
      items.map((item) => item.catalogId)
    );

    return items.map((item) => ({
      ...item,
      userInteraction: interactionMap.get(item.catalogId) || item.userInteraction,
    }));
  }

  private async loadSingleUserInteraction(
    userId: string | undefined,
    catalogId: string
  ) {
    if (!userId) {
      return undefined;
    }

    const map = await this.loadInteractionMap(userId, [catalogId]);
    return map.get(catalogId);
  }

  private async loadInteractionMap(userId: string, catalogIds: string[]) {
    const acceptedIds = Array.from(
      new Set(catalogIds.flatMap((catalogId) => this.expandAcceptedContentIds(catalogId)))
    );

    const [interactions, listItems] = await Promise.all([
      UserContentInteractionModel.find({
        userId,
        contentId: { $in: acceptedIds },
      })
        .lean()
        .exec(),
      UserListItemModel.find({
        userId,
        contentId: { $in: acceptedIds },
      })
        .lean()
        .exec(),
    ]);

    const listIds = Array.from(
      new Set(listItems.map((item: any) => String(item.listId || '')).filter(Boolean))
    );
    const lists = listIds.length
      ? await UserListModel.find({ _id: { $in: listIds } }).lean().exec()
      : [];
    const listTitleById = new Map(
      lists.map((list: any) => [String(list._id), String(list.title || '')])
    );

    const result = new Map<string, CatalogItemDTO['userInteraction']>();
    catalogIds.forEach((catalogId) => {
      const aliases = this.expandAcceptedContentIds(catalogId);
      const interaction = interactions.find((entry: any) =>
        aliases.includes(String(entry.contentId || ''))
      );
      const matchingListItems = listItems.filter((entry: any) =>
        aliases.includes(String(entry.contentId || ''))
      );

      if (!interaction && !matchingListItems.length) {
        return;
      }

      result.set(catalogId, {
        status: interaction?.status || (matchingListItems.length ? 'pending' : undefined),
        rating: typeof interaction?.rating === 'number' ? interaction.rating : undefined,
        liked: Boolean(interaction?.liked),
        inWatchlist: matchingListItems.length > 0,
        lists: matchingListItems
          .map((entry: any) => listTitleById.get(String(entry.listId || '')) || '')
          .filter(Boolean),
        watchedAt: interaction?.watchedAt
          ? new Date(interaction.watchedAt).toISOString()
          : undefined,
      });
    });

    return result;
  }

  private async loadSocialSummary(
    userId: string | undefined,
    item: CatalogItemDTO
  ): Promise<CatalogDetailDTO['socialSummary']> {
    if (!userId) {
      return undefined;
    }

    const follows = await UserFollowModel.find({ followerId: userId }).lean().exec();
    const followeeIds = follows.map((entry: any) => String(entry.followeeId)).filter(Boolean);
    if (!followeeIds.length) {
      return undefined;
    }

    const acceptedIds = this.expandAcceptedContentIds(item.catalogId);
    const stats = await UserContentInteractionModel.aggregate([
      {
        $match: {
          userId: { $in: followeeIds },
          $or: [
            { contentId: { $in: acceptedIds } },
            ...(item.tmdbId ? [{ tmdbId: item.tmdbId }] : []),
            { contentTitle: new RegExp(`^${this.escapeRegex(item.title)}$`, 'i') },
          ],
        },
      },
      {
        $group: {
          _id: null,
          friendsWhoWatched: { $addToSet: '$userId' },
          avgFriendRating: { $avg: '$rating' },
        },
      },
    ]).exec();

    const first = stats[0];
    if (!first) {
      return undefined;
    }

    return {
      friendsWhoWatched: Array.isArray(first.friendsWhoWatched)
        ? first.friendsWhoWatched.length
        : 0,
      avgFriendRating:
        typeof first.avgFriendRating === 'number'
          ? Number(first.avgFriendRating.toFixed(1))
          : undefined,
    };
  }

  private async resolveProgramProviders(
    program: Program
  ): Promise<CatalogWhereToWatchDTO | undefined> {
    const inferredType = this.inferTmdbTypeFromContentType(
      this.inferProgramContentType(program)
    );
    if (!inferredType) {
      return undefined;
    }

    let tmdbId = program.tmdbId;
    if (!tmdbId) {
      const resolved =
        inferredType === 'movie'
          ? await this.tmdbService.searchMovie(program.title, program.year ? Number(program.year) : undefined)
          : await this.tmdbService.searchSeries(program.title);
      tmdbId = resolved?.id;
    }

    if (!tmdbId) {
      return undefined;
    }

    const providers =
      inferredType === 'movie'
        ? await this.streamingProvidersService.getMovieProviders(tmdbId)
        : await this.streamingProvidersService.getTVProviders(tmdbId);

    return providers ? this.mapWatchProviders(providers) : undefined;
  }

  private mapWatchProviders(providers: WatchProvidersResult): CatalogWhereToWatchDTO {
    const mapProviders = (
      input: WatchProvidersResult['flatrate'],
      type: CatalogProviderDTO['type']
    ): CatalogProviderDTO[] =>
      input.map((provider) => ({
        id: provider.providerId,
        name: provider.providerName,
        logoUrl: provider.logoPath
          ? this.streamingProvidersService.getLogoUrl(provider.logoPath)
          : '',
        type,
        deepLink: providers.link || undefined,
      }));

    return {
      flatrate: mapProviders(providers.flatrate, 'flatrate'),
      rent: mapProviders(providers.rent, 'rent'),
      buy: mapProviders(providers.buy, 'buy'),
      free: mapProviders(providers.free, 'free'),
      tmdbLink: providers.link || '',
    };
  }

  private extractPrimaryPlatforms(
    whereToWatch?: CatalogWhereToWatchDTO
  ): string[] {
    if (!whereToWatch) {
      return [];
    }

    return Array.from(
      new Set(
        [
          ...(whereToWatch.flatrate || []),
          ...(whereToWatch.free || []),
          ...(whereToWatch.rent || []),
          ...(whereToWatch.buy || []),
        ]
          .map((provider) => provider.name)
          .filter(Boolean)
      )
    );
  }

  private mapAvailabilityToWatchTypes(
    availability: string[]
  ): Array<'flatrate' | 'free' | 'rent' | 'buy'> {
    const resolved = new Set<'flatrate' | 'free' | 'rent' | 'buy'>();
    availability.forEach((value) => {
      if (value === 'streaming' || value === 'flatrate') {
        resolved.add('flatrate');
      }
      if (value === 'free') {
        resolved.add('free');
      }
      if (value === 'rent') {
        resolved.add('rent');
      }
      if (value === 'buy') {
        resolved.add('buy');
      }
    });

    return Array.from(resolved);
  }

  private computeScore(
    item: CatalogItemDTO,
    sort: string,
    preferences: CatalogPreferences
  ): number {
    const genreBoost = item.genres.some((genre) =>
      preferences.favoriteGenres.has(this.normalizeToken(genre))
    )
      ? 0.25
      : 0;
    const platformBoost = item.primaryPlatforms.some((platform) =>
      preferences.preferredPlatforms.has(this.normalizeToken(platform))
    )
      ? 0.2
      : 0;
    const ratingScore = Math.min(1, Number(item.rating || 0) / 10);
    const liveBoost = item.liveNow ? 0.4 : item.start ? 0.2 : 0;

    if (sort === 'airtime') {
      return liveBoost + this.computeAirtimeScore(item);
    }
    if (sort === 'rating') {
      return ratingScore + genreBoost + platformBoost;
    }
    if (sort === 'recent') {
      return this.computeRecencyScore(item) + genreBoost + platformBoost;
    }
    if (sort === 'personalized') {
      return genreBoost + platformBoost + ratingScore * 0.35 + liveBoost * 0.2;
    }

    return ratingScore * 0.5 + liveBoost * 0.2 + genreBoost + platformBoost;
  }

  private computeAirtimeScore(item: CatalogItemDTO): number {
    if (!item.start) {
      return 0;
    }
    const start = new Date(item.start).getTime();
    const delta = Math.abs(start - Date.now());
    return Math.max(0, 1 - delta / (1000 * 60 * 60 * 24));
  }

  private computeRecencyScore(item: CatalogItemDTO): number {
    if (!item.releaseYear) {
      return item.start ? this.computeAirtimeScore(item) : 0;
    }
    const deltaYears = Math.max(0, new Date().getFullYear() - item.releaseYear);
    return Math.max(0, 1 - deltaYears / 20);
  }

  private matchesAvailability(item: CatalogItemDTO, availability: string[]): boolean {
    if (!availability.length) {
      return true;
    }

    if (availability.includes('live') && item.source === 'program') {
      return true;
    }

    if (
      availability.includes('streaming') &&
      (item.primaryPlatforms.length > 0 || item.source === 'tmdb')
    ) {
      return true;
    }

    const whereToWatch = item.whereToWatch;
    if (!whereToWatch) {
      return false;
    }

    return availability.some((value) => {
      if (value === 'free') return Boolean(whereToWatch.free?.length);
      if (value === 'flatrate') return Boolean(whereToWatch.flatrate?.length);
      if (value === 'rent') return Boolean(whereToWatch.rent?.length);
      if (value === 'buy') return Boolean(whereToWatch.buy?.length);
      return false;
    });
  }

  private matchesPlatforms(item: CatalogItemDTO, platforms: string[]): boolean {
    if (!platforms.length) {
      return true;
    }

    const itemPlatforms = new Set(
      item.primaryPlatforms.map((platform) => this.normalizeToken(platform))
    );
    return platforms.some((platform) => itemPlatforms.has(this.normalizeToken(platform)));
  }

  private matchesGenres(item: CatalogItemDTO, genres: string[]): boolean {
    if (!genres.length) {
      return true;
    }

    const normalizedGenres = item.genres.map((genre) => this.normalizeToken(genre));
    return genres.some((genre) => normalizedGenres.includes(this.normalizeToken(genre)));
  }

  private matchesSeenFilter(
    item: CatalogItemDTO,
    sort: string,
    preferences: CatalogPreferences
  ): boolean {
    if (sort !== 'personalized') {
      return true;
    }

    if (preferences.excludeSeen.has(item.catalogId)) {
      return false;
    }

    if (
      item.tmdbId &&
      preferences.excludeSeen.has(
        item.contentType === 'series'
          ? buildTmdbCatalogId('tv', item.tmdbId)
          : buildTmdbCatalogId('movie', item.tmdbId)
      )
    ) {
      return false;
    }

    return true;
  }

  private async loadPreferences(userId?: string): Promise<CatalogPreferences> {
    if (!userId) {
      return {
        favoriteGenres: new Set(),
        preferredPlatforms: new Set(),
        excludeSeen: new Set(),
      };
    }

    const [profile, genreProfile, history] = await Promise.all([
      UserProfileModel.findOne({ userId }).lean().exec(),
      this.interactionRepository.getUserGenreProfile(userId),
      this.interactionRepository.findByUser(userId, { limit: 250 }),
    ]);

    const excludeSeen = new Set<string>();
    history
      .filter((entry) => entry.status === 'seen' || entry.status === 'dropped')
      .forEach((entry) => {
        excludeSeen.add(normalizeInteractionContentId(entry));
      });

    return {
      favoriteGenres: new Set(
        [...(profile?.favoriteGenres || []), ...genreProfile.genres.map((item) => item.genre)].map((item) =>
          this.normalizeToken(item)
        )
      ),
      preferredPlatforms: new Set(
        [...(profile?.preferredPlatforms || []), ...genreProfile.preferredPlatforms].map((item) =>
          this.normalizeToken(item)
        )
      ),
      excludeSeen,
    };
  }

  private normalizeQuery(params: CatalogQueryParams): Required<CatalogQueryParams> {
    return {
      userId: params.userId || '',
      q: String(params.q || '').trim(),
      types: this.normalizeTypes(params.types),
      genres: this.normalizeStringArray(params.genres),
      platforms: this.normalizeStringArray(params.platforms),
      availability: this.normalizeAvailability(params.availability),
      date: this.normalizeDate(params.date),
      timeSlot: String(params.timeSlot || '').trim(),
      sort: this.normalizeSort(params.sort),
      page: Math.max(1, Number(params.page || 1)),
      limit: Math.min(48, Math.max(1, Number(params.limit || 24))),
    };
  }

  private normalizeTypes(value?: string[]): CatalogContentType[] {
    const input = Array.isArray(value) ? value : [];
    const normalized = Array.from(
      new Set(
        input
          .map((item) => String(item || '').trim().toLowerCase())
          .map((item) => {
            if (item === 'movies') return 'movie';
            if (item === 'tv') return 'program';
            if (item === 'programs') return 'program';
            if (item === 'series') return 'series';
            if (item === 'movie') return 'movie';
            if (item === 'program') return 'program';
            return '';
          })
          .filter(Boolean) as CatalogContentType[]
      )
    );

    return normalized.length ? normalized : ['program', 'movie', 'series'];
  }

  private normalizeAvailability(value?: string[]): string[] {
    const normalized = this.normalizeStringArray(value);
    return normalized.filter((entry) =>
      ['live', 'streaming', 'free', 'flatrate', 'rent', 'buy'].includes(
        entry
      )
    );
  }

  private normalizeStringArray(value?: string[]): string[] {
    return Array.from(
      new Set(
        (Array.isArray(value) ? value : [])
          .map((item) => String(item || '').trim())
          .filter(Boolean)
      )
    );
  }

  private normalizeDate(value?: string): string {
    const raw = String(value || 'today').trim();
    if (!raw) {
      return DateUtils.getTodayYYYYMMDD();
    }

    try {
      return DateUtils.parseDateAlias(raw);
    } catch {
      return DateUtils.getTodayYYYYMMDD();
    }
  }

  private normalizeSort(value?: string): string {
    const raw = String(value || 'popular').trim().toLowerCase();
    return ['personalized', 'popular', 'rating', 'airtime', 'recent'].includes(raw)
      ? raw
      : 'popular';
  }

  private mapSortToTmdb(
    sort: string,
    type: 'movie' | 'tv'
  ): 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' | 'first_air_date.desc' {
    if (sort === 'rating' || sort === 'personalized') {
      return 'vote_average.desc';
    }
    if (sort === 'recent') {
      return type === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc';
    }
    return 'popularity.desc';
  }

  private mapGenreNamesToIds(
    genres: string[],
    type: 'movie' | 'tv'
  ): number[] {
    const source = type === 'movie' ? MOVIE_GENRE_IDS : TV_GENRE_IDS;
    return Array.from(
      new Set(
        genres
          .map((genre) => this.normalizeToken(genre))
          .map((genre) => source[genre])
          .filter((genreId): genreId is number => typeof genreId === 'number')
      )
    );
  }

  private inferProgramContentType(program: Program): CatalogContentType {
    const token = this.normalizeToken(program.genre || '');
    if (token.includes('serie')) return 'series';
    if (token.includes('cine') || token.includes('pelicula') || token.includes('pel')) {
      return 'movie';
    }
    return 'program';
  }

  private inferTmdbTypeFromContentType(
    type: CatalogContentType
  ): 'movie' | 'tv' | null {
    if (type === 'movie') return 'movie';
    if (type === 'series') return 'tv';
    return null;
  }

  private extractProgramGenres(program: Program): string[] {
    const parts = [program.genre, program.subgenre]
      .flatMap((value) => String(value || '').split(/[\\/|,]/))
      .map((value) => value.trim())
      .filter(Boolean);
    return Array.from(new Set(parts));
  }

  private programMatchesQuery(program: Program, q: string): boolean {
    const token = this.normalizeToken(q);
    return [program.title, program.description, program.genre, program.subgenre]
      .some((value) => this.normalizeToken(value || '').includes(token));
  }

  private programMatchesTimeSlot(program: Program, timeSlot: string): boolean {
    const slot = Number(timeSlot);
    if (!Number.isFinite(slot)) {
      return true;
    }
    const hours = new Date(program.startTime).getHours();
    if (slot === 6) return hours >= 18 && hours < 21;
    if (slot === 7) return hours >= 21 || hours < 3;
    const ranges: Array<[number, number]> = [
      [0, 3],
      [3, 6],
      [6, 9],
      [9, 12],
      [12, 15],
      [15, 18],
    ];
    const range = ranges[slot] || ranges[0];
    return hours >= range[0] && hours < range[1];
  }

  private async loadChannelMap() {
    const channels = await this.channelRepository.findAll();
    return new Map(channels.map((channel) => [channel.id, channel.toJSON()]));
  }

  private async findProgramMatches(
    title: string,
    tmdbId?: number,
    contentType?: 'movie' | 'series'
  ): Promise<Program[]> {
    const dates = [DateUtils.getTodayYYYYMMDD(), DateUtils.getTomorrowYYYYMMDD()];
    const chunks = await Promise.all(
      dates.map((date) => this.programRepository.findByDate(date, 'full'))
    );
    const normalizedTitle = this.normalizeToken(title);
    return chunks
      .flat()
      .filter((program) => {
        if (tmdbId && program.tmdbId === tmdbId) {
          return true;
        }
        if (contentType) {
          const inferred = this.inferProgramContentType(program);
          if (inferred !== contentType) {
            return false;
          }
        }
        return this.normalizeToken(program.title) === normalizedTitle;
      })
      .slice(0, 12);
  }

  private mergeAirings(
    primary?: CatalogAiringDTO[],
    secondary?: CatalogAiringDTO[]
  ): CatalogAiringDTO[] | undefined {
    const merged = [...(primary || []), ...(secondary || [])];
    if (!merged.length) {
      return undefined;
    }
    const seen = new Set<string>();
    return merged.filter((airing) => {
      const key = `${airing.channelId}:${airing.start}:${airing.end}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private mapAiring(program: Program, channelMap: Map<string, any>): CatalogAiringDTO {
    const channel = channelMap.get(program.channelId);
    return {
      channelId: program.channelId,
      channelName: channel?.name || program.channelId,
      channelIcon: channel?.icon || undefined,
      start: program.startTime.toISOString(),
      end: program.endTime.toISOString(),
    };
  }

  private mapCast(detail: TMDBDetailResult | null | undefined) {
    return (detail?.credits?.cast || []).slice(0, 10).map((person) => ({
      name: person.name,
      character: person.character,
      profile: this.tmdbService.getImageUrl(person.profile_path || null),
    }));
  }

  private extractDirector(detail: TMDBDetailResult | null | undefined) {
    const crew = detail?.credits?.crew || [];
    const director = crew.find(
      (person) => person.job === 'Director' || person.department === 'Directing'
    );
    return director?.name;
  }

  private extractYear(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }
    const year = Number(String(value).slice(0, 4));
    return Number.isFinite(year) ? year : undefined;
  }

  private isLive(start: Date, end: Date): boolean {
    const now = Date.now();
    return start.getTime() <= now && end.getTime() >= now;
  }

  private findPlatform(name: string) {
    const normalized = this.normalizeToken(name);
    for (const platform of CATALOG_PLATFORM_REGISTRY) {
      if (this.normalizeToken(platform.name) === normalized) {
        return platform;
      }
    }
    return CATALOG_PLATFORM_NAME_MAP.get(String(name || '').trim().toLowerCase()) || null;
  }

  private normalizeToken(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private expandAcceptedContentIds(catalogId: string): string[] {
    const parsed = parseCatalogId(catalogId);
    if (!parsed) {
      return [catalogId];
    }
    if (parsed.source === 'program' && parsed.programId) {
      return [catalogId, parsed.programId];
    }
    if (parsed.source === 'tmdb' && parsed.tmdbId) {
      return [catalogId, String(parsed.tmdbId)];
    }
    return [catalogId];
  }

  private escapeRegex(value: string): string {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
