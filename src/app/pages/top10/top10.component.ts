import { Component } from '@angular/core';

@Component({
  selector: 'app-top10',
  templateUrl: './top10.component.html',
  styleUrls: ['./top10.component.scss'],
})
export class Top10Component {
  public top10: any[] = [];
  public post_list: any[] = [];
  public page: number = 1;
  public destacada: any = {};

  ngOnInit(): void {
    this.post_list = [
      'uno',
      'dos',
      'tres',
      'cuatro',
      'cinco',
      'seis',
      'siete',
      'ocho',
      'nueve',
      'diez',
      'once',
    ];
  }

  public setBlog(post: any) {
    this.post_list.push(post);
  }
}
