import { Component } from '@angular/core';

@Component({
  selector: 'app-blog-details',
  templateUrl: './blog-details.component.html',
  styleUrls: ['./blog-details.component.scss'],
})
export class BlogDetailsComponent {
  public post: any = {};
  public post_list: any[] = [];
  public blog: any = {};
  public headers: any = [];
  public alt: string = '';

  ngOnInit(): void {}
}
