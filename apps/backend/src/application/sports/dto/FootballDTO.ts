/**
 * Football bounded context — API DTOs.
 */

import {
  FootballCompetition,
  FootballMatch,
  FootballMatchStatus,
  FootballNewsItem,
  FootballStandingRow,
  FootballTeam,
} from '../../../domain/sports/football/types';

export interface FootballHomeDTO {
  liveMatches: FootballMatch[];
  todayMatches: FootballMatch[];
  featuredMatches: FootballMatch[];
  upcomingMatches: FootballMatch[];
  featuredCompetitions: FootballCompetition[];
  latestNews: FootballNewsItem[];
  generatedAt: string;
}

export interface FootballMatchesResponseDTO {
  matches: FootballMatch[];
  meta: {
    total: number;
    date?: string;
    status?: FootballMatchStatus | 'live';
    competitionSlug?: string;
    teamSlug?: string;
    generatedAt: string;
  };
}

export interface FootballMatchDetailDTO {
  match: FootballMatch;
  relatedNews: FootballNewsItem[];
  meta: { generatedAt: string };
}

export interface FootballCompetitionsResponseDTO {
  competitions: FootballCompetition[];
  meta: { total: number; generatedAt: string };
}

export interface FootballCompetitionDetailDTO {
  competition: FootballCompetition;
  matches: FootballMatch[];
  standings: FootballStandingRow[];
  news: FootballNewsItem[];
  meta: { generatedAt: string };
}

export interface FootballTeamDetailDTO {
  team: FootballTeam;
  nextMatch: FootballMatch | null;
  lastResult: FootballMatch | null;
  matches: FootballMatch[];
  news: FootballNewsItem[];
  meta: { generatedAt: string };
}

export interface FootballNewsResponseDTO {
  news: FootballNewsItem[];
  meta: { total: number; generatedAt: string };
}

export interface FootballSearchResponseDTO {
  query: string;
  matches: FootballMatch[];
  teams: FootballTeam[];
  competitions: FootballCompetition[];
  news: FootballNewsItem[];
  meta: { generatedAt: string };
}

export interface FootballBroadcastOverrideDTO {
  matchId: string;
  matchSlug: string;
  channelId: string;
  channelName: string;
}
