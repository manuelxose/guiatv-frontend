import { Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Observable, Subscription, combineLatest, fromEvent, map, of, throttleTime } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';


@Component({
  selector: 'app-program-list',
  templateUrl: './program-list.component.html',
  styleUrls: ['./program-list.component.scss']
})
export class ProgramListComponent implements OnInit, OnDestroy {

  @ViewChild('tabla') tabla!: ElementRef;
  @ViewChild('cabecera') cabecera!: ElementRef;
  @ViewChildren('programasRow', { read: ElementRef }) programasRow: QueryList<ElementRef>;

  programas: any = [];
  horas: string[] = [];
  senalizadorPosicion: number = 0;
  alturaScroll = 200;
  dias:any;
  canales:any;
  factorProporcional = 2; // Ajusta este valor según la relación deseada entre la duración del programa y el height del elemento
  franjaHorariaActual: number = 0; // El valor inicial será 0, que corresponderá a la primera franja horaria
  franjaHoraria: string ="";
  leftRem:any;
  mostrarHoraActual: boolean = true;
  desplazamientoHorizontal: number = 0;
  diaActual: string = "";
  franjas =[
    ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00'],
    ['03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30'],
    ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00'],
    ['10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
    ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'],
    ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
    ['21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00']
  ];
 //las franjas del movil duran 6h 00-06, 06-12, 12-18, 18-24
 franjas_movil = [

 ]
  hoy_format:any;
  isLoading = true;
  programasFiltrados: any = [];
  horaActual:any
  array_tipo:any = [];
  array_subTipo: any = [];
  tdt = [  "La 1",  "La 2",  "Antena 3",  "Cuatro",  "Telecinco",  "La Sexta",  "Mega",  "Factoría de Ficción",  "Neox",  "Nova",  "Boing",  "Divinity",  "Energy",  "Paramount Network",  "DMax",  "Disney Channel",  "Ten",  "Clan",  "Teledeporte",  "Be Mad",  "TRECE",  "DKiss",  "Real Madrid TV",  "Atreseries",  "GOL PLAY"];
  autonomicos: any[] = [
    {
      nombre: 'Canal Sur',
      comunidad: 'Andalucía'
    },
    {
      nombre: 'Canal Sur 2',
      comunidad: 'Andalucía'
    },
    {
      nombre: 'Andalucía TV',
      comunidad: 'Andalucía'
    },
    {
      nombre: 'Aragón TV',
      comunidad: 'Aragón'
    },
    {
      nombre: 'IB3',
      comunidad: 'Baleares'
    },
    {
      nombre: 'TV Canaria',
      comunidad: 'Canarias'
    },
    {
      nombre: 'CMM TV',
      comunidad: 'Castilla-La Mancha'
    },
    {
      nombre: 'CyLTV',
      comunidad: 'Castilla y León'
    },
    {
      nombre: 'La 8',
      comunidad: 'Castilla y León'
    },
    {
      nombre: 'TV3',
      comunidad: 'Cataluña'
    },
    {
      nombre: '3/24',
      comunidad: 'Cataluña'
    },
    {
      nombre: 'Super3/33',
      comunidad: 'Cataluña'
    },
    {
      nombre: 'Esport3',
      comunidad: 'Cataluña'
    },
    {
      nombre: 'Barça TV',
      comunidad: 'Cataluña'
    },
    {
      nombre: 'Telemadrid',
      comunidad: 'Madrid'
    },
    {
      nombre: 'La Otra',
      comunidad: 'Madrid'
    },
    {
      nombre: 'À Punt',
      comunidad: 'Comunidad Valenciana'
    },
    {
      nombre: '8 Mediterráneo',
      comunidad: 'Comunidad Valenciana'
    },
    {
      nombre: 'Canal Extremadura',
      comunidad: 'Extremadura'
    },
    {
      nombre: 'TVG',
      comunidad: 'Galicia'
    },
    {
      nombre: 'TVG2',
      comunidad: 'Galicia'
    },
    {
      nombre: 'TVR',
      comunidad: 'La Rioja'
    },
    {
      nombre: 'La 7 Rioja',
      comunidad: 'La Rioja'
    },
    {
      nombre: '7RM',
      comunidad: 'Murcia'
    },
    {
      nombre: 'TV Murciana',
      comunidad: 'Murcia'
    },
    {
      nombre: 'Navarra Televisión',
      comunidad: 'Navarra'
    },
    {
      nombre: 'Navarra 2 TV',
      comunidad: 'Navarra'
    },
    {
      nombre: 'ETB1',
      comunidad: 'País Vasco'
    },
    {
      nombre: 'ETB2',
      comunidad: 'País Vasco'
    },
    {
      nombre: 'ETB3',
      comunidad: 'País Vasco'
    },
    {
      nombre: 'ETB4',
      comunidad: 'País Vasco'
    }
  ];
  //todos los programas de cable y satelite
  cable = [
    "FOX",
    "FOX Life",
    "FOX Crime",
    "AXN",
    "AXN White",
    "TNT",
    "Syfy",
    "AMC",
    "HBO",
    "DARK",
    "TCM",
    "TNT",
    "Comedy Central",
    "Calle 13",
    "COSMO",
    "Canal Hollywood",
    "SUNDAZE",
    "XTRM",
    "Somos",
  ];
  screenWidthInRem: number;
  programaSeleccionado: any;
  canalSeleccionado: number = -1;
  isMobile: boolean;
  private scrollSubscription!: Subscription;

  constructor(private firestore: AngularFirestore,private el: ElementRef) {
    this.screenWidthInRem = 18.375;
    this.programasRow = new QueryList<ElementRef>();
    //dias debe tener la propuedad diaSemana y diaNumero el numero es el numero de dia del mes hoy seria Viernes 24 se debe calcular de forma dinamica a partir de la fecha actual
    this.getDiaSemana();
    this.isMobile = false;
    this.generarHoras();
  }

  async ngOnInit(): Promise<void> {

    this.updateScreenWidthInRem();
    window.addEventListener('resize', this.updateScreenWidthInRem.bind(this));




    const hoy = new Date();
     this.hoy_format = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '_');

    //obtener el dia en numero
    const dia = hoy.getDate();
    this.diaActual = dia.toString();
    this.horaActual = hoy.getHours();
    const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    this.seleccionarFranjaHoraria(this.horaActual);


    console.log('Realizando la llamada HTTP...');
    // this.programaService.initProgramacion().subscribe({
    //   next: (respuesta:any) => {
    //     console.log('Datos iniciales cargados correctamente:', respuesta.message);
    //   },
    //   error: (error) => {
    //     console.error('Error al cargar los datos iniciales:', error);
    //   },
    //   complete: () => {
    //     console.log('Carga de datos iniciales completada.');
    //   }
    // })

    //eliminar todos los documentos
    // this.programaService.deleteCollection('canales');
    this.obtenerPrimerosCanales().subscribe((canales: any[]) => {
      this.programas = canales.map(canal => {
        const programasHoy = canal[`programas_${this.hoy_format}`];
        if (programasHoy) {
          return {
            ...canal,
            programas: programasHoy.map((programa: any) => this.procesarProgramas(programa))
          };
        } else {
          console.log(`No se encontraron programas para el día ${this.hoy_format} en el canal ${canal.nombre}`);
          return { ...canal, programas: [] };
        }
      });

      this.programas = this.ordenarProgramas(this.programas);

      this.isLoading = false;

      if (this.franjaHoraria != "00:00") {
        const index = this.franjas.findIndex((franja) => franja[0] === this.franjaHoraria);
        this.cambiarFranjaHoraria(this.franjas[index], index);
      }
      this.leftRem = this.calcularLeft(hora, this.franjaHoraria);
    });

  }

