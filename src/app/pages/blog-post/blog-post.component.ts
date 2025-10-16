import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {  Router } from '@angular/router';
import { take, tap } from 'rxjs';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { PostCardComponent } from 'src/app/components/post-card/post-card.component';
import { BlogService } from 'src/app/services/blog.service';
import { HttpService } from 'src/app/services/http.service';
import { MetaService } from 'src/app/services/meta.service';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [ CommonModule,NavBarComponent,PostCardComponent],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss',
})
export class BlogPostComponent {
  public post_list: any[] = [];
  public post: any;
  constructor(
    private http: HttpService,
    private blogSvc: BlogService,
    private metaSvc: MetaService,
    private router: Router
  ) {}

  public copyToClipboard(text: any) {
    var textarea = document.createElement('textarea');
    textarea.textContent = text;
    textarea.style.position = 'fixed'; // Prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand('copy'); // Security exception may be thrown by some browsers.
    } catch (ex) {
      console.warn('Copy to clipboard failed.', ex);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }

  ngOnInit(): void {
    const slug = this.router.url.split('/').pop() || '';
    this.blogSvc.posts$
      .pipe(
        take(1),
        tap((data) => {
          if (data.length === 0) {
            console.log('no hay posts');
            console.log(slug);
            this.blogSvc.getPostBySlug(slug.trim()).subscribe((data) => {
              console.log('blog', data[0]);
              this.blogSvc.setPosts(data[0]);
              this.post = data[0];
              this.manageData();
            });
          } else {
            console.log('hay posts');
            console.log(data);
            this.post = data;
            this.manageData();
          }
        })
      )
      .subscribe();

    const canonicalUrl = this.router.url;
  }

  private manageData() {
    this.metaSvc.setMetaTags({
      title: this.post.title,
      description: this.post.excerpt.replace(/(<([^>]+)>)/gi, ''),
      canonicalUrl: this.router.url,
    });
    this.blogSvc.getAllPosts().subscribe((data) => {
      this.post_list = data;
      this.post_list.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    });
  }
}
