import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { isLive } from 'src/app/utils/utils';

@Component({
  selector: 'app-peliculas',
  templateUrl: './peliculas.component.html',
  styleUrls: ['./peliculas.component.scss'],
})
export class PeliculasComponent {
  public peliculas: any[] = [];
  public categorias: any[] = [];
  public destacada: any = {};
  public logo: string = '';
  public en_emision: any[] = [];

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
          this.http.getProgramacion('today').subscribe((data) => {
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
  }

  private manageMovies(data: any) {
    this.svcGuide.setData(data);

    this.peliculas = this.svcGuide.getAllMovies().filter((pelicula) => {
      if (isLive(pelicula.start, pelicula.stop)) {
        this.en_emision.push(pelicula);
      }

      return (
        pelicula !== undefined &&
        pelicula.title.value.toLowerCase().trim() !== 'cine'
      );
    });

    this.categorias = this.svcGuide
      .getMoviesCategories()
      .filter((categoria) => {
        return (
          categoria !== undefined && categoria.toLowerCase().trim() !== 'otros'
        );
      });
    // GESTION DE PELICULA DESTACADA

    this.svcGuide.getPeliculasDestacadas().subscribe((data) => {
      this.destacada = data[0];
    });
  }

  public getPeliculasByCategory(categoria: string) {
    return this.svcGuide.getMoviesByCategory(categoria);
  }
}
