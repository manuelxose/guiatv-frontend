import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-program-details',
  templateUrl: './program-details.component.html',
  styleUrls: ['./program-details.component.scss']
})
export class ProgramDetailsComponent {
  @Input() program: any;

  constructor() {}

  ngOnInit() {}

  closeDetails() {
    this.program = null;
  }
}
