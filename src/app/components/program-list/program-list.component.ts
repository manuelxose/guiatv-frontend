import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FilterService } from 'src/app/services/filter.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import * as _canales from '../../../assets/canales.json';
import { HttpService } from 'src/app/services/http.service';
import { ReductorService } from 'src/app/reducers/reductor.service';
import { Store } from '@ngrx/store';
import { PROGRAMS } from 'src/app/models/program';

@Component({
  selector: 'app-program-list',
  templateUrl: './program-list.component.html',
  styleUrls: ['./program-list.component.scss'],
})
export class ProgramListComponent implements OnInit, OnDestroy {
  @ViewChild('tabla') tabla!: ElementRef;
  @ViewChild('cabecera') cabecera!: ElementRef;
  @ViewChildren('programasRow', { read: ElementRef })
  programasRow: QueryList<ElementRef>;

  programas: any = [];
  horas: string[] = [];
  senalizadorPosicion: number = 0;
  alturaScroll = 200;
  dias: any;
  canales: any;
  factorProporcional = 2; // Ajusta este valor según la relación deseada entre la duración del programa y el height del elemento
  franjaHorariaActual: number = 0; // El valor inicial será 0, que corresponderá a la primera franja horaria
  franjaHoraria: string = '';
  leftRem: any;
  mostrarHoraActual: boolean = true;
  desplazamientoHorizontal: number = 0;
  diaActual: string = '';
  _canales: any;
  franjas = [
    ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00'],
    ['03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30'],
    ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00'],
    ['10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
    ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'],
    ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
    ['21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00'],
  ];
  //las franjas del movil duran 6h 00-06, 06-12, 12-18, 18-24
  franjas_movil = [];
  hoy_format: any;
  isLoading = true;
  programasFiltrados: any = [];
  horaActual: any;
  array_tipo: any = [];
  array_subTipo: any = [];
  hoy: boolean = true;
  screenWidthInRem: number;
  programaSeleccionado: any;
  canalSeleccionado: number = -1;
  isMobile: boolean;
  private scrollSubscription!: Subscription;

  constructor(private httpservce: HttpService, private redux: ReductorService) {
    this.screenWidthInRem = 18.375;
    this.programasRow = new QueryList<ElementRef>();
    //dias debe tener la propuedad diaSemana y diaNumero el numero es el numero de dia del mes hoy seria Viernes 24 se debe calcular de forma dinamica a partir de la fecha actual
    this.getDiaSemana();
    this.isMobile = false;
    this.generarHoras();
    this._canales = _canales;
  }

  ngOnInit() {
    const hoy = new Date();
    const dia = hoy.getDate();
    this.diaActual = dia.toString();
    this.horaActual = hoy.getHours();
    const hora = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    this.hoy_format = hoy
      .toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '_');

    //nuevos programas

    this.seleccionarFranjaHoraria(this.horaActual);
    this.updateScreenWidthInRem();
    window.addEventListener('resize', this.updateScreenWidthInRem.bind(this));

    ///de forma temporal obtener los progrmaas de models programs

    // this.programas = PROGRAMS;
    //comprobar si hay progrmas en beahvior subject

    this.httpservce.programas$.subscribe(async (programas) => {
      this.programas = programas;
      if (this.programas.length === 0) {
        this.isLoading = true;

        await this.getFromApi();
      }
      this.isLoading = false;
      if (this.franjaHoraria != '00:00') {
        const index = this.franjas.findIndex(
          (franja) => franja[0] === this.franjaHoraria
        );
        this.cambiarFranjaHoraria(this.franjas[index], index);
      }
      this.leftRem = this.calcularLeft(hora, this.franjaHoraria);
      //si no hay programas llamar a la api
    });

    // this.httpservce.setProgramas(this.programas);

    // console.log('Estado del Stoire: ', this.redux.getState());
    // this.isLoading = false;
    // if (this.franjaHoraria != '00:00') {
    //   const index = this.franjas.findIndex(
    //     (franja) => franja[0] === this.franjaHoraria
    //   );
    //   this.cambiarFranjaHoraria(this.franjas[index], index);
    // }
  }

  ngOnDestroy(): void {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
  }
  public async getFromApi() {
    const hora = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    (await this.httpservce.getProgramacion('today')).subscribe((res: any) => {
      this.programas = res;

      this.httpservce.setProgramas(res);

      this.isLoading = false;
      if (this.franjaHoraria != '00:00') {
        const index = this.franjas.findIndex(
          (franja) => franja[0] === this.franjaHoraria
        );
        this.cambiarFranjaHoraria(this.franjas[index], index);
      }
      this.leftRem = this.calcularLeft(hora, this.franjaHoraria);
    });
  }

