import {
  Component,
  Input,
  OnInit,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { Router } from '@angular/router';
import { register } from 'swiper/element/bundle';
import { getHoraInicio } from 'src/app/utils/utils';

import { TvGuideService } from 'src/app/services/tv-guide.service';
import { CommonModule } from '@angular/common';

// Register Swiper custom elements
register();

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SliderComponent implements OnInit {
  @Input() programas: any[] = [];
  @Input() logo?: string = '';
  @ViewChild('swiperRef', { static: false }) swiperRef?: any;
  
  programas_similares: any[] = [];

  constructor(private guiatvSvc: TvGuideService, private router: Router) {}

  ngOnInit(): void {
    // Configuration is now handled in the template
  }

  manageData(programa: any) {
    if (programa?.channel) {
      this.guiatvSvc.setDetallesPrograma(programa);
      this.router.navigate([
        'programacion-tv/detalles',
        programa.title.value.replace(/\s/g, '-'),
      ]);
    } else {
      this.router.navigate([
        'programacion-tv/ver-canal',
        programa.name.replace(/\s/g, '-'),
      ]);
    }
  }

  onSwiper(swiper: any) {
    // Handle swiper instance if needed
  }

  onNextClick() {
    this.swiperRef?.nativeElement?.swiper?.slideNext();
  }

  onPrevClick() {
    this.swiperRef?.nativeElement?.swiper?.slidePrev();
  }

  public horaInicio(i: any) {
    return getHoraInicio(this.programas[i].start);
  }
}