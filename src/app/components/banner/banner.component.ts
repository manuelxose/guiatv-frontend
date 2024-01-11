import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { diffHour, getHoraInicio } from 'src/app/utils/utils';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
})
export class BannerComponent {
  @Input() data: any = {};
  public logo: string = '';
  public time: string = '';

  constructor(private router: Router, private guiatvSvc: TvGuideService) {}

  ngOnInit(): void {
    console.log('lo del modal: ', this.data);
    this.time = this.getTime(this.data.start, this.data.stop);
  }

  public getHora(hora: string) {
    return getHoraInicio(hora);
  }

  private getTime(start: string, stop: string) {
    this.time = diffHour(start, stop);
    return this.time;
  }
  public navigateTo() {
    this.guiatvSvc.setDetallesPrograma(this.data);

    this.router.navigate([
      'programacion-tv/detalles',
      this.data?.title?.value.replace(/s/g, '-'),
    ]);
  }
}
