import {
  AIRecommendationService,
  ChatbotContext,
  ChatbotMessage,
  ChatbotQueryContext,
  ChatbotRecommendationPayload,
  ChatbotResponse,
} from '@/infrastructure/external/AIRecommendationService';
import { IUserContentInteractionRepository } from '@/domain/repositories/IUserContentInteractionRepository';
import { MongoUserRepository } from '@/infrastructure/repositories/MongoUserRepository';
import { CatalogService } from '../services/CatalogService';
import {
  CatalogContentType,
  CatalogItemDTO,
  CATALOG_PLATFORM_REGISTRY,
} from '../dto/CatalogDTO';
import { UserProfileModel } from '@/infrastructure/database/models/UserProfile.model';
import {
  AssistantHistoryPayload,
  AssistantMemoryService,
} from '../services/AssistantMemoryService';
import { ICacheRepository } from '@/domain/repositories/ICacheRepository';
import * as crypto from 'crypto';

export interface ChatbotRecommendRequest {
  userId: string;
  messages: ChatbotMessage[];
  conversationId?: string;
}

interface ChatQueryIntent {
  mode: 'tv_now' | 'tv_tonight' | 'streaming' | 'general';
  requestedTypes: Array<'movie' | 'series' | 'program'>;
  explicitGenres: string[];
  explicitPlatforms: string[];
  wantsFamily: boolean;
  wantsShort: boolean;
  negativeSignals: string[];
}

const KNOWN_GENRES = [
  'Cine',
  'Series',
  'Acción',
  'Drama',
  'Comedia',
  'Terror',
  'Ciencia ficción',
  'Documental',
  'Deportes',
  'Infantil',
  'Suspense',
  'Romance',
  'Noticias',
  'Cultura',
];

const NATIONAL_CHANNEL_PRIORITY = [
  'la 1',
  'la1',
  'la 2',
  'la2',
  'antena 3',
  'telecinco',
  'cuatro',
  'la sexta',
  'lasexta',
  'mega',
  'neox',
  'nova',
  'atreseries',
  'fdf',
  'divinity',
  'energy',
  'be mad',
  'bemad',
  'dmax',
  'paramount network',
  'trece',
  'dkiss',
  'clan',
  'boing',
];

const PAY_CHANNEL_PATTERNS = [
  'axn',
  'amc',
  'calle 13',
  'canal hollywood',
  'comedy central',
  'cosmo',
  'dark',
  'fox',
  'star channel',
  'syfy',
  'sundancetv',
  'tcm',
  'tnt',
  'warner tv',
  'xtrm',
  'de pelicula',
  'movistar',
];

const AUTONOMIC_CHANNEL_PATTERNS = [
  'andalucia',
  'andalucía',
  'aragon',
  'aragón',
  'aragón tv',
  'apunt',
  'à punt',
  'canal extremadura',
  'castilla',
  'cmm',
  'cyl',
  'etb',
  'ib3',
  'la 7',
  'navarra',
  'rtpa',
  'sur',
  'telemadrid',
  'tv3',
  'tvg',
  '7rm',
];

const FAST_CHANNEL_PATTERNS = [
  'rakuten',
  'pluto',
  'plex',
  'runtime',
  'samsung tv plus',
  'rlaxx',
  'tivify',
  'youtube',
];

const AUTONOMOUS_COMMUNITIES: Array<{
  canonical: string;
  aliases: string[];
  channelPatterns: string[];
}> = [
  {
    canonical: 'Andalucía',
    aliases: ['andalucia', 'andalucía'],
    channelPatterns: ['andalucia', 'andalucía', 'canal sur', 'sur'],
  },
  {
    canonical: 'Aragón',
    aliases: ['aragon', 'aragón'],
    channelPatterns: ['aragon', 'aragón'],
  },
  {
    canonical: 'Asturias',
    aliases: ['asturias', 'principado de asturias'],
    channelPatterns: ['rtpa', 'tpa'],
  },
  {
    canonical: 'Baleares',
    aliases: ['baleares', 'illes balears', 'islas baleares'],
    channelPatterns: ['ib3'],
  },
  {
    canonical: 'Canarias',
    aliases: ['canarias', 'islas canarias'],
    channelPatterns: ['tv canaria', 'canaria'],
  },
  {
    canonical: 'Castilla-La Mancha',
    aliases: ['castilla la mancha', 'castilla-la-mancha'],
    channelPatterns: ['cmm', 'castilla la mancha'],
  },
  {
    canonical: 'Castilla y León',
    aliases: ['castilla y leon', 'castilla y león'],
    channelPatterns: ['cyl', 'castilla y leon', 'castilla y león'],
  },
  {
    canonical: 'Cataluña',
    aliases: ['cataluna', 'cataluña', 'catalunya'],
    channelPatterns: ['tv3', '324', 'catalunya'],
  },
  {
    canonical: 'Comunidad Valenciana',
    aliases: ['comunidad valenciana', 'valencia', 'pais valenciano', 'país valenciano'],
    channelPatterns: ['apunt', 'à punt', 'punt'],
  },
  {
    canonical: 'Extremadura',
    aliases: ['extremadura'],
    channelPatterns: ['canal extremadura', 'extremadura'],
  },
  {
    canonical: 'Galicia',
    aliases: ['galicia'],
    channelPatterns: ['tvg', 'galicia'],
  },
  {
    canonical: 'Madrid',
    aliases: ['madrid', 'comunidad de madrid'],
    channelPatterns: ['telemadrid', 'la otra', 'madrid'],
  },
  {
    canonical: 'Murcia',
    aliases: ['murcia', 'region de murcia', 'región de murcia'],
    channelPatterns: ['7rm', 'murcia'],
  },
  {
    canonical: 'Navarra',
    aliases: ['navarra'],
    channelPatterns: ['navarra'],
  },
  {
    canonical: 'País Vasco',
    aliases: ['pais vasco', 'país vasco', 'euskadi'],
    channelPatterns: ['etb', 'euskadi'],
  },
];

interface RankedScheduleItem {
  item: CatalogItemDTO;
  displayTitle: string;
  dedupeKey: string;
  groupRank: number;
  contentTypeRank: number;
  channelRank: number;
  liveRank: number;
  startRank: number;
  ratingRank: number;
  historyBoost: number;   // lower = better, -1 for genre match, 0 default
  negativePenalty: number; // 0 default, 1 penalty
  timeBoost: number;       // lower = better, 0 primetime, 1 default
}

interface RankingContext {
  likedGenres?: string[];
  negativeSignals?: string[];
  recentTitles?: string[];
}

interface CommunityPreferenceReply {
  kind: 'none' | 'confirm' | 'decline' | 'set' | 'change';
  community?: string;
  shouldPersist: boolean;
}

export type StreamableChatResponse = {
  kind: 'direct';
  response: ChatbotResponse;
} | {
  kind: 'stream';
  textStream: AsyncGenerator<string>;
  finalize: (fullText: string) => Promise<ChatbotResponse>;
};

export class ChatbotRecommend {
  constructor(
    private readonly aiService: AIRecommendationService,
    private readonly interactionRepository: IUserContentInteractionRepository,
    private readonly userRepository: MongoUserRepository,
    private readonly catalogService: CatalogService,
    private readonly assistantMemoryService: AssistantMemoryService,
    private readonly cacheRepository?: ICacheRepository
  ) {}