  ngOnDestroy(): void {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.actualizarSeñalizador();

  }



  updateScreenWidthInRem(): void {
    const screenWidthInPixels = window.innerWidth;
    const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    this.screenWidthInRem = screenWidthInPixels / fontSize;//en cada pantalla meto 3horas

    if (this.screenWidthInRem <= 48) { // Reemplaza '48' con el valor de tu breakpoint de móvil en rem
      console.log('Tamaño de pantalla en rem:', this.screenWidthInRem);
      this.isMobile = true;
      this.screenWidthInRem = this.screenWidthInRem/3
    }else this.isMobile = false;
  }

  obtenerPrimerosCanales(): Observable<any[]> {
    const segmentos = [];
    const tamanioSegmento = 10;
    const nombresAutonomicos = this.autonomicos.map(autonomico => autonomico.nombre);

    const todosLosNombres = [...this.tdt, ...this.cable, ...nombresAutonomicos];

    // Divide los nombres en segmentos de tamaño 10
    for (let i = 0; i < todosLosNombres.length; i += tamanioSegmento) {
      segmentos.push(todosLosNombres.slice(i, i + tamanioSegmento));
    }

    // Realiza consultas por separado para cada segmento utilizando el filtro 'in', pero solo si el segmento no está vacío
    const consultas = segmentos.map(segmento => {
      if (segmento.length > 0) {
        return this.firestore
          .collection('canales', ref => ref.where('name', 'in', segmento))
          .valueChanges({ idField: 'id' });
      } else {
        // Si el segmento está vacío, devolver un observable vacío
        return of([]);
      }
    });

    // Combina todos los resultados y los aplana para obtener un único array
    return combineLatest(consultas).pipe(map(resultado => resultado.flat()));
  }


