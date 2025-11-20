/**
 * Provider para datos de programación desde la API estándar (backend v2)
 * Ubicación: src/app/services/providers/api-program.provider.ts
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import {
  IProgramDataProvider,
  ITvProgram,
  IChannel,
  ICacheManager,
  ILogger,
  CacheKeys,
} from '../../interfaces';
import { AppConfigurationService } from '../core/config.service';

interface ApiChannel {
  id: string;
  name: string;
  icon?: string;
  type?: string;
  isActive: boolean;
}

interface ApiProgram {
  id: string;
  channelId: string;
  title: string;
  startTime: string;
  endTime: string;
  duration?: number;
  description?: string;
  image?: string;
  genre?: string;
  subgenre?: string;
  rating?: string;
  details?: Record<string, string>;
}

interface ApiScheduleResponse {
  date: string;
  channels: Array<{
    channel: ApiChannel;
    programs: ApiProgram[];
  }>;
  meta?: {
    totalChannels?: number;
    totalPrograms?: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ApiProgramProvider implements IProgramDataProvider {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private cache: ICacheManager<any[]>,
    private logger: ILogger,
    private configService: AppConfigurationService
  ) {
    const apiConfig = this.configService.getApiConfig();
    this.baseUrl = apiConfig.backend?.baseUrl || 'http://localhost:4000/v2';
  }

  getPrograms(date: string): Observable<ITvProgram[]> {
    const cacheKey = `${CacheKeys.TODAY_PROGRAMS}_${date}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.info(`Using cached programs for ${date}`, { count: cached.length });
      return of(cached);
    }

    this.logger.info(`Fetching programs from API for ${date}`);

    return this.http.get<ApiScheduleResponse>(`${this.baseUrl}/schedules/${date}`).pipe(
      map((response) => response.channels || []),
      map((channelsData) => this.transformApiData(channelsData)),
      tap((programs) => {
        this.cache.set(cacheKey, programs);
        this.logger.info(`Programs cached for ${date}`, { count: programs.length });
      }),
      catchError((error) => {
        this.logger.error(`Failed to fetch programs for ${date}`, error);
        throw error;
      })
    );
  }

  getChannels(): Observable<IChannel[]> {
    const cacheKey = 'channels';
    const cached = this.cache.get(cacheKey);

    if (cached) {
      this.logger.info('Using cached channels');
      return of(cached);
    }

    this.logger.info('Fetching channels from API');

    return this.http.get<{ channels: ApiChannel[] }>(`${this.baseUrl}/channels`).pipe(
      map((response) => response.channels || []),
      map((apiChannels: ApiChannel[]) =>
        apiChannels.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon || '',
          type: c.type,
        }))
      ),
      tap((channels) => {
        this.cache.set(cacheKey, channels);
        this.logger.info('Channels cached', { count: channels.length });
      }),
      catchError((error) => {
        this.logger.error('Failed to fetch channels', error);
        throw error;
      })
    );
  }

  private transformApiData(channelsData: ApiScheduleResponse['channels']): ITvProgram[] {
    if (!Array.isArray(channelsData)) {
      return [];
    }

    const allPrograms: ITvProgram[] = [];

    channelsData.forEach(({ channel, programs }) => {
      if (!channel || !Array.isArray(programs)) return;

      programs.forEach((program) => {
        allPrograms.push({
          id: program.id,
          title: program.title,
          start: program.startTime,
          end: program.endTime,
          channel_id: channel.id,
          channel: {
            id: channel.id,
            name: channel.name,
            icon: channel.icon || '',
            type: channel.type,
          },
          desc: program.description
            ? {
                value: program.description,
                lang: 'es',
                details: program.details?.longText || program.details?.summary,
              }
            : undefined,
          category: program.genre ? { value: program.genre, lang: 'es' } : undefined,
          starRating: program.rating ? Number(program.rating) : undefined,
          image: program.image,
          duration: program.duration ?? this.calculateDuration(program.startTime, program.endTime),
        });
      });
    });

    return allPrograms;
  }

  // Método para compatibilidad con ProgramListComponent
  getProgramsForProgramList(date: string): Observable<any[]> {
    return this.http.get<ApiScheduleResponse>(`${this.baseUrl}/schedules/${date}`).pipe(
      map((response) => response.channels || []),
      map((channelsData) => {
        return channelsData.map((cd) => ({
          id: cd.channel.id,
          channel: cd.channel,
          channels: cd.programs.map((p) => ({
            ...p,
            title: p.title,
            id: p.id,
            start: p.startTime,
            stop: p.endTime,
            duracion: this.calculateDuration(p.startTime, p.endTime),
            desc: p.description
              ? { value: p.description, lang: 'es', details: p.details?.longText || p.details?.summary }
              : undefined,
            category: p.genre ? { value: p.genre, lang: 'es' } : undefined,
          })),
        }));
      })
    );
  }

  private calculateDuration(start: string, end: string): number {
    try {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      return Math.max(1, Math.floor((endTime - startTime) / (1000 * 60)));
    } catch {
      return 30;
    }
  }
}