  async execute(
    request: ChatbotRecommendRequest
  ): Promise<ChatbotResponse> {
    const latestUserMessage = this.getLatestUserMessage(request.messages);

    // --- Response cache: check before heavy processing ---
    if (this.cacheRepository && latestUserMessage) {
      const intent = this.analyzeIntent(latestUserMessage);
      const cacheKey = this.buildCacheKey(request.userId, latestUserMessage, intent.mode);
      try {
        const cached = await this.cacheRepository.get<string>(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as ChatbotResponse;
          return parsed;
        }
      } catch { /* cache miss or parse error – continue normally */ }
    }

    const [history, user, profile, genreProfile, recentInteractions] =
      await Promise.all([
        this.assistantMemoryService.getHistory(
          request.userId,
          request.conversationId
        ),
        this.userRepository.findById(request.userId),
        UserProfileModel.findOne({ userId: request.userId }).lean().exec(),
        this.interactionRepository.getUserGenreProfile(request.userId),
        this.interactionRepository.findByUser(request.userId, {
          status: 'seen',
          limit: 20,
        }),
      ]);

    const communityReply = this.extractCommunityReply(
      latestUserMessage,
      history.memory?.preferredAutonomousCommunity
    );
    if (communityReply.shouldPersist) {
      await this.assistantMemoryService.saveCommunityPreference({
        userId: request.userId,
        preferredAutonomousCommunity:
          communityReply.kind === 'set'
            ? communityReply.community
            : history.memory?.preferredAutonomousCommunity,
        autonomicOptIn:
          communityReply.kind === 'decline'
            ? false
            : communityReply.kind === 'confirm' || communityReply.kind === 'set'
              ? true
              : undefined,
      });
      if (communityReply.kind === 'set' && history.memory) {
        history.memory.preferredAutonomousCommunity = communityReply.community;
        history.memory.autonomicOptIn = true;
      } else if (communityReply.kind === 'confirm' && history.memory) {
        history.memory.autonomicOptIn = true;
      } else if (communityReply.kind === 'decline' && history.memory) {
        history.memory.autonomicOptIn = false;
      }
    }

    const intent = this.analyzeIntent(latestUserMessage);
    const effectiveCommunity =
      communityReply.kind === 'set'
        ? communityReply.community
        : history.memory?.preferredAutonomousCommunity;
    const liveTypes = this.resolveLiveTypes(intent);
    const [
      liveCatalog,
      tonightEarlyCatalog,
      tonightLateCatalog,
      streamingCatalog,
    ] = await Promise.all([
      this.catalogService.query({
        userId: request.userId,
        availability: ['live'],
        types: liveTypes,
        sort: 'airtime',
        limit: 500,
        page: 1,
      }),
      this.catalogService.query({
        userId: request.userId,
        availability: ['live'],
        types: liveTypes,
        sort: 'airtime',
        timeSlot: '6',
        limit: 240,
        page: 1,
      }),
      this.catalogService.query({
        userId: request.userId,
        availability: ['live'],
        types: liveTypes,
        sort: 'airtime',
        timeSlot: '7',
        limit: 240,
        page: 1,
      }),
      this.catalogService.query({
        userId: request.userId,
        availability: ['streaming'],
        types: this.resolveStreamingTypes(intent),
        genres: intent.explicitGenres.length ? intent.explicitGenres : undefined,
        platforms: intent.explicitPlatforms.length
          ? intent.explicitPlatforms
          : undefined,
        sort: 'popular',
        limit: 36,
        page: 1,
      }),
    ]);

    const liveNowItems = this.filterCatalogItems(
      this.dedupeCatalogItems(liveCatalog.items.filter((item) => item.liveNow)),
      intent
    );
    const tonightSourceItems = this.dedupeCatalogItems([
      ...tonightEarlyCatalog.items,
      ...tonightLateCatalog.items,
    ]);
    const tonightItems = this.filterCatalogItems(
      this.extractTonightItems(tonightSourceItems),
      intent
    );
    const streamingMatches = this.filterCatalogItems(
      streamingCatalog.items,
      intent
    );

    const directResponse = this.buildDirectScheduleResponse(
      intent,
      liveNowItems,
      tonightItems,
      streamingMatches,
      latestUserMessage,
      {
        history,
        effectiveCommunity,
        communityReply,
        rankingCtx: {
          likedGenres: this.mergeUnique(profile?.favoriteGenres || [], history.memory?.likedGenres || []),
          negativeSignals: this.mergeUnique(history.memory?.negativeSignals || [], history.memory?.dislikedGenres || []),
          recentTitles: recentInteractions.map((i: any) => i.title || '').filter(Boolean),
        },
      }
    );
    if (directResponse && latestUserMessage) {
      const normalizedDirectResponse = this.finalizeResponse(
        directResponse,
        latestUserMessage
      );
      const persisted = await this.assistantMemoryService.saveChatTurn({
        userId: request.userId,
        conversationId: request.conversationId || history.conversationId || undefined,
        userMessage: latestUserMessage,
        assistantResponse: normalizedDirectResponse,
      });

      return {
        ...normalizedDirectResponse,
        conversationId: persisted.conversationId,
        assistantMemorySnapshot: persisted.memory,
      };
    }

    const context = this.buildContext({
      userId: request.userId,
      history,
      intent,
      userName: user?.name || profile?.username || 'usuario',
      favoriteGenres: this.mergeUnique(
        profile?.favoriteGenres || [],
        history.memory?.likedGenres || []
      ),
      dislikedGenres: this.mergeUnique(
        history.memory?.dislikedGenres || []
      ),
      preferredPlatforms: this.mergeUnique(
        genreProfile.preferredPlatforms || [],
        profile?.preferredPlatforms || [],
        history.memory?.preferredPlatforms || []
      ),
      recentInteractions,
      liveNowItems,
      tonightItems,
      streamingMatches,
      avgRating: genreProfile.avgRating,
      effectiveCommunity,
    });

    const baseResponse = await this.aiService.chat(request.messages, context);
    const [resolvedRecommendations, resolvedMoreRecommendations] = await Promise.all([
      this.resolveRecommendations(baseResponse.recommendations || []),
      this.resolveRecommendations(baseResponse.moreRecommendations || []),
    ]);

    const finalResponse: ChatbotResponse = {
      ...baseResponse,
      recommendations: resolvedRecommendations,
      moreRecommendations: resolvedMoreRecommendations,
    };

    if (!latestUserMessage) {
      return {
        ...finalResponse,
        assistantMemorySnapshot: history.memory || undefined,
      };
    }

    const normalizedFinalResponse = this.finalizeResponse(
      finalResponse,
      latestUserMessage
    );
    const persisted = await this.assistantMemoryService.saveChatTurn({
      userId: request.userId,
      conversationId: request.conversationId || history.conversationId || undefined,
      userMessage: latestUserMessage,
      assistantResponse: normalizedFinalResponse,
    });

    const result = {
      ...normalizedFinalResponse,
      conversationId: persisted.conversationId,
      assistantMemorySnapshot: persisted.memory,
    };

    // --- Store in cache ---
    if (this.cacheRepository && latestUserMessage) {
      const cacheKey = this.buildCacheKey(request.userId, latestUserMessage, intent.mode);
      const ttl = this.getCacheTtl(intent.mode);
      this.cacheRepository.set(cacheKey, JSON.stringify(result), ttl).catch(() => {});
    }

    return result;
  }

