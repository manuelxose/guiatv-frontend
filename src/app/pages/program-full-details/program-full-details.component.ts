import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from 'src/app/services/http.service';
import { HeaderComponent } from 'src/app/components/header/header.component';
import {
  Navigation,
  Scrollbar,
  A11y,
  Virtual,
  Zoom,
  Autoplay,
  Thumbs,
  Controller,
  Pagination,
} from 'swiper';
import SwiperCore from 'swiper';

import { BehaviorSubject } from 'rxjs';
import { SwiperOptions } from 'swiper/types/swiper-options';
import { ModalService } from 'src/app/services/modal.service';
import { MetaService } from 'src/app/services/meta.service';

SwiperCore.use([
  Navigation,
  Pagination,
  Scrollbar,
  A11y,
  Virtual,
  Zoom,
  Autoplay,
  Thumbs,
  Controller,
]);

@Component({
  selector: 'app-program-full-details',
  templateUrl: './program-full-details.component.html',
  styleUrls: ['./program-full-details.component.scss'],
})
export class ProgramFullDetailsComponent {
  @ViewChild(HeaderComponent) header!: HeaderComponent;
  public program: any = {};
  public isVisible = false;
  public array = [1, 2, 3, 4, 5, 6, 7, 8];
  show: boolean = false;
  thumbs: any;
  slides$ = new BehaviorSubject<string[]>(['']);
  programas$!: BehaviorSubject<any[]>;
  programas_canal: any[] = [];
  programas_ahora: any[] = [];
  categoria: string = '';
  programas_similares: any[] = [];
  program_modal: any = {};

  config: SwiperOptions = {
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
      //no mostrar bullets
      el: '.swiper-pagination',
      type: 'bullets',
    },
    navigation: true,
    //detectar clicks en los slides
    on: {
      click: (event: any) => {
        console.log('click', event);
      },
    },
    //eliminar la navegacion por puntos
  };

  programas: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpService,
    private modalService: ModalService,
    private router: Router,
    private metaSvc: MetaService
  ) {}

  ngOnInit() {
    const canonicalUrl = this.router.url;

    this.metaSvc.setMetaTags({
      title: 'Guia Programacion TV - Detalles de programa',
      description:
        'Detalles de programa de la guia de programacion de TV española',
      canonicalUrl: canonicalUrl,
    });

    //obtener los progrmas del reducer

    ///obterner programa del behavior subject que vienen del http service

    // suscribirse al behavior subject del modal service

    this.modalService.programa$.subscribe((programa) => {
      this.program = programa;
    });

    this.http.programas$.subscribe(async (programas) => {
      this.programas = programas;
      // console.log('Programas del behavior subject:', this.programas);
      //si no hay programas llamar a la api
      if (this.programas.length === 0) {
        this.http.getProgramacion('today').subscribe((programas) => {
          this.programas = programas;
          // console.log('Programas de la api:', this.programas);
          this.getProgramaById(); // Mover esta línea aquí
        });
        // this.programas = this.prgramas_temp;
      } else {
        this.getProgramaById();
      }
    });

    // this.http.getProgramaById(this.route.snapshot.params['id']).subscribe(
    //   (data: any) => {
    //     this.program = data;
    //     console.log('los datos: ', this.program);
    //     this.http.setToLocalStorage(
    //       `${this.route.snapshot.params['id']}`,
    //       this.program
    //     );
    //   },
    //   (error: any) => {
    //     console.error('Error al obtener el programa por ID:', error);
    //   }
    // );
    //obterner por titile del programa
  }

  manageModal(program: any): void {
    this.modalService.setPrograma(program);
  }
  getSlides() {
    this.slides$.next(
      Array.from({ length: 600 }).map((el, index) => `Slide ${index + 1}`)
    );
  }

  virtualSlides = Array.from({ length: 600 }).map(
    (el, index) => `Slide ${index + 1}`
  );

  log(log: string) {
    // console.log(string);
  }

  onSwiper([swiper]: any) {}
  onSlideChange() {}

  public compareDate(dateIni: string, dateFin: string): boolean {
    const horaActual = new Date();
    const horaInicio = new Date(dateIni);
    const horaFin = new Date(dateFin);

    // Obtén las horas y minutos de la hora actual y las horas de inicio y fin
    const horaActualNumero = horaActual.getHours() + 2;
    const minutoActualNumero = horaActual.getMinutes();
    const horaInicioNumero = horaInicio.getHours();
    const minutoInicioNumero = horaInicio.getMinutes();
    const horaFinNumero = horaFin.getHours();
    const minutoFinNumero = horaFin.getMinutes();

    // Comprueba si la hora actual está dentro del rango de horas
    if (
      (horaActualNumero > horaInicioNumero ||
        (horaActualNumero === horaInicioNumero &&
          minutoActualNumero >= minutoInicioNumero)) &&
      (horaActualNumero < horaFinNumero ||
        (horaActualNumero === horaFinNumero &&
          minutoActualNumero <= minutoFinNumero))
    ) {
      return true;
    }
    return false;
  }

  private getProgramaById() {
    const idParam = this.route.snapshot.params['id'];

    const allPrograms = this.programas.flatMap(
      (programa: any) => programa.programs
    );

    const currentPrograms = allPrograms.filter((programa: any) =>
      this.compareDate(programa.start, programa.stop)
    );
    const similarPrograms = allPrograms.filter(
      (programa: any) =>
        (programa.desc?.category?.split('/')[0] ===
          this.program?.desc?.category?.split('/')[0] ||
          programa.desc?.category?.split('/')[1] ===
            this.program?.desc?.category?.split('/')[1]) &&
        this.compareDate(programa.start, programa.stop)
    );

    this.program = this.programas
      .flatMap((data: any) => data.programs)
      .find(
        (program: any) =>
          program?.title.value.replace(/ /g, '-').trim() ===
          idParam.replace(/ /g, '-').trim()
      );

    const channelPrograms = allPrograms.filter(
      (programa: any) => programa?.channel_id === this?.program?.channel_id
    );
    this.programas_canal = channelPrograms;
    this.programas_ahora = currentPrograms;
    this.programas_similares = similarPrograms;
  }
}
