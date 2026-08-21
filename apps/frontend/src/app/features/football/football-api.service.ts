import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@app/api/api-client.service';
import { ApiResponse } from '@app/api/models';
import {
  FootballCompetitionDetailDTO,
  FootballCompetitionsResponseDTO,
  FootballHomeDTO,
  FootballMatchDetailDTO,
  FootballMatchesResponseDTO,
  FootballNewsDTO,
  FootballSearchDTO,
  FootballTeamDetailDTO,
} from './football.models';

@Injectable({ providedIn: 'root' })
export class FootballApiService {
  constructor(private readonly client: ApiClientService) {}

  getHome(): Observable<ApiResponse<FootballHomeDTO>> {
    return this.client.get<ApiResponse<FootballHomeDTO>>('/sports/football/home');
  }

  getMatches(params: {
    date?: string;
    status?: string;
    competition?: string;
    team?: string;
    q?: string;
    limit?: number;
  } = {}): Observable<ApiResponse<FootballMatchesResponseDTO>> {
    return this.client.get<ApiResponse<FootballMatchesResponseDTO>>(
      '/sports/football/matches',
      params
    );
  }

  getLiveMatches(): Observable<ApiResponse<FootballMatchesResponseDTO>> {
    return this.client.get<ApiResponse<FootballMatchesResponseDTO>>('/sports/football/matches/live');
  }

  getMatch(idOrSlug: string): Observable<ApiResponse<FootballMatchDetailDTO>> {
    return this.client.get<ApiResponse<FootballMatchDetailDTO>>(
      `/sports/football/matches/${idOrSlug}`
    );
  }

  getCompetitions(): Observable<ApiResponse<FootballCompetitionsResponseDTO>> {
    return this.client.get<ApiResponse<FootballCompetitionsResponseDTO>>(
      '/sports/football/competitions'
    );
  }

  getCompetition(slug: string): Observable<ApiResponse<FootballCompetitionDetailDTO>> {
    return this.client.get<ApiResponse<FootballCompetitionDetailDTO>>(
      `/sports/football/competitions/${slug}`
    );
  }

  getTeam(slug: string): Observable<ApiResponse<FootballTeamDetailDTO>> {
    return this.client.get<ApiResponse<FootballTeamDetailDTO>>(`/sports/football/teams/${slug}`);
  }

  getNews(
    params: { team?: string; competition?: string; match?: string; slug?: string; q?: string; limit?: number; offset?: number } = {}
  ): Observable<ApiResponse<{ news: FootballNewsDTO[] }>> {
    return this.client.get<ApiResponse<{ news: FootballNewsDTO[] }>>('/sports/football/news', params);
  }

  search(q: string): Observable<ApiResponse<FootballSearchDTO>> {
    return this.client.get<ApiResponse<FootballSearchDTO>>('/sports/football/search', { q });
  }
}