  async executeStream(
    request: ChatbotRecommendRequest
  ): Promise<StreamableChatResponse> {
    const latestUserMessage = this.getLatestUserMessage(request.messages);
    const [history, user, profile, genreProfile, recentInteractions] =
      await Promise.all([
        this.assistantMemoryService.getHistory(request.userId, request.conversationId),
        this.userRepository.findById(request.userId),
        UserProfileModel.findOne({ userId: request.userId }).lean().exec(),
        this.interactionRepository.getUserGenreProfile(request.userId),
        this.interactionRepository.findByUser(request.userId, { status: 'seen', limit: 20 }),
      ]);

    const communityReply = this.extractCommunityReply(
      latestUserMessage,
      history.memory?.preferredAutonomousCommunity
    );
    if (communityReply.shouldPersist) {
      await this.assistantMemoryService.saveCommunityPreference({
        userId: request.userId,
        preferredAutonomousCommunity:
          communityReply.kind === 'set'
            ? communityReply.community
            : history.memory?.preferredAutonomousCommunity,
        autonomicOptIn:
          communityReply.kind === 'decline'
            ? false
            : communityReply.kind === 'confirm' || communityReply.kind === 'set' ? true : undefined,
      });
      if (communityReply.kind === 'set' && history.memory) {
        history.memory.preferredAutonomousCommunity = communityReply.community;
        history.memory.autonomicOptIn = true;
      } else if (communityReply.kind === 'confirm' && history.memory) {
        history.memory.autonomicOptIn = true;
      } else if (communityReply.kind === 'decline' && history.memory) {
        history.memory.autonomicOptIn = false;
      }
    }

    const intent = this.analyzeIntent(latestUserMessage);
    const effectiveCommunity =
      communityReply.kind === 'set'
        ? communityReply.community
        : history.memory?.preferredAutonomousCommunity;
    const liveTypes = this.resolveLiveTypes(intent);
    const [liveCatalog, tonightEarlyCatalog, tonightLateCatalog, streamingCatalog] =
      await Promise.all([
        this.catalogService.query({ userId: request.userId, availability: ['live'], types: liveTypes, sort: 'airtime', limit: 500, page: 1 }),
        this.catalogService.query({ userId: request.userId, availability: ['live'], types: liveTypes, sort: 'airtime', timeSlot: '6', limit: 240, page: 1 }),
        this.catalogService.query({ userId: request.userId, availability: ['live'], types: liveTypes, sort: 'airtime', timeSlot: '7', limit: 240, page: 1 }),
        this.catalogService.query({ userId: request.userId, availability: ['streaming'], types: this.resolveStreamingTypes(intent), genres: intent.explicitGenres.length ? intent.explicitGenres : undefined, platforms: intent.explicitPlatforms.length ? intent.explicitPlatforms : undefined, sort: 'popular', limit: 36, page: 1 }),
      ]);

    const liveNowItems = this.filterCatalogItems(this.dedupeCatalogItems(liveCatalog.items.filter((item) => item.liveNow)), intent);
    const tonightSourceItems = this.dedupeCatalogItems([...tonightEarlyCatalog.items, ...tonightLateCatalog.items]);
    const tonightItems = this.filterCatalogItems(this.extractTonightItems(tonightSourceItems), intent);
    const streamingMatches = this.filterCatalogItems(streamingCatalog.items, intent);

    // Direct schedule responses return immediately (no streaming needed)
    const directResponse = this.buildDirectScheduleResponse(intent, liveNowItems, tonightItems, streamingMatches, latestUserMessage, { history, effectiveCommunity, communityReply, rankingCtx: {
      likedGenres: this.mergeUnique(profile?.favoriteGenres || [], history.memory?.likedGenres || []),
      negativeSignals: this.mergeUnique(history.memory?.negativeSignals || [], history.memory?.dislikedGenres || []),
      recentTitles: recentInteractions.map((i: any) => i.title || '').filter(Boolean),
    } });
    if (directResponse && latestUserMessage) {
      const normalizedDirectResponse = this.finalizeResponse(directResponse, latestUserMessage);
      const persisted = await this.assistantMemoryService.saveChatTurn({
        userId: request.userId,
        conversationId: request.conversationId || history.conversationId || undefined,
        userMessage: latestUserMessage,
        assistantResponse: normalizedDirectResponse,
      });
      return {
        kind: 'direct',
        response: { ...normalizedDirectResponse, conversationId: persisted.conversationId, assistantMemorySnapshot: persisted.memory },
      };
    }

    // Build AI context and stream text from provider
    const context = this.buildContext({
      userId: request.userId,
      history,
      intent,
      userName: user?.name || profile?.username || 'usuario',
      favoriteGenres: this.mergeUnique(profile?.favoriteGenres || [], history.memory?.likedGenres || []),
      dislikedGenres: this.mergeUnique(history.memory?.dislikedGenres || []),
      preferredPlatforms: this.mergeUnique(genreProfile.preferredPlatforms || [], profile?.preferredPlatforms || [], history.memory?.preferredPlatforms || []),
      recentInteractions,
      liveNowItems,
      tonightItems,
      streamingMatches,
      avgRating: genreProfile.avgRating,
      effectiveCommunity,
    });

    const textStream = this.aiService.chatStream(request.messages, context);

    const finalize = async (fullText: string): Promise<ChatbotResponse> => {
      const baseResponse = this.aiService.parseStreamedResponse(fullText);
      const [resolvedRecommendations, resolvedMoreRecommendations] = await Promise.all([
        this.resolveRecommendations(baseResponse.recommendations || []),
        this.resolveRecommendations(baseResponse.moreRecommendations || []),
      ]);

      const finalResponse: ChatbotResponse = {
        ...baseResponse,
        recommendations: resolvedRecommendations,
        moreRecommendations: resolvedMoreRecommendations,
      };

      if (!latestUserMessage) {
        return { ...finalResponse, assistantMemorySnapshot: history.memory || undefined };
      }

      const normalizedFinalResponse = this.finalizeResponse(finalResponse, latestUserMessage);
      const persisted = await this.assistantMemoryService.saveChatTurn({
        userId: request.userId,
        conversationId: request.conversationId || history.conversationId || undefined,
        userMessage: latestUserMessage,
        assistantResponse: normalizedFinalResponse,
      });

      return {
        ...normalizedFinalResponse,
        conversationId: persisted.conversationId,
        assistantMemorySnapshot: persisted.memory,
      };
    };

    return { kind: 'stream', textStream, finalize };
  }

  // --- Cache helpers ---

  buildCacheKey(userId: string, message: string, mode: string): string {
    const normalized = message.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
    const hash = crypto.createHash('sha256').update(`${normalized}:${mode}`).digest('hex').slice(0, 16);
    return `ai:response:${userId}:${hash}`;
  }

  getCacheTtl(mode: string): number {
    switch (mode) {
      case 'tv_now': return 180;
      case 'tv_tonight': return 300;
      case 'streaming': return 600;
      default: return 300;
    }
  }

  buildProactiveCacheKey(community: string, mode: string): string {
    const now = new Date();
    const window = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0')}`;
    return `ai:proactive:${community || 'default'}:${mode}:${window}`;
  }

  private buildContext(input: {
    userId: string;
    history: AssistantHistoryPayload;
    intent: ChatQueryIntent;
    userName: string;
    favoriteGenres: string[];
    dislikedGenres: string[];
    preferredPlatforms: string[];
    recentInteractions: Array<{
      contentTitle: string;
      platform?: string;
      rating?: number;
      contentType: string;
    }>;
    liveNowItems: CatalogItemDTO[];
    tonightItems: CatalogItemDTO[];
    streamingMatches: CatalogItemDTO[];
    avgRating: number;
    effectiveCommunity?: string;
  }): ChatbotContext {
    return {
      userId: input.userId,
      userProfile: {
        name: input.userName,
        favoriteGenres: input.favoriteGenres,
        dislikedGenres: input.dislikedGenres,
        topRatedContent: input.recentInteractions
          .filter((interaction) => interaction.rating && interaction.rating >= 7)
          .map((interaction) => ({
            title: interaction.contentTitle,
            rating: interaction.rating || 0,
            type: interaction.contentType,
          }))
          .slice(0, 10),
        recentlyWatched: input.recentInteractions.slice(0, 10).map((interaction) => ({
          title: interaction.contentTitle,
          platform: interaction.platform,
        })),
        preferredPlatforms: input.preferredPlatforms,
        avgRating: input.avgRating,
      },
      assistantMemory: {
        likedGenres: input.history.memory?.likedGenres || [],
        dislikedGenres: input.history.memory?.dislikedGenres || [],
        preferredPlatforms: input.history.memory?.preferredPlatforms || [],
        avoidedPlatforms: input.history.memory?.avoidedPlatforms || [],
        preferredDurations: input.history.memory?.preferredDurations || [],
        preferredViewingContexts:
          input.history.memory?.preferredViewingContexts || [],
        favoriteFranchisesOrTitles:
          input.history.memory?.favoriteFranchisesOrTitles || [],
        recentTopics: input.history.memory?.recentTopics || [],
        negativeSignals: input.history.memory?.negativeSignals || [],
        preferredAutonomousCommunity:
          input.effectiveCommunity ||
          input.history.memory?.preferredAutonomousCommunity,
        autonomicOptIn: input.history.memory?.autonomicOptIn || 'unknown',
        lastCommunityConfirmationAt:
          input.history.memory?.lastCommunityConfirmationAt,
      },
      conversationHistory: input.history.messages
        .slice(-12)
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
      queryIntent: input.intent,
      liveNow: input.liveNowItems.slice(0, 10).map((item) => ({
        title: item.title,
        type: item.contentType,
        channel: item.channel?.name || '',
        platform: item.primaryPlatforms[0],
        time: item.start ? this.formatTime(item.start) : '',
        genre: item.genres[0] || '',
        tmdbRating: item.rating,
      })),
      tonight: input.tonightItems.slice(0, 10).map((item) => ({
        title: item.title,
        type: item.contentType,
        channel: item.channel?.name || '',
        platform: item.primaryPlatforms[0],
        time: item.start ? this.formatTime(item.start) : '',
        genre: item.genres[0] || '',
        tmdbRating: item.rating,
      })),
      streamingMatches: input.streamingMatches.slice(0, 12).map((item) => ({
        title: item.title,
        type: item.contentType,
        channel: item.channel?.name,
        platform: item.primaryPlatforms[0],
        time: item.start ? this.formatTime(item.start) : undefined,
        genre: item.genres[0] || '',
        tmdbRating: item.rating,
      })),
    };
  }

