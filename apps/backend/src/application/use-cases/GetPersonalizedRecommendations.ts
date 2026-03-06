import { GetPrograms } from './GetPrograms';
import { IUserContentInteractionRepository } from '@/domain/repositories/IUserContentInteractionRepository';
import { ProgramLayoutDTO } from '../services/ProgramLayoutBuilder';
import { StreamingProvidersService } from '@/infrastructure/external/StreamingProvidersService';
import { UserContentInteractionModel } from '@/infrastructure/database/models/UserContentInteraction.model';
import { UserProfileModel } from '@/infrastructure/database/models/UserProfile.model';

export interface GetPersonalizedRecommendationsRequest {
  userId: string;
  limit?: number;
  context?: 'home' | 'detail' | 'chatbot';
  excludeIds?: string[];
}

export interface PersonalizedRecommendation {
  program: ProgramLayoutDTO;
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
    private readonly getPrograms: GetPrograms,
    private readonly interactionRepository: IUserContentInteractionRepository,
    private readonly streamingProvidersService: StreamingProvidersService
  ) {}

  async execute(
    request: GetPersonalizedRecommendationsRequest
  ): Promise<PersonalizedRecommendation[]> {
    const limit = Math.min(Math.max(1, request.limit || 20), 30);
    const [profile, genreProfile, history, programsResponse, similarUsers] =
      await Promise.all([
        UserProfileModel.findOne({ userId: request.userId }).lean().exec(),
        this.interactionRepository.getUserGenreProfile(request.userId),
        this.interactionRepository.findByUser(request.userId, { limit: 500 }),
        this.getPrograms.execute({
          date: 'today',
          fields: 'full',
          limit: 2500,
        }),
        this.interactionRepository.getSimilarUsers(request.userId, 8),
      ]);

    const favoriteGenres = new Set<string>([
      ...(profile?.favoriteGenres || []),
      ...genreProfile.genres.map((item) => item.genre),
    ]);
    const excludeKeys = new Set<string>(request.excludeIds || []);
    history.forEach((item) => {
      if (item.status === 'seen' || item.status === 'dropped') {
        excludeKeys.add(this.buildInteractionKey(item.tmdbId, item.contentTitle));
        excludeKeys.add(item.contentId);
      }
    });

    const collaborativeScores = await this.loadCollaborativeScores(similarUsers);

    const scored = programsResponse.programs
      .filter((program) => !excludeKeys.has(program.id))
      .filter(
        (program) =>
          !excludeKeys.has(this.buildInteractionKey(program.tmdbId, String(program.title)))
      )
      .map((program) => {
        const matchedGenres = Array.from(favoriteGenres).filter((genre) =>
          String(program.category || '')
            .toLowerCase()
            .includes(String(genre).toLowerCase())
        );

        const collaborative =
          collaborativeScores.get(
            this.buildInteractionKey(program.tmdbId, String(program.title))
          ) || 0;
        const tmdbRating = Number(program.rating || 0) / 10;
        const hour = new Date(program.start).getHours();
        const primetime = hour >= 20 && hour <= 23 ? 1 : 0;
        const genreMatch = matchedGenres.length ? Math.min(1, matchedGenres.length / 2) : 0;
        const score =
          genreMatch * 0.4 + collaborative * 0.3 + tmdbRating * 0.2 + primetime * 0.1;

        const reason = matchedGenres.length
          ? `Porque encaja con tus gustos en ${matchedGenres[0]}`
          : collaborative > 0
            ? 'A usuarios con gustos parecidos les ha gustado'
            : primetime
              ? 'Es una buena opcion para esta noche'
              : 'Tiene buena valoracion y encaja con tu perfil';

        return {
          program,
          score,
          reason,
          matchedGenres,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const providers = await Promise.all(
      scored.map(async (item) => {
        if (!item.program.tmdbId) {
          return [];
        }

        const kind = this.inferProviderType(item.program.category);
        if (!kind) {
          return [];
        }

        const result =
          kind === 'movie'
            ? await this.streamingProvidersService.getMovieProviders(item.program.tmdbId)
            : await this.streamingProvidersService.getTVProviders(item.program.tmdbId);

        const source = result?.flatrate?.length ? result.flatrate : result?.free || [];
        return source.slice(0, 3).map((provider) => ({
          id: provider.providerId,
          name: provider.providerName,
          logoUrl: provider.logoPath
            ? this.streamingProvidersService.getLogoUrl(provider.logoPath)
            : '',
          type: result?.flatrate?.length ? ('flatrate' as const) : ('free' as const),
        }));
      })
    );

    return scored.map((item, index) => ({
      program: item.program,
      score: Number(item.score.toFixed(3)),
      reason: item.reason,
      matchedGenres: item.matchedGenres,
      whereToWatch: providers[index],
    }));
  }

  private async loadCollaborativeScores(similarUsers: string[]) {
    if (!similarUsers.length) {
      return new Map<string, number>();
    }

    const docs = await UserContentInteractionModel.find({
      userId: { $in: similarUsers },
      status: { $in: ['seen', 'watching'] },
    })
      .lean()
      .exec();

    const counts = new Map<string, number>();
    docs.forEach((doc: any) => {
      const key = this.buildInteractionKey(
        typeof doc.tmdbId === 'number' ? doc.tmdbId : undefined,
        String(doc.contentTitle || '')
      );
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const max = Math.max(...Array.from(counts.values()), 1);
    counts.forEach((value, key) => {
      counts.set(key, value / max);
    });

    return counts;
  }

  private buildInteractionKey(tmdbId: number | undefined, title: string): string {
    if (tmdbId) {
      return `tmdb:${tmdbId}`;
    }

    return `title:${String(title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()}`;
  }

  private inferProviderType(category?: string): 'movie' | 'tv' | null {
    const normalized = String(category || '').toLowerCase();
    if (normalized.includes('serie')) return 'tv';
    if (normalized.includes('cine') || normalized.includes('pel')) return 'movie';
    return null;
  }
}
