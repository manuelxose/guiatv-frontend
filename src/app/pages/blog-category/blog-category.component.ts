import { Component } from '@angular/core';
import { ComponentsModule } from 'src/app/components/components.module';
import { HttpService } from 'src/app/services/http.service';

@Component({
  selector: 'app-blog-category',
  standalone: true,
  imports: [ComponentsModule],
  templateUrl: './blog-category.component.html',
  styleUrl: './blog-category.component.scss',
})
export class BlogCategoryComponent {
  public post_list: any[] = [];
  public page: number = 1;
  public show_more: number = 9;

  constructor(private httpSvc: HttpService) {}

  ngOnInit(): void {
    this.httpSvc.getProgramacion('today').subscribe((data: any) => {
      this.post_list = data;
      console.log('Post list:', this.post_list);
    });
  }

  public showMore() {
    this.show_more += 10;
  }
}
