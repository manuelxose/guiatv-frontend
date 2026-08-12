import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, first } from 'rxjs';
import { BlogService } from 'src/app/services/blog.service';
import { slugify } from 'src/app/utils/utils';

@Component({
  selector: 'app-blog-details',
  templateUrl: './blog-details.component.html',
  styleUrls: ['./blog-details.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class BlogDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  article: any = null;
  relatedArticles: any[] = [];
  isLoading = true;
  liked = false;
  commentsCount = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogSvc: BlogService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const slug = params['slug'];
        if (slug) {
          this.loadArticle(slug);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadArticle(slug: string): void {
    this.isLoading = true;
    
    this.blogSvc
      .getPostBySlug(slug)
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (posts) => {
          if (posts && posts.length > 0) {
            this.article = posts[0];
            this.loadRelatedArticles();
          } else {
            this.router.navigate(['/blog']);
          }
        },
        error: (err) => {
          console.error('Error loading article:', err);
          this.router.navigate(['/blog']);
        }
      });
  }

  private loadRelatedArticles(): void {
    if (!this.article?.categories_name?.[0]?.id) {
      this.isLoading = false;
      return;
    }

    const categoryId = this.article.categories_name[0].id;
    
    this.blogSvc
      .getRelatedPosts(categoryId, 3)
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (posts) => {
          // Filter out current article
          this.relatedArticles = posts
            .filter(p => p.id !== this.article.id)
            .slice(0, 3);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  toggleLike(): void {
    this.liked = !this.liked;
  }

  shareArticle(): void {
    if (navigator.share) {
      navigator.share({
        title: this.article.title?.rendered,
        text: this.getExcerpt(this.article),
        url: window.location.href
      }).catch(() => {
        // Fallback: copy to clipboard
        this.copyToClipboard(window.location.href);
      });
    } else {
      this.copyToClipboard(window.location.href);
    }
  }

  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Link copied to clipboard');
    });
  }

  navigateToArticle(article: any): void {
    const slug = slugify(article.slug || article.title?.rendered || '');
    this.router.navigate(['/blog', slug]);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  getExcerpt(article: any): string {
    const excerpt = article.excerpt?.rendered || '';
    const text = excerpt.replace(/<[^>]*>/g, '');
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  trackByArticleId(index: number, article: any): any {
    return article.id || index;
  }
}
