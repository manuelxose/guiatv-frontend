import {
  AIRecommendationService,
  ChatbotMessage,
  ChatbotResponse,
} from '@/infrastructure/external/AIRecommendationService';
import { IUserContentInteractionRepository } from '@/domain/repositories/IUserContentInteractionRepository';
import { MongoUserRepository } from '@/infrastructure/repositories/MongoUserRepository';
import { GetPrograms } from './GetPrograms';
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
    private readonly getPrograms: GetPrograms
  ) {}

  async execute(
    request: ChatbotRecommendRequest
  ): Promise<ChatbotResponse> {
    const [user, profile, genreProfile, recentInteractions, tonightPrograms] =
      await Promise.all([
        this.userRepository.findById(request.userId),
        UserProfileModel.findOne({ userId: request.userId }).lean().exec(),
        this.interactionRepository.getUserGenreProfile(request.userId),
        this.interactionRepository.findByUser(request.userId, {
          status: 'seen',
          limit: 20,
        }),
        this.getPrograms.execute({
          date: 'today',
          fields: 'full',
          limit: 120,
        }),
      ]);

    const channelMap = new Map(
      tonightPrograms.channels.map((channel) => [channel.id, channel])
    );

    return this.aiService.chat(request.messages, {
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
      availableTonight: tonightPrograms.programs
        .filter((program) => program.image)
        .filter((program) => {
          const hour = new Date(program.start).getHours();
          return hour >= 20 && hour <= 23;
        })
        .slice(0, 20)
        .map((program) => ({
          title: String(program.title),
          channel: channelMap.get(program.channelId)?.name || '',
          time: new Date(program.start).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          genre: program.category || '',
          tmdbRating: program.rating ? Number(program.rating) : undefined,
        })),
    });
  }
}