  private buildDirectScheduleResponse(
    intent: ChatQueryIntent,
    liveNowItems: CatalogItemDTO[],
    tonightItems: CatalogItemDTO[],
    streamingMatches: CatalogItemDTO[],
    latestUserMessage: string,
    context: {
      history: AssistantHistoryPayload;
      effectiveCommunity?: string;
      communityReply: CommunityPreferenceReply;
      rankingCtx?: RankingContext;
    }
  ): ChatbotResponse | null {
    const previousTvContext = this.getLastAutonomicPromptContext(
      context.history.messages
    );
    if (
      previousTvContext &&
      (context.communityReply.kind === 'confirm' ||
        context.communityReply.kind === 'set' ||
        context.communityReply.kind === 'decline')
    ) {
      return this.buildAutonomicFollowUpResponse(
        previousTvContext,
        liveNowItems,
        tonightItems,
        latestUserMessage,
        context.effectiveCommunity,
        context.communityReply.kind
      );
    }

    const requestedLabel = this.buildRequestedLabel(intent.requestedTypes);
    if (!this.isDirectScheduleIntent(intent)) {
      return null;
    }

    const rankedLiveNowItems = this.rankScheduleItems(liveNowItems, 'tv_now', context.rankingCtx);
    const rankedTonightItems = this.rankScheduleItems(tonightItems, 'tv_tonight', context.rankingCtx);
    const uniqueStreamingMatches = this.dedupeCatalogItems(streamingMatches);

    const rankedPrimaryLiveNowItems = rankedLiveNowItems.filter(
      (item) => item.groupRank <= 2
    );
    const rankedPrimaryTonightItems = rankedTonightItems.filter(
      (item) => item.groupRank <= 2
    );
    const rankedAutonomicLiveNowItems = this.filterAutonomicMatches(
      rankedLiveNowItems,
      context.effectiveCommunity
    );
    const rankedAutonomicTonightItems = this.filterAutonomicMatches(
      rankedTonightItems,
      context.effectiveCommunity
    );

    const rankedPrimaryItems =
      intent.mode === 'tv_now'
        ? rankedPrimaryLiveNowItems
        : rankedPrimaryTonightItems;
    const rankedAutonomicItems =
      intent.mode === 'tv_now'
        ? rankedAutonomicLiveNowItems
        : rankedAutonomicTonightItems;

    if (rankedPrimaryItems.length) {
      const picks = rankedPrimaryItems.slice(0, 3);
      const more = rankedPrimaryItems.slice(3, 12);
      const hasNationalMatches = rankedPrimaryItems.some(
        (item) => item.groupRank === 1
      );
      const textLead =
        intent.mode === 'tv_now'
          ? hasNationalMatches
            ? `Ahora mismo sí tienes ${requestedLabel} en emisión. Te dejo primero TDT y canales nacionales, y después pago si hace falta.`
            : `Ahora mismo no veo ${requestedLabel} en TDT o nacionales. Lo más relevante que sí tienes va por canales de pago.`
          : hasNationalMatches
            ? `Esta noche sí tienes ${requestedLabel} en TV. Te muestro primero TDT y canales nacionales, y después pago si hace falta.`
            : `Esta noche no veo ${requestedLabel} destacados en TDT o nacionales. Lo más útil ahora mismo está en canales de pago.`;

      return {
        text: this.appendAutonomicPrompt(
          textLead,
          rankedAutonomicItems.length > 0,
          context.effectiveCommunity
        ),
        recommendations: picks.map((item) =>
          this.mapRankedItemToRecommendation(
            item,
            item.item.liveNow
              ? `En emisión ahora en ${item.item.channel?.name || 'TV'}.`
              : `Empieza a las ${
                  item.item.start ? this.formatTime(item.item.start) : 'próximamente'
                } en ${item.item.channel?.name || 'TV'}.`
          )
        ),
        moreRecommendations: more.map((item) =>
          this.mapRankedItemToRecommendation(
            item,
            item.item.liveNow
              ? `En emisión ahora en ${item.item.channel?.name || 'TV'}.`
              : `Empieza a las ${
                  item.item.start ? this.formatTime(item.item.start) : 'próximamente'
                } en ${item.item.channel?.name || 'TV'}.`
          )
        ),
        followUpSuggestions: this.buildFollowUpSuggestions(intent, latestUserMessage),
        queryContext: this.buildQueryContext(
          intent.mode,
          intent.requestedTypes,
          rankedPrimaryItems.length,
          picks.length,
          more.length > 0,
          intent.mode === 'tv_now' ? 'Ahora' : 'Esta noche',
          {
            primaryMatches: rankedPrimaryItems.length,
            hasAutonomicMatches: rankedAutonomicItems.length > 0,
            autonomicPromptRequired: rankedAutonomicItems.length > 0,
            savedAutonomousCommunity: context.effectiveCommunity,
          }
        ),
      };
    }

    if (rankedAutonomicItems.length) {
      return {
        text: this.appendAutonomicPrompt(
          `No veo ${requestedLabel} en TDT o canales de pago para ${
            intent.mode === 'tv_now' ? 'ahora mismo' : 'esta noche'
          }.`,
          true,
          context.effectiveCommunity
        ),
        recommendations: [],
        moreRecommendations: [],
        followUpSuggestions: this.buildFallbackFollowUpSuggestions(
          intent,
          latestUserMessage
        ),
        queryContext: this.buildQueryContext(
          intent.mode,
          intent.requestedTypes,
          0,
          0,
          false,
          intent.mode === 'tv_now' ? 'Ahora' : 'Esta noche',
          {
            primaryMatches: 0,
            hasAutonomicMatches: true,
            autonomicPromptRequired: true,
            savedAutonomousCommunity: context.effectiveCommunity,
          }
        ),
      };
    }

    if (intent.mode === 'tv_now' && rankedPrimaryTonightItems.length) {
      const picks = rankedPrimaryTonightItems.slice(0, 3);
      const more = rankedPrimaryTonightItems.slice(3, 12);
      return {
        text: `Ahora mismo no veo ${requestedLabel} en emisión. Lo más útil que llega en TV durante esta noche es esto.`,
        recommendations: picks.map((item) =>
          this.mapRankedItemToRecommendation(
            item,
            item.item.liveNow
              ? `En emisión ahora en ${item.item.channel?.name || 'TV'}.`
              : `Empieza a las ${
                  item.item.start ? this.formatTime(item.item.start) : 'próximamente'
                } en ${item.item.channel?.name || 'TV'}.`
          )
        ),
        moreRecommendations: more.map((item) =>
          this.mapRankedItemToRecommendation(
            item,
            item.item.liveNow
              ? `En emisión ahora en ${item.item.channel?.name || 'TV'}.`
              : `Empieza a las ${
                  item.item.start ? this.formatTime(item.item.start) : 'próximamente'
                } en ${item.item.channel?.name || 'TV'}.`
          )
        ),
        followUpSuggestions: this.buildFallbackFollowUpSuggestions(
          intent,
          latestUserMessage
        ),
        queryContext: this.buildQueryContext(
          'tv_now',
          intent.requestedTypes,
          rankedPrimaryTonightItems.length,
          picks.length,
          more.length > 0,
          'Esta noche',
          {
            primaryMatches: rankedPrimaryTonightItems.length,
            hasAutonomicMatches: rankedAutonomicTonightItems.length > 0,
            autonomicPromptRequired: rankedAutonomicTonightItems.length > 0,
            savedAutonomousCommunity: context.effectiveCommunity,
          }
        ),
      };
    }

    if (uniqueStreamingMatches.length) {
      const picks = uniqueStreamingMatches.slice(0, 3);
      const more = uniqueStreamingMatches.slice(3, 12);
      return {
        text: `Ahora mismo no veo ${requestedLabel} en TV con esa búsqueda concreta. En streaming sí he encontrado alternativas útiles.`,
        recommendations: picks.map((item) =>
          this.mapCatalogItemToRecommendation(
            item,
            `Está disponible en ${item.primaryPlatforms[0] || 'streaming'} y encaja con lo que has pedido.`
          )
        ),
        moreRecommendations: more.map((item) =>
          this.mapCatalogItemToRecommendation(
            item,
            `Está disponible en ${item.primaryPlatforms[0] || 'streaming'} y encaja con lo que has pedido.`
          )
        ),
        followUpSuggestions: this.buildStreamingFallbackSuggestions(
          intent,
          latestUserMessage
        ),
        queryContext: this.buildQueryContext(
          'streaming',
          this.resolveStreamingTypes(intent) || [],
          uniqueStreamingMatches.length,
          picks.length,
          more.length > 0,
          'En streaming',
          {
            primaryMatches: uniqueStreamingMatches.length,
          }
        ),
      };
    }

    return {
      text: `Ahora mismo no veo ${requestedLabel} en la parrilla con esa búsqueda concreta. Si quieres, puedo mirar qué llega más tarde esta noche o proponerte alternativas reales en streaming.`,
      recommendations: [],
      moreRecommendations: [],
      followUpSuggestions: this.buildFallbackFollowUpSuggestions(
        intent,
        latestUserMessage
      ),
      queryContext: this.buildQueryContext(
        intent.mode,
        intent.requestedTypes,
        0,
        0,
        false,
        intent.mode === 'tv_now' ? 'Ahora' : 'Esta noche',
        {
          primaryMatches: 0,
        }
      ),
    };
  }

