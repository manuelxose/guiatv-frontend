import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { first, filter } from 'rxjs';
import { BannerComponent } from 'src/app/components/banner/banner.component';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { SliderComponent } from 'src/app/components/slider/slider.component';
import { HttpService } from 'src/app/services/http.service';
import { MetaService } from 'src/app/services/meta.service';
import { ModalService } from 'src/app/services/modal.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-canal-completo',
  templateUrl: './canal-completo.component.html',
  styleUrls: ['./canal-completo.component.scss'],
  standalone: true,
  imports: [CommonModule,SliderComponent,BannerComponent,NavBarComponent],
})
export class CanalCompletoComponent {
  public query: string = '';
  public diaSeleccionado: string = 'Hoy';
  public canal: string = '';
  public programs: any = [];
  public program: any = {};
  public categorias: any[] = [];
  public categoriaSeleccionada: string = 'Selcciona una categoria';
  public popular_movies: any[] = [];
  public time: string = '';
  public logo: string = '';
  public channel: any = {};
  public live_programs: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpService,
    private modalService: ModalService,
    private svcGuide: TvGuideService,
    private router: Router,
    private metaSvc: MetaService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.query = params.get('id')?.toString() || '';
      this.canal = this.query.replace('-', ' ');
    });

    const canonicalUrl = this.router.url;

    this.metaSvc.setMetaTags({
      title: 'Programamacion de ' + this.canal + ' hoy',
      description: 'Programacion de ' + this.canal + ' hoy',
      canonicalUrl: canonicalUrl,
    });    try {
      this.http.programas$.pipe(first()).subscribe(async (data) => {
        if (data.length === 0) {
          console.log(`⏳ CANAL-COMPLETO - No hay datos, esperando a que se carguen desde HomeComponent...`);
          // En lugar de hacer una llamada API, suscribirse al observable para esperar datos
          this.http.programas$.pipe(
            filter(programs => programs.length > 0),
            first()
          ).subscribe((programs) => {
            console.log(`📦 CANAL-COMPLETO - Datos recibidos del observable global`);
            this.managePrograms(programs);
          });
        } else {
          console.log(`📋 CANAL-COMPLETO - Usando datos ya disponibles en cache`);
          this.managePrograms(data);
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  async cambiarDia(dia: string) {
    this.diaSeleccionado = this.cambiaDia(dia);
    (await this.http.getProgramacion(dia)).subscribe((data) => {
      this.http.setProgramas(data, dia).then(() => {
        this.managePrograms(data);
      });
    });
  }

  private managePrograms(programas: any) {
    this.svcGuide.setData(programas);
    // this.svcGuide.getProgramsByChannel(programas);
    this.programs = this.svcGuide.getProgramsByChannel(
      this.canal.replace('-', ' ')
    );
    //this.program es el programa que se optiene de cmpareDate
    this.program = this.programs.find((programa: any) => {
      return this.compareDate(programa.start, programa.stop);
    });

    for (let program of programas) {
      let programm = program.programs.find((programa: any) => {
        return this.compareDate(programa.start, programa.stop);
      });
      if (programm && programm.title.value !== 'Cine') {
        this.live_programs.push(programm);
        this.categorias.push(programm.desc.details.spli);
      }
    }

    // this.categorias = this.svcGuide
    //   .getAllCategories()
    //   .filter((categoria) => categoria !== undefined);

    this.categorias = this.svcGuide.getChannelCategories(this.programs);
    console.log(this.program);

    this.categoriaSeleccionada = this.program.category.value.split(',')[0];
    console.log(this.categoriaSeleccionada);

    this.http.getChannel(this.program.channel_id).forEach((data: any) => {
      this.logo = data.icon;
      this.channel = data;
    });
  }

  public manageModal(program: any) {
    this.modalService.setPrograma(program);
  }

  public compareDate(dateIni: string, dateFin: string): boolean {
    // Obtiene la hora actual, la hora de inicio y la hora de fin

    let horaActual = new Date(); // Suma 1 hora en milisegundos (3600000 ms)
    horaActual.setHours(horaActual.getHours() + 1);
    const horaInicio = new Date(dateIni);
    const horaFin = new Date(dateFin);

    if (this.diaSeleccionado !== 'Hoy') {
      switch (this.diaSeleccionado) {
        case 'Mañana':
          horaInicio.setDate(horaInicio.getDate() - 1);
          horaFin.setDate(horaFin.getDate() - 1);
          break;
        case 'Pasado mañana':
          horaInicio.setDate(horaInicio.getDate() - 2);
          horaFin.setDate(horaFin.getDate() - 2);
          break;
        default:
          break;
      }
    }

    // Obtén las horas y minutos de la hora actual y las horas de inicio y fin
    if (horaActual >= horaInicio && horaActual <= horaFin) {
      return true;
    }
    return false;
  }

  public getProgramsByCategory(categoria: string) {
    return this.svcGuide.getProgramsByCategory(categoria, this.channel.name);
  }

  public cambiaDia(dia: string) {
    switch (dia) {
      case 'today':
        return 'Hoy';
      case 'tomorrow':
        return 'Mañana';
      case 'after_tomorrow':
        return 'Pasado mañana';
      default:
        return 'Hoy';
    }
  }
}
