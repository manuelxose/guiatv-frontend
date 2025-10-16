import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpService } from 'src/app/services/http.service';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ModalService } from 'src/app/services/modal.service';
import { MetaService } from 'src/app/services/meta.service';
import { SliderComponent } from 'src/app/components/slider/slider.component';

// Importaciones modernas de Swiper
import { SwiperOptions } from 'swiper/types';
import { Navigation, Pagination, A11y } from 'swiper/modules';

@Component({
  selector: 'app-program-full-details',
  templateUrl: './program-full-details.component.html',
  styleUrls: ['./program-full-details.component.scss'],
  standalone: true,
  imports: [CommonModule, SliderComponent],
})
export class ProgramFullDetailsComponent implements OnInit, OnDestroy {
  @ViewChild(HeaderComponent) header!: HeaderComponent;

  // Propiedades del componente
  public program: any = {};
  public isVisible = false;
  public array = [1, 2, 3, 4, 5, 6, 7, 8];
  public show: boolean = false;
  public thumbs: any;
  public slides$ = new BehaviorSubject<string[]>(['']);
  public programas$!: BehaviorSubject<any[]>;
  public programas_canal: any[] = [];
  public programas_ahora: any[] = [];
  public categoria: string = '';
  public programas_similares: any[] = [];
  public program_modal: any = {};
  public programas: any[] = [];

  // Subscriptions para evitar memory leaks
  private subscriptions: Subscription = new Subscription();

  // Configuración optimizada de Swiper
  public config: SwiperOptions = {
    modules: [Navigation, Pagination, A11y],
    slidesPerView: 4,
    spaceBetween: 5,
    breakpoints: {
      320: {
        slidesPerView: 2,
        spaceBetween: 5,
      },
      480: {
        slidesPerView: 2,
        spaceBetween: 5,
      },
      640: {
        slidesPerView: 3,
        spaceBetween: 5,
      },
      768: {
        slidesPerView: 4,
        spaceBetween: 5,
      },
    },
    pagination: {
      clickable: true,
      type: 'bullets',
      dynamicBullets: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    observer: true,
    observeParents: true,
    on: {
      click: (swiper, event) => {
        console.log('Slide clicked:', event);
      },
    },
  };

  // Virtual slides optimizado
  public virtualSlides = Array.from({ length: 600 }, (_, index) => 
    `Slide ${index + 1}`
  );

  constructor(
    private route: ActivatedRoute,
    private http: HttpService,
    private modalService: ModalService,
    private router: Router,
    private metaSvc: MetaService
  ) {}

  ngOnInit(): void {
    this.initializeMetaTags();
    this.subscribeToModalService();
    this.subscribeToHttpService();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Métodos privados optimizados
  private initializeMetaTags(): void {
    const canonicalUrl = this.router.url;
    this.metaSvc.setMetaTags({
      title: 'Guía Programación TV - Detalles de programa',
      description: 'Detalles de programa de la guía de programación de TV española',
      canonicalUrl: canonicalUrl,
    });
  }

  private subscribeToModalService(): void {
    const modalSub = this.modalService.programa$.subscribe((programa) => {
      this.program = programa;
    });
    this.subscriptions.add(modalSub);
  }

  private subscribeToHttpService(): void {
    const httpSub = this.http.programas$.subscribe(async (programas) => {
      this.programas = programas;
      
      if (this.programas.length === 0) {
        this.loadProgramasFromAPI();
      } else {
        this.getProgramaById();
      }
    });
    this.subscriptions.add(httpSub);
  }

  private loadProgramasFromAPI(): void {
    const apiSub = this.http.getProgramacion('today').subscribe((programas) => {
      this.programas = programas;
      this.getProgramaById();
    });
    this.subscriptions.add(apiSub);
  }

  private getProgramaById(): void {
    const idParam = this.route.snapshot.params['id'];
    
    if (!this.programas?.length) return;

    const allPrograms = this.programas.flatMap((programa: any) => programa.programs);
    
    // Encontrar programa principal
    this.program = allPrograms.find((program: any) =>
      program?.title?.value?.replace(/ /g, '-').trim() === 
      idParam.replace(/ /g, '-').trim()
    );

    if (!this.program) return;

    // Filtrar programas relacionados
    this.programas_canal = this.getChannelPrograms(allPrograms);
    this.programas_ahora = this.getCurrentPrograms(allPrograms);
    this.programas_similares = this.getSimilarPrograms(allPrograms);
  }

  private getChannelPrograms(allPrograms: any[]): any[] {
    return allPrograms.filter(
      (programa: any) => programa?.channel_id === this?.program?.channel_id
    );
  }

  private getCurrentPrograms(allPrograms: any[]): any[] {
    return allPrograms.filter((programa: any) =>
      this.compareDate(programa.start, programa.stop)
    );
  }

  private getSimilarPrograms(allPrograms: any[]): any[] {
    return allPrograms.filter((programa: any) => {
      const programCategory = this.program?.desc?.category;
      const currentCategory = programa?.desc?.category;
      
      if (!programCategory || !currentCategory) return false;

      const programCats = programCategory.split('/');
      const currentCats = currentCategory.split('/');
      
      return (
        (programCats[0] === currentCats[0] || programCats[1] === currentCats[1]) &&
        this.compareDate(programa.start, programa.stop)
      );
    });
  }

  // Métodos públicos optimizados
  public compareDate(dateIni: string, dateFin: string): boolean {
    if (!dateIni || !dateFin) return false;

    const now = new Date();
    const start = new Date(dateIni);
    const end = new Date(dateFin);

    // Ajuste de zona horaria (+2 horas)
    const currentTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    
    return currentTime >= start && currentTime <= end;
  }

  public manageModal(program: any): void {
    if (program) {
      this.modalService.setPrograma(program);
    }
  }

  public getSlides(): void {
    const slides = Array.from({ length: 600 }, (_, index) => `Slide ${index + 1}`);
    this.slides$.next(slides);
  }

  // Handlers de Swiper
  public onSwiper(swiper: any): void {
    console.log('Swiper initialized:', swiper);
  }

  public onSlideChange(): void {
    console.log('Slide changed');
  }

  public log(message: string): void {
    if (console && console.log) {
      console.log(message);
    }
  }
}