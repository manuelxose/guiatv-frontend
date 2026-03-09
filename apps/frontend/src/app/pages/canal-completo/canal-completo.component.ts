import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
  ViewChildren,
  QueryList,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, first, filter, tap } from 'rxjs';
import { BannerComponent } from 'src/app/components/banner/banner.component';
import { SliderComponent } from 'src/app/components/slider/slider.component';
import { TvDataService } from 'src/app/state/tv-data.service';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { isLive } from 'src/app/utils/utils';
import { ApiConfigService } from 'src/app/api/api-config.service';
import { DeviceDetectorService } from 'src/app/services/device-detector.service';
import { environment } from 'src/environments/environment';

interface DayOption {
  label: string;
  value: string;
}


interface TimeSlot {
  hour: string;
  label: string;
  programs: any[];
  isActive: boolean;
}

interface RelatedChannel {
  id: string;
  name: string;
}

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  dataFetchTime: number;
}

const devConsole = environment.production
  ? {
      log: (..._args: unknown[]) => undefined,
      warn: (..._args: unknown[]) => undefined,
      error: (..._args: unknown[]) => undefined,
      debug: (..._args: unknown[]) => undefined,
      info: (..._args: unknown[]) => undefined,
      group: (..._args: unknown[]) => undefined,
      groupEnd: (..._args: unknown[]) => undefined,
    }
  : console;

interface RelatedChannel {
  id: string;
  name: string;
}

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  dataFetchTime: number;
}

@Component({
  selector: 'app-canal-completo',
  templateUrl: './canal-completo.component.html',
  styleUrls: ['./canal-completo.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    SliderComponent,
    BannerComponent,
    RouterModule,
  ],
})
export class CanalCompletoComponent implements OnInit, OnDestroy {
  // Dependency Injection - Migrated to new services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tvDataService = inject(TvDataService);
  private svcGuide = inject(TvGuideService);
  private metaSvc = inject(MetaService);
  private cdr = inject(ChangeDetectorRef);
  private apiConfig = inject(ApiConfigService);
  public deviceDetector = inject(DeviceDetectorService);

  // ViewChildren for slider controls
  @ViewChildren('timeSlotSlider') timeSlotSliders!: QueryList<SliderComponent>;
  @ViewChildren('categorySlider') categorySliders!: QueryList<SliderComponent>;
  @ViewChild('fullScheduleSlider') fullScheduleSlider?: SliderComponent;
  @ViewChild('otherChannelsSlider') otherChannelsSlider?: SliderComponent;

  // Public Properties
  public query: string = '';
  public diaSeleccionado: string = 'Hoy';
  public activeDayAlias: 'yesterday' | 'today' | 'tomorrow' | 'after_tomorrow' = 'today';
  public canal: string = '';
  public programs: any[] = [];
  public program: any = {};
  public categorias: any[] = [];
  public categoriaSeleccionada: string = 'Selecciona una categoría';
  public logo: string = '';
  public channel: any = {};
  public live_programs: any[] = [];
  public isLoading: boolean = true;
  public error: string | null = null;
  public channelDescription: string | null = null;

  // New Properties for Enhanced Features
  public days: DayOption[] = [
    { label: 'Hoy', value: 'today' },
    { label: 'Mañana', value: 'tomorrow' },
    { label: 'Pasado', value: 'after_tomorrow' },
  ];

  public selectedTimeSlot: string | null = null;
  public selectedCategory: string | null = null;
  public timeSlots: TimeSlot[] = []; // Filters
  public relatedChannels: RelatedChannel[] = [];

