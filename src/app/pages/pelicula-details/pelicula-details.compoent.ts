import { Component, inject } from '@angular/core';
import { HttpService } from 'src/app/services/http.service';
import { diffHour } from '../../utils/utils';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { CommonModule } from '@angular/common';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { BannerComponent } from 'src/app/components/banner/banner.component';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-pelicula-details',
  templateUrl: './pelicula-details.compoent.html',
  styleUrls: ['./pelicula-details.compoent.scss'],
  standalone: true,
  imports: [CommonModule, NavBarComponent, BannerComponent],
})
export class PeliculaDetailsComponent {
  private route = inject(ActivatedRoute);

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
  // If we received bannerData via navigation state, skip the first param-based fetch
  private skipInitialRouteFetch = false;

  constructor(private guiaSvc: TvGuideService, private httpSvc: HttpService) {}

  ngOnInit(): void {
    // Prefer navigation state (router.navigate(..., { state: { bannerData } })) when available
    try {
      const navBanner = (history && (history.state as any)?.bannerData) || null;
      if (navBanner) {
        this.data = navBanner;
        this.destacada = navBanner;
        this.time = diffHour(navBanner.start || '', navBanner.stop || '');
        this.tipo = this.getTipo();
        this.updateProperties();
        this.skipInitialRouteFetch = true;
      }
    } catch (_) {}

    // React to route param changes so navigation between slugs reloads
    this.route.paramMap.subscribe((params) => {
      if (this.skipInitialRouteFetch) {
        // We've already populated from navigation state; allow subsequent param changes
        this.skipInitialRouteFetch = false;
        return;
      }
      const slugParam = params.get('slug');
      const idParam = params.get('id');

      // Reset state
      this.movie = {};
      this.data = {};
      this.destacada = {};
      this.actors = [];
      this.actorStartIndex = 0;
      this.movieStartIndex = 0;

      if (slugParam) {
        this.httpSvc.getMovieId(slugParam).subscribe((res: any) => {
          const first = res?.results?.[0];
          if (first?.id) {
            this.httpSvc
              .getMovieDetails(String(first.id))
              .subscribe((m: any) => {
                this.movie = m;
                this.data = this.transformMovieToData(m);
                this.destacada = this.data;
                this.time = diffHour(
                  this.data.start || '',
                  this.data.stop || ''
                );
                this.tipo = this.getTipo();
                this.updateProperties();
              });
          }
        });
      } else if (idParam) {
        if (/^\d+$/.test(idParam)) {
          this.httpSvc.getMovieDetails(idParam).subscribe((m: any) => {
            this.movie = m;
            this.data = this.transformMovieToData(m);
            this.destacada = this.data;
            this.time = diffHour(this.data.start || '', this.data.stop || '');
            this.tipo = this.getTipo();
            this.updateProperties();
          });
        } else {
          this.httpSvc.getMovieId(idParam).subscribe((res: any) => {
            const first = res?.results?.[0];
            if (first?.id) {
              this.httpSvc
                .getMovieDetails(String(first.id))
                .subscribe((m: any) => {
                  this.movie = m;
                  this.data = this.transformMovieToData(m);
                  this.destacada = this.data;
                  this.time = diffHour(
                    this.data.start || '',
                    this.data.stop || ''
                  );
                  this.tipo = this.getTipo();
                  this.updateProperties();
                });
            }
          });
        }
      }
    });

    // Still listen to in-app navigation which pushes into the service
    this.guiaSvc.getDetallesPrograma().subscribe((data: any) => {
      if (!data) return;
      this.data = data;
      this.destacada = data;
      this.time = diffHour(data.start, data.stop);
      this.tipo = this.getTipo();

      // Actualiza las propiedades de la clase
      this.updateProperties();
    });
  }

  private transformMovieToData(m: any) {
    return {
      title: { value: m.title || m.name || '' },
      desc: {
        cast: (m.credits?.cast || [])
          .slice(0, 10)
          .map((c: any) => c.name)
          .join(','),
      },
      start: m.release_date || '',
      stop: '',
      id: m.id,
      poster: m.poster_path
        ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
        : undefined,
      category: { value: 'Cine' },
    };
  }

  private updateProperties(): void {
    if (this.data?.channel_id) {
      this.httpSvc.getChannel(this.data.channel_id).subscribe((data: any) => {
        this.logo = data.icon;
      });
    }

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
    const castString = this.data?.desc?.cast;
    if (!castString) return;

    const castArray = String(castString)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (let actorName of castArray) {
      this.httpSvc.getPerson(actorName).subscribe((resp: any) => {
        const person = resp?.results?.[0];
        if (person) this.actors.push(person);
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
