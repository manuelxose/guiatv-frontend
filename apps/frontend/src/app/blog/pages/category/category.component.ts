import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogService } from '../../../services/blog.service';
import { MetaService } from '../../../services/meta.service';
import { PostCardComponent } from '../../components/post-card/post-card.component';
import { Subject, first, takeUntil, switchMap } from 'rxjs';
import { slugify } from '../../../utils/utils';
import { PostCardHorizontalComponent } from '../../components/post-card-horizontal/post-card-horizontal.component';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink, PostCardComponent],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
})
export class CategoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  // Data
  category: any = null;
  posts: any[] = [];
  allCategories: any[] = [];
  featuredPost: any = null;

  // Pagination
  currentPage = 1;
  postsPerPage = 12;
  displayedPosts: any[] = [];

  // Loading
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogSvc: BlogService,
    private metaSvc: MetaService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const slug = params['slug'];
          this.isLoading = true;
          return this.loadCategoryAndPosts(slug);
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadCategoryAndPosts(slug: string) {
    try {
      // Cargar todas las categorías
      await this.loadAllCategories();

      // Encontrar la categoría actual por slug
      this.category = this.allCategories.find(
        (cat) => slugify(cat.name) === slug || slugify(cat.slug) === slug
      );

      if (!this.category) {
        this.router.navigate(['/blog']);
        return;
      }

      // Cargar posts de la categoría
      await this.loadCategoryPosts();

      // Configurar meta tags
      this.setMetaTags();

      this.isLoading = false;

      // Scroll to top
      if (this.isBrowser) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error loading category:', error);
      this.router.navigate(['/blog']);
    }
  }

  private async loadAllCategories(): Promise<void> {
    return new Promise((resolve) => {
      this.blogSvc.blogCategories$.pipe(first()).subscribe((categories) => {
        if (categories.length === 0) {
          // Si no hay categorías, cargar posts primero
          this.blogSvc
            .getAllPosts()
            .pipe(first())
            .subscribe((posts) => {
              this.blogSvc.intiCategories(posts);
              this.blogSvc.blogCategories$.pipe(first()).subscribe((cats) => {
                this.allCategories = cats;
                resolve();
              });
            });
        } else {
          this.allCategories = categories;
          resolve();
        }
      });
    });
  }

  private async loadCategoryPosts(): Promise<void> {
    return new Promise((resolve) => {
      this.blogSvc
        .filterByCategory(this.category.id)
        .pipe(first())
        .subscribe((posts) => {
          this.posts = this.blogSvc.sortPostsByDate(posts);

          // Separar post destacado
          if (this.posts.length > 0) {
            this.featuredPost = this.posts[0];
            this.updateDisplayedPosts();
          }

          resolve();
        });
    });
  }

  private setMetaTags(): void {
    const description = this.category.description
      ? this.stripHtml(this.category.description).slice(0, 160)
      : `Descubre los mejores artículos sobre ${this.category.name}. Análisis, reseñas y noticias actualizadas.`;

    this.metaSvc.setMetaTags({
      title: `${this.category.name} - Blog | Guía Programación`,
      description: description,
      image:
        this.featuredPost?.featured_image?.source_url ||
        '/assets/images/blog-og-image.jpg',
      canonicalUrl: `/blog/categoria/${slugify(
        this.category.slug || this.category.name
      )}`,
      type: 'website',
    });
  }

  private updateDisplayedPosts(): void {
    const start = 0;
    const end = this.currentPage * this.postsPerPage;
    // Excluir el post destacado de la lista
    const postsToDisplay = this.posts.slice(1);
    this.displayedPosts = postsToDisplay.slice(start, end);
  }

  // Pagination
  loadMore(): void {
    this.currentPage++;
    this.updateDisplayedPosts();
  }

  get hasMorePosts(): boolean {
    const totalPosts = this.posts.length - 1; // Excluir post destacado
    return this.currentPage * this.postsPerPage < totalPosts;
  }

  // Navigation
  navigateToPost(post: any): void {
    const slug = slugify(post.slug || post.title?.rendered || '');
    this.router.navigate(['/blog', slug]);
  }

  navigateToCategory(category: any): void {
    const slug = slugify(category.slug || category.name);
    this.router.navigate(['/blog/categoria', slug]);
  }

  // Utils
  stripHtml(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  trackByPostId(index: number, post: any): number {
    return post.id || index;
  }

  trackByCategoryId(index: number, category: any): number {
    return category.id || index;
  }
}
