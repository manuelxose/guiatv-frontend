import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { HttpService } from 'src/app/services/http.service';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { diffHour, getHoraInicio } from 'src/app/utils/utils';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  public popular_movies: any[] = [];
  public live_programs: any[] = [];
  public programs: any = [];
  public program: any = {};
  public logo: any = {};
  public time: string = '';
  public destacada: any = {};

  constructor(
    private metaSvc: MetaService,
    private router: Router,
    private http: HttpService,
    private svcGuide: TvGuideService
  ) {}

  ngOnInit(): void {
    const canonicalUrl = this.router.url;

    this.metaSvc.setMetaTags({
      title: 'Guia Programacion TV',
      description: 'Guia de programacion de canales de television de España',
      canonicalUrl: canonicalUrl,
    });

    try {
      this.http.programas$.pipe(first()).subscribe(async (data) => {
        //si no hay programas llamar a la api
        if (data.length === 0) {
          this.http.getProgramacion('today').subscribe((data) => {
            this.http.setProgramas(data, 'today').then(() => {
              this.svcGuide.setData(data);
              this.programs = data;
              this.managePrograms();
            });
          });
        } else {
          this.svcGuide.setData(data);
          this.programs = data;
          this.managePrograms();
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  ngAfterViewInit() {
    // cargar programas
  }

  private async managePrograms() {
    // this.popular_movies = await this.svcGuide.getBestRatedMovies();
    this.svcGuide.getPeliculasDestacadas().subscribe((data) => {
      this.destacada = data[0];
    });
    // this.time = getHoraInicio(this.program.start);

    this.programs.find((programa: any) => {
      if (programa.channel.id === this.program.channel_id) {
        console.log('Programa:', programa.channel);

        this.logo = programa.channel.icon;
      }
    });
  }

  public formatHora(inicio: string) {
    //la salida de la funcion es un string con la hora de inicio del programa
    //ejemplo: 12:00
    //la hora de entrada es "Tue Jan 09 2024 00:00:00 GMT+0000 (Coordinated Universal Time)" hay que sumarle 1 hora

    const horaInicio = new Date(inicio);
    horaInicio.setHours(horaInicio.getHours() - 1); // Restar 1 hora
    const horaInicioString = horaInicio.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return horaInicioString;
  }
}
