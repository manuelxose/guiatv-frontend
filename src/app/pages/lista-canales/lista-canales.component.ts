// ============== src/app/pages/lista-canales/lista-canales.component.ts ==============
import { Component, EventEmitter, Output, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { first, filter, Subscription } from 'rxjs';

import { TvGuideService } from 'src/app/services/tv-guide.service';
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
  imports: [CommonModule,NavBarComponent,BannerComponent,SliderComponent]
})
export class ListaCanalesComponent implements OnInit, OnDestroy {
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

  constructor(
    private guideSvc: TvGuideService,
    private httpService: HttpService,
    private metaSvc: MetaService,
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.setupMetaTags();
    this.loadCanalesData();
    this.loadProgramsData();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ============== MÉTODOS PRIVADOS ==============
  private setupMetaTags(): void {
    const canonicalUrl = this.router.url;
    this.metaSvc.setMetaTags({
      title: 'Canales de TV de España',
      description: 'Listado de canales de televisión de España, como TVE, Antena 3, Telecinco, Cuatro, La Sexta, etc.',
      canonicalUrl: canonicalUrl,
    });
  }

  private loadCanalesData(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.canalesSubscription = this.http.get<any>('/assets/canales.json').subscribe({
        next: (data) => {
          this.url_web = data;
        },
        error: (error) => {
          console.error('Error loading canales:', error);
          this.url_web = {};
        }
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
      console.log(`⏳ LISTA-CANALES - No hay datos, esperando a que se carguen desde HomeComponent...`);
      // En lugar de hacer una llamada API directa, suscribirse al observable para esperar datos
      this.httpService.programas$.pipe(
        filter(programs => programs.length > 0),
        first()
      ).subscribe({
        next: (data) => {
          console.log(`📦 LISTA-CANALES - Datos recibidos del observable global`);
          this.manageCanales(data);
        },
        error: (error) => {
          console.error('Error loading programacion from observable:', error);
          this.cargando = false;
        }
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
  }

  private cleanup(): void {
    if (this.programasSubscription) {
      this.programasSubscription.unsubscribe();
    }
    if (this.canalesSubscription) {
      this.canalesSubscription.unsubscribe();
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

  // ============== GETTERS PARA FACILITAR EL ACCESO A DATOS ==============
  get hasCanalesTdt(): boolean {
    return this.canales_tdt.length > 0;
  }

  get hasCanalesTotales(): boolean {
    return this.canales_auto.length > 0 || 
           this.canales_tdt.length > 0 || 
           this.canales_m.length > 0 || 
           this.canales_dep.length > 0 || 
           this.canales_cable.length > 0;
  }

  get totalCanales(): number {
    return this.canales_auto.length + 
           this.canales_tdt.length + 
           this.canales_m.length + 
           this.canales_dep.length + 
           this.canales_cable.length;
  }
}