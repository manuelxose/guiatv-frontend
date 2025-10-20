// ============== src/app/pages/lista-canales/lista-canales.component.ts ==============
import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChildren,
  QueryList,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { first, filter, Subscription } from 'rxjs';

import { TvGuideService } from 'src/app/services/tv-guide.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpService } from 'src/app/services/http.service';
import { MetaService } from 'src/app/services/meta.service';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { BannerComponent } from 'src/app/components/banner/banner.component';
import { SliderComponent } from 'src/app/components/slider/slider.component';

@Component({
  selector: 'app-lista-canales',
  templateUrl: './lista-canales.component.html',
  styleUrls: ['./lista-canales.component.scss'],
  standalone: true,
  imports: [CommonModule, NavBarComponent, BannerComponent, SliderComponent],
})
export class ListaCanalesComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() nextClicked = new EventEmitter<void>();
  @Output() prevClicked = new EventEmitter<void>();

  // Datos principales
  public categorias: string[] = ['TDT', 'Cable', 'Autonomico'];
  public canales: any = [];
  public url_web: any = {};

  // Estado de carga
  public cargando = true;

  // Canales por categoría
  public canales_tdt: any[] = [];
  public canales_m: any[] = [];
  public canales_auto: any[] = [];
  public canales_dep: any[] = [];
  public canales_cable: any[] = [];

  // Datos adicionales
  public program: any;
  public data: any;
  public popular_movies: any[] = [];
  public relatedMovies: any;
  public movieStartIndex = 0;
  public actors: any;
  public actorStartIndex = 0;
  public actor = {};
  public movie: any;
  public time: any;
  public logo: any;
  public destacada: any;

  // Suscripciones
  private programasSubscription!: Subscription;
  private canalesSubscription!: Subscription;
  // view children for lazy observer
  @ViewChildren('channelSection', { read: ElementRef })
  channelSections!: QueryList<ElementRef>;
  // capture child slider components so parents can control navigation
  @ViewChildren(SliderComponent) sliderComponents!: QueryList<SliderComponent>;
  private intersectionObserver?: IntersectionObserver;
  // runtime flags
  public isBrowser = false;
  // tracks which sliders are ready to render (lazy)
  public sliderVisible: Record<string, boolean> = {};
  // SEO helpers
  public ldJson: string = '';
  public safeLdHtml: SafeHtml | null = null;
  public topChannels: Array<any> = [];

  constructor(
    private guideSvc: TvGuideService,
    private httpService: HttpService,
    private metaSvc: MetaService,
    private router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.setupMetaTags();
    this.loadCanalesData();
    this.loadProgramsData();
    // initialize slider visibility (server-safe)
    this.sliderVisible = {
      tdt: !this.isBrowser, // SSR: don't render sliders, but on browser set to false -> will be enabled via observer
      movistar: !this.isBrowser,
      online: !this.isBrowser,
      autonomo: !this.isBrowser,
      deporte: !this.isBrowser,
    };
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          const key = el.getAttribute('data-key') || el.id || '';
          if (!key) return;
          if (entry.isIntersecting) {
            this.sliderVisible[key] = true;
            if (this.intersectionObserver)
              this.intersectionObserver.unobserve(el);
          }
        });
      },
      { root: null, rootMargin: '200px 0px', threshold: 0.05 }
    );

    // observe sections (slight delay to ensure QueryList populated)
    setTimeout(() => {
      this.channelSections.forEach((q) => {
        const el = q.nativeElement as HTMLElement;
        const key = el.getAttribute('data-key') || el.id || '';
        if (key && this.intersectionObserver && !this.sliderVisible[key]) {
          this.intersectionObserver.observe(el);
        }
      });
    }, 80);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ============== MÉTODOS PRIVADOS ==============
  private setupMetaTags(): void {
    const canonicalUrl = this.router.url;
    this.metaSvc.setMetaTags({
      title: 'Canales de TV de España',
      description:
        'Listado de canales de televisión de España, como TVE, Antena 3, Telecinco, Cuatro, La Sexta, etc.',
      canonicalUrl: canonicalUrl,
    });
  }

  private loadCanalesData(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.canalesSubscription = this.http
        .get<any>('/assets/canales.json')
        .subscribe({
          next: (data) => {
            this.url_web = data;
          },
          error: (error) => {
            console.error('Error loading canales:', error);
            this.url_web = {};
          },
        });
    }
  }

  private loadProgramsData(): void {
    try {
      this.programasSubscription = this.httpService.programas$
        .pipe(first())
        .subscribe(async (data) => {
          if (data.length === 0) {
            await this.loadFromApi();
          } else {
            this.manageCanales(data);
          }
        });
    } catch (error) {
      console.error('Error loading programs data:', error);
      this.cargando = false;
    }
  }
  private async loadFromApi(): Promise<void> {
    try {
      console.log(
        `⏳ LISTA-CANALES - No hay datos, esperando a que se carguen desde HomeComponent...`
      );
      // En lugar de hacer una llamada API directa, suscribirse al observable para esperar datos
      // Si no hay datos, intentar forzar la carga desde la API (fall back)
      // Llamamos a getProgramacion('today') para obtener datos y emitirlos
      this.httpService
        .getProgramacion('today')
        .pipe(first())
        .subscribe({
          next: async (data) => {
            try {
              if (Array.isArray(data) && data.length > 0) {
                console.log(
                  '📡 LISTA-CANALES - Datos recibidos desde API (today)'
                );
                // Emitir al observable global para mantener consistencia
                await this.httpService.setProgramas(data, 'today');
                // Ahora manageCanales puede leer desde el servicio
                this.manageCanales(data);
              } else {
                console.warn(
                  '⚠️ LISTA-CANALES - La API devolvió datos vacíos para today'
                );
                this.cargando = false;
              }
            } catch (err) {
              console.error('Error processing data from API:', err);
              this.cargando = false;
            }
          },
          error: (error) => {
            console.error(
              'Error loading programacion from API fallback:',
              error
            );
            this.cargando = false;
          },
        });
    } catch (error) {
      console.error('Error in loadFromApi:', error);
      this.cargando = false;
    }
  }

  private manageCanales(data: any): void {
    this.guideSvc.setData(data);

    this.canales_auto = this.guideSvc.getAutonomicoCanales();
    this.canales_tdt = this.guideSvc.getTDTCanales();
    this.canales_m = this.guideSvc.getMovistarCanales();
    this.canales_dep = this.guideSvc.getDeportesCanales();
    this.canales_cable = this.guideSvc.getCableCanales();

    this.cargando = false;
    // when data available on browser, enable sliders for rendering
    if (this.isBrowser) {
      // small delay to let the view initialize
      setTimeout(() => {
        Object.keys(this.sliderVisible).forEach(
          (k) => (this.sliderVisible[k] = true)
        );
      }, 120);
    }

    // Build SEO artifacts (JSON-LD and top channels list)
    try {
      this.buildLdJson();
    } catch (err) {
      console.warn('Error building JSON-LD for channels', err);
    }
  }

  private buildLdJson(): void {
    const channels = [
      ...this.canales_tdt,
      ...this.canales_m,
      ...this.canales_cable,
      ...this.canales_auto,
      ...this.canales_dep,
    ].filter(Boolean);

    // prepare top channels list for a simple crawlable list
    this.topChannels = channels.slice(0, 12);

    const itemListElement = channels.map((c: any, i: number) => {
      const name =
        c.name || c.nombre || c.title || c.titulo || `Canal ${i + 1}`;
      // attempt to resolve a url from url_web mapping; fallback to empty string
      const urlFromMap =
        this.url_web &&
        (this.url_web[c.id] || this.url_web[name] || this.url_web[c.slug]);
      const url = urlFromMap && urlFromMap.url ? urlFromMap.url : '';
      return {
        '@type': 'ListItem',
        position: i + 1,
        name,
        url,
      };
    });

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Listado de canales de televisión en España',
      description:
        'Listado y programación de los principales canales de TV en España.',
      itemListElement: itemListElement.slice(0, 200),
    };

    this.ldJson = JSON.stringify(ld, null, 2);
    // sanitize for safe injection into template
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${this.ldJson}</script>`
    );
  }

  private cleanup(): void {
    if (this.programasSubscription) {
      this.programasSubscription.unsubscribe();
    }
    if (this.canalesSubscription) {
      this.canalesSubscription.unsubscribe();
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }
  }

  // ============== MÉTODOS PÚBLICOS ==============
  public canalesPorCategoria(categoria: string): any[] {
    return this.canales.filter((canal: any) => canal.tipo === categoria);
  }

  onNextClick(): void {
    this.nextClicked.emit();
  }

  onPrevClick(): void {
    this.prevClicked.emit();
  }

  // Parent controls to navigate a specific slider by its key
  public prevFor(key: string): void {
    const found = this.sliderComponents.find((s) => (s as any).key === key);
    if (found) {
      found.prev();
    }
  }

  public nextFor(key: string): void {
    const found = this.sliderComponents.find((s) => (s as any).key === key);
    if (found) {
      found.next();
    }
  }

  // ============== GETTERS PARA FACILITAR EL ACCESO A DATOS ==============
  get hasCanalesTdt(): boolean {
    return this.canales_tdt.length > 0;
  }

  get hasCanalesTotales(): boolean {
    return (
      this.canales_auto.length > 0 ||
      this.canales_tdt.length > 0 ||
      this.canales_m.length > 0 ||
      this.canales_dep.length > 0 ||
      this.canales_cable.length > 0
    );
  }

  get totalCanales(): number {
    return (
      this.canales_auto.length +
      this.canales_tdt.length +
      this.canales_m.length +
      this.canales_dep.length +
      this.canales_cable.length
    );
  }
}
