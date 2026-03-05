import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, first } from 'rxjs';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { BlogService } from 'src/app/services/blog.service';
import { slugify } from 'src/app/utils/utils';

interface ArticleCategory {
  id: string;
  name: string;
  articles: any[];
}

@Component({
  selector: 'app-blog-category',
  standalone: true,
  imports: [CommonModule, NavBarComponent],
  templateUrl: './blog-category.component.html',
  styleUrl: './blog-category.component.scss',
})
export class BlogCategoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  featuredArticle: any = null;
  categories: ArticleCategory[] = [];
  trendingArticles: any[] = [];
  isLoading = true;

  constructor(
    private blogSvc: BlogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBlogData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBlogData(): void {
    this.blogSvc
      .getAllPosts()
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (posts) => {
          const sortedPosts = this.blogSvc.sortPostsByDate(posts);
          
          // Set featured article (most recent)
          this.featuredArticle = sortedPosts[0] || null;
          
          // Organize by categories
          this.organizeByCategories(sortedPosts.slice(1));
          
          // Set trending (mock - in real app would come from analytics)
          this.trendingArticles = sortedPosts.slice(0, 3);
          
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading blog posts:', err);
          this.isLoading = false;
        }
      });
  }

  private organizeByCategories(posts: any[]): void {
    const categoryMap = new Map<number, ArticleCategory>();
    
    posts.forEach(post => {
      if (post.categories_name && Array.isArray(post.categories_name)) {
        post.categories_name.forEach((cat: any) => {
          if (!categoryMap.has(cat.id)) {
            categoryMap.set(cat.id, {
              id: cat.id.toString(),
              name: cat.name,
              articles: []
            });
          }
          categoryMap.get(cat.id)?.articles.push(post);
        });
      }
    });

    // Convert to array and limit articles per category
    this.categories = Array.from(categoryMap.values())
      .map(cat => ({
        ...cat,
        articles: cat.articles.slice(0, 6) // Limit to 6 per category
      }))
      .filter(cat => cat.articles.length > 0);
  }

  navigateToArticle(post: any): void {
    const slug = slugify(post.slug || post.title?.rendered || '');
    this.router.navigate(['/blog', slug]);
  }

  navigateToCategory(categoryId: string): void {
    // Navigate to filtered view (would need to implement)
    console.log('Navigate to category:', categoryId);
  }

  getExcerpt(post: any): string {
    const excerpt = post.excerpt?.rendered || '';
    // Remove HTML tags and limit to 150 characters
    const text = excerpt.replace(/<[^>]*>/g, '');
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  trackByArticleId(index: number, article: any): any {
    return article.id || index;
  }
}