  // Private Properties
  private destroy$ = new Subject<void>();
  private performanceMetrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    dataFetchTime: 0,
  };
  private componentStartTime: number = 0;

  // Dropdown States
  public isDayDropdownOpen: boolean = false;
  public isTimeSlotDropdownOpen: boolean = false;
  public isCategoryDropdownOpen: boolean = false;

  // Category Icons Map
  private categoryIcons: { [key: string]: string } = {
    Películas:
      '<path fill="currentColor" d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>',
    Series:
      '<path fill="currentColor" d="M21 3H3c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.11-.9-2-2-2zm0 14H3V5h18v12z"/>',
    Deportes:
      '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>',
    Documentales:
      '<path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>',
    Infantil:
      '<path fill="currentColor" d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"/>',
    Noticias:
      '<path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>',
    Entretenimiento:
      '<path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>',
    Cultura:
      '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
    default:
      '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
  };

  ngOnInit(): void {
    this.componentStartTime = performance.now();
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.logPerformanceMetrics();
  }

  /**
   * Resolve image URL to absolute path
   */
  private resolveImageUrl(url?: string | null): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const base = this.apiConfig.getAssetBaseUrl();
    if (url.startsWith('/')) {
      return `${base}${url}`;
    }
    return `${base}/${url}`;
  }

  /**
   * Format channel name from URL parameter
   */
  private formatChannelName(query: string): string {
    return query.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Format day name from route parameter
   */
  private formatDayName(dia: string): string {
    switch (dia) {
      case 'today':
        return 'Hoy';
      case 'tomorrow':
        return 'Mañana';
      case 'after_tomorrow':
        return 'Pasado mañana';
      default:
        return 'Hoy';
    }
  }

  private normalizeChannelToken(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private buildLocalChannelIcon(channelRef?: string): string {
    const token = this.normalizeChannelToken(channelRef || this.query || this.canal);
    return `/storage/channel_icons/${encodeURIComponent(token)}.webp`;
  }

  /**
   * Initialize component with route params and data
   */
  private initializeComponent(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        tap((params) => {
          this.query = params.get('id')?.toString() || '';
          this.canal = this.formatChannelName(this.query);
        })
      )
      .subscribe(() => {
        this.setupMetaTags();
        this.loadProgramData();
      });
  }

  /**
   * Setup SEO meta tags
   */
  private setupMetaTags(): void {
    const canonicalUrl = this.router.url;
    const channelName = this.canal;
    const dayText = this.diaSeleccionado.toLowerCase();

    this.metaSvc.setMetaTags({
      title: `Programación de ${channelName} ${dayText} - Guía TV Completa en Directo`,
      description: `✓ Consulta qué ver en ${channelName} ${dayText}. Parrilla completa con horarios, programas en directo, películas y series. Guía TV actualizada de ${channelName}.`,
      canonicalUrl: canonicalUrl,
      keywords: `${channelName}, programación ${channelName}, ${channelName} ${dayText}, guía tv ${channelName}, ${channelName} en directo, parrilla ${channelName}, horarios ${channelName}, qué ver ${channelName}`,
      ogTitle: `Programación ${channelName} ${dayText} - Todos los Programas y Horarios`,
      ogDescription: `Descubre toda la programación de ${channelName} ${dayText}. Películas, series, documentales y mucho más. Guía TV actualizada en tiempo real.`,
      ogType: 'website',
      ogImage: `https://guiaprogramaciontv.com${this.buildLocalChannelIcon(this.query)}`,
    });
  }

  /**
   * Load program data using TvDataService
   */
  private loadProgramData(): void {
    this.isLoading = true;
    const dataFetchStart = performance.now();

    try {
      this.svcGuide
        .getFromApi(this.activeDayAlias)
        .pipe(first(), takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            devConsole.log(`📦 CANAL-COMPLETO - Data loaded from API`);
            this.performanceMetrics.dataFetchTime =
              performance.now() - dataFetchStart;
            this.managePrograms(data);
          },
          error: (error) => this.handleError(error),
        });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Change day and reload data using TvDataService
   */
  public async cambiarDia(dia: string): Promise<void> {
    this.isLoading = true;
    this.diaSeleccionado = this.formatDayName(dia);
    this.activeDayAlias = dia as any;

    try {
      this.svcGuide
        .getFromApi(this.activeDayAlias)
        .pipe(first(), takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.managePrograms(data);
            this.setupMetaTags();
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.handleError(error);
            this.isLoading = false;
          },
        });
    } catch (error) {
      this.handleError(error);
      this.isLoading = false;
    }
  }

  /**
   * Process and organize program data
   */
  private managePrograms(programas: any): void {
    const renderStart = performance.now();

    try {
      // Store data in legacy service for compatibility
      this.svcGuide.setData(programas);
      
      // Normalize search term
      const normalizeChannelName = (name: string) => {
        return name.toLowerCase()
          .replace(/\s+/g, '_')  // spaces to underscores
          .replace(/-/g, '_')    // hyphens to underscores
          .replace(/\./g, '')    // remove dots
          .trim();
      };
      
      const searchTerm = normalizeChannelName(this.canal);
      
      // Log available channels for debugging
      devConsole.log('🔍 CANAL-COMPLETO - Buscando canal:', {
        original: this.canal,
        normalized: searchTerm,
        availableChannels: programas.slice(0, 10).map((g: any) => ({
          name: g.channel?.name,
          id: g.channel?.id,
          normalized: normalizeChannelName(g.channel?.name || g.channel?.id || '')
        }))
      });
      
      // Find the channel group that matches this canal (by name or ID)
      const channelGroup = programas.find((group: any) => {
        const groupName = normalizeChannelName(group.channel?.name || '');
        const groupId = normalizeChannelName(group.channel?.id || '');
        
        return groupName === searchTerm || 
               groupId === searchTerm ||
               groupName.includes(searchTerm) ||
               groupId.includes(searchTerm);
      });
      
      // Extract programs from the found channel group
      if (channelGroup) {
        devConsole.log('🔎 Canal Group structure:', {
          hasChannel: !!channelGroup.channel,
          hasPrograms: !!channelGroup.programs,
          programsLength: channelGroup.programs?.length || 0,
          programsIsArray: Array.isArray(channelGroup.programs),
          keys: Object.keys(channelGroup),
          sample: channelGroup
        });
        
        if (channelGroup.programs && channelGroup.programs.length > 0) {
          // Set noindex for non-curated channel types (Cable, Movistar, OTT)
          const channelType = channelGroup.channel?.type;
          if (channelType && channelType !== 'TDT' && channelType !== 'Autonomico') {
            this.metaSvc.setMetaTags({
              title: `Programación de ${this.canal} ${this.diaSeleccionado.toLowerCase()} - Guía TV Completa en Directo`,
              description: `✓ Consulta qué ver en ${this.canal} ${this.diaSeleccionado.toLowerCase()}. Parrilla completa con horarios, programas en directo, películas y series.`,
              canonicalUrl: this.router.url,
              robots: 'noindex, follow',
            });
          }

          this.logo = this.buildLocalChannelIcon(
            channelGroup.channel?.id || channelGroup.channel?.name || this.query
          );
          this.channelDescription = channelGroup.channel?.description || null;
          if (this.channelDescription) {
            this.metaSvc.setMetaTags({
              title: `Programación de ${this.canal} ${this.diaSeleccionado.toLowerCase()} - Guía TV Completa en Directo`,
              description: `${this.channelDescription} Consulta la parrilla completa de ${this.canal} ${this.diaSeleccionado.toLowerCase()} con horarios y programas en directo.`,
              canonicalUrl: this.router.url,
            });
          }
          this.programs = channelGroup.programs.map((p: any) => {
            const imageUrl = p.poster || p.icon || p.image;
            return {
              ...p,
              stop: p.stop || p.end,
              icon: this.resolveImageUrl(imageUrl),
              poster: this.resolveImageUrl(imageUrl),
              channel: channelGroup.channel?.name || channelGroup.channel?.id || this.canal
            };
          });
          
          devConsole.log('✅ Canal encontrado:', channelGroup.channel?.name, 'con', this.programs.length, 'programas');
        } else {
          devConsole.warn('⚠️ Canal encontrado pero sin programas:', channelGroup.channel?.name);
          this.programs = [];
        }
      } else {
        devConsole.warn('⚠️ No se encontró el canal:', this.canal, 'normalizado:', searchTerm);
        this.programs = [];
        // Channel not found — show 404 page with correct HTTP status
        void this.router.navigate(['/not-found'], { skipLocationChange: true });
        this.isLoading = false;
        this.cdr.markForCheck();
        return;
      }

      // Find current live program
      let foundProgram = this.programs.find((programa: any) => {
        const end = programa.end || programa.stop;
        return isLive(programa.start, end);
      });
      
      // Normalize the program object for the banner component
      if (foundProgram) {
        const imageUrl = foundProgram.poster || foundProgram.icon || foundProgram.image;
        this.program = {
          ...foundProgram,
          stop: foundProgram.stop || foundProgram.end,
          channel: typeof foundProgram.channel === 'string' 
            ? foundProgram.channel 
            : foundProgram.channel?.name || foundProgram.channel?.id || this.canal,
          icon: this.resolveImageUrl(imageUrl),
          poster: this.resolveImageUrl(imageUrl)
        };
      } else {
        devConsole.warn('⚠️ No se encontró programa en directo para', this.canal);
      }

      // Reset and populate live programs from OTHER channels
      this.live_programs = [];
      for (let group of programas) {
        // Skip the current channel
        if (group.channel?.name?.toLowerCase() === this.canal.replace('-', ' ').toLowerCase()) {
          continue;
        }
        
        let liveProgram = group.programs.find((p: any) => {
          const end = p.end || p.stop;
          return isLive(p.start, end);
        });

        if (liveProgram && liveProgram.title?.value !== 'Cine') {
          // Enrich program with channel info for the slider
          const imageUrl = liveProgram.poster || liveProgram.icon || liveProgram.image || group.channel?.icon;
          const enrichedProgram = {
            ...liveProgram,
            stop: liveProgram.stop || liveProgram.end,
            channel: group.channel?.name || group.channel?.id || group.channel,
            channelId: group.channel?.id,
            channelName: group.channel?.name,
            icon: this.resolveImageUrl(imageUrl),
            poster: this.resolveImageUrl(imageUrl)
          };
          this.live_programs.push(enrichedProgram);
        }
      }
      
      devConsole.log('📦 CANAL-COMPLETO - Processed Data:', {
        canal: this.canal,
        programsCount: this.programs.length,
        currentProgram: this.program,
        liveProgramsCount: this.live_programs.length,
        sampleLiveProgram: this.live_programs[0]
      });

      // Get categories
      this.categorias = this.svcGuide.getChannelCategories(this.programs);

      // Default category is null ("Todas")
      // The user specifically requested "que en categorias aparezca todas las categorias de inicio"
      this.selectedCategory = null;

      // Organize programs by time slots
      this.organizeTimeSlots();

      // Get related channels
      this.relatedChannels = this.getRelatedChannelsList();

      this.isLoading = false;
      this.performanceMetrics.renderTime = performance.now() - renderStart;
      this.cdr.markForCheck();
    } catch (error) {
      this.handleError(error);
      this.isLoading = false;
    }
  }



