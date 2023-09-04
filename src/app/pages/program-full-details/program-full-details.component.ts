import { Component, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

import { BehaviorSubject, first } from 'rxjs';
import { ReductorService } from 'src/app/reducers/reductor.service';
import { SwiperOptions } from 'swiper/types/swiper-options';

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
    },
    navigation: true,
    //detectar clicks en los slides
    on: {
      click: (event: any) => {
        console.log('click', event);
      },
    },
  };

  programas: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpService,
    private stateService: ReductorService
  ) {}

  ngOnInit() {
    this.stateService
      .getState()
      .pipe(first())
      .subscribe((state: any) => {
        console.log('Estado actual:', state);
        this.programas = state.programas;
      });
    this.route.params.subscribe((params) => {
      console.log('Los putisimos params: ', params['id']);
    });

    this.http.getProgramaById(this.route.snapshot.params['id']).subscribe(
      (data: any) => {
        this.program = data;
        console.log('los datos: ', this.program);
        this.http.setToLocalStorage(
          `${this.route.snapshot.params['id']}`,
          this.program
        );
      },
      (error: any) => {
        console.error('Error al obtener el programa por ID:', error);
      }
    );
  }

  closeModal(): void {
    this.isVisible = !this.isVisible;
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

  onSwiper([swiper]: any) {
    console.log(swiper);
  }
  onSlideChange() {
    console.log('slide change');
  }
}
