import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ContentService } from '../state/content.service';
import { TvDataService } from '../state/tv-data.service';
import { DateAlias } from '../api/models';
const DEFAULT_CHANNEL_TYPES = ['TDT', 'CABLE', 'MOVISTAR', 'AUTONOMICO', 'OTT'];

/**
 * TvGuideService - Lightweight compatibility layer
 * Delegates all operations to ContentService
 * 
 * @deprecated This service exists for backward compatibility only.
 * New code should use ContentService directly.
 */
@Injectable({ providedIn: 'root' })
export class TvGuideService {
  private currentData: any[] = [];
  private isMovies = false;
  private isSeries = false;
  private detallesProgramaSource = new BehaviorSubject<any | null>(null);
  public detallesPrograma$ = this.detallesProgramaSource.asObservable();

  constructor(
    private contentSvc: ContentService,
    private tvData: TvDataService
  ) {}

  /**
   * Set data manually (legacy compatibility)
   */
  setData(programs: any[]): void {
    this.currentData = Array.isArray(programs) ? programs : [];
  }

  /**
   * Get programs and channels stream (legacy)
   */
  getProgramsAndChannels(): Observable<any[]> {
    return this.contentSvc.loadContent('all').pipe(
      map((snapshot) => snapshot.items)
    );
  }

  /**
   * Load data from API
   */
  getFromApi(date: DateAlias = 'today'): Observable<any[]> {
    return this.tvData
      .loadPrograms({
        date,
        fields: 'full', // Changed from 'minimal' to get complete data
        limit: 5000,
        channelTypes: DEFAULT_CHANNEL_TYPES,
      })
      .pipe(
        map((resp) => {
          console.log('TvGuideService.getFromApi raw response:', { 
            channelsCount: resp.channels?.length, 
            programsCount: resp.programs?.length 
          });
          const channels = resp.channels || [];
          const programs = resp.programs || [];
          
          const grouped = channels.map((c) => {
            const channelPrograms = programs.filter((p) => p.channelId === c.id);
            if (c.id === 'la_1') {
              console.log('🔍 Programs for La 1:', {
                channelId: c.id,
                channelName: c.name,
                totalPrograms: programs.length,
                filteredCount: channelPrograms.length,
                sample: channelPrograms[0]
              });
            }
            return {
              channel: c,
              programs: channelPrograms,
            };
          });
          return grouped;
        }),
        tap((channels) => this.setData(channels))
      );
  }

  /**
   * Get programs by channel
   */
  getProgramsByChannel(channelId: string): any[] {
    return this.contentSvc.getProgramsByChannel(channelId);
  }

  /**
   * Get programs by category
   */
  getProgramsByCategory(category: string, channel?: string): any[] {
    return this.contentSvc.getProgramsByCategory(category, channel);
  }

  /**
   * Get channel categories from programs
   */
  getChannelCategories(programs?: any[]): string[] {
    return this.contentSvc.getAllCategories();
  }

  /**
   * Get channels by type
   */
  getAutonomicoCanales(): any[] {
    return this.contentSvc.getChannelsByType('AUTONOMICO');
  }

  getTDTCanales(): any[] {
    return this.contentSvc.getChannelsByType('TDT');
  }

  getMovistarCanales(): any[] {
    return this.contentSvc.getChannelsByType('MOVISTAR');
  }

  getCableCanales(): any[] {
    return this.contentSvc.getChannelsByType('CABLE');
  }

  getDeportesCanales(): any[] {
    return this.contentSvc.getChannelsByType('DEPORTES');
  }

  /**
   * Get all movies (deprecated - use ContentService.loadContent('movies'))
   */
  getAllMovies(): any[] {
    return this.contentSvc.getLivePrograms('movies');
  }

  /**
   * Get all series (deprecated - use ContentService.loadContent('series'))
   */
  getAllSeries(): any[] {
    return this.contentSvc.getLivePrograms('series');
  }

  /**
   * Set featured content (deprecated - handled by ContentService)
   */
  setPeliculasDestacadas(): void {
    // No-op: ContentService handles featured content automatically
  }

  setSeriesDestacadas(): void {
    // No-op: ContentService handles featured content automatically
  }

  /**
   * Get featured content (deprecated)
   */
  getPeliculasDestacadas(): Observable<any[]> {
    return this.contentSvc.loadContent('movies').pipe(
      map((snapshot) => snapshot.items.slice(0, 10))
    );
  }

  getSeriesDestacadas(): Observable<any[]> {
    return this.contentSvc.loadContent('series').pipe(
      map((snapshot) => snapshot.items.slice(0, 10))
    );
  }

  /**
   * State management methods (legacy compatibility)
   */
  setIsMovies(): void {
    this.isMovies = true;
    this.isSeries = false;
  }

  setIsSeries(): void {
    this.isSeries = true;
    this.isMovies = false;
  }

  getIsMovies(): boolean {
    return this.isMovies;
  }

  getIsSeries(): boolean {
    return this.isSeries;
  }

  setDetallesPrograma(programa: any): void {
    this.detallesProgramaSource.next(programa);
  }

  getDetallesPrograma(): Observable<any | null> {
    return this.detallesPrograma$;
  }
}
