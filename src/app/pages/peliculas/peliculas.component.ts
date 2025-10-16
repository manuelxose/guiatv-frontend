import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { first, filter } from 'rxjs';
import { BannerComponent } from 'src/app/components/banner/banner.component';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { SliderComponent } from 'src/app/components/slider/slider.component';
import { HttpService } from 'src/app/services/http.service';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { isLive } from 'src/app/utils/utils';

@Component({
  selector: 'app-peliculas',
  templateUrl: './peliculas.component.html',
  styleUrls: ['./peliculas.component.scss'],
  standalone: true,
  imports: [SliderComponent, CommonModule, BannerComponent, NavBarComponent],
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
    });    try {
      this.http.programas$.pipe(first()).subscribe(async (data) => {
        //si no hay programas, esperar a que HomeComponent los cargue
        if (data.length === 0) {
          console.log(`⏳ PELICULAS - No hay datos, esperando a que se carguen desde HomeComponent...`);
          // En lugar de hacer una llamada API, suscribirse al observable para esperar datos
          this.http.programas$.pipe(
            filter(programs => programs.length > 0),
            first()
          ).subscribe((programs) => {
            console.log(`📦 PELICULAS - Datos recibidos del observable global`);
            this.manageMovies(programs);
          });
        } else {
          console.log(`📋 PELICULAS - Usando datos ya disponibles en cache`);
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
