import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { first, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-blog-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './blog-layout.component.html',
  styleUrls: ['./blog-layout.component.scss'],
})
export class BlogLayoutComponent implements OnInit, OnDestroy {
  public hasError: boolean = false;
  public errorMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private blogSvc: BlogService) {}

  ngOnInit(): void {
    // Pre-cargar posts si no están en memoria
    this.blogSvc.posts$.pipe(first()).subscribe((posts) => {
      if (!posts || posts.length === 0) {
        this.blogSvc.getAllPosts().pipe(first()).subscribe();
      }
    });

    // Subscribe to error state so the layout can show a banner.
    // Use takeUntil to keep subscription alive while component is active
    this.blogSvc.error$.pipe(takeUntil(this.destroy$)).subscribe((msg) => {
      if (msg) {
        this.hasError = true;
        this.errorMessage = msg;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
