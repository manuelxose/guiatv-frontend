import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ModalService } from 'src/app/services/modal.service';
import Swiper from 'swiper';
import { SwiperComponent } from 'swiper/angular';
import { SwiperOptions } from 'swiper/types/swiper-options';
import { getHoraInicio } from 'src/app/utils/utils';
import { TvGuideService } from 'src/app/services/tv-guide.service';
@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
})
export class SliderComponent implements OnInit {
  @Input() programas: any[] = [];
  @Input() logo?: string = '';
  @ViewChild('swiperRef', { static: false }) swiperRef?: SwiperComponent;
  config: SwiperOptions = {};
  programas_similares: any[] = [];
  private swiperInstance?: Swiper;

  constructor(private guiatvSvc: TvGuideService, private router: Router) {}

  ngOnInit(): void {
    this.config = {
      slidesPerView: 4,
      spaceBetween: 5,
      breakpoints: {
        320: {
          slidesPerView: 2,
          spaceBetween: 5,
        },
        480: {
          slidesPerView: 3,
          spaceBetween: 5,
        },
        640: {
          slidesPerView: 4,
          spaceBetween: 5,
        },
      },
    };
  }

  manageData(programa: any) {
    console.log('Programa:', programa);
    ///Si se trata de un canal hacer route a /ver-canal/:id
    if (programa?.channel) {
      console.log('Es un programa');
      this.guiatvSvc.setDetallesPrograma(programa);
      this.router.navigate([
        'programacion-tv/detalles',
        programa.title.value.replace(/\s/g, '-'),
      ]);
    }
    //Si se trata de un programa hacer route a /detalles/:id
    else {
      console.log('Es un canal');
      //sustituir espacios por guiones
      this.router.navigate([
        'programacion-tv/ver-canal',
        programa.name.replace(/\s/g, '-'),
      ]);
    }
  }

  onSwiper(swiper: Swiper) {
    this.swiperInstance = swiper;
  }

  onNextClick() {
    console.log('next');
    this.swiperInstance?.slideNext();
  }

  onPrevClick() {
    this.swiperInstance?.slidePrev();
  }

  public horaInicio(i: any) {
    return getHoraInicio(this.programas[i].start);
  }
}