  ngAfterViewInit() {
    this.actualizarSeñalizador();
  }

  updateScreenWidthInRem(): void {
    const screenWidthInPixels = window.innerWidth;
    const fontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    this.screenWidthInRem = screenWidthInPixels / fontSize; //en cada pantalla meto 3horas

    if (this.screenWidthInRem <= 48) {
      // Reemplaza '48' con el valor de tu breakpoint de móvil en rem
      this.isMobile = true;
      this.screenWidthInRem = this.screenWidthInRem / 3;
    } else this.isMobile = false;
  }

  generarHoras() {
    for (let i = 0; i < 24; i++) {
      this.horas.push(`${i.toString().padStart(2, '0')}:00`);
      this.horas.push(`${i.toString().padStart(2, '0')}:30`);
    }
  }

  cambiarFranjaHoraria(franja: string[], index?: number) {
    this.franjaHoraria = franja[0];
    // Agregar esta línea
    this.horas = franja;
    //mostrar o no la barraver tical
    const horaActual = this.obtenerHoraActual();
    const horaEnMinutos =
      parseInt(horaActual.split(':')[0]) * 60 +
      parseInt(horaActual.split(':')[1]);
    const rangoInicioEnMinutos =
      parseInt(franja[0].split(':')[0]) * 60 +
      parseInt(franja[0].split(':')[1]);
    const rangoFinEnMinutos = rangoInicioEnMinutos + 180; // 3 horas en minutos
    this.mostrarHoraActual =
      horaEnMinutos >= rangoInicioEnMinutos &&
      horaEnMinutos <= rangoFinEnMinutos;

    if (index !== undefined)
      setTimeout(() => {
        const programasRows = this.programasRow.toArray();
        programasRows.forEach((programasRowElement: any) => {
          let desplazamiento = 66.44999999999999 * index;
          if (this.isMobile) desplazamiento = 28.43 * index;
          if (index == 2) {
            desplazamiento = 129.43333333333334;
            if (this.isMobile) desplazamiento = 55.86;
          }
          if (index == 3) {
            desplazamiento = 193.8;
            if (this.isMobile) desplazamiento = 83.29;
          }
          if (index == 4) {
            desplazamiento = 258.38;
            if (this.isMobile) desplazamiento = 110.92;
          }
          if (index == 5) {
            desplazamiento = 323.15;
            if (this.isMobile) desplazamiento = 140.15;
          }
          if (index == 6) {
            desplazamiento = 388.7;
            if (this.isMobile) desplazamiento = 166.38;
          }

          programasRowElement.nativeElement.style.transition = `transform 0.6s ease-out`;
          programasRowElement.nativeElement.style.transform = `translateX(-${desplazamiento}rem)`;
        });
      }, 0);
  }

  actualizarSeñalizador() {
    // Implementar la lógica para actualizar la posición del señalizador.
    this.senalizadorPosicion = 0;
  }

  // Simplifica el código utilizando una función
  seleccionarFranjaHoraria(horaActual: number) {
    let index = Math.floor(horaActual / 3) - 1;
    if (index < 0) index = 0;

    // Verifica si this.franjas[index] está definido
    if (this.franjas[index]) {
      this.franjaHoraria = this.franjas[index][0];
      this.cambiarFranjaHoraria(this.franjas[index]);

      // Si la hora actual no está dentro de la franja seleccionada, oculta la línea

      this.mostrarHoraActual = this.franjaHoraria === this.franjas[index][0];
    } else {
      // Manejar el caso en que this.franjas[index] no esté definido

      console.error('Error: this.franjas[index] no está definido');
    }
  }

  public getDiaSemana() {
    // Mostrar el día actual y los dos siguientes después de la fecha actual
    const dias = [];
    const fechaActual = new Date();

    for (let i = 0; i < 3; i++) {
      const fecha = new Date(fechaActual);
      fecha.setDate(fecha.getDate() + i);

      const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
      const diaNumero = fecha.toLocaleDateString('es-ES', { day: 'numeric' });

      dias.push({ diaSemana, diaNumero });
    }

    this.dias = dias;
  }

  public parseCustomDate(dateString: string): Date {
    //el formato de fechas es de 24h la diferencia entre
    const [day, month, year, hour, minute] = dateString
      .split(/[/ :]/)
      .map(Number);
    return new Date(year, month - 1, day, hour, minute);
  }

  calcularAnchoPrograma(duracion: number): string {
    //60 minutos son 18.35 rem
    let anchoPorcentaje = duracion * (18.35 / 60);
    if (this.isMobile)
      anchoPorcentaje = duracion * (this.screenWidthInRem / 60);

    return `${anchoPorcentaje}rem`;
  }

