import {
  AIRecommendationService,
  ChatbotMessage,
  ChatbotResponse,
} from '@/infrastructure/external/AIRecommendationService';
import { IUserContentInteractionRepository } from '@/domain/repositories/IUserContentInteractionRepository';
import { MongoUserRepository } from '@/infrastructure/repositories/MongoUserRepository';
import { CatalogService } from '../services/CatalogService';
import { UserProfileModel } from '@/infrastructure/database/models/UserProfile.model';

export interface ChatbotRecommendRequest {
  userId: string;
  messages: ChatbotMessage[];
}

export class ChatbotRecommend {
  constructor(
    private readonly aiService: AIRecommendationService,
    private readonly interactionRepository: IUserContentInteractionRepository,
    private readonly userRepository: MongoUserRepository,
    private readonly catalogService: CatalogService
  ) {}

  async execute(
    request: ChatbotRecommendRequest
  ): Promise<ChatbotResponse> {
    const [user, profile, genreProfile, recentInteractions, tonightCatalog] =
      await Promise.all([
        this.userRepository.findById(request.userId),
        UserProfileModel.findOne({ userId: request.userId }).lean().exec(),
        this.interactionRepository.getUserGenreProfile(request.userId),
        this.interactionRepository.findByUser(request.userId, {
          status: 'seen',
          limit: 20,
        }),
        this.catalogService.query({
          userId: request.userId,
          availability: ['live'],
          sort: 'airtime',
          limit: 20,
          page: 1,
        }),
      ]);

    const baseResponse = await this.aiService.chat(request.messages, {
      userId: request.userId,
      userProfile: {
        name: user?.name || profile?.username || 'usuario',
        favoriteGenres: profile?.favoriteGenres || [],
        topRatedContent: recentInteractions
          .filter((interaction) => interaction.rating && interaction.rating >= 7)
          .map((interaction) => ({
            title: interaction.contentTitle,
            rating: interaction.rating || 0,
            type: interaction.contentType,
          }))
          .slice(0, 10),
        recentlyWatched: recentInteractions.slice(0, 10).map((interaction) => ({
          title: interaction.contentTitle,
          platform: interaction.platform,
        })),
        preferredPlatforms:
          genreProfile.preferredPlatforms.length
            ? genreProfile.preferredPlatforms
            : profile?.preferredPlatforms || [],
        avgRating: genreProfile.avgRating,
      },
      availableTonight: tonightCatalog.items
        .filter((item) => item.start && item.channel?.name)
        .slice(0, 12)
        .map((item) => ({
          title: item.title,
          channel: item.channel?.name || '',
          time: item.start
            ? new Date(item.start).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '',
          genre: item.genres[0] || '',
          tmdbRating: item.rating,
        })),
    });

    if (!Array.isArray(baseResponse.recommendations) || !baseResponse.recommendations.length) {
      return baseResponse;
    }

    const resolvedRecommendations = await Promise.all(
      baseResponse.recommendations.map(async (recommendation) => {
        const match = await this.catalogService.resolveRecommendation({
          title: recommendation.title,
          type: recommendation.type,
          platform: recommendation.platform,
          channel: recommendation.channel,
        });

        return {
          ...recommendation,
          catalogId: match?.catalogId,
          source: match?.source,
          tmdbId: match?.tmdbId || recommendation.tmdbId,
          image: match?.image || recommendation.image,
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

    return {
      ...baseResponse,
      recommendations: resolvedRecommendations,
    };
  }
}
