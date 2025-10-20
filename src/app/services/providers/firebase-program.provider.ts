/**
 * Provider para datos de programación desde Firebase - ADAPTADO A ESTRUCTURA REAL
 * Ubicación: src/app/services/providers/firebase-program.provider.ts
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import {
  IProgramDataProvider,
  ITvProgram,
  IChannel,
  ICacheManager,
  ILogger,
  CacheKeys,
} from '../../interfaces';
import { AppConfigurationService } from '../core/config.service';

/**
 * Estructura real de datos que viene de Firebase
 */
interface FirebaseChannelData {
  channel: {
    id: string;
    name: string;
    icon: string;
    type?: string;
  };
  programs: any[]; // Array de programas para este canal
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseProgramProvider implements IProgramDataProvider {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private cache: ICacheManager<any[]>,
    private logger: ILogger,
    private configService: AppConfigurationService
  ) {
    this.baseUrl = this.configService.getApiConfig().firebase.baseUrl;
  }

  getPrograms(date: string): Observable<ITvProgram[]> {
    const cacheKey = `${CacheKeys.TODAY_PROGRAMS}_${date}`;

    // Verificar cache primero
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.info(`Using cached programs for ${date}`, {
        count: cached.length,
      });
      return of(cached);
    }

    this.logger.info(`Fetching programs from Firebase for ${date}`);

    return this.http.get<any>(`${this.baseUrl}/programas/date/${date}`).pipe(
      // If the API returns a manifest { jsonUrl, channels, cached }, follow the jsonUrl
      switchMap((resp) => {
        if (resp && resp.jsonUrl) {
          // Fetch the precomputed JSON directly from storage via the signed URL
          return this.http.get<FirebaseChannelData[]>(resp.jsonUrl);
        }
        // Otherwise the response is already the array
        return of(resp as FirebaseChannelData[]);
      }),
      map((channelDataArray) => this.transformFirebaseData(channelDataArray)),
      tap((programs) => {
        this.cache.set(cacheKey, programs);
        this.logger.info(`Programs cached for ${date}`, {
          count: programs.length,
          channels: this.extractUniqueChannels(programs).length,
        });
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

    this.logger.info('Fetching channels from Firebase');

    return this.http.get<IChannel[]>(`${this.baseUrl}/canales`).pipe(
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

  /**
   * MÉTODO CLAVE: Transforma la estructura de Firebase a la estructura esperada
   *
   * Firebase: [{ channel: {...}, programs: [...] }]
   * Esperado: [{ id, title, start, end, channel, ... }]
   */
  private transformFirebaseData(
    channelDataArray: FirebaseChannelData[]
  ): ITvProgram[] {
    if (!Array.isArray(channelDataArray)) {
      this.logger.warn(
        'Invalid channel data received from Firebase',
        channelDataArray
      );
      return [];
    }

    this.logger.debug(
      `Transforming ${channelDataArray.length} channels from Firebase`
    );

    const allPrograms: ITvProgram[] = [];

    channelDataArray.forEach((channelData, channelIndex) => {
      if (!channelData || !channelData.channel) {
        this.logger.warn(
          `Invalid channel data at index ${channelIndex}`,
          channelData
        );
        return;
      }

      const channel = channelData.channel;
      const programs = channelData.programs || [];

      // Transformar cada programa de este canal
      programs.forEach((program, programIndex) => {
        const transformedProgram: ITvProgram = {
          id: program.id || this.generateId(channelIndex, programIndex),
          title: program.title || 'Sin título',
          start: program.start,
          end: program.end || program.stop, // Manejar ambos campos
          channel_id: channel.id,
          channel: {
            id: channel.id,
            name: channel.name,
            icon: channel.icon || '',
            type: channel.type,
          },
          category: program.category,
          desc: program.desc,
          starRating: program.starRating,
        };

        allPrograms.push(transformedProgram);
      });
    });

    this.logger.info(
      `Transformed ${allPrograms.length} total programs from ${channelDataArray.length} channels`
    );

    // Log de muestra para debugging
    if (allPrograms.length > 0) {
      this.logger.debug('Sample transformed program:', allPrograms[0]);
    }

    return allPrograms;
  }

  /**
   * Extrae canales únicos de los programas
   */
  private extractUniqueChannels(programs: ITvProgram[]): IChannel[] {
    const channelMap = new Map<string, IChannel>();

    programs.forEach((program) => {
      if (program.channel && !channelMap.has(program.channel.id)) {
        channelMap.set(program.channel.id, program.channel);
      }
    });

    return Array.from(channelMap.values());
  }

  /**
   * Genera ID único para programas sin ID
   */
  private generateId(channelIndex: number, programIndex: number): string {
    return `program_${Date.now()}_${channelIndex}_${programIndex}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * MÉTODO ADICIONAL: Para compatibilidad con ProgramListComponent
   * Devuelve los datos en el formato que espera ProgramListComponent
   */
  getProgramsForProgramList(date: string): Observable<any[]> {
    console.log(
      `🔥 Firebase: Obteniendo programas en formato ProgramList para ${date}`
    );

    const url = `${this.baseUrl}/programas/date/${date}`;
    console.log(`📡 URL de la petición: ${url}`);

    return this.http.get<any>(url).pipe(
      switchMap((resp) => {
        if (resp && resp.jsonUrl) {
          return this.http.get<FirebaseChannelData[]>(resp.jsonUrl);
        }
        return of(resp as FirebaseChannelData[]);
      }),
      tap((response) => {
        console.log(
          `✅ Firebase: Respuesta recibida, ${response.length} canales`
        );
      }),
      map((channelDataArray) => {
        const transformed = this.transformForProgramList(channelDataArray);
        console.log(`🔄 Datos transformados: ${transformed.length} canales`);
        return transformed;
      }),
      tap((data) => {
        this.logger.info(`✅ ProgramList format data prepared`, {
          channelsCount: data.length,
          totalPrograms: data.reduce(
            (sum, ch) => sum + (ch.channels?.length || 0),
            0
          ),
        });
      }),
      catchError((error) => {
        console.error(`❌ Firebase: Error en getProgramsForProgramList`, error);
        this.logger.error(
          `Failed to fetch programs for ProgramList format`,
          error
        );
        throw error;
      })
    );
  }

  /**
   * Transforma datos para ProgramListComponent manteniendo estructura original
   */
  private transformForProgramList(
    channelDataArray: FirebaseChannelData[]
  ): any[] {
    if (!Array.isArray(channelDataArray)) {
      this.logger.warn('Invalid data for ProgramList transformation');
      return [];
    }

    return channelDataArray.map((channelData) => ({
      id: channelData.channel.id,
      channel: channelData.channel,
      channels: channelData.programs.map((program) => ({
        ...program,
        // Asegurar campos necesarios para ProgramListComponent
        id: program.id || this.generateId(0, 0),
        duracion: this.calculateDuration(
          program.start,
          program.end || program.stop
        ),
        start: program.start,
        stop: program.end || program.stop,
      })),
    }));
  }

  /**
   * Calcula duración en minutos
   */
  private calculateDuration(start: string, end: string): number {
    if (!start || !end) return 30; // Duración por defecto

    try {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      return Math.max(1, Math.floor((endTime - startTime) / (1000 * 60))); // Minutos
    } catch (error) {
      this.logger.warn('Error calculating duration', { start, end, error });
      return 30;
    }
  }
}