  calcularPosicionIzquierda(horaInicio: string): string {
    const inicio = new Date(`1970-01-01 ${horaInicio}`);
    const franja = new Date(`1970-01-01 00:00`);

    const diferenciaMinutos =
      (inicio.getTime() - franja.getTime()) / (1000 * 60);
    //60 minutos son 18.35 rem
    let diferenciaRem = (diferenciaMinutos * 18.375) / 60;
    if (this.isMobile) {
      diferenciaRem = (diferenciaMinutos * this.screenWidthInRem) / 60;
    }
    return `${diferenciaRem}rem`;
  }

  mostrarInfoPrograma(canalIndex: number, programa: any) {
    this.canalSeleccionado = canalIndex;
    this.programaSeleccionado = programa;
    this.mostrarHoraActual = false;
  }

  calcularLeft = (horaActual: string, horaInicio: string) => {
    const inicio = new Date(`1970-01-01T${horaInicio}:00`);
    const actual = new Date(`1970-01-01T${horaActual}:00`);

    const diffInMinutes = (actual.getTime() - inicio.getTime()) / 60000;
    let totalRem = 18.375;
    const totalMinutes = 60; // 24 horas en minutos
    if (this.isMobile) totalRem = this.screenWidthInRem;
    const minutesPerRem = totalMinutes / totalRem;

    const leftRem = diffInMinutes / minutesPerRem;

    return leftRem < 8 ? 8 : leftRem;
  };

  async cambiarDia(dia: number) {
    // Obtener la fecha actual y establecer el día proporcionado

    console.log(dia);

    const hora = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    this.seleccionarFranjaHoraria(this.horaActual);
    this.updateScreenWidthInRem();
    window.addEventListener('resize', this.updateScreenWidthInRem.bind(this));

    // Lógica para verificar si el día seleccionado es el día siguiente o dos días después
    const esDiaSiguiente = dia === 1;
    const esDosDiasDespues = dia === 2;

    if (esDiaSiguiente || esDosDiasDespues) {
      this.isLoading = true;
      this.hoy = true;
      const fechaParaLlamar = esDiaSiguiente ? 'today+1' : 'today+2';

      (await this.httpservce.getProgramacion(fechaParaLlamar)).subscribe(
        (res: any) => {
          this.programas = res;
          // Añadir el url_web y url_live desde _canales
          this.httpservce.setProgramas(this.programas);

          this.isLoading = false;
          if (this.franjaHoraria != '00:00') {
            const index = this.franjas.findIndex(
              (franja) => franja[0] === this.franjaHoraria
            );

            this.cambiarFranjaHoraria(this.franjas[index], index);

            this.leftRem = this.calcularLeft(hora, this.franjaHoraria);
          }
        }
      );
    } else if (dia === 0) {
      this.isLoading = true;
      this.hoy = false;
      console.log('dia actual: ', this.hoy_format);

      (await this.httpservce.getProgramacion('today')).subscribe((res: any) => {
        this.programas = res;
        // Añadir el url_web y url_live desde _canales
        this.httpservce.setProgramas(this.programas);

        this.isLoading = false;
        if (this.franjaHoraria != '00:00') {
          const index = this.franjas.findIndex(
            (franja) => franja[0] === this.franjaHoraria
          );

          this.cambiarFranjaHoraria(this.franjas[index], index);

          this.leftRem = this.calcularLeft(hora, this.franjaHoraria);
        }
      });
    }
  }

  public cerrarPrograma() {
    this.programaSeleccionado = null;
    this.mostrarHoraActual = true;
  }

  public getHoras(fechaString: string) {
    //el formato tiene que ser hh:mm
    const partes = fechaString.split(' ');
    const horaMinutos = partes[4].split(':');
    const hora = horaMinutos[0];
    const minutos = horaMinutos[1];

    return `${hora}:${minutos}`;
  }

  isCineCategory(category: string): boolean {
    category = category.trim();
    return category === 'Cine' || category === 'Películas de suspense';
  }

  obtenerHoraActual(): string {
    const fechaActual = new Date();
    const hora = fechaActual.getHours().toString().padStart(2, '0');
    const minutos = fechaActual.getMinutes().toString().padStart(2, '0');
    return `${hora}:${minutos}`;
  }

  get programaRoute() {
    // Verifica que programaSeleccionado.title.value sea una cadena válida antes de hacer el reemplazo
    if (
      this.programaSeleccionado &&
      typeof this.programaSeleccionado.title.value === 'string'
    ) {
      return (
        '/detalles/' + this.programaSeleccionado.title.value.replace(/ /g, '-')
      );
    }
    return '/detalles'; // Otra ruta por defecto si no es válido
  }
}
