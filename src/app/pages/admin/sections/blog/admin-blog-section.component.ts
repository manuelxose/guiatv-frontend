import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import {
  AdminBlogCreatePayload,
  AdminBlogPost,
  AdminBlogService,
} from '../../../../services/admin-blog.service';
import {
  calculateReadingTime,
  generateExcerpt,
  isValidUrl,
  slugify,
  stripHtml,
  truncateTitle,
} from '../../../../utils/utils';

@Component({
  selector: 'app-admin-blog-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-blog-section.component.html',
  styleUrls: ['./admin-blog-section.component.scss'],
})
export class AdminBlogSectionComponent implements OnInit {
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  public blogPosts: AdminBlogPost[] = [];
  public blogLoading = false;
  public blogError: string | null = null;
  public blogLastLoaded: Date | null = null;
  public blogSaving = false;
  public blogSaveError: string | null = null;
  public blogSaveSuccess: string | null = null;

  public blogStatusFilter: 'all' | 'draft' | 'publish' = 'all';
  public blogSearchTerm = '';
  public readonly blogStatusOptions = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'publish', label: 'Published' },
  ];

  public readonly seoTitleMax = 60;
  public readonly seoDescriptionMax = 160;
  public blogForm: FormGroup;
  public readonly siteUrl = environment.SITE_URL;

  constructor(private blogService: AdminBlogService, private fb: FormBuilder) {
    this.blogForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(6)]],
      slug: [''],
      status: ['draft'],
      excerpt: [''],
      content: [''],
      categories: [''],
      coverImage: [''],
      metaTitle: [''],
      metaDescription: [''],
      keywords: [''],
      ogImage: [''],
      canonicalUrl: [''],
      publishedAt: [''],
    });
  }

  ngOnInit(): void {
    this.loadBlogPosts();
  }

  onBlogSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.blogSearchTerm = target?.value || '';
  }

  setBlogStatus(status: 'all' | 'draft' | 'publish'): void {
    this.blogStatusFilter = status;
    this.loadBlogPosts(true);
  }

  applyBlogFilters(): void {
    this.loadBlogPosts(true);
  }

  refreshBlog(): void {
    this.loadBlogPosts(true);
  }

  submitBlogPost(): void {
    if (this.blogSaving) return;

    if (this.blogForm.invalid) {
      this.blogForm.markAllAsTouched();
      this.blogSaveError = 'Please complete the required fields.';
      return;
    }

    const payload = this.buildBlogPayload();
    this.blogSaving = true;
    this.blogSaveError = null;
    this.blogSaveSuccess = null;

    this.blogService.createPost(payload).subscribe({
      next: () => {
        this.blogSaving = false;
        this.blogSaveSuccess = 'Post saved.';
        this.resetBlogForm();
        this.loadBlogPosts(true);
      },
      error: () => {
        this.blogSaving = false;
        this.blogSaveError = 'Failed to save the post.';
      },
    });
  }

  resetBlogForm(clearMessages = false): void {
    this.blogForm.reset({
      title: '',
      slug: '',
      status: 'draft',
      excerpt: '',
      content: '',
      categories: '',
      coverImage: '',
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      ogImage: '',
      canonicalUrl: '',
      publishedAt: '',
    });

    if (clearMessages) {
      this.blogSaveError = null;
      this.blogSaveSuccess = null;
    }
  }

  trackByBlogPost(_index: number, post: AdminBlogPost): string {
    return String(post.id || post.slug);
  }

  get blogPreviewSlug(): string {
    return slugify(this.getTrimmedValue('slug') || this.blogTitleValue);
  }

  get blogPreviewTitle(): string {
    const title = this.getTrimmedValue('metaTitle') || this.blogTitleValue;
    return truncateTitle(title || 'Untitled post', this.seoTitleMax);
  }

  get blogPreviewDescription(): string {
    const content = this.getRawValue('content');
    const excerpt =
      this.getRawValue('metaDescription') ||
      this.getRawValue('excerpt') ||
      generateExcerpt(content, this.seoDescriptionMax);
    return truncateTitle(excerpt, this.seoDescriptionMax);
  }

  get blogPreviewUrl(): string {
    const slug = this.blogPreviewSlug || 'new-post';
    return `${this.siteUrl}/blog/${slug}`;
  }

  get blogTitleValue(): string {
    return this.getTrimmedValue('title');
  }

  get blogSeoTitleLength(): number {
    return (this.getTrimmedValue('metaTitle') || this.blogTitleValue).length;
  }

  get blogSeoDescriptionLength(): number {
    return this.blogPreviewDescription.length;
  }

  get blogWordCount(): number {
    const text = stripHtml(this.getRawValue('content')).trim();
    return text ? text.split(/\s+/).length : 0;
  }

  get blogReadingTime(): number {
    return calculateReadingTime(this.getRawValue('content'));
  }

  isSeoTitleOk(): boolean {
    const len = this.blogSeoTitleLength;
    return len >= 40 && len <= this.seoTitleMax;
  }

  isSeoDescriptionOk(): boolean {
    const len = this.blogSeoDescriptionLength;
    return len >= 120 && len <= this.seoDescriptionMax;
  }

  isCanonicalValid(): boolean {
    const value = this.getTrimmedValue('canonicalUrl');
    return !value || isValidUrl(value);
  }

  getPostTitle(post: AdminBlogPost): string {
    return post.title?.rendered || 'Untitled';
  }

  getPostExcerpt(post: AdminBlogPost): string {
    const excerpt = post.excerpt?.rendered || post.content?.rendered || '';
    return generateExcerpt(excerpt, 160);
  }

  getPostCategories(post: AdminBlogPost): string {
    const categories = post.categories_name?.map((cat) => cat.name) || [];
    return categories.length ? categories.join(', ') : 'Uncategorized';
  }

  getPostSeoTitle(post: AdminBlogPost): string {
    return post.seo?.metaTitle || this.getPostTitle(post);
  }

  getPostSeoDescription(post: AdminBlogPost): string {
    return (
      post.seo?.metaDescription ||
      generateExcerpt(
        post.excerpt?.rendered || post.content?.rendered || '',
        this.seoDescriptionMax
      )
    );
  }

  getPostImage(post: AdminBlogPost): string | null {
    return post.featured_image?.source_url || post.seo?.ogImage || null;
  }

  getPostUrl(post: AdminBlogPost): string {
    const slug = post.slug || 'post';
    return `${this.siteUrl}/blog/${slug}`;
  }

  getPostStatusClass(status?: string): string {
    if (status === 'publish') {
      return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40';
    }
    return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
  }

  private loadBlogPosts(force = false): void {
    if (this.blogLoading) return;
    if (!force && this.blogPosts.length > 0) return;

    this.blogLoading = true;
    this.blogError = null;

    const search = this.blogSearchTerm.trim();
    this.blogService
      .getPosts({
        status: this.blogStatusFilter,
        search: search || undefined,
        limit: 40,
      })
      .subscribe({
        next: (posts) => {
          this.blogPosts = posts || [];
          this.blogLastLoaded = new Date();
          this.blogLoading = false;
          this.lastUpdatedChange.emit(this.blogLastLoaded);
        },
        error: () => {
          this.blogLoading = false;
          this.blogError = 'Failed to load blog posts.';
        },
      });
  }

  private buildBlogPayload(): AdminBlogCreatePayload {
    const title = this.getTrimmedValue('title');
    const slug = slugify(this.getTrimmedValue('slug') || title);
    const status =
      this.getTrimmedValue('status') === 'publish' ? 'publish' : 'draft';
    const content = this.getRawValue('content');
    const excerpt =
      this.getRawValue('excerpt') ||
      generateExcerpt(content, this.seoDescriptionMax);
    const metaTitle = this.getTrimmedValue('metaTitle') || title;
    const metaDescription =
      this.getRawValue('metaDescription') || excerpt || '';
    const publishedAt = this.getTrimmedValue('publishedAt');

    return {
      title,
      slug,
      status,
      excerpt,
      content,
      categories: this.getTrimmedValue('categories'),
      coverImage: this.getTrimmedValue('coverImage'),
      metaTitle,
      metaDescription,
      keywords: this.getTrimmedValue('keywords'),
      ogImage: this.getTrimmedValue('ogImage'),
      canonicalUrl: this.getTrimmedValue('canonicalUrl'),
      publishedAt: publishedAt || undefined,
    };
  }

  private getTrimmedValue(controlName: string): string {
    const value = this.blogForm.get(controlName)?.value;
    return value ? String(value).trim() : '';
  }

  private getRawValue(controlName: string): string {
    const value = this.blogForm.get(controlName)?.value;
    return value ? String(value) : '';
  }
}
