import { Component } from '@angular/core';
import { HttpService } from 'src/app/services/http.service';
import { diffHour } from '../../utils/utils';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-pelicula-details',
  templateUrl: './blog-details.component.html',
  styleUrls: ['./blog-details.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class PeliculaDetailsComponent {
  public post: any = {};
  public post_list: any[] = [];
  public blog: any = {};
  public headers: any = [];
  public alt: string = '';
  public data: any = {};
  public actors: any[] = [];
  public actor: any = {};
  public relatedMovies: any[] = [];
  public actorStartIndex = 0;
  public movieStartIndex = 0;
  public popular_movies: any[] = [];
  public movie: any = {};
  public movieId: string = '';
  public time: string = '';
  public logo: string = '';
  public tipo = '';
  public destacada: any = {};

  constructor(private guiaSvc: TvGuideService, private httpSvc: HttpService) {}

  ngOnInit(): void {
    this.guiaSvc.getDetallesPrograma().subscribe((data: any) => {
      this.data = data;
      this.destacada = data;
      this.time = diffHour(data.start, data.stop);
      this.tipo = this.getTipo();

      // Actualiza las propiedades de la clase
      this.updateProperties();
    });
  }

  private updateProperties(): void {
    this.httpSvc.getChannel(this.data.channel_id).subscribe((data: any) => {
      this.logo = data.icon;
    });

    if (this.data && Object.keys(this.data).length > 0) {
      this.getActors();
      if (this.tipo === 'Series') {
        this.getSeriesDetails();
        this.getRelatedSeries();
        this.getPopularSeries();
      } else {
        this.getRelatedMovies();
        this.getMovieDetails();
        this.getPopularMovies();
      }
    }
  }

  private getTipo() {
    if (/T\d/.test(this.data.title.value)) {
      return 'Series';
    } else {
      return 'Peliculas';
    }
  }

  ngAfterViewInit(): void {}

  private getActors() {
    this.actors = [];
    if (this.data.desc.cast === null) {
      return;
    }
    for (let actor of this.data.desc.cast.split(',')) {
      this.httpSvc.getPerson(actor).subscribe((data) => {
        this.actor = data;
        this.actors.push(this.actor.results[0]);
      });
    }
  }

  private getRelatedSeries() {
    const title = this.data.title.value.replace(/T\d+.*/, '');
    this.httpSvc.getSeriesId(title).subscribe((data: any) => {
      this.httpSvc
        .getSimilarSeries(data.results[0].id)
        .subscribe((data: any) => {
          this.relatedMovies = data.results;
        });
    });
  }

  private getPopularSeries() {
    this.httpSvc.getPopularSeries().subscribe((data: any) => {
      this.popular_movies = data.results;
    });
  }

  private getSeriesDetails() {
    const title = this.data.title.value.replace(/T\d+.*/, '');
    this.httpSvc.getSeriesId(title).subscribe((data: any) => {
      this.httpSvc
        .getSeriesDetails(data.results[0].id)
        .subscribe((data: any) => {
          this.movie = data;
        });
    });
  }

  private getRelatedMovies() {
    this.httpSvc.getMovieId(this.data.title.value).subscribe((data: any) => {
      this.httpSvc
        .getSimilarMovie(data.results[0].id)
        .subscribe((data: any) => {
          this.relatedMovies = data.results;
        });
    });
  }

  private getPopularMovies() {
    this.httpSvc.getPopularMovies().subscribe((data: any) => {
      this.popular_movies = data.results;
    });
  }

  private getMovieDetails() {
    this.httpSvc.getMovieId(this.data.title.value).subscribe((data: any) => {
      this.httpSvc
        .getMovieDetails(data.results[0].id)
        .subscribe((data: any) => {
          this.movie = data;
        });
    });
  }

  public nextActors(): void {
    if (this.actorStartIndex + 4 < this.actors.length) {
      this.actorStartIndex += 4;
    }
  }
  public previousActors(): void {
    if (this.actorStartIndex > 0) {
      this.actorStartIndex -= 4;
    }
  }

  public nextMovies(): void {
    if (this.movieStartIndex + 6 < this.relatedMovies.length) {
      this.movieStartIndex += 6;
    }
  }
  public previousMovies(): void {
    this.movieStartIndex = Math.max(this.movieStartIndex - 6, 0);
  }
}
