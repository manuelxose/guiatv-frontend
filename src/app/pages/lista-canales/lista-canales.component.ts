import { Component } from '@angular/core';
import { TvGuideService } from 'src/app/services/tv-guide.service';
//importar canales.json de assets
import * as _canales from '../../../assets/canales.json';

@Component({
  selector: 'app-lista-canales',
  templateUrl: './lista-canales.component.html',
  styleUrls: ['./lista-canales.component.scss']
})
export class ListaCanalesComponent {

  public categorias:any;
  public canales:any;
  public cargando:boolean = true;
  public url_web:any;

  constructor(private tvGuideSvc: TvGuideService) {
    this.categorias = [
      "TDT","Cable","Autonomico"
    ]
    this.canales = []
    this.url_web = _canales;
  }

  ngOnInit(): void {
    this.tvGuideSvc.setCollection("canales_españa").getAll().subscribe((res: any) => {
      this.canales = res.docs.map((doc: any) => {
        return {
          id: doc.id,
          ...doc.data()
        };
      });
      //AÑADIR A CADA CANAL LA URL DE LA PAGINA WEB Y LA URL DEL STREAMING
      this.canales = this.setUrl(this.canales);
      this.cargando = false;
      console.log("los canales: ", this.canales);

    });


  }

  public setUrl(canales:any){
    canales.forEach((canal:any) => {
        //buscar coincidencias entre el nombre del canal y el nombre del canal en el json que es la clave
        //pasar todo a minusculas sin espacios
        canal.name = canal.name.toLowerCase().replace(/\s/g, '');

        let canalJson = this.url_web[canal.name];
        if(canalJson){
          canal.url_web = canalJson.url_web;
          canal.url_live = canalJson.url_live;
        }
    });
    return canales;
  }

  public canalesPorCategoria(categoria:string){
    return this.canales.filter((canal:any) => canal.tipo == categoria);
  }

}