  private procesarProgramas(programa: any): any {
    const { start, end, description: descripcion } = programa;
    const inicio = this.parseCustomDate(start);
    const fin = this.parseCustomDate(end);
    const duracion = (fin.getTime() - inicio.getTime()) / 1000 / 60;
    const [primera = '', segunda = '', ...resto] = descripcion ? descripcion.split('\n') : [];
    const [ano = '', edad = '', votos = ''] = primera.split('|').map((s: any) => s.trim());
    const [genero = '', des_programa = ''] = segunda.split('·').map((s: any) => s.trim());
    const detalles = resto.join('\n').split('·').reduce((acc: any, item: string) => {
      const [clave, valor] = item.split(/: (.+)/)
      valor && (acc[clave.trim()?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")] = valor.trim());
      return acc;
    }, {});
    const [tipo = '', subtipo = ''] = genero.split("/");

    if (!this.array_tipo.includes(tipo)) {
      this.array_tipo.push(tipo);
    }
    if (!this.array_subTipo.includes(subtipo)) {
      this.array_subTipo.push(subtipo);
    }

    return {
      ...programa,
      duracion,
      inicio: inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      fin: fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      ano,
      edad,
      des_programa,
      clasificacion: /^\d\/\d/.test(votos) ? votos : '',
      genero,
      detalles,
      tipo,
      subtipo
    };
  }

  private ordenarProgramas(programas: any[]): any[] {
    return programas.sort((a: any, b: any) => {
      const indexATDT = this.tdt.indexOf(a.name);
      const indexBTDT = this.tdt.indexOf(b.name);
      const indexAAutonomico = this.autonomicos.findIndex(autonomico => autonomico.nombre === a.name);
      const indexBAutonomico = this.autonomicos.findIndex(autonomico => autonomico.nombre === b.name);
      const indexACable = this.cable.indexOf(a.name);
      const indexBCable = this.cable.indexOf(b.name);

      if (indexATDT !== -1 || indexBTDT !== -1) {
        if (indexATDT === -1) return 1;
        if (indexBTDT === -1) return -1;
        return indexATDT - indexBTDT;
      }

      if (indexACable !== -1 || indexBCable !== -1) {
        if (indexACable === -1) return 1;
        if (indexBCable === -1) return -1;
        return indexACable - indexBCable;
      }

      if (indexAAutonomico !== -1 || indexBAutonomico !== -1) {
        if (indexAAutonomico === -1) return 1;
        if (indexBAutonomico === -1) return -1;
        return indexAAutonomico - indexBAutonomico;
      }

      return a.name.localeCompare(b.name);
    });
  }

  generarHoras() {
    for (let i = 0; i < 24; i++) {
      this.horas.push(`${i.toString().padStart(2, '0')}:00`);
      this.horas.push(`${i.toString().padStart(2, '0')}:30`);
    }
  }

  cambiarFranjaHoraria(franja: string[], index?: number) {

    this.franjaHoraria = franja[0]; // Agregar esta línea
    this.horas = franja;
    //mostrar o no la barraver tical


    if(this.horaActual > this.horas[0].split(':')[0]  && this.horaActual < this.horas[0].split(':')[0]+3)     this.mostrarHoraActual = true
    else this.mostrarHoraActual = false;


    if(index !== undefined)
      setTimeout(() => {
        const programasRows = this.programasRow.toArray();
        programasRows.forEach((programasRowElement:any) => {
          let desplazamiento = (66.44999999999999*index)
          if(this.isMobile) desplazamiento = (28.43*index);
          if(index==2) {
            desplazamiento = 129.43333333333334;
            if(this.isMobile) desplazamiento = 55.86;
          }
          if(index==3) {
            desplazamiento = 193.8;
            if(this.isMobile) desplazamiento = 83.29;
          }
          if(index==4) {
            desplazamiento = 258.38;
            if(this.isMobile) desplazamiento = 110.92;
          }
          if(index==5) {
            desplazamiento = 323.15;
            if(this.isMobile) desplazamiento = 140.15;
          }
          if(index==6) {
            desplazamiento = 388.7;
            if(this.isMobile) desplazamiento = 166.38;
          }

          programasRowElement.nativeElement.style.transition = `transform 0.6s ease-out`
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
    console.log('horaActual', horaActual);

    const index = Math.floor(horaActual / 3) - 1;
    console.log('index', index);

    // Verifica si this.franjas[index] está definido
    if (this.franjas[index]) {
      console.log('this.franjas[index]', this.franjas[index]);

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
    // Mostrar dos días antes y tres días después de la fecha actual
    let fecha = new Date();
    let fechaActual = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
    let fechaAnterior = new Date(fecha.setDate(fecha.getDate() - 1)).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
    let fechaPosterior = new Date(fecha.setDate(fecha.getDate() + 2)).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
    let fechaPosterior2 = new Date(fecha.setDate(fecha.getDate() + 2)).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
    let fechaPosterior3 = new Date(fecha.setDate(fecha.getDate() + 3)).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });

    this.dias = [
      { diaSemana: fechaAnterior.split(' ')[0], diaNumero: fechaAnterior.split(' ')[1] },
      { diaSemana: fechaActual.split(' ')[0], diaNumero: fechaActual.split(' ')[1] },
      { diaSemana: fechaPosterior.split(' ')[0], diaNumero: fechaPosterior.split(' ')[1] },
    ];
  }

  public parseCustomDate(dateString: string): Date {
    //el formato de fechas es de 24h la diferencia entre
    const [day, month, year, hour, minute] = dateString.split(/[/ :]/).map(Number);
    return new Date(year, month - 1, day, hour, minute);
  }

  calcularAnchoPrograma(duracion: number): string {

    //60 minutos son 18.35 rem
    let anchoPorcentaje = duracion * (18.35 / 60)
    if(this.isMobile) anchoPorcentaje = duracion * (this.screenWidthInRem / 60)

    return `${anchoPorcentaje}rem`;
  }

  calcularPosicionIzquierda(horaInicio: string): string {

      const inicio = new Date(`1970-01-01 ${horaInicio}`);
      const franja = new Date(`1970-01-01 00:00`);

      const diferenciaMinutos = (inicio.getTime() - franja.getTime()) / (1000 * 60);
      //60 minutos son 18.35 rem
      let diferenciaRem = diferenciaMinutos * 18.375 / 60;
      if(this.isMobile){
        diferenciaRem = diferenciaMinutos * this.screenWidthInRem / 60;
    }
      return `${diferenciaRem}rem`;

  }

  mostrarInfoPrograma(canalIndex: number, programa: any) {
    this.canalSeleccionado = canalIndex;
    this.programaSeleccionado = programa;
  }

  calcularLeft = (horaActual: string, horaInicio: string) => {
    const inicio = new Date(`1970-01-01T${horaInicio}:00`);
    const actual = new Date(`1970-01-01T${horaActual}:00`);

    const diffInMinutes = (actual.getTime() - inicio.getTime()) / 60000;
    let totalRem = 18.375;
    const totalMinutes =  60; // 24 horas en minutos
    if(this.isMobile) totalRem = this.screenWidthInRem;
    const minutesPerRem = totalMinutes / totalRem;

    const leftRem = diffInMinutes / minutesPerRem;

    return leftRem < 8 ? 8 : leftRem;
  };

  cambiarDia(dia: number) {
    // Asignar this.programas a this.programasFiltrados solo si no tiene ningún valor
    this.diaActual = dia.toString();

    // Obtener la fecha actual y establecer el día proporcionado
    const fechaActual = new Date();
    fechaActual.setDate(dia);

    const fechaStr = `${('0' + fechaActual.getDate()).slice(-2)}_${('0' + (fechaActual.getMonth() + 1)).slice(-2)}_${fechaActual.getFullYear()}`;


    // Filtrar los programas basándose en el día seleccionado
    this.programas = this.programas.map((canal: any) => {
      const programasHoy = canal[`programas_${fechaStr}`];

      if (programasHoy) {
        return {
          ...canal,
          programas: programasHoy.map((programa: any) => this.procesarProgramas(programa))
        };
      } else {
        console.log(`No se encontraron programas para el día ${fechaStr} en el canal ${canal.nombre}`);
        return { ...canal, programas: [] };
      }
    });

    this.cambiarFranjaHoraria(this.franjas[0]);

  }

  public cerrarPrograma() {
    this.programaSeleccionado = null;
  }


}
