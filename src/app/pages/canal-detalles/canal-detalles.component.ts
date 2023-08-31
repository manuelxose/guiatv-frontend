import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FilterService } from 'src/app/services/filter.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-canal-detalles',
  templateUrl: './canal-detalles.component.html',
  styleUrls: ['./canal-detalles.component.scss'],
})
export class CanalDetallesComponent implements OnInit {
  public programas$: Subscription | undefined;
  public programas: any[] = [];
  public hoy_format: string;
  public canalName: string;
  public canalLogo: string;
  public query: string;
  public canal: any;
  public diaSeleccionado: string = 'hoy';

  constructor(private route: ActivatedRoute, private guiaSvc: TvGuideService) {
    const hoy = new Date();
    this.hoy_format = hoy
      .toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '_');
    this.canalName = '';
    this.canalLogo = '';
    this.query = '';
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.query = params.get('canal')?.toString() || '';
    });

    this.guiaSvc
      .getDocumentByName('canales_españa', this.query)
      .subscribe((data: any) => {
        console.log(data);
        this.canal = data;
        this.canalName = data.name;
        this.canalLogo = data.image;
        this.programas = data[`programas_${this.hoy_format}`];
        console.log(this.programas);
      });
  }

  ngOnDestroy(): void {
    // Asegúrate de cancelar la suscripción cuando el componente se destruya
    this.programas$!.unsubscribe();
  }

  cambiarDia(dia: string) {
    // Limpia la lista actual de programas
    this.programas = [];
    this.diaSeleccionado = dia;

    // Establece la fecha de la programación según el día seleccionado
    let fechaProgramacion = new Date();
    if (dia === 'ayer') {
      fechaProgramacion.setDate(fechaProgramacion.getDate() - 1);
    } else if (dia === 'mañana') {
      fechaProgramacion.setDate(fechaProgramacion.getDate() + 1);
    }
    console.log(this.canal, fechaProgramacion);

    // Convierte la fecha de programación a una cadena en el formato que deseas, por ejemplo: 'dd/MM/yyyy'
    const fechaProgramacionStr = fechaProgramacion
      .toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '_');
    console.log(fechaProgramacionStr);

    this.programas = this.canal[`programas_${fechaProgramacionStr}`];
  }
}
