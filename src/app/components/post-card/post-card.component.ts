import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from 'src/app/services/blog.service';
import { truncateTitle } from 'src/app/utils/utils';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent {
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
      'programacion-tv/ver-mas/detalles',
      post.slug.replace(/ /g, '-'),
    ]);
  }

  public setBlog(post: any) {
    this.blogSvc.setPosts(post);
  }
}