// ... [Keep other properties as is, assume they match, but since I can't match scattered lines easily with replace_file_content in one go if they are far apart, I'll focus on the method replacement first. Wait, I can match the method]

  /**
   * Get related channels based on current channel
   */
  private getRelatedChannelsList(): RelatedChannel[] {
    const channelGroups: { [key: string]: string[] } = {
      'La 1': ['La 2', 'Antena 3', 'Cuatro', 'Telecinco', 'laSexta'],
      'La 2': ['La 1', 'Antena 3', 'Cuatro', 'Telecinco', 'laSexta'],
      'Antena 3': ['La 1', 'Cuatro', 'Telecinco', 'laSexta', 'Neox'],
      Cuatro: ['Antena 3', 'Telecinco', 'laSexta', 'FDF', 'Energy'],
      Telecinco: ['Antena 3', 'Cuatro', 'laSexta', 'FDF', 'Energy'],
      laSexta: ['Antena 3', 'Cuatro', 'Telecinco', 'La 1', 'Neox'],
    };

    const currentChannel = this.canal.replace(/-/g, ' ');
    const related = channelGroups[currentChannel] || [
      'La 1',
      'Antena 3',
      'Cuatro',
      'Telecinco',
      'laSexta',
      'La 2',
    ];

    return related
      .map((name) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name: name,
      }))
      .slice(0, 6);
  }

  /**
   * Organize programs into time slots
   */
  private organizeTimeSlots(programs?: any[]): void {
     // Use passed programs or this.programs
     const sourcePrograms = programs || this.programs;
     if (!sourcePrograms) return;

    const slots: { [key: string]: TimeSlot } = {};
    const now = new Date();
    const currentHour = now.getHours();

    sourcePrograms.forEach((program) => {
      if (!program.start) return;
      const start = new Date(program.start);
      // Use 'end' or 'stop' property, default to start + 1 hour if missing
      const end = program.end ? new Date(program.end) : (program.stop ? new Date(program.stop) : new Date(start.getTime() + 60 * 60 * 1000));
      
      let startHour = start.getHours();
      let endHour = end.getHours();
      
      // Handle day crossing (e.g. 23:00 to 01:00)
      if (endHour < startHour) {
        endHour += 24; 
      }
      
      // Special case: if end is exactly on the hour (e.g. 15:00), don't include 15 in the loop
      if (end.getMinutes() === 0 && end.getSeconds() === 0) {
          // Keep endHour as is for loop condition i < endHour
      } else {
         // If it ends at 15:30, it spans 15. loop should go up to 15.
         // If start 14:00 end 15:30. hours: 14, 15.
         // startHour=14. endHour=15. loop i <= endHour?
         // simple loop: for (let h = startHour; h <= endHour; h++)
         // But need to be careful with exact boundaries.
         // Let's rely on checking intersection with strictly Hour blocks.
         // Slot H is [H:00, H+1:00).
         // Program spans [Start, End).
         // Does Program intersect [H:00, H+1:00)?
      }

      // Simpler approach: Iterate hours from startHour to endHour
      // Ensure we treat hours modulo 24.
      const durationHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)) || 1;
      
      for (let i = 0; i < durationHours; i++) {
        const h = (startHour + i) % 24;
        const slotKey = h.toString();

        if (!slots[slotKey]) {
            const nextHour = (h + 1) % 24;
            const startStr = `${h.toString().padStart(2, '0')}:00`;
            const endStr = `${nextHour.toString().padStart(2, '0')}:00`;
            
            slots[slotKey] = {
                hour: slotKey,
                label: `${startStr} - ${endStr}`,
                programs: [],
                isActive: h === currentHour,
            };
        }
        // Avoid adding duplicate program if logic runs twice (though slots is local)
        if (!slots[slotKey].programs.find(p => p === program)) {
             slots[slotKey].programs.push(program);
        }
      }
    });

    this.timeSlots = Object.values(slots).sort(
      (a, b) => parseInt(a.hour) - parseInt(b.hour)
    );
     
    // REMOVED: Default forcing selectedTimeSlot. Leave it null to mean 'Dynamic/Ahora'
  }

  /**
 * Get the single active time slot for display
 */
