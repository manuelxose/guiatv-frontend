import { IUserContentInteractionRepository } from '@/domain/repositories/IUserContentInteractionRepository';
import { StreamingProvidersService } from '@/infrastructure/external/StreamingProvidersService';
import { CatalogService } from '../services/CatalogService';
import { CatalogItemDTO } from '../dto/CatalogDTO';

export interface GetPersonalizedRecommendationsRequest {
  userId: string;
  limit?: number;
  context?: 'home' | 'detail' | 'chatbot';
  excludeIds?: string[];
}

export interface PersonalizedRecommendation {
  item: CatalogItemDTO;
  score: number;
  reason: string;
  matchedGenres: string[];
  whereToWatch?: Array<{
    id: number;
    name: string;
    logoUrl: string;
    type: 'flatrate' | 'rent' | 'buy' | 'free';
  }>;
}

export class GetPersonalizedRecommendations {
  constructor(
    _getPrograms: unknown,
    private readonly interactionRepository: IUserContentInteractionRepository,
    _streamingProvidersService: StreamingProvidersService,
    private readonly catalogService: CatalogService
  ) {
    void _getPrograms;
    void _streamingProvidersService;
  }

  async execute(
    request: GetPersonalizedRecommendationsRequest
  ): Promise<PersonalizedRecommendation[]> {
    const limit = Math.min(Math.max(1, request.limit || 20), 30);
    const profile = await this.interactionRepository.getUserGenreProfile(request.userId);
    const favoriteGenres = new Set(
      profile.genres.map((item) => this.normalizeToken(item.genre))
    );

    const result = await this.catalogService.query({
      userId: request.userId,
      limit: Math.max(limit * 2, 24),
      page: 1,
      sort: 'personalized',
      availability:
        request.context === 'chatbot' ? ['live', 'streaming'] : undefined,
    });

    const excluded = new Set((request.excludeIds || []).map((item) => String(item || '').trim()));

    return result.items
      .filter((item) => !excluded.has(item.catalogId))
      .slice(0, limit)
      .map((item, index) => {
        const matchedGenres = item.genres.filter((genre) =>
          favoriteGenres.has(this.normalizeToken(genre))
        );

        return {
          item,
          score: Number(Math.max(0.1, 1 - index / Math.max(limit + 2, 3)).toFixed(3)),
          reason: this.buildReason(item, matchedGenres),
          matchedGenres,
          whereToWatch: [
            ...(item.whereToWatch?.flatrate || []),
            ...(item.whereToWatch?.free || []),
          ].slice(0, 3),
        };
      });
  }

  private buildReason(item: CatalogItemDTO, matchedGenres: string[]): string {
    if (matchedGenres.length) {
      return `Porque suele encajar con tus gustos en ${matchedGenres[0]}`;
    }
    if (item.liveNow && item.channel?.name) {
      return `Se esta emitiendo ahora en ${item.channel.name}`;
    }
    if (item.primaryPlatforms.length) {
      return `Disponible en ${item.primaryPlatforms[0]} y alineado con tus plataformas`;
    }
    return 'Encaja con tu historial reciente y su valoracion es alta';
  }

  private normalizeToken(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
}
