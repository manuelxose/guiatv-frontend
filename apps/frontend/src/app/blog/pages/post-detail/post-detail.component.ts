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
import { Subject, first, takeUntil } from 'rxjs';
import { PostCardComponent } from '../../components/post-card/post-card.component';
import { ShareButtonsComponent } from '../../components/share-buttons/share-buttons.component';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, PostCardComponent, ShareButtonsComponent],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss'],
})
export class PostDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  post: any = null;
  relatedPosts: any[] = [];
  isLoading = true;
  readingTime = 0;
  currentUrl = '';

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
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const slug = params['slug'];
      this.loadPost(slug);
    });

    if (this.isBrowser) {
      this.currentUrl = window.location.href;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPost(slug: string): void {
    this.isLoading = true;

    this.blogSvc
      .getPostBySlug(slug)
      .pipe(first())
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.post = data[0];
            // Ensure content/excerpt are strings for template binding
            this.normalizePostContent(this.post);
            this.calculateReadingTime();
            this.setMetaTags();
            this.loadRelatedPosts();
            this.isLoading = false;

            // Scroll to top
            if (this.isBrowser) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          } else {
            this.router.navigate(['/blog']);
          }
        },
        error: (err) => {
          console.error('Error loading post:', err);
          this.router.navigate(['/blog']);
        },
      });
  }

  /**
   * Ensure the post.content.rendered and post.excerpt.rendered are strings.
   * Some backends may return an object shape unexpectedly; convert to a
   * safe HTML string or JSON fallback to avoid [object Object] in templates.
   */
  private normalizePostContent(post: any): void {
    if (!post) return;

    const ensureString = (value: any): string => {
      if (typeof value === 'string') return value;
      if (!value) return '';
      // try common nested keys
      const keys = ['rendered', 'raw', 'html', 'value', 'text'];
      for (const k of keys) {
        if (value[k] && typeof value[k] === 'string') return value[k];
      }
      // last resort: stringify
      try {
        return JSON.stringify(value);
      } catch (e) {
        return String(value);
      }
    };

    try {
      if (post.content) {
        post.content = {
          rendered: ensureString(post.content.rendered ?? post.content),
        };
      } else {
        post.content = { rendered: '' };
      }

      if (post.excerpt) {
        post.excerpt = {
          rendered: ensureString(post.excerpt.rendered ?? post.excerpt),
        };
      } else {
        post.excerpt = { rendered: '' };
      }

      // Normalize featured image caption if present (WP returns object with rendered)
      if (post.featured_image && post.featured_image.caption) {
        post.featured_image.caption = ensureString(
          post.featured_image.caption.rendered ?? post.featured_image.caption
        );
      }

      // Ensure title.rendered is string
      if (post.title) {
        post.title = {
          rendered: ensureString(post.title.rendered ?? post.title),
        };
      } else {
        post.title = { rendered: '' };
      }
    } catch (err) {
      // defensively set minimal fields
      post.content = post.content || { rendered: '' };
      post.excerpt = post.excerpt || { rendered: '' };
    }
  }

  private calculateReadingTime(): void {
    if (!this.post?.content?.rendered) {
      this.readingTime = 1;
      return;
    }

    const text = this.stripHtml(this.post.content.rendered);
    const words = text.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    this.readingTime = Math.max(1, Math.ceil(words / wordsPerMinute));
  }

  private setMetaTags(): void {
    const description = this.stripHtml(this.post.excerpt?.rendered || '').slice(
      0,
      160
    );

    this.metaSvc.setMetaTags({
      title: `${this.post.title?.rendered} | Blog`,
      description: description,
      image:
        this.post.featured_image?.source_url ||
        '/assets/images/blog-og-image.jpg',
      canonicalUrl: `/blog/${this.post.slug}`,
      type: 'article',
    });
  }

  private loadRelatedPosts(): void {
    if (!this.post.categories || this.post.categories.length === 0) {
      return;
    }
    const categoryId = this.post.categories[0];

    this.blogSvc
      .getRelatedPosts(categoryId)
      .pipe(first())
      .subscribe((posts) => {
        this.relatedPosts = posts
          .filter((p) => p.id !== this.post.id)
          .slice(0, 3);
      });
  }

  stripHtml(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  navigateToPost(post: any): void {
    this.router.navigate(['/blog', post.slug]);
  }

  trackByPostId(index: number, post: any): number {
    return post.id || index;
  }
}
