/**
 * Provider para datos de programaciÃ³n desde la API estÃ¡ndar (backend v2)
 * UbicaciÃ³n: src/app/services/providers/api-program.provider.ts
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
  start: string;
  end: string;
  durationMinutes?: number;
  description?: string;
  image?: string;
  category?: string;
  subgenre?: string;
  rating?: string;
  details?: Record<string, string>;
  gridColumnStart?: number;
  gridColumnEnd?: number;
  layerIndex?: number;
  isCutAtStart?: boolean;
  isCutAtEnd?: boolean;
  visibleStartTime?: string;
  visibleEndTime?: string;
  crossesMidnight?: boolean;
  layoutsBySlot?: any[];
  fieldsProvided?: string;
  pxStart?: number;
  pxWidth?: number;
  timeSlotIndex?: number;
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
  private readonly typeOrder: Record<string, number> = {
    TDT: 0,
    AUTONOMICO: 1,
    MOVISTAR: 2,
    CABLE: 3,
    OTT: 4,
  };
  private readonly tdtPriority = [
    'LA 1',
    'LA 2',
    'ANTENA 3',
    'CUATRO',
    'TELECINCO',
    'LA SEXTA',
    'PARAMOUNT NETWORK',
    'DIVINITY',
    'DKISS',
    'TEN',
    'BE MAD',
    'MEGA',
    'DMAX',
    'ENERGY',
    'FDF',
    'ATRESERIES',
    'NEOX',
    'NOVA',
  ];

  constructor(
    private http: HttpClient,
    private cache: ICacheManager<any[]>,
    private logger: ILogger,
    private configService: AppConfigurationService
  ) {
    const apiConfig = this.configService.getApiConfig();
    this.baseUrl = apiConfig.backend?.baseUrl;
  }

  /**
   * Construye una URL segura hacia el backend evitando dobles barras o baseUrl vacía.
   * Lanza un error claro si no hay baseUrl configurada para evitar peticiones a "/".
   */
  private buildUrl(path: string): string {
    const base = (this.baseUrl || '').replace(/\/+$/, '');
    if (!base) {
      throw new Error('[ApiProgramProvider] backend baseUrl is not configured');
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  getPrograms(date: string): Observable<ITvProgram[]> {
    // Canonical endpoint /v2/programs with layout precomputado
    const cacheKey = `${CacheKeys.TODAY_PROGRAMS}_${date}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.info(`[ApiProgramProvider] Returning cached programs for ${date}`);
      return of(cached);
    }

    const url = this.buildUrl('/programs');
    this.logger.info(`[ApiProgramProvider] Fetching programs for ${date} from ${url}`);
    return this.http.get<any>(url, {
      // fields=minimal reduce payload; backend soporta alias de fecha
      // Exclude Autonomico channels as they require region validation
      params: {
        date,
        fields: 'minimal',
        limit: 5000,
        channelTypes: 'TDT,CABLE,MOVISTAR,AUTONOMICO,OTT',
      } as any,
    })
      .pipe(
        tap(response => this.logger.info(`[ApiProgramProvider] Raw response received for ${date}`, response)),
        map((response) => (response as any)?.data ?? response),
        map((payload) => {
          const channels: any[] = payload?.channels ?? [];
          const programs: ApiProgram[] = payload?.programs ?? [];
          
          this.logger.info(`[ApiProgramProvider] Payload parsed: ${channels.length} channels, ${programs.length} programs`);
          
          if (!programs.length || !channels.length) return [];

          const channelMap = new Map(
            channels.map((c) => [
              c.id,
              {
                ...c,
                type: this.normalizeChannelType(c.type, c.name),
              },
            ])
          );
          return programs
            .map((p) => ({
              id: p.id,
              title: p.title,
              start: p.start,
              end: p.end,
              duration: p.durationMinutes ?? this.calculateDuration(p.start, p.end),
              channel_id: p.channelId,
              channel:
                channelMap.get(p.channelId) || {
                  id: p.channelId,
                  name: '',
                  type: this.normalizeChannelType(undefined, ''),
                },
              desc: p.description ? { value: p.description, lang: 'es' } : undefined,
              category: p.category ? { value: p.category, lang: 'es' } : undefined,
              image: p.image,
              starRating: p.rating ? Number(p.rating) : undefined,
              // layout fields (para compatibilidad futura)
              gridColumnStart: p.gridColumnStart,
              gridColumnEnd: p.gridColumnEnd,
              layerIndex: p.layerIndex,
              isCutAtStart: p.isCutAtStart,
              isCutAtEnd: p.isCutAtEnd,
              visibleStartTime: p.visibleStartTime,
              visibleEndTime: p.visibleEndTime,
              crossesMidnight: p.crossesMidnight,
              layoutsBySlot: p.layoutsBySlot,
              pxStart: p.pxStart,
              pxWidth: p.pxWidth,
              timeSlotIndex: p.timeSlotIndex,
            }))
            .sort((a, b) =>
              this.compareChannels(
                a.channel?.type,
                b.channel?.type,
                a.channel?.name,
                b.channel?.name
              )
            );
        }),
        tap((programs) => {
          this.logger.info(`[ApiProgramProvider] Processed ${programs.length} programs`);
          this.cache.set(cacheKey, programs);
        }),
        catchError((error) => {
          this.logger.error(`[ApiProgramProvider] Failed to fetch programs for ${date}`, error);
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
          start: (program as any).startTime ?? program.start,
          end: (program as any).endTime ?? program.end,
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
          category: program.category
            ? { value: program.category, lang: 'es' }
            : undefined,
          starRating: program.rating ? Number(program.rating) : undefined,
          image: program.image,
          duration:
            program.durationMinutes ??
            (program as any).duration ??
            this.calculateDuration(
              (program as any).startTime ?? program.start,
              (program as any).endTime ?? program.end
            ),
        });
      });
    });

    return allPrograms;
  }

  // Modo para compatibilidad con ProgramListComponent
  getProgramsForProgramList(date: string): Observable<any[]> {
    const url = this.buildUrl(`/layouts/${date}`);
    this.logger.info?.(
      `[ApiProgramProvider] Fetching layouts for ${date} from ${url}`
    );
    return this.http.get<any>(url, {
      // Exclude Autonomico channels as they require region validation
      params: {
        fields: 'full',
        channelTypes: 'TDT,CABLE,MOVISTAR,AUTONOMICO,OTT',
      } as any,
    })
      .pipe(
        map((response) => (response as any)?.data ?? response),
        map((payload) => {
          const channels: any[] = payload?.channels ?? [];
          this.logger.info?.(
            `[ApiProgramProvider] Layouts received: channels=${channels.length}, timeSlots=${payload?.timeSlots?.length ?? 0}`
          );
          const sample = channels[0];
          if (sample) {
            this.logger.info?.(
              `[ApiProgramProvider] Sample channel: ${sample?.channel?.id || 'n/a'} - programs=${sample?.programs?.length ?? 0}`
            );
          }
          const mapped = channels.map((entry: any) => {
            const channelInfoRaw =
              entry?.channel || entry?.channelInfo || entry || { id: '', name: '' };
            const channelInfo = {
              ...channelInfoRaw,
              icon:
                channelInfoRaw.icon ||
                channelInfoRaw.logo ||
                channelInfoRaw.logoUrl ||
                '',
              type: this.normalizeChannelType(
                channelInfoRaw.type,
                channelInfoRaw.name
              ),
            };
            return {
            id: channelInfo.id,
            channel: channelInfo,
            channels: (entry?.programs || []).map((p: any) => ({
              id: p.id,
              title: p.title,
              start: p.start,
              stop: p.end,
              duracion:
                p.durationMinutes ??
                this.calculateDuration(
                  (p as any).startTime ?? p.start,
                  (p as any).endTime ?? p.end
                ),
              desc: p.description ? { value: p.description, lang: 'es' } : undefined,
              category: p.category ? { value: p.category, lang: 'es' } : undefined,
              image: p.image,
              rating: p.rating,
              gridColumnStart: p.gridColumnStart,
              gridColumnEnd: p.gridColumnEnd,
              layerIndex: p.layerIndex,
              isCutAtStart: p.isCutAtStart,
              isCutAtEnd: p.isCutAtEnd,
              visibleStartTime: p.visibleStartTime,
              visibleEndTime: p.visibleEndTime,
              crossesMidnight: p.crossesMidnight,
              layoutsBySlot: p.layoutsBySlot,
              fieldsProvided: p.fieldsProvided,
              pxStart: p.pxStart,
              pxWidth: p.pxWidth,
              timeSlotIndex: p.timeSlotIndex,
            })),
          };
          });

          return mapped.sort((a: any, b: any) =>
            this.compareChannels(
              a.channel?.type,
              b.channel?.type,
              a.channel?.name,
              b.channel?.name
            )
          );
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

  private normalizeChannelType(type: string | undefined, name: string): string | undefined {
    const normalized =
      type && String(type).trim() ? String(type).trim().toUpperCase() : '';
    if (normalized) return normalized;

    const n = (name || '').toUpperCase();
    if (!n) return undefined;

    const isAutonomico =
      /TV3|ETB|ARAG|CANAL SUR|TELEMADRID|CMM|IB3|TVG|LA 7|PUNT|NAVARRA|CANARIA|ANDALUCIA|EXTREMADURA|TPA|CYL|CASTILLA/.test(
        n
      );
    const isMovistar = /M\+|MOVISTAR/.test(n);
    const isCable = /SKY|FOX|AXN|TNT|ESPN|HBO|SYFY/.test(n);
    const isOtt =
      /RAKUTEN|RUNTIME|PLUTO|DAZN|AMAZON|NETFLIX|APPLE|ATRESPLAYER|RTVE PLAY/.test(
        n
      );

    if (isAutonomico) return 'AUTONOMICO';
    if (isMovistar) return 'MOVISTAR';
    if (isCable) return 'CABLE';
    if (isOtt) return 'OTT';
    return 'TDT';
  }

  private compareChannels(
    typeA?: string,
    typeB?: string,
    nameA?: string,
    nameB?: string
  ): number {
    const tA = (typeA || '').toUpperCase();
    const tB = (typeB || '').toUpperCase();

    const oA = this.typeOrder[tA] ?? 99;
    const oB = this.typeOrder[tB] ?? 99;
    if (oA !== oB) return oA - oB;

    // Prioridad TDT conocida
    if (tA === 'TDT' && tB === 'TDT') {
      const idxA = this.tdtPriority.indexOf((nameA || '').toUpperCase());
      const idxB = this.tdtPriority.indexOf((nameB || '').toUpperCase());
      if (idxA !== -1 || idxB !== -1) {
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        if (idxA !== idxB) return idxA - idxB;
      }
    }

    return (nameA || '').localeCompare(nameB || '', 'es', {
      sensitivity: 'base',
    });
  }
}
