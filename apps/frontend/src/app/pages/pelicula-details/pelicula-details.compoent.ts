import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpService } from 'src/app/services/http.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { MetaService } from 'src/app/services/meta.service';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { Subscription } from 'rxjs';
import { diffHour, durationToISO8601, minutesToISO8601 } from '../../utils/utils';
import { InteractionButtonsComponent } from 'src/app/components/interaction-buttons/interaction-buttons.component';
import { WhereToWatchComponent } from 'src/app/components/where-to-watch/where-to-watch.component';

@Component({
  selector: 'app-pelicula-details',
  templateUrl: './pelicula-details.compoent.html',
  styleUrls: ['./pelicula-details.compoent.scss'],
  standalone: true,
  imports: [CommonModule, NavBarComponent, RouterModule, InteractionButtonsComponent, WhereToWatchComponent],
})
export class PeliculaDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private httpSvc = inject(HttpService);
  private guiaSvc = inject(TvGuideService);
  private metaSvc = inject(MetaService);

  public data: any = { genres: [] };
  public movie: any = {}; // Holds raw API response
  public actors: any[] = [];
  public relatedContent: any[] = [];
  public popularContent: any[] = [];
  
  public contentType: 'movies' | 'series' | 'programs' = 'movies';
  public isLoading = true;
  public ldJson: string = '';
  
  // Navigation state
  public actorStartIndex = 0;
  public relatedStartIndex = 0;

  private subs: Subscription = new Subscription();

  ngOnInit(): void {
    console.log('PeliculaDetailsComponent ngOnInit');

    // 1. Determine content type from route data
    this.subs.add(
      this.route.data.subscribe((data) => {
        if (data['type']) {
          this.contentType = data['type'];
        }
      })
    );

    // 2. Listen to params
    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        const slug = params.get('slug');
        const id = params.get('id');
        this.resetState();
        
        if (slug) {
          this.loadBySlug(slug);
        } else if (id) {
          this.loadById(id);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private resetState() {
    this.data = {};
    this.movie = {};
    this.actors = [];
    this.relatedContent = [];
    this.popularContent = [];
    this.actorStartIndex = 0;
    this.relatedStartIndex = 0;
    this.isLoading = true;
  }

  private loadBySlug(slug: string) {
    if (this.contentType === 'programs') {
      this.loadProgramBySlug(slug);
    } else {
      const searchMethod = this.contentType === 'series' 
        ? this.httpSvc.getSeriesId(slug) 
        : this.httpSvc.getMovieId(slug);

      searchMethod.subscribe({
        next: (res: any) => {
          const first = res?.results?.[0];
          if (first?.id) {
            this.loadDetails(String(first.id));
          } else {
            console.warn('No results found for slug:', slug, 'Falling back to programs...');
            this.loadProgramBySlug(slug);
          }
        },
        error: (err) => {
          console.error('loadBySlug error:', err, 'Falling back to programs...');
          this.loadProgramBySlug(slug);
        }
      });
    }
  }

  private loadById(id: string) {
    if (this.contentType === 'programs') {
       this.loadProgramById(id);
    } else {
      this.loadDetails(id);
    }
  }

  private loadDetails(id: string) {
    const detailsMethod = this.contentType === 'series'
      ? this.httpSvc.getSeriesDetails(id)
      : this.httpSvc.getMovieDetails(id);

    detailsMethod.subscribe({
      next: (res: any) => {
        this.movie = res;
        this.data = this.transformToUnifiedData(res);
        this.updateMetaTags();
        this.loadAdditionalInfo(id);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  public interactionType(): 'movie' | 'series' | 'program' {
    if (this.contentType === 'series') {
      return 'series';
    }
    if (this.contentType === 'programs') {
      return 'program';
    }
    return 'movie';
  }

  public providerContentType(): 'movie' | 'tv' | null {
    if (this.contentType === 'movies') {
      return 'movie';
    }
    if (this.contentType === 'series') {
      return 'tv';
    }
    return null;
  }

  public numericTmdbId(): number | null {
    const id = Number(this.data?.id);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  // --- Program Specific Logic ---
  private loadProgramBySlug(slug: string) {
    this.httpSvc.getProgramacion('today').subscribe((programs: any[]) => {
        const flatPrograms = this.flattenPrograms(programs);
        const found = flatPrograms.find((p: any) => this.slugify(p.title?.value || p.title) === slug);
        
        if (found) {
            this.movie = found;
            this.data = this.transformProgramToData(found);
            this.updateMetaTags();
            this.isLoading = false;
            this.relatedContent = this.getSimilarPrograms(flatPrograms, found);
        } else {
            this.isLoading = false;
        }
    });
  }

  private loadProgramById(id: string) {
      this.httpSvc.getProgramacion('today').subscribe((programs: any[]) => {
        const flatPrograms = this.flattenPrograms(programs);
        const found = flatPrograms.find((p: any) => String(p.id) === id);
        
        if (found) {
            this.movie = found;
            this.data = this.transformProgramToData(found);
            this.updateMetaTags();
            this.isLoading = false;
             this.relatedContent = this.getSimilarPrograms(flatPrograms, found);
        } else {
             this.isLoading = false;
        }
    });
  }

  private flattenPrograms(data: any[]): any[] {
    return data.flatMap((item: any) => {
      if (Array.isArray(item?.programs)) return item.programs;
      if (Array.isArray(item?.channels)) return item.channels; // Adjust based on actual structure
      return [];
    });
  }

  private getSimilarPrograms(allPrograms: any[], current: any): any[] {
      // Simple similarity based on category
      const category = current.category?.value || current.desc?.category;
      if (!category) return [];
      return allPrograms.filter(p => {
          const pCat = p.category?.value || p.desc?.category;
          return pCat && pCat === category && p.id !== current.id;
      }).slice(0, 10);
  }

  // --- Data Transformation ---

  private transformToUnifiedData(m: any) {
    console.log('transformToUnifiedData input:', m);
    const isSeries = this.contentType === 'series';
    const result = {
      id: m.id,
      title: m.title || m.name || '',
      overview: m.overview || '',
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
      backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : '',
      year: (m.release_date || m.first_air_date || '').split('-')[0],
      rating: m.vote_average,
      duration: m.runtime || (m.episode_run_time?.length ? m.episode_run_time[0] : 0),
      genres: m.genres?.map((g: any) => g.name) || [],
      directors: isSeries ? (m.created_by || []).map((c: any) => c.name).join(', ') : '',
      cast: m.credits?.cast || [],
      type: this.contentType
    };
    console.log('transformToUnifiedData result:', result);
    return result;
  }

  private transformProgramToData(p: any) {
      console.log('transformProgramToData input:', p);
      
      // Handle category which can be a string or object
      let genres: string[] = [];
      if (typeof p.category === 'string') {
          genres = p.category.split(',').map((c: string) => c.trim());
      } else if (p.category?.value) {
          genres = [p.category.value];
      }

      // Handle description
      const overview = p.desc?.value || p.desc?.details || p.description || '';

      const result = {
          id: p.id,
          title: p.title?.value || p.title || '',
          overview: overview,
          poster: p.image || '', 
          backdrop: p.image || '',
          year: p.start ? new Date(p.start).getFullYear().toString() : '',
          rating: p.starRating,
          duration: diffHour(p.start, p.end || p.stop), // Use end or stop
          genres: genres,
          directors: '',
          cast: [],
          type: 'programs',
          start: p.start,
          stop: p.end || p.stop // Use end or stop
      };
      console.log('transformProgramToData result:', result);
      return result;
  }

  private loadAdditionalInfo(id: string) {
    if (this.contentType === 'movies') {
        // Get Credits (Cast/Crew)
        this.httpSvc.getMovieCredits(id).subscribe((res: any) => {
            if (res) {
                this.actors = res.cast || [];
                const directors = res.crew?.filter((c: any) => c.job === 'Director').map((c: any) => c.name).join(', ');
                if (this.data) this.data.directors = directors;
            }
        });
        // Get Similar
        this.httpSvc.getSimilarMovie(id).subscribe((res: any) => {
            this.relatedContent = res?.results || [];
        });

    } else if (this.contentType === 'series') {
         // Get Credits
         this.httpSvc.getSeriesCredits(id).subscribe((res: any) => {
             if (res) {
                 this.actors = res.cast || [];
             }
         });
         // Get Similar
         this.httpSvc.getSimilarSeries(id).subscribe((res: any) => {
             this.relatedContent = res?.results || [];
         });
    }
  }

  private updateMetaTags() {
    if (!this.data) return;
    
    const title = `${this.data.title} - Guía TV`;
    const description = this.data.overview || `Detalles de ${this.data.title}`;
    const image = this.data.backdrop || this.data.poster;

    this.metaSvc.setMetaTags({
      title,
      description,
      image,
      url: this.router.url,
      type: 'website' // or video.movie / video.tv_show
    });

    this.generateJsonLd();
  }

  private generateJsonLd(): void {
    if (!this.data?.title) return;
    const baseUrl = 'https://guiaprogramaciontv.com';
    const slug = this.slugify(this.data.title);
    const schemaType = this.contentType === 'series' ? 'TVSeries'
      : this.contentType === 'programs' ? 'VideoObject'
      : 'Movie';
    const contentPath = this.contentType === 'series' ? 'series'
      : this.contentType === 'movies' ? 'peliculas'
      : 'programas';
    const contentUrl = `${baseUrl}/${contentPath}/${slug}`;

    let isoDuration = '';
    if (this.contentType === 'programs' && this.data.start && this.data.stop) {
      isoDuration = durationToISO8601(this.data.start, this.data.stop);
    } else if (typeof this.data.duration === 'number' && this.data.duration > 0) {
      isoDuration = minutesToISO8601(this.data.duration);
    }

    const uploadDate = this.data.year ? `${this.data.year}-01-01` : new Date().toISOString().split('T')[0];

    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name: this.data.title,
      description: this.data.overview || `${this.data.title} en la guía de TV española`,
      image: this.data.poster || this.data.backdrop,
      uploadDate,
      url: contentUrl,
      contentUrl,
      inLanguage: 'es-ES',
    };
    if (isoDuration) schema['duration'] = isoDuration;
    if (this.data.rating) {
      schema['aggregateRating'] = {
        '@type': 'AggregateRating',
        ratingValue: this.data.rating,
        bestRating: 10,
        ratingCount: 1,
      };
    }
    if (this.data.genres?.length) schema['genre'] = this.data.genres;
    if (this.data.directors) schema['director'] = { '@type': 'Person', name: this.data.directors };

    try {
      this.ldJson = JSON.stringify(schema);
    } catch {
      this.ldJson = '';
    }
  }

  // --- UI Helpers ---
  
  public getDuration(): string {
      if (!this.data.duration) return '';
      if (typeof this.data.duration === 'string') return this.data.duration; // Already formatted
      const hours = Math.floor(this.data.duration / 60);
      const minutes = this.data.duration % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  public nextActors() {
    if (this.actorStartIndex + 6 < this.actors.length) {
      this.actorStartIndex += 6;
    }
  }

  public prevActors() {
    this.actorStartIndex = Math.max(0, this.actorStartIndex - 6);
  }

  public nextRelated() {
    if (this.relatedStartIndex + 6 < this.relatedContent.length) {
      this.relatedStartIndex += 6;
    }
  }

  public prevRelated() {
    this.relatedStartIndex = Math.max(0, this.relatedStartIndex - 6);
  }

  public slugify(text: string): string {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  }
}
