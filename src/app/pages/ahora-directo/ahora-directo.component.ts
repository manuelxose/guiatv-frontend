import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { first, filter } from 'rxjs';
import { BannerComponent } from 'src/app/components/banner/banner.component';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { HttpService } from 'src/app/services/http.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { isLive } from 'src/app/utils/utils';

@Component({
  selector: 'app-ahora-directo',
  standalone: true,
  imports: [ CommonModule,NavBarComponent,BannerComponent],
  templateUrl: './ahora-directo.component.html',
  styleUrl: './ahora-directo.component.scss',
})
export class AhoraDirectoComponent {
  public isPelicula: boolean = true;
  public isSerie: boolean = false;
  public programs: any[] = [];
  public peliculas_live: any[] = [];
  public series_live: any[] = [];
  constructor(private http: HttpService, private svcGuide: TvGuideService) {}

  ngOnInit(): void {    try {
      this.http.programas$.pipe(first()).subscribe(async (data) => {
        //si no hay programas, esperar a que HomeComponent los cargue
        if (data.length === 0) {
          console.log(`⏳ AHORA-DIRECTO - No hay datos, esperando a que se carguen desde HomeComponent...`);
          // En lugar de hacer una llamada API, suscribirse al observable para esperar datos
          this.http.programas$.pipe(
            filter(programs => programs.length > 0),
            first()
          ).subscribe((programs) => {
            console.log(`📦 AHORA-DIRECTO - Datos recibidos del observable global`);
            this.svcGuide.setData(programs);
            this.programs = programs;
            this.managePrograms();
          });
        } else {
          console.log(`📋 AHORA-DIRECTO - Usando datos ya disponibles en cache`);
          this.svcGuide.setData(data);
          this.programs = data;
          this.managePrograms();
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  private managePrograms() {
    this.svcGuide.getAllMovies().forEach((movie) => {
      if (isLive(movie.start, movie.stop)) {
        this.peliculas_live.push(movie);
      }
    });
    this.svcGuide.getAllSeries().forEach((serie) => {
      if (isLive(serie.start, serie.stop)) {
        this.series_live.push(serie);
      }
    });
    this.programs = this.peliculas_live;
  }

  getPeliculasAhora() {
    this.isPelicula = true;
    this.isSerie = false;
    this.programs = this.peliculas_live;
  }
  getSeriesAhora() {
    this.isPelicula = false;
    this.isSerie = true;
    this.programs = this.series_live;
  }
}