public getActiveTimeSlot(): TimeSlot | undefined {
  // If a time slot is selected, return it.
  if (this.selectedTimeSlot) {
    return this.timeSlots.find(slot => slot.hour === this.selectedTimeSlot);
  }
  // Dynamically calculate current hour (don't rely on potentially stale isActive flag)
  const currentHour = new Date().getHours().toString();
  const currentSlot = this.timeSlots.find(slot => slot.hour === currentHour);
  
  // If current hour slot exists, return it
  if (currentSlot) {
    return currentSlot;
  }
  
  // If no slot for current hour, find nearest future slot or first slot
  const sortedSlots = [...this.timeSlots].sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  const futureSlot = sortedSlots.find(slot => parseInt(slot.hour) >= parseInt(currentHour));
  return futureSlot || sortedSlots[0];
}

  /**
   * Select time slot to filter programs
   */
  public selectTimeSlot(hour: string | null): void {
    this.selectedTimeSlot = hour;
    // REMOVED: forcing hour if null. Null is a valid state.
    this.cdr.markForCheck();
  }

  // OLD getFilteredTimeSlots REMOVED/UNUSED for this new view logic
  // public getFilteredTimeSlots(): TimeSlot[] { ... }

  // ===============================================
  // DROPDOWN TOGGLE METHODS
  // ===============================================

  public toggleDayDropdown(): void {
    if (this.isDayDropdownOpen) {
      this.closeAllDropdowns();
    } else {
      this.closeAllDropdowns();
      this.isDayDropdownOpen = true;
    }
  }

  public toggleTimeSlotDropdown(): void {
    if (this.isTimeSlotDropdownOpen) {
      this.closeAllDropdowns();
    } else {
      this.closeAllDropdowns();
      this.isTimeSlotDropdownOpen = true;
    }
  }

  public toggleCategoryDropdown(): void {
    if (this.isCategoryDropdownOpen) {
      this.closeAllDropdowns();
    } else {
      this.closeAllDropdowns();
      this.isCategoryDropdownOpen = true;
    }
  }

  public isAnyDropdownOpen(): boolean {
    return this.isDayDropdownOpen || this.isTimeSlotDropdownOpen || this.isCategoryDropdownOpen;
  }

  public closeAllDropdowns(): void {
    this.isDayDropdownOpen = false;
    this.isTimeSlotDropdownOpen = false;
    this.isCategoryDropdownOpen = false;
  }

  /**
   * Select category to filter programs
   */
  public selectCategory(category: string | null): void {
    this.selectedCategory = category;
    this.cdr.markForCheck();
  }

  /**
   * Get filtered categories based on selection
   */
  public getFilteredCategories(): string[] {
    if (this.selectedCategory === null) {
      return this.categorias;
    }
    return this.categorias.filter(cat => cat === this.selectedCategory);
  }

  /**
   * Get programs count for current hour
   */
  public getProgramasPorHora(): number {
    const currentHour = new Date().getHours();
    return this.programs.filter((p: any) => {
      const hour = new Date(p.start).getHours();
      return hour === currentHour;
    }).length;
  }

  /**
   * Get featured programs count (high rating or popular)
   */
  public getProgramasDestacados(): number {
    return (
      this.programs.filter((p: any) => {
        return p.starRating && parseFloat(p.starRating) >= 3.5;
      }).length || Math.floor(this.programs.length * 0.3)
    ); // Fallback to 30% of programs
  }

  /**
   * Check if a time slot is the current hour
   */
  public isCurrentHour(hour: string | null): boolean {
    if (!hour) return false;
    const currentHour = new Date().getHours();
    return parseInt(hour) === currentHour;
  }

  /**
   * Get current date formatted
   */
  public getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Get canonical URL
   */
  public getCanonicalUrl(): string {
    return `${window.location.origin}${this.router.url}`;
  }

  /**
   * Handle errors
   */
  private handleError(error: any): void {
    devConsole.error('Error in CanalCompletoComponent:', error);
    this.error =
      'Error al cargar la programación. Por favor, intenta de nuevo.';
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  /**
   * Log performance metrics
   */
  private logPerformanceMetrics(): void {
    this.performanceMetrics.loadTime =
      performance.now() - this.componentStartTime;

    if (this.performanceMetrics.loadTime > 0) {
      devConsole.log('📊 Canal Completo Performance:', {
        Total: `${this.performanceMetrics.loadTime.toFixed(2)}ms`,
        'Data Fetch': `${this.performanceMetrics.dataFetchTime.toFixed(2)}ms`,
        Render: `${this.performanceMetrics.renderTime.toFixed(2)}ms`,
        Programs: this.programs.length,
        Categories: this.categorias.length,
        'Time Slots': this.timeSlots.length,
      });

      // Performance warnings
      if (this.performanceMetrics.loadTime > 3000) {
        devConsole.warn('⚠️ Load time exceeds 3s');
      }
    }
  }
}
