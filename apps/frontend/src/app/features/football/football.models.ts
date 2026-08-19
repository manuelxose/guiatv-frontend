/**
 * Football bounded context — frontend contracts.
 * Mirrors the backend /v2/sports/football payloads.
 */

import { ApiResponse } from '../../api/models';

export type FootballMatchStatus =
  | 'scheduled'
  | 'live'
  | 'halftime'
  | 'finished'
  | 'postponed'
  | 'suspended'
  | 'cancelled';

export type FootballCompetitionType = 'league' | 'cup' | 'international' | 'national_team' | 'other';
export type BroadcastAvailabilityType = 'tv' | 'streaming' | 'both';
export type BroadcastConfidence = 'high' | 'medium' | 'low';

export interface FootballTeamDTO {
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  country?: string;
  crest?: string | null;
  aliases: string[];
  providerIds: Record<string, string>;
  lastUpdatedAt: string;
}

export interface FootballCompetitionDTO {
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  country?: string;
  logo?: string | null;
  type: FootballCompetitionType;
  currentSeason?: string;
  providerIds: Record<string, string>;
  lastUpdatedAt: string;
}

export interface FootballBroadcastDTO {
  channelId: string;
  channelName: string;
  availability: BroadcastAvailabilityType;
  provenance: 'airing' | 'reconciliation' | 'override';
  confidence: BroadcastConfidence;
  channelPath?: string;
}

export interface FootballMatchDTO {
  id: string;
  slug: string;
  providerIds: Record<string, string>;
  competition: Pick<FootballCompetitionDTO, 'id' | 'slug' | 'name' | 'shortName' | 'logo'>;
  season?: string;
  round?: string;
  kickoffAt: string;
  status: FootballMatchStatus;
  homeTeam: FootballTeamDTO;
  awayTeam: FootballTeamDTO;
  score: { home: number | null; away: number | null };
  minute?: number | null;
  venue?: string;
  broadcasts: FootballBroadcastDTO[];
  sourceProvenance: { source: string; externalId?: string; confidence: BroadcastConfidence };
  lastUpdatedAt: string;
}

export interface FootballStandingRowDTO {
  position: number;
  team: FootballTeamDTO;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string;
}

export type FootballContentType =
  | 'news'
  | 'analysis'
  | 'preview'
  | 'match-report'
  | 'guide'
  | 'ranking'
  | 'trend';

export interface FootballNewsDTO {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  contentType: FootballContentType;
  author?: { name?: string; id?: string };
  coverImage?: string | null;
  publishedAt: string;
  updatedAt?: string;
  sportsRelations: { teamIds: string[]; competitionIds: string[]; matchIds: string[] };
  externalSource?: { name: string; url: string };
}

export interface FootballHomeDTO {
  liveMatches: FootballMatchDTO[];
  todayMatches: FootballMatchDTO[];
  featuredMatches: FootballMatchDTO[];
  upcomingMatches: FootballMatchDTO[];
  featuredCompetitions: FootballCompetitionDTO[];
  latestNews: FootballNewsDTO[];
  generatedAt: string;
}

export interface FootballMatchesResponseDTO {
  matches: FootballMatchDTO[];
  meta: Record<string, any>;
}

export interface FootballMatchDetailDTO {
  match: FootballMatchDTO;
  relatedNews: FootballNewsDTO[];
  meta: Record<string, any>;
}

export interface FootballCompetitionsResponseDTO {
  competitions: FootballCompetitionDTO[];
  meta: Record<string, any>;
}

export interface FootballCompetitionDetailDTO {
  competition: FootballCompetitionDTO;
  matches: FootballMatchDTO[];
  standings: FootballStandingRowDTO[];
  news: FootballNewsDTO[];
  meta: Record<string, any>;
}

export interface FootballTeamDetailDTO {
  team: FootballTeamDTO;
  nextMatch: FootballMatchDTO | null;
  lastResult: FootballMatchDTO | null;
  matches: FootballMatchDTO[];
  news: FootballNewsDTO[];
  meta: Record<string, any>;
}

export interface FootballSearchDTO {
  query: string;
  matches: FootballMatchDTO[];
  teams: FootballTeamDTO[];
  competitions: FootballCompetitionDTO[];
  news: FootballNewsDTO[];
  meta: Record<string, any>;
}

export type FootballApiResponse<T> = ApiResponse<T>;
