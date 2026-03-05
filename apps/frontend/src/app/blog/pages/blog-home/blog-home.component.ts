import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BlogService } from '../../../services/blog.service';
import { MetaService } from '../../../services/meta.service';

import { Subject, first, takeUntil } from 'rxjs';
import { slugify } from '../../../utils/utils';
import { PostCardComponent } from 'src/app/components/post-card/post-card.component';
import { CategoryFilterComponent } from '../../components/category-filter/category-filter.component';
import { PostCardHorizontalComponent } from '../../components/post-card-horizontal/post-card-horizontal.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-blog-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PostCardComponent,
    CategoryFilterComponent,
  ],
  templateUrl: './blog-home.component.html',
  styleUrls: ['./blog-home.component.scss'],
})
export class BlogHomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  // Data
  posts: any[] = [];
  featuredPosts: any[] = [];
  latestPosts: any[] = [];
  categories: any[] = [];

  // Pagination
  postsPerPage = 12;
  currentPage = 1;

  // Loading states
  isLoading = true;

  // Filters
  selectedCategory: string | null = null;

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
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setMetaTags(): void {
    this.metaSvc.setMetaTags({
      title: 'Blog de Cine, Series y Anime | Noticias y Análisis',
      description:
        'Descubre artículos, reseñas y análisis sobre cine, series y anime. Mantente al día con las últimas noticias del entretenimiento.',
      image: '/assets/images/blog-og-image.jpg',
      canonicalUrl: '/blog',
      type: 'website',
    });
  }

  private loadData(): void {
    this.blogSvc
      .getAllPosts()
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.posts = this.sortByDate(data);
          this.featuredPosts = this.posts.slice(0, 6);
          this.latestPosts = this.posts.slice(0, 12);
          this.loadCategories();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading posts:', err);
          this.isLoading = false;
        },
      });
  }

  private loadCategories(): void {
    this.blogSvc.blogCategories$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats) => {
        if (cats.length === 0) {
          this.blogSvc.intiCategories(this.posts);
        } else {
          this.categories = cats;
        }
      });
  }

  private sortByDate(posts: any[]): any[] {
    return [...posts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  // UI Methods
  navigateToPost(post: any): void {
    const slug = slugify(post.slug || post.title?.rendered || '');
    this.router.navigate(['/blog', slug]);
  }

  filterByCategory(categoryId: string | null): void {
    this.selectedCategory = categoryId;
    this.currentPage = 1;

    if (!categoryId) {
      this.latestPosts = this.posts.slice(0, this.postsPerPage);
      return;
    }

    this.blogSvc
      .filterByCategory(Number(categoryId))
      .pipe(first())
      .subscribe((filtered) => {
        this.latestPosts = filtered.slice(0, this.postsPerPage);
      });
  }

  loadMore(): void {
    this.currentPage++;
    const start = 0;
    const end = this.currentPage * this.postsPerPage;

    if (this.selectedCategory) {
      this.blogSvc
        .filterByCategory(Number(this.selectedCategory))
        .pipe(first())
        .subscribe((filtered) => {
          this.latestPosts = filtered.slice(start, end);
        });
    } else {
      this.latestPosts = this.posts.slice(start, end);
    }
  }

  get hasMorePosts(): boolean {
    const totalPosts = this.selectedCategory
      ? this.latestPosts.length
      : this.posts.length;
    return this.currentPage * this.postsPerPage < totalPosts;
  }

  trackByPostId(index: number, post: any): number {
    return post.id || index;
  }
}