  private mapCatalogItemToRecommendation(
    item: CatalogItemDTO,
    reason: string
  ): ChatbotRecommendationPayload {
    return {
      catalogId: item.catalogId,
      detailPath: item.detailPath,
      source: item.source,
      title: this.cleanDisplayTitle(item.title, item.contentType),
      subtitle:
        item.genres.length > 1 ? item.genres.slice(0, 2).join(' · ') : item.genres[0],
      type: item.contentType,
      platform: item.primaryPlatforms[0],
      channel: item.channel?.name,
      time: item.start ? this.formatTime(item.start) : undefined,
      channelOrPlatform: item.channel?.name || item.primaryPlatforms[0],
      startTime: item.start ? this.formatTime(item.start) : undefined,
      endTime: item.end ? this.formatTime(item.end) : undefined,
      liveNow: Boolean(item.liveNow),
      reason,
      tmdbId: item.tmdbId,
      image: item.image,
      actions: {
        canOpenDetail: true,
        canSave: true,
        canTrack: true,
      },
      badges: this.buildRecommendationBadges(item),
      rating: item.rating,
      durationMinutes: item.durationMinutes,
      synopsis: item.synopsis ? item.synopsis.slice(0, 200) : undefined,
      platformLogo: this.resolvePlatformLogo(item.primaryPlatforms[0]),
    };
  }

  private resolvePlatformLogo(platformKey?: string): string | undefined {
    if (!platformKey) return undefined;
    const platform = CATALOG_PLATFORM_REGISTRY.find(
      (p) => p.key === platformKey
    );
    return platform?.logoUrl;
  }

  private mapRankedItemToRecommendation(
    rankedItem: RankedScheduleItem,
    reason: string
  ): ChatbotRecommendationPayload {
    return {
      ...this.mapCatalogItemToRecommendation(rankedItem.item, reason),
      title: rankedItem.displayTitle,
    };
  }

  private filterCatalogItems(
    items: CatalogItemDTO[],
    intent: ChatQueryIntent
  ): CatalogItemDTO[] {
    return items
      .filter((item) => {
        if (intent.requestedTypes.length && !intent.requestedTypes.includes(item.contentType)) {
          return false;
        }

        if (
          intent.explicitGenres.length &&
          !intent.explicitGenres.some((genre) =>
            item.genres.some(
              (itemGenre) => this.normalize(itemGenre) === this.normalize(genre)
            )
          )
        ) {
          return false;
        }

        if (
          intent.explicitPlatforms.length &&
          !intent.explicitPlatforms.some((platform) =>
            item.primaryPlatforms.some(
              (itemPlatform) =>
                this.normalize(itemPlatform) === this.normalize(platform)
            )
          )
        ) {
          return false;
        }

        if (
          intent.negativeSignals.some((signal) => signal.includes('deportes')) &&
          item.genres.some((genre) => this.normalize(genre).includes('deportes'))
        ) {
          return false;
        }

        if (
          intent.wantsFamily &&
          !item.genres.some((genre) =>
            ['familia', 'infantil', 'comedia', 'animacion'].includes(
              this.normalize(genre)
            )
          )
        ) {
          return false;
        }

        if (
          intent.wantsShort &&
          item.durationMinutes &&
          item.durationMinutes > 120 &&
          item.contentType !== 'series'
        ) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        const livePriority = Number(Boolean(right.liveNow)) - Number(Boolean(left.liveNow));
        if (livePriority !== 0) {
          return livePriority;
        }

        return (right.rating || 0) - (left.rating || 0);
      });
  }

  private extractTonightItems(items: CatalogItemDTO[]): CatalogItemDTO[] {
    const now = new Date();
    const tonightStart = this.buildTonightWindowStart(now);
    const tonightEnd = this.buildTonightWindowEnd(now);
    const isBeforeTonightWindow = now.getTime() < tonightStart.getTime();
    const activeWindowStart = isBeforeTonightWindow ? tonightStart : now;

    return items.filter((item) => {
      if (!item.start) {
        return false;
      }

      const startDate = new Date(item.start);
      if (Number.isNaN(startDate.getTime())) {
        return false;
      }

      const endDate = item.end ? new Date(item.end) : null;
      if (endDate && Number.isNaN(endDate.getTime())) {
        return false;
      }

      if (isBeforeTonightWindow) {
        return (
          startDate.getTime() >= tonightStart.getTime() &&
          startDate.getTime() <= tonightEnd.getTime()
        );
      }

      const intervalEnd = endDate || startDate;
      return (
        startDate.getTime() <= tonightEnd.getTime() &&
        intervalEnd.getTime() >= activeWindowStart.getTime()
      );
    });
  }

  private analyzeIntent(message: string): ChatQueryIntent {
    const normalized = this.normalize(message);
    const explicitPlatforms = CATALOG_PLATFORM_REGISTRY
      .map((platform) => platform.name)
      .filter((platform) => normalized.includes(this.normalize(platform)));
    const explicitGenres = KNOWN_GENRES.filter((genre) =>
      normalized.includes(this.normalize(genre))
    );

    const wantsTv =
      /television|televisión|tv|parrilla|canal|canales|emision|emisión|directo/.test(
        normalized
      );
    const wantsNow =
      /ahora mismo|ahora|en este momento|actualmente|ya\b/.test(normalized);
    const wantsTonight =
      /esta noche|hoy por la noche|mas tarde|más tarde|noche/.test(normalized);
    const wantsStreaming =
      explicitPlatforms.length > 0 ||
      /streaming|netflix|prime|disney|movistar|max|filmin|apple tv|rakuten/.test(
        normalized
      );

    const requestedTypes: Array<'movie' | 'series' | 'program'> = [];
    if (/pelicula|peliculas|cine/.test(normalized)) {
      requestedTypes.push('movie');
    }
    if (/serie|series|miniserie/.test(normalized)) {
      requestedTypes.push('series');
    }
    if (!requestedTypes.length && /programa|programas/.test(normalized)) {
      requestedTypes.push('program');
    }

    const negativeSignals = [
      /sin deportes|no deportes/.test(normalized) ? 'sin deportes' : '',
      /sin terror|no terror/.test(normalized) ? 'sin terror' : '',
      /sin noticias|no noticias/.test(normalized) ? 'sin noticias' : '',
    ].filter(Boolean);

    let mode: ChatQueryIntent['mode'] = 'general';
    if ((wantsTv && wantsNow) || /en parrilla ahora/.test(normalized) || (wantsNow && !wantsStreaming)) {
      mode = 'tv_now';
    } else if ((wantsTv && wantsTonight) || (wantsTonight && !wantsStreaming)) {
      mode = 'tv_tonight';
    } else if (wantsStreaming) {
      mode = 'streaming';
    }

    return {
      mode,
      requestedTypes,
      explicitGenres,
      explicitPlatforms,
      wantsFamily: /familia|familiar|con ninos|con niños/.test(normalized),
      wantsShort: /corta|corto|menos de|rapida|rápida/.test(normalized),
      negativeSignals,
    };
  }

  private resolveLiveTypes(
    intent: ChatQueryIntent
  ): CatalogContentType[] | undefined {
    if (!intent.requestedTypes.length) {
      return ['movie', 'series', 'program'];
    }

    return Array.from(new Set(intent.requestedTypes));
  }

  private resolveStreamingTypes(
    intent: ChatQueryIntent
  ): CatalogContentType[] | undefined {
    const streamingTypes = intent.requestedTypes.filter(
      (type) => type === 'movie' || type === 'series'
    );
    return streamingTypes.length ? streamingTypes : ['movie', 'series'];
  }

  private isDirectScheduleIntent(intent: ChatQueryIntent): boolean {
    return intent.mode === 'tv_now' || intent.mode === 'tv_tonight';
  }

