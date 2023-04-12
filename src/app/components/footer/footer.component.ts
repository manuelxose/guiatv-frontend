import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentYear: number;
  tdt = [  "La 1",  "La 2",  "Antena 3",  "Cuatro",  "Telecinco",  "La Sexta",  "Mega",  "Factoría de Ficción",  "Neox",  "Nova",  "Boing",  "Divinity",  "Energy",  "Paramount Network",  "DMAX",  "Disney Channel",  "Ten",  "Clan",  "Teledeporte",  "Be Mad",  "TRECE",  "DKISS",  "Atreseries",  "GOL PLAY"];
  movistar = [
    "M+ #0",
    "M+ #Vamos",
    "M+ Estrenos",
    "M+ Estrenos 2",
    "M+ Oscars",
    "M+ Clásicos",
    "M+ Acción",
    "M+ Comedia",
    "M+ Drama",
    "M+ Cine Español",
    "M+ Fest",
    "M+ Series",
    "M+ Series 2",
  ];
  urls: string[];

  constructor() {
    this.currentYear = new Date().getFullYear();
    //unir tdt y movistar en un array,
    this.urls = this.tdt.concat(this.movistar);
  }

  ngOnInit(): void {}
}
