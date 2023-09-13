import { Component } from '@angular/core';
import { TvGuideService } from 'src/app/services/tv-guide.service';
//importar canales.json de assets
import * as _canales from '../../../assets/canales.json';
import { HttpService } from 'src/app/services/http.service';
import { first } from 'rxjs';

@Component({
  selector: 'app-lista-canales',
  templateUrl: './lista-canales.component.html',
  styleUrls: ['./lista-canales.component.scss'],
})
export class ListaCanalesComponent {
  public categorias: any;
  public canales: any;
  public cargando: boolean = true;
  public url_web: any;
  public program: any;
  public canales_tdt: any = [];
  public canales_m: any = [];
  public canales_auto: any = [];
  public canales_dep: any = [];
  public canales_cable: any = [];

  constructor(private guideSvc: TvGuideService, private http: HttpService) {
    this.categorias = ['TDT', 'Cable', 'Autonomico'];
    this.canales = [];
    this.url_web = _canales;
  }

  ngOnInit(): void {
    try {
      this.http.programas$.pipe(first()).subscribe(async (data) => {
        //si no hay programas llamar a la api
        if (data.length === 0) {
          (await this.http.getProgramacion('today')).subscribe((data) => {
            this.http.setProgramas(data).then(() => {
              this.manageCanales(data);
            });
          });
        } else {
          this.manageCanales(data);
        }
      });
    } catch (error) {
      console.log(error);
    }

    console.log('Canales autonomicos:', this.canales_auto);
  }

  private manageCanales(data: any) {
    this.guideSvc.setData(data);

    console.log('Gestion de canales');
    this.canales_auto = this.guideSvc.getAutonomicoCanales();
    this.canales_tdt = this.guideSvc.getTDTCanales();
    this.canales_m = this.guideSvc.getMovistarCanales();
    this.canales_dep = this.guideSvc.getDeportesCanales();
    this.canales_cable = this.guideSvc.getCableCanales();
  }

  ngAfterViewInit() {}

  public canalesPorCategoria(categoria: string) {
    return this.canales.filter((canal: any) => canal.tipo == categoria);
  }
}
