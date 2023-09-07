import { Component, Input } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';
import { SwiperOptions } from 'swiper/types/swiper-options';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
})
export class SliderComponent {
  @Input() programas: any[] = [];
  config: SwiperOptions = {};
  programas_similares: any[] = [];

  constructor(private modalService: ModalService) {
    this.config = {
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
      lazy: true,
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
  }

  ngOnInit(): void {}

  manageModal(programa: any) {
    this.modalService.setPrograma(programa);
  }
}
