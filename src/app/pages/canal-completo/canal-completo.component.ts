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
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { SliderComponent } from 'src/app/components/slider/slider.component';
import { TvDataService } from 'src/app/state/tv-data.service';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { isLive } from 'src/app/utils/utils';
import { ApiConfigService } from 'src/app/api/api-config.service';

interface DayOption {
  label: string;
  value: string;
}

interface TimeSlot {
  hour: number;
  label: string;
  programs: any[];
  count: number;
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

@Component({
  selector: 'app-canal-completo',
  templateUrl: './canal-completo.component.html',
  styleUrls: ['./canal-completo.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    SliderComponent,
    BannerComponent,
    NavBarComponent,
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

  // New Properties for Enhanced Features
  public days: DayOption[] = [
    { label: 'Hoy', value: 'today' },
    { label: 'Mañana', value: 'tomorrow' },
    { label: 'Pasado', value: 'after_tomorrow' },
  ];

  public timeSlots: TimeSlot[] = [];
  public selectedTimeSlot: number | null = null;
  public selectedCategory: string | null = null;
  public relatedChannels: RelatedChannel[] = [];

  // Private Properties
  private destroy$ = new Subject<void>();
  private performanceMetrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    dataFetchTime: 0,
  };
  private componentStartTime: number = 0;

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
      ogImage: `https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/${this.query}.png&w=1200&h=630&fit=cover&output=webp`,
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
            console.log(`📦 CANAL-COMPLETO - Data loaded from API`);
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
        .pipe(takeUntil(this.destroy$))
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
      console.log('🔍 CANAL-COMPLETO - Buscando canal:', {
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
        console.log('🔎 Canal Group structure:', {
          hasChannel: !!channelGroup.channel,
          hasPrograms: !!channelGroup.programs,
          programsLength: channelGroup.programs?.length || 0,
          programsIsArray: Array.isArray(channelGroup.programs),
          keys: Object.keys(channelGroup),
          sample: channelGroup
        });
        
        if (channelGroup.programs && channelGroup.programs.length > 0) {
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
          
          console.log('✅ Canal encontrado:', channelGroup.channel?.name, 'con', this.programs.length, 'programas');
        } else {
          console.warn('⚠️ Canal encontrado pero sin programas:', channelGroup.channel?.name);
          this.programs = [];
        }
      } else {
        console.warn('⚠️ No se encontró el canal:', this.canal, 'normalizado:', searchTerm);
        this.programs = [];
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
        console.warn('⚠️ No se encontró programa en directo para', this.canal);
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
      
      console.log('📦 CANAL-COMPLETO - Processed Data:', {
        canal: this.canal,
        programsCount: this.programs.length,
        currentProgram: this.program,
        liveProgramsCount: this.live_programs.length,
        sampleLiveProgram: this.live_programs[0]
      });

      // Get categories
      this.categorias = this.svcGuide.getChannelCategories(this.programs);

      // Set default category to "Películas" if available
      if (this.selectedCategory === null) {
        const peliculasCategory = this.categorias.find(cat => 
          cat.toLowerCase().includes('película') || cat.toLowerCase().includes('cine')
        );
        this.selectedCategory = peliculasCategory || (this.categorias.length > 0 ? this.categorias[0] : null);
      }

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

  /**
   * Organize programs into time slots (morning, afternoon, evening, night)
   */
  private organizeTimeSlots(): void {
    const currentHour = new Date().getHours();

    const slots = [
      { hour: 6, label: 'Mañana', range: [6, 12] },
      { hour: 12, label: 'Mediodía', range: [12, 15] },
      { hour: 15, label: 'Tarde', range: [15, 18] },
      { hour: 18, label: 'Sobremesa', range: [18, 21] },
      { hour: 21, label: 'Prime Time', range: [21, 24] },
      { hour: 0, label: 'Noche', range: [0, 6] },
    ];

    this.timeSlots = slots.map((slot) => {
      const programs = this.programs.filter((p: any) => {
        const hour = new Date(p.start).getHours();
        return hour >= slot.range[0] && hour < slot.range[1];
      });

      const isActive = currentHour >= slot.range[0] && currentHour < slot.range[1];

      return {
        hour: slot.hour,
        label: slot.label,
        programs: programs,
        count: programs.length,
        isActive: isActive,
      };
    });

    // Set current time slot as default selection
    const activeSlot = this.timeSlots.find(slot => slot.isActive);
    if (activeSlot && this.selectedTimeSlot === null) {
      this.selectedTimeSlot = activeSlot.hour;
    }
  }

  /**
   * Get programs for a specific category
   */
  public getProgramsByCategory(categoria: string): any[] {
    return this.svcGuide.getProgramsByCategory(categoria, this.channel.name);
  }

  /**
   * Compare if current time is between start and end dates
   */
  public compareDate(dateIni: string, dateFin: string): boolean {
    let horaActual = new Date();
    // horaActual.setHours(horaActual.getHours() + 1); // Removed incorrect offset

    const horaInicio = new Date(dateIni);
    const horaFin = new Date(dateFin);

    if (this.diaSeleccionado !== 'Hoy') {
      switch (this.diaSeleccionado) {
        case 'Mañana':
          horaInicio.setDate(horaInicio.getDate() - 1);
          horaFin.setDate(horaFin.getDate() - 1);
          break;
        case 'Pasado mañana':
          horaInicio.setDate(horaInicio.getDate() - 2);
          horaFin.setDate(horaFin.getDate() - 2);
          break;
        default:
          break;
      }
    }

    return horaActual >= horaInicio && horaActual <= horaFin;
  }

  /**
   * Format time from ISO string
   */
  public formatTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  /**
   * Get icon SVG for category
   */
  private sanitizer = inject(DomSanitizer);

  /**
   * Get icon SVG for category
   */
  public getCategoryIcon(categoria: string): SafeHtml {
    const normalizedCategory = categoria.toLowerCase();
    let icon = '';

    if (
      normalizedCategory.includes('película') ||
      normalizedCategory.includes('cine')
    ) {
      icon = this.categoryIcons['Películas'];
    } else if (normalizedCategory.includes('serie')) {
      icon = this.categoryIcons['Series'];
    } else if (normalizedCategory.includes('deporte')) {
      icon = this.categoryIcons['Deportes'];
    } else if (normalizedCategory.includes('documental')) {
      icon = this.categoryIcons['Documentales'];
    } else if (
      normalizedCategory.includes('infantil') ||
      normalizedCategory.includes('niños')
    ) {
      icon = this.categoryIcons['Infantil'];
    } else if (
      normalizedCategory.includes('noticia') ||
      normalizedCategory.includes('informativo')
    ) {
      icon = this.categoryIcons['Noticias'];
    } else if (
      normalizedCategory.includes('entretenimiento') ||
      normalizedCategory.includes('show')
    ) {
      icon = this.categoryIcons['Entretenimiento'];
    } else if (normalizedCategory.includes('cultura')) {
      icon = this.categoryIcons['Cultura'];
    } else {
      icon = this.categoryIcons['default'];
    }

    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }

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
   * Get related channels for display
   */
  public getRelatedChannels(): RelatedChannel[] {
    return this.relatedChannels;
  }

  /**
   * Select time slot to filter programs
   */
  public selectTimeSlot(hour: number | null): void {
    this.selectedTimeSlot = hour;
    this.cdr.markForCheck();
  }

  /**
   * Get filtered time slots based on selection
   */
  public getFilteredTimeSlots(): TimeSlot[] {
    if (this.selectedTimeSlot === null) {
      return this.timeSlots;
    }
    return this.timeSlots.filter(slot => slot.hour === this.selectedTimeSlot);
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
    console.error('Error in CanalCompletoComponent:', error);
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
      console.log('📊 Canal Completo Performance:', {
        Total: `${this.performanceMetrics.loadTime.toFixed(2)}ms`,
        'Data Fetch': `${this.performanceMetrics.dataFetchTime.toFixed(2)}ms`,
        Render: `${this.performanceMetrics.renderTime.toFixed(2)}ms`,
        Programs: this.programs.length,
        Categories: this.categorias.length,
        'Time Slots': this.timeSlots.length,
      });

      // Performance warnings
      if (this.performanceMetrics.loadTime > 3000) {
        console.warn('⚠️ Load time exceeds 3s');
      }
    }
  }
}
