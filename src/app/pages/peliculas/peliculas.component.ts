import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-peliculas',
  templateUrl: './peliculas.component.html',
  styleUrls: ['./peliculas.component.scss'],
})
export class PeliculasComponent {
  public peliculas: any[] = [];
  public categorias: any[] = [];

  constructor(
    private svcGuide: TvGuideService,
    private http: HttpService,
    private metaSvc: MetaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const canonicalUrl = this.router.url;

    this.metaSvc.setMetaTags({
      title: 'Peliculas de TV',
      description:
        'Listado de peliculas de television de España, como El Hormiguero, La Voz, Masterchef, etc.',
      canonicalUrl: canonicalUrl,
    });

    try {
      this.http.programas$.pipe(first()).subscribe(async (data) => {
        //si no hay programas llamar a la api
        if (data.length === 0) {
          (await this.http.getProgramacion('today')).subscribe((data) => {
            this.http.setProgramas(data, 'today').then(() => {
              this.manageMovies(data);
            });
          });
        } else {
          this.manageMovies(data);
        }
      });
    } catch (error) {
      console.log(error);
    }

    // LOGICA DE GESTION DE PELICULAS
  }

  private manageMovies(data: any) {
    console.log('Gestion de peliculas');
    this.svcGuide.setData(data);

    this.peliculas = this.svcGuide.getAllMovies();
    this.categorias = this.svcGuide
      .getMoviesCategories()
      .filter((categoria) => categoria !== undefined);
  }

  //elminar de la lista de categorias las undefined
  // this.categorias = this.svcGuide
  //   .getMoviesCategories()
  //   .filter((categoria) => categoria !== undefined);
  // console.log('Peliculas:', this.peliculas);
  // console.log('Categorias:', this.categorias);
  public getPeliculasByCategory(categoria: string) {
    return this.svcGuide.getMoviesByCategory(categoria);
  }
}
