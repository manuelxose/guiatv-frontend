import {
  FootballCompetition,
  FootballDataProvider,
  FootballMatch,
  FootballMatchQuery,
  FootballStandingRow,
  FootballTeam,
} from '../../../domain/sports/football/types';

/**
 * Keeps the football surface available when the live provider is throttled or
 * unavailable. The secondary provider is the local EPG read model, so the
 * fallback never causes another external request and never invents scores.
 */
export class FallbackFootballDataProvider implements FootballDataProvider {
  readonly key: string;
  readonly name: string;

  constructor(
    private readonly primary: FootballDataProvider,
    private readonly secondary: FootballDataProvider
  ) {
    this.key = `${primary.key}+${secondary.key}`;
    this.name = `${primary.name} with ${secondary.name} fallback`;
  }

  getMatches(query: FootballMatchQuery): Promise<FootballMatch[]> {
    return this.withFallback(() => this.primary.getMatches(query), () => this.secondary.getMatches(query));
  }

  getLiveMatches(): Promise<FootballMatch[]> {
    return this.withFallback(() => this.primary.getLiveMatches(), () => this.secondary.getLiveMatches());
  }

  getMatch(idOrSlug: string): Promise<FootballMatch | null> {
    return this.withNullableFallback(() => this.primary.getMatch(idOrSlug), () => this.secondary.getMatch(idOrSlug));
  }

  getCompetitions(): Promise<FootballCompetition[]> {
    return this.withFallback(() => this.primary.getCompetitions(), () => this.secondary.getCompetitions());
  }

  getCompetition(slug: string): Promise<FootballCompetition | null> {
    return this.withNullableFallback(() => this.primary.getCompetition(slug), () => this.secondary.getCompetition(slug));
  }

  getStandings(competitionSlug: string): Promise<FootballStandingRow[]> {
    return this.withFallback(() => this.primary.getStandings(competitionSlug), () => this.secondary.getStandings(competitionSlug));
  }

  getTeams(): Promise<FootballTeam[]> {
    return this.withFallback(() => this.primary.getTeams(), () => this.secondary.getTeams());
  }

  getTeam(slug: string): Promise<FootballTeam | null> {
    return this.withNullableFallback(() => this.primary.getTeam(slug), () => this.secondary.getTeam(slug));
  }

  supportsLiveScores(): boolean {
    return this.primary.supportsLiveScores();
  }

  private async withFallback<T>(primary: () => Promise<T>, secondary: () => Promise<T>): Promise<T> {
    try {
      return await primary();
    } catch {
      return secondary();
    }
  }

  private async withNullableFallback<T>(primary: () => Promise<T | null>, secondary: () => Promise<T | null>): Promise<T | null> {
    try {
      return (await primary()) ?? secondary();
    } catch {
      return secondary();
    }
  }
}
