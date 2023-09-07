import { Component } from '@angular/core';

@Component({
  selector: 'app-top10',
  templateUrl: './top10.component.html',
  styleUrls: ['./top10.component.scss'],
})
export class Top10Component {
  public top10: any[] = [];

  constructor() {}

  ngOnInit(): void {}
}
