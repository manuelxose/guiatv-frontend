import { Component, Input, ViewEncapsulation } from '@angular/core';
import { BlogService } from 'src/app/services/blog.service';
import { truncateTitle, slugify } from 'src/app/utils/utils';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-post-card-last',
  templateUrl: './post-card-last.component.html',
  styleUrls: ['./post-card-last.component.scss'],
  standalone: true,
  imports: [CommonModule, DatePipe],
  encapsulation: ViewEncapsulation.None,
})
export class PostCardLastComponent {
  public post: any;
  @Input() public data: any;

  constructor(private blogSvc: BlogService, private routes: Router) {}

  ngOnInit(): void {
    this.post = this.data;
  }

  public truncateTitle(title: string, limit: number = 50): string {
    return truncateTitle(title, limit);
  }

  public moveTo(post: any) {
    this.setBlog(post);
    this.blogSvc.setPosts(post);
    this.routes.navigate([
      'blog',
      slugify(post.slug || post.title?.rendered || ''),
    ]);
  }

  public setBlog(post: any) {
    this.blogSvc.setPosts(post);
  }
}
