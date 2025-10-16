import { Component } from '@angular/core';
import { BlogService } from 'src/app/services/blog.service';
import { Router } from '@angular/router';
import { first, pipe } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { PostCardComponent } from 'src/app/components/post-card/post-card.component';
@Component({
  selector: 'app-top10',
  templateUrl: './top10.component.html',
  styleUrls: ['./top10.component.scss'],
  standalone: true,
  imports: [CommonModule,NavBarComponent,PostCardComponent],
})
export class Top10Component {
  public top10: any[] = [];
  public post_list: any[] = [];
  public page: number = 1;
  public destacada: any = {};
  public show_more: number = 10;
  public index_section: number = 0;
  public offset: number = 0;
  public data_slider: any[] = [];
  scrollIndex = 0;
  scrollInterval = 20; // Cambia este valor para ajustar la frecuencia de desplazamiento
  scrollSpeed = 1; // Cambia este valor para ajustar la velocidad de desplazamiento
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
    console.log('All posts from Wordpress: ', this.post_list);
    this.data_slider = this.post_list;
    // ordenar los posts por fecha
    this.post_list.sort((a, b) => {
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
