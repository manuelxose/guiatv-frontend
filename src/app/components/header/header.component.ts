import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  items: MenuItem[] | any;

  constructor() {}

  ngOnInit() {
    this.items = [
      {
        label: 'Inicio',
        icon: 'pi pi-home',
        routerLink: '/'
      },
      {
        label: 'Ahora en TV',
        icon: 'pi pi-clock',
        routerLink: '/ahora-en-tv'
      },
      {
        label: 'Canales',
        icon: 'pi pi-television',
        routerLink: '/canales'
      },
      {
        label: 'Qué ver hoy',
        icon: 'pi pi-video',
        routerLink: '/que-ver-hoy'
      },
      {
        label: 'Acerca de',
        icon: 'pi pi-info',
        routerLink: '/acerca-de'
      }
    ];
  }
}
