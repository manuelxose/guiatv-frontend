import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { PostCardComponent } from '../../components/post-card/post-card.component';
import { Subject, first, takeUntil } from 'rxjs';
import { BlogService } from 'src/app/services/blog.service';
import { MetaService } from 'src/app/services/meta.service';
import { slugify } from 'src/app/utils/utils';

@Component({
  selector: 'app-top10',
  standalone: true,
  imports: [CommonModule, PostCardComponent],
  templateUrl: './top10.component.html',
  styleUrls: ['./top10.component.scss'],
})
export class Top10Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  // Data
  posts: any[] = [];
  featuredPosts: any[] = [];
  displayedPosts: any[] = [];

  // Carousel
  carouselIndex = 0;
  postsPerView = 3;

  // Pagination
  currentPage = 1;
  postsPerPage = 10;

  // Loading
  isLoading = true;

  constructor(
    private blogSvc: BlogService,
    private metaSvc: MetaService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.setMetaTags();
    this.calculatePostsPerView();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setMetaTags(): void {
    this.metaSvc.setMetaTags({
      title: 'Top 10 - Los Mejores Rankings de Cine, Series y Anime',
      description:
        'Descubre los mejores rankings y listas de cine, series y anime. Obras maestras, joyas ocultas y sorpresas de cada temporada.',
      image: '/assets/images/top10-og-image.jpg',
      canonicalUrl: '/blog/top10',
      type: 'website',
    });
  }

  private calculatePostsPerView(): void {
    if (!this.isBrowser) {
      this.postsPerView = 3;
      return;
    }

    const width = window.innerWidth;
    if (width < 640) {
      this.postsPerView = 1;
    } else if (width < 1024) {
      this.postsPerView = 2;
    } else {
      this.postsPerView = 3;
    }
  }

  private loadData(): void {
    this.blogSvc
      .getAllPosts()
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.posts = this.blogSvc.sortPostsByDate(data);
          this.featuredPosts = this.posts.slice(0, 6);
          this.updateDisplayedPosts();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading posts:', err);
          this.isLoading = false;
        },
      });

    this.blogSvc.setProgramsFromApi();
  }

  private updateDisplayedPosts(): void {
    const start = 0;
    const end = this.currentPage * this.postsPerPage;
    this.displayedPosts = this.posts.slice(start, end);
  }

  // Carousel Controls
  nextSlide(): void {
    if (this.carouselIndex < this.posts.length - this.postsPerView) {
      this.carouselIndex++;
    }
  }

  prevSlide(): void {
    if (this.carouselIndex > 0) {
      this.carouselIndex--;
    }
  }

  get visiblePosts(): any[] {
    return this.posts.slice(
      this.carouselIndex,
      this.carouselIndex + this.postsPerView
    );
  }

  get canGoPrev(): boolean {
    return this.carouselIndex > 0;
  }

  get canGoNext(): boolean {
    return this.carouselIndex < this.posts.length - this.postsPerView;
  }

  // Pagination
  loadMore(): void {
    this.currentPage++;
    this.updateDisplayedPosts();
  }

  get hasMorePosts(): boolean {
    return this.currentPage * this.postsPerPage < this.posts.length;
  }

  // Navigation
  navigateToPost(post: any): void {
    const slug = slugify(post.slug || post.title?.rendered || '');
    this.router.navigate(['/blog', slug]);
  }

  trackByPostId(index: number, post: any): number {
    return post.id || index;
  }
}
