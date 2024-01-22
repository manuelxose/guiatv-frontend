import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { first } from 'rxjs';
import { ComponentsModule } from 'src/app/components/components.module';
import { HttpService } from 'src/app/services/http.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { isLive } from 'src/app/utils/utils';

@Component({
  selector: 'app-ahora-directo',
  standalone: true,
  imports: [ComponentsModule, CommonModule],
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

  ngOnInit(): void {
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
