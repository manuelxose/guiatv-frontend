import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { first, pipe, take } from 'rxjs';
import { ComponentsModule } from 'src/app/components/components.module';
import { BlogService } from 'src/app/services/blog.service';

@Component({
  selector: 'app-blog-noticias',
  standalone: true,
  imports: [ComponentsModule, CommonModule],
  templateUrl: './blog-noticias.component.html',
  styleUrl: './blog-noticias.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class BlogNoticiasComponent {
  public post_list: any[] = [];
  public page: number = 1;
  public show_more: number = 9;
  public scrollSpeed: number = 10;
  public scrollInterval: number = 50;
  public index_section: number = 0;
  public latest_posts: any[] = [];
  public offset: number = 0;
  public data_slider: any[] = [];
  public categories: any[] = [];

  constructor(private blogSvc: BlogService, private routes: Router) {}

  ngOnInit(): void {
    this.blogSvc
      .getAllPosts()
      .pipe(first())
      .subscribe((data) => {
        this.post_list = data;
        this.managePosts();
      });

    this.blogSvc.setProgramsFromApi();
  }

  ngAfterViewInit() {
    const scroll = (container: Element, direction: 'up' | 'down') => {
      if (direction === 'up') {
        container.scrollTop += this.scrollSpeed;
        if (container.scrollTop >= container.scrollHeight / 2) {
          container.scrollTop = 0;
        }
      } else {
        container.scrollTop -= this.scrollSpeed;
        if (container.scrollTop <= 0) {
          container.scrollTop = container.scrollHeight / 2;
        }
      }
    };

    const startScrolling = (selector: string, direction: 'up' | 'down') => {
      const containers = document.querySelectorAll(selector);
      containers.forEach((container) => {
        setInterval(
          () => scroll(container as Element, direction),
          this.scrollInterval
        );
      });
    };

    startScrolling('.autoscroll', 'up');
    startScrolling('.autoscroll1', 'down');
  }

  private isMobile() {
    if (window.innerWidth < 768) {
      this.offset = 2;
    } else {
      this.offset = 3;
    }
  }

  private managePosts() {
    // comprobamos si hay categorias

    this.blogSvc.blogCategories$.subscribe((data) => {
      this.categories = data;
      if (data.length === 0) {
        this.blogSvc.intiCategories(this.post_list);
      }
    });

    this.data_slider = this.post_list;
    // ordenar los posts por fecha
    this.data_slider.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    this.blogSvc.setPosts(this.post_list);

    this.isMobile();
  }

  public showMore() {
    this.show_more += 10;
  }

  // control del slider horizontal
  public _next() {
    console.log('Next');
    this.data_slider.push(this.data_slider[0]);
    this.data_slider.shift();
  }

  public _prev() {
    console.log('Prev');
    this.data_slider.unshift(this.data_slider[this.data_slider.length - 1]);
    this.data_slider.pop();
  }

  public moveTo(post: any) {
    this.blogSvc.setPosts(post);
    this.routes.navigate([
      'programacion-tv/ver-mas/detalles',
      post.slug.replace(/ /g, '-'),
    ]);
  }
}
