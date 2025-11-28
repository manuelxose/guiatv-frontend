import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { TvApiService } from '../api/tv-api.service';
import { TvDataService } from '../state/tv-data.service';
import { ProgramsResponse } from '../api/models';
const DEFAULT_CHANNEL_TYPES = ['TDT', 'CABLE', 'MOVISTAR', 'AUTONOMICO', 'OTT'];

/**
 * HttpService unificado y mínimo.
 * - Delegado TV: usa TvApiService (v2) para programaciones.
 * - Delegado genérico: expone get/post/put/delete para otros usos (ej. blog).
 * - Sin caches ni lógica legacy; solo adaptaciones básicas.
 */
@Injectable({ providedIn: 'root' })
export class HttpService {
  private programasSource = new BehaviorSubject<any[]>([]);
  public programas$ = this.programasSource.asObservable();

  constructor(
    private http: HttpClient,
    private tvApi: TvApiService,
    private tvData: TvDataService
  ) {}

  // Métodos genéricos
  get<T>(url: string, headers?: HttpHeaders): Observable<T> {
    return this.http.get<T>(url, { headers });
  }

  post<T>(url: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(url, body, { headers });
  }

  put<T>(url: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(url, body, { headers });
  }

  delete<T>(url: string, headers?: HttpHeaders): Observable<T> {
    return this.http.delete<T>(url, { headers });
  }

  /**
   * Programación TV desde layouts precalculados.
   * Sustituye antiguos métodos de Firebase/legacy.
   */
  getProgramacion(dia: 'yesterday' | 'today' | 'tomorrow' | 'after_tomorrow' | string): Observable<any[]> {
    return this.tvData
      .loadPrograms({
        date: dia as any,
        fields: 'minimal',
        limit: 5000,
        channelTypes: DEFAULT_CHANNEL_TYPES,
      })
      .pipe(
        map((resp: ProgramsResponse) => {
          const channels = resp.channels || [];
          const programs = resp.programs || [];
          return channels.map((c) => ({
            channel: c,
            programs: programs.filter((p) => p.channelId === c.id),
          }));
        })
      );
  }

  // Compatibilidad: setProgramas actualiza el BehaviorSubject
  setProgramas(programas: any[], _date?: string): Promise<void> {
    this.programasSource.next(programas || []);
    return Promise.resolve();
  }

  // ===== TMDb stubs (compatibilidad) =====
  getPerson(_person: string): Observable<any> {
    return of({ results: [] });
  }
  getMovieId(_movie: string): Observable<any> {
    return of({ results: [] });
  }
  getSeriesId(_serie: string): Observable<any> {
    return of({ results: [] });
  }
  getSeriesDetails(_id: string): Observable<any> {
    return of({});
  }
  getSimilarSeries(_id: string): Observable<any> {
    return of({ results: [] });
  }
  getPopularSeries(): Observable<any> {
    return of({ results: [] });
  }
  getMovieDetails(_id: string): Observable<any> {
    return of({});
  }
  getSimilarMovie(_id: string): Observable<any> {
    return of({ results: [] });
  }
  getPopularMovies(): Observable<any> {
    return of({ results: [] });
  }
}