  private buildRequestedLabel(
    types: Array<'movie' | 'series' | 'program'>
  ): string {
    if (types.includes('movie') && types.includes('series')) {
      return 'películas y series';
    }
    if (types.includes('movie') && !types.includes('series')) {
      return 'películas';
    }
    if (types.includes('series') && !types.includes('movie')) {
      return 'series';
    }
    return 'contenido relevante';
  }

  private getLatestUserMessage(messages: ChatbotMessage[]): string {
    const latest = [...messages]
      .reverse()
      .find((message) => message.role === 'user');
    return String(latest?.content || '').trim();
  }

  private formatTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private normalize(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private mergeUnique(...groups: string[][]): string[] {
    const merged = new Map<string, string>();
    groups.flat().forEach((entry) => {
      const safe = String(entry || '').trim();
      if (!safe) {
        return;
      }
      merged.set(this.normalize(safe), safe);
    });
    return Array.from(merged.values());
  }

  private dedupeCatalogItems(items: CatalogItemDTO[]): CatalogItemDTO[] {
    const deduped = new Map<string, CatalogItemDTO>();

    items.forEach((item) => {
      const key = `${this.normalize(item.title)}::${this.normalize(
        item.channel?.name || item.primaryPlatforms[0] || item.catalogId
      )}`;
      if (!deduped.has(key)) {
        deduped.set(key, item);
      }
    });

    return Array.from(deduped.values());
  }

  private async resolveRecommendations(
    recommendations: ChatbotRecommendationPayload[]
  ): Promise<ChatbotRecommendationPayload[]> {
    const resolved = await Promise.all(
      recommendations.map(async (recommendation) => {
        const match = await this.catalogService.resolveRecommendation({
          title: recommendation.title,
          type: recommendation.type,
          platform: recommendation.platform,
          channel: recommendation.channel,
        });

        return {
          ...recommendation,
          catalogId: recommendation.catalogId || match?.catalogId,
          detailPath: recommendation.detailPath || match?.detailPath,
          source: recommendation.source || match?.source,
          tmdbId: match?.tmdbId || recommendation.tmdbId,
          image: match?.image || recommendation.image,
          title: this.cleanDisplayTitle(recommendation.title, recommendation.type),
          platform:
            recommendation.platform ||
            match?.primaryPlatforms[0] ||
            recommendation.channel,
          channel: recommendation.channel || match?.channel?.name,
          time:
            recommendation.time ||
            (match?.start
              ? new Date(match.start).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : undefined),
        };
      })
    );

    return this.dedupeRecommendations(resolved);
  }

  private finalizeResponse(
    response: ChatbotResponse,
    latestUserMessage: string
  ): ChatbotResponse {
    const recommendations = this.dedupeRecommendations(response.recommendations || []);
    const moreRecommendations = this.dedupeRecommendations(
      (response.moreRecommendations || []).filter(
        (candidate) =>
          !recommendations.some((existing) =>
            this.buildRecommendationKey(existing) ===
            this.buildRecommendationKey(candidate)
          )
      )
    );

    const shownCount = recommendations.length;
    const totalMatches =
      response.queryContext?.totalMatches ||
      recommendations.length + moreRecommendations.length;
    const primaryMatches =
      typeof response.queryContext?.primaryMatches === 'number'
        ? response.queryContext.primaryMatches
        : recommendations.length;

    return {
      ...response,
      recommendations,
      moreRecommendations,
      followUpSuggestions: this.sanitizeFollowUpSuggestions(
        response.followUpSuggestions || [],
        latestUserMessage
      ),
      queryContext: response.queryContext
        ? {
            ...response.queryContext,
            totalMatches,
            primaryMatches,
            shownCount,
            hasMore: moreRecommendations.length > 0,
          }
        : undefined,
    };
  }

  private rankScheduleItems(
    items: CatalogItemDTO[],
    mode: 'tv_now' | 'tv_tonight',
    ctx?: RankingContext
  ): RankedScheduleItem[] {
    const likedSet = new Set((ctx?.likedGenres || []).map((g) => g.toLowerCase()));
    const negativeSet = new Set((ctx?.negativeSignals || []).map((s) => s.toLowerCase()));
    const recentSet = new Set((ctx?.recentTitles || []).map((t) => this.normalizeTitleKey(t)));

    return items
      .filter((item) => {
        if (mode === 'tv_now' && !item.liveNow) {
          return false;
        }

        if (mode === 'tv_tonight') {
          const isUpcomingTonight = Boolean(
            item.start && this.isTonightWindow(item.start, item.end)
          );
          if (!item.liveNow && !isUpcomingTonight) {
            return false;
          }
        }

        return true;
      })
      .map((item) => {
        const displayTitle = this.cleanDisplayTitle(item.title, item.contentType);
        const channelName = item.channel?.name || '';
        const itemGenres = (item.genres || []).map((g: string) => g.toLowerCase());

        // History boost: -1 if genres match user's liked genres
        const genreMatch = itemGenres.some((g: string) => likedSet.has(g));
        const historyBoost = genreMatch ? -1 : 0;

        // Negative penalty: 1 if title matches a negative signal or recently seen
        const titleKey = this.normalizeTitleKey(displayTitle);
        const isNegative = itemGenres.some((g: string) => negativeSet.has(g))
          || negativeSet.has(titleKey)
          || recentSet.has(titleKey);
        const negativePenalty = isNegative ? 1 : 0;

        // Time boost: primetime (20-23) gets 0, else 1
        const startHour = item.start ? new Date(item.start).getHours() : -1;
        const timeBoost = (startHour >= 20 && startHour < 23) ? 0 : 1;

        return {
          item,
          displayTitle,
          dedupeKey: this.buildScheduleDedupeKey(item, displayTitle),
          groupRank: this.getChannelGroupRank(item),
          contentTypeRank: this.getContentTypePriority(item.contentType),
          channelRank: this.getChannelPriority(channelName),
          liveRank: item.liveNow ? 0 : 1,
          startRank: item.start ? new Date(item.start).getTime() : Number.MAX_SAFE_INTEGER,
          ratingRank: -(item.rating || 0),
          historyBoost,
          negativePenalty,
          timeBoost,
        };
      })
      .sort((left, right) => {
        // Penalized items always go last
        if (left.negativePenalty !== right.negativePenalty) {
          return left.negativePenalty - right.negativePenalty;
        }
        if (left.groupRank !== right.groupRank) {
          return left.groupRank - right.groupRank;
        }
        if (left.liveRank !== right.liveRank) {
          return left.liveRank - right.liveRank;
        }
        // History boost next (genre-matched items rise)
        if (left.historyBoost !== right.historyBoost) {
          return left.historyBoost - right.historyBoost;
        }
        if (left.contentTypeRank !== right.contentTypeRank) {
          return left.contentTypeRank - right.contentTypeRank;
        }
        if (left.channelRank !== right.channelRank) {
          return left.channelRank - right.channelRank;
        }
        // Time-aware: primetime items first
        if (left.timeBoost !== right.timeBoost) {
          return left.timeBoost - right.timeBoost;
        }
        if (left.startRank !== right.startRank) {
          return left.startRank - right.startRank;
        }
        return left.ratingRank - right.ratingRank;
      })
      .filter((candidate, index, candidates) =>
        index === candidates.findIndex((entry) => entry.dedupeKey === candidate.dedupeKey)
      );
  }

  private buildScheduleDedupeKey(
    item: CatalogItemDTO,
    displayTitle: string
  ): string {
    if (item.contentType === 'series') {
      return this.normalizeTitleKey(this.extractSeriesBaseTitle(displayTitle));
    }

    return this.normalizeTitleKey(displayTitle);
  }

  private buildRecommendationKey(
    recommendation: ChatbotRecommendationPayload
  ): string {
    return [
      recommendation.type || '',
      this.normalizeTitleKey(recommendation.title) ||
        this.normalize(recommendation.catalogId || ''),
      this.normalize(
        recommendation.channelOrPlatform ||
          recommendation.channel ||
          recommendation.platform ||
          recommendation.detailPath ||
          ''
      ),
      this.normalize(
        recommendation.startTime || recommendation.time || recommendation.endTime || ''
      ),
    ]
      .filter(Boolean)
      .join('::');
  }

  private dedupeRecommendations(
    recommendations: ChatbotRecommendationPayload[]
  ): ChatbotRecommendationPayload[] {
    const deduped = new Map<string, ChatbotRecommendationPayload>();

    recommendations.forEach((recommendation) => {
      const normalized = {
        ...recommendation,
        title: this.cleanDisplayTitle(recommendation.title, recommendation.type),
      };
      const key = this.buildRecommendationKey(normalized);
      if (!deduped.has(key)) {
        deduped.set(key, normalized);
      }
    });

    return Array.from(deduped.values());
  }

  private buildAutonomicFollowUpResponse(
    previousContext: ChatbotQueryContext,
    liveNowItems: CatalogItemDTO[],
    tonightItems: CatalogItemDTO[],
    latestUserMessage: string,
    effectiveCommunity: string | undefined,
    replyKind: CommunityPreferenceReply['kind']
  ): ChatbotResponse | null {
    const followUpIntent: ChatQueryIntent = {
      mode: previousContext.mode,
      requestedTypes: previousContext.requestedTypes || [],
      explicitGenres: [],
      explicitPlatforms: [],
      wantsFamily: false,
      wantsShort: false,
      negativeSignals: [],
    };

    if (replyKind === 'decline') {
      return {
        text: 'Perfecto. Mantengo la recomendación centrada en TDT y canales de pago, sin incluir autonómicas.',
        recommendations: [],
        moreRecommendations: [],
        followUpSuggestions: this.sanitizeFollowUpSuggestions(
          [
            '¿Qué merece la pena ahora mismo?',
            '¿Qué películas hay esta noche en TV?',
            '¿Qué series hay esta noche?'
          ],
          latestUserMessage
        ),
        queryContext: this.buildQueryContext(
          previousContext.mode,
          previousContext.requestedTypes || [],
          0,
          0,
          false,
          previousContext.answerWindowLabel || 'TV',
          {
            primaryMatches: 0,
            hasAutonomicMatches: false,
            autonomicPromptRequired: false,
            savedAutonomousCommunity: effectiveCommunity,
          }
        ),
      };
    }

    const sourceItems =
      previousContext.mode === 'tv_now'
        ? this.rankScheduleItems(
            this.filterCatalogItems(liveNowItems, followUpIntent),
            'tv_now'
          )
        : this.rankScheduleItems(
            this.filterCatalogItems(tonightItems, followUpIntent),
            'tv_tonight'
          );
    const autonomicMatches = this.filterAutonomicMatches(
      sourceItems,
      effectiveCommunity
    );

    if (!autonomicMatches.length) {
      return {
        text: effectiveCommunity
          ? `No veo una opción clara en autonómicas de ${effectiveCommunity} para ${
              previousContext.mode === 'tv_now' ? 'ahora mismo' : 'esta noche'
            }. Si quieres, sigo buscando en TDT, pago o streaming.`
          : 'No he podido filtrar autonómicas sin una comunidad concreta. Si quieres, dime cuál es tu comunidad y vuelvo a mirar.',
        recommendations: [],
        moreRecommendations: [],
        followUpSuggestions: this.sanitizeFollowUpSuggestions(
          [
            '¿Qué merece la pena esta noche?',
            '¿Qué tengo en mis plataformas?',
            'Algo corto para ver hoy',
          ],
          latestUserMessage
        ),
        queryContext: this.buildQueryContext(
          previousContext.mode,
          previousContext.requestedTypes || [],
          0,
          0,
          false,
          previousContext.answerWindowLabel || 'TV',
          {
            primaryMatches: 0,
            hasAutonomicMatches: false,
            autonomicPromptRequired: !effectiveCommunity,
            savedAutonomousCommunity: effectiveCommunity,
          }
        ),
      };
    }

    const picks = autonomicMatches.slice(0, 3);
    const more = autonomicMatches.slice(3, 12);
    return {
      text: `Perfecto. También puedo incluir autonómicas de ${
        effectiveCommunity || 'tu comunidad'
      }. Estas son las más útiles para ${
        previousContext.mode === 'tv_now' ? 'ahora mismo' : 'esta noche'
      }.`,
      recommendations: picks.map((item) =>
        this.mapRankedItemToRecommendation(
          item,
          item.item.liveNow
            ? `En emisión ahora en ${item.item.channel?.name || 'TV'}.`
            : `Empieza a las ${
                item.item.start ? this.formatTime(item.item.start) : 'próximamente'
              } en ${item.item.channel?.name || 'TV'}.`
        )
      ),
      moreRecommendations: more.map((item) =>
        this.mapRankedItemToRecommendation(
          item,
          item.item.liveNow
            ? `En emisión ahora en ${item.item.channel?.name || 'TV'}.`
            : `Empieza a las ${
                item.item.start ? this.formatTime(item.item.start) : 'próximamente'
              } en ${item.item.channel?.name || 'TV'}.`
        )
      ),
      followUpSuggestions: this.sanitizeFollowUpSuggestions(
        [
          '¿Qué merece la pena ahora mismo?',
          '¿Qué películas hay esta noche en TV?',
          '¿Qué series hay esta noche?',
        ],
        latestUserMessage
      ),
      queryContext: this.buildQueryContext(
        previousContext.mode,
        previousContext.requestedTypes || [],
        autonomicMatches.length,
        picks.length,
        more.length > 0,
        previousContext.answerWindowLabel || 'TV',
        {
          primaryMatches: 0,
          hasAutonomicMatches: true,
          autonomicPromptRequired: false,
          savedAutonomousCommunity: effectiveCommunity,
        }
      ),
    };
  }

  private getLastAutonomicPromptContext(
    messages: AssistantHistoryPayload['messages']
  ): ChatbotQueryContext | null {
    const lastAssistant = [...messages]
      .reverse()
      .find(
        (message) =>
          message.role === 'assistant' &&
          message.queryContext?.autonomicPromptRequired &&
          (message.queryContext.mode === 'tv_now' ||
            message.queryContext.mode === 'tv_tonight')
      );

    return lastAssistant?.queryContext || null;
  }

  private filterAutonomicMatches(
    items: RankedScheduleItem[],
    community?: string
  ): RankedScheduleItem[] {
    const patterns = community
      ? this.getAutonomicCommunityPatterns(community)
      : [];

    return items.filter((item) => {
      if (item.groupRank !== 3) {
        return false;
      }

      if (!patterns.length) {
        return true;
      }

      const channelName = this.normalize(item.item.channel?.name || '');
      return patterns.some((pattern) => channelName.includes(this.normalize(pattern)));
    });
  }

  private appendAutonomicPrompt(
    baseText: string,
    hasAutonomicMatches: boolean,
    savedCommunity?: string
  ): string {
    if (!hasAutonomicMatches) {
      return baseText;
    }

    if (savedCommunity) {
      return `${baseText} Si quieres, también puedo incluir autonómicas. Tengo guardada ${savedCommunity}. ¿Sigo usando esa comunidad?`;
    }

    return `${baseText} Si quieres, también puedo incluir autonómicas. ¿Cuál es tu comunidad?`;
  }

  private extractCommunityReply(
    message: string,
    savedCommunity?: string
  ): CommunityPreferenceReply {
    const normalized = this.normalize(message);
    const matchedCommunity = AUTONOMOUS_COMMUNITIES.find((community) =>
      community.aliases.some((alias) =>
        normalized.includes(this.normalize(alias))
      )
    );

    if (
      /no incluir autonomic|sin autonomic|no auton[oó]mic|sin cadenas autonomic/.test(
        normalized
      )
    ) {
      return { kind: 'decline', shouldPersist: true };
    }

    if (matchedCommunity) {
      return {
        kind: 'set',
        community: matchedCommunity.canonical,
        shouldPersist: true,
      };
    }

    if (
      savedCommunity &&
      /^(si|sí|vale|ok|de acuerdo|usa esa|usa la misma|la misma)$/.test(
        normalized
      )
    ) {
      return {
        kind: 'confirm',
        community: savedCommunity,
        shouldPersist: true,
      };
    }

    if (/cambiar comunidad|otra comunidad/.test(normalized)) {
      return { kind: 'change', shouldPersist: false };
    }

    return { kind: 'none', shouldPersist: false };
  }

  private buildQueryContext(
    mode: ChatbotQueryContext['mode'],
    requestedTypes: Array<'movie' | 'series' | 'program'>,
    totalMatches: number,
    shownCount: number,
    hasMore: boolean,
    answerWindowLabel: string,
    extra: Partial<ChatbotQueryContext> = {}
  ): ChatbotQueryContext {
    return {
      mode,
      requestedTypes,
      totalMatches,
      primaryMatches:
        typeof extra.primaryMatches === 'number'
          ? Number(extra.primaryMatches)
          : totalMatches,
      shownCount,
      hasMore,
      answerWindowLabel,
      ...extra,
    };
  }

  private buildFollowUpSuggestions(
    intent: ChatQueryIntent,
    latestUserMessage: string
  ): string[] {
    const candidates =
      intent.requestedTypes[0] === 'movie'
        ? [
            intent.mode === 'tv_now'
              ? '¿Qué películas hay más tarde esta noche?'
              : '¿Qué merece la pena ahora mismo?',
            intent.mode === 'tv_now'
              ? '¿Qué series hay ahora mismo?'
              : '¿Qué series hay esta noche?',
            '¿Qué merece la pena esta noche?',
          ]
        : intent.requestedTypes[0] === 'series'
          ? [
              intent.mode === 'tv_now'
                ? '¿Qué series hay más tarde esta noche?'
                : '¿Qué merece la pena ahora mismo?',
              intent.mode === 'tv_now'
                ? '¿Qué películas hay ahora mismo en TV?'
                : '¿Qué películas hay esta noche en TV?',
              '¿Qué merece la pena esta noche?',
            ]
          : [
              '¿Qué merece la pena ahora mismo?',
              '¿Qué hay esta noche en TV?',
              '¿Qué películas hay esta noche en TV?',
            ];

    return this.sanitizeFollowUpSuggestions(candidates, latestUserMessage);
  }

  private buildFallbackFollowUpSuggestions(
    intent: ChatQueryIntent,
    latestUserMessage: string
  ): string[] {
    return this.sanitizeFollowUpSuggestions(
      [
        intent.requestedTypes[0] === 'movie'
          ? '¿Qué películas hay esta noche en TV?'
          : '¿Qué series hay esta noche?',
        '¿Qué hay mañana en TV?',
        '¿Qué tengo en streaming ahora mismo?',
      ],
      latestUserMessage
    );
  }

  private buildStreamingFallbackSuggestions(
    intent: ChatQueryIntent,
    latestUserMessage: string
  ): string[] {
    return this.sanitizeFollowUpSuggestions(
      [
        intent.requestedTypes[0] === 'movie'
          ? '¿Qué películas hay esta noche en TV?'
          : '¿Qué series hay esta noche?',
        '¿Qué tengo en mis plataformas?',
        'Algo corto para ver hoy',
      ],
      latestUserMessage
    );
  }

  private sanitizeFollowUpSuggestions(
    suggestions: string[],
    latestUserMessage: string
  ): string[] {
    const normalizedLastUserMessage = this.normalize(latestUserMessage);
    const unique = new Map<string, string>();

    suggestions.forEach((suggestion) => {
      const safe = String(suggestion || '').trim();
      if (!safe) {
        return;
      }

      const normalized = this.normalize(safe);
      if (!normalized || normalized === normalizedLastUserMessage) {
        return;
      }

      unique.set(normalized, safe);
    });

    return Array.from(unique.values()).slice(0, 3);
  }

  private cleanDisplayTitle(
    value: string,
    contentType: 'movie' | 'series' | 'program'
  ): string {
    const raw = String(value || '').trim();
    if (!raw) {
      return '';
    }

    const segments = raw
      .split(/·|\||—|-/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length >= 2) {
      const first = segments[0];
      const second = segments[1];
      if (this.normalize(first) === this.normalize(second)) {
        return first;
      }
    }

    if (contentType === 'series') {
      return this.extractSeriesBaseTitle(raw);
    }

    return raw;
  }

  private extractSeriesBaseTitle(title: string): string {
    return String(title || '')
      .replace(/\s*T\d+\s*E\d+.*$/i, '')
      .replace(/\s*S\d+\s*E\d+.*$/i, '')
      .replace(/\s*\([^)]*dobles[^)]*\).*$/i, '')
      .replace(/\s*·.*$/i, '')
      .trim();
  }

  private getChannelGroupRank(item: CatalogItemDTO): number {
    const channelName = this.normalize(item.channel?.name || '');
    const platforms = item.primaryPlatforms.map((platform) => this.normalize(platform));

    if (
      NATIONAL_CHANNEL_PRIORITY.some((pattern) =>
        channelName.includes(this.normalize(pattern))
      )
    ) {
      return 1;
    }

    if (
      PAY_CHANNEL_PATTERNS.some((pattern) =>
        channelName.includes(this.normalize(pattern))
      )
    ) {
      return 2;
    }

    if (
      AUTONOMIC_CHANNEL_PATTERNS.some((pattern) =>
        channelName.includes(this.normalize(pattern))
      )
    ) {
      return 3;
    }

    if (
      FAST_CHANNEL_PATTERNS.some((pattern) =>
        channelName.includes(this.normalize(pattern))
      )
    ) {
      return 4;
    }

    if (
      !channelName &&
      platforms.some((platform) =>
        FAST_CHANNEL_PATTERNS.some((pattern) =>
          platform.includes(this.normalize(pattern))
        )
      )
    ) {
      return 4;
    }

    return 2;
  }

  private getChannelPriority(channelName: string): number {
    const normalized = this.normalize(channelName);
    const nationalIndex = NATIONAL_CHANNEL_PRIORITY.findIndex((pattern) =>
      normalized.includes(this.normalize(pattern))
    );
    if (nationalIndex >= 0) {
      return nationalIndex;
    }

    const payIndex = PAY_CHANNEL_PATTERNS.findIndex((pattern) =>
      normalized.includes(this.normalize(pattern))
    );
    if (payIndex >= 0) {
      return 100 + payIndex;
    }

    const autonomicIndex = AUTONOMIC_CHANNEL_PATTERNS.findIndex((pattern) =>
      normalized.includes(this.normalize(pattern))
    );
    if (autonomicIndex >= 0) {
      return 200 + autonomicIndex;
    }

    const fastIndex = FAST_CHANNEL_PATTERNS.findIndex((pattern) =>
      normalized.includes(this.normalize(pattern))
    );
    if (fastIndex >= 0) {
      return 300 + fastIndex;
    }

    return 999;
  }

  private getAutonomicCommunityPatterns(community: string): string[] {
    return (
      AUTONOMOUS_COMMUNITIES.find(
        (entry) => this.normalize(entry.canonical) === this.normalize(community)
      )?.channelPatterns || []
    );
  }

  private isTonightWindow(start: string, end?: string): boolean {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    if (Number.isNaN(startDate.getTime())) {
      return false;
    }
    if (endDate && Number.isNaN(endDate.getTime())) {
      return false;
    }

    const tonightStart = this.buildTonightWindowStart(now);
    const tonightEnd = this.buildTonightWindowEnd(now);
    const isBeforeTonightWindow = now.getTime() < tonightStart.getTime();
    const activeWindowStart = isBeforeTonightWindow ? tonightStart : now;

    if (isBeforeTonightWindow) {
      return (
        startDate.getTime() >= tonightStart.getTime() &&
        startDate.getTime() <= tonightEnd.getTime()
      );
    }

    const intervalEnd = endDate || startDate;

    return (
      startDate.getTime() <= tonightEnd.getTime() &&
      intervalEnd.getTime() >= activeWindowStart.getTime()
    );
  }

  private buildTonightWindowStart(reference: Date): Date {
    const tonightStart = new Date(reference);
    tonightStart.setHours(20, 0, 0, 0);
    return tonightStart;
  }

  private buildTonightWindowEnd(reference: Date): Date {
    const tonightEnd = new Date(reference);
    tonightEnd.setHours(23, 59, 59, 999);
    return tonightEnd;
  }

  private getContentTypePriority(
    contentType: CatalogItemDTO['contentType']
  ): number {
    switch (contentType) {
      case 'movie':
        return 0;
      case 'series':
        return 1;
      default:
        return 2;
    }
  }

  private normalizeTitleKey(value: string): string {
    return this.normalize(value)
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\b(el|la|los|las|un|una|unos|unas)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildRecommendationBadges(item: CatalogItemDTO): string[] {
    const badges: string[] = [];

    if (item.liveNow) {
      badges.push('En emisión ahora');
    } else if (item.start) {
      badges.push(`Empieza a las ${this.formatTime(item.start)}`);
    }

    const groupRank = this.getChannelGroupRank(item);
    if (groupRank === 1) {
      badges.push('TDT / nacional');
    } else if (groupRank === 2) {
      badges.push('Canal de pago');
    } else if (groupRank === 3) {
      badges.push('Autonómica');
    } else if (groupRank === 4) {
      badges.push('FAST / lineal');
    }

    return badges.slice(0, 3);
  }
}
