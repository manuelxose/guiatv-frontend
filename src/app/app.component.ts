//app.component.ts

import { Component, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { LeftSidebarComponent } from './components/left-sidebar/left-sidebar.component';
import { RightSidebarComponent } from './components/right-sidebar/right-sidebar.component';
import { FooterComponent } from './components/footer/footer.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    LeftSidebarComponent,
    RightSidebarComponent,
    FooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Guía de Programación TV - Encuentra tus programas favoritos';

  constructor(private metaService: Meta) {}

  ngOnInit() {
    this.updateMetaData();
  }

  updateMetaData(): void {
    this.metaService.updateTag({
      name: 'description',
      content:
        'Consulta nuestra completa guía de programación TV y descubre los horarios de tus programas, series y películas favoritas en todos los canales de televisión.',
    });
    this.metaService.updateTag({
      name: 'keywords',
      content:
        'guía TV, programación TV, horarios televisión, guía de programas, series, películas, canales de televisión, programación de canales, televisión en vivo',
    });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    this.metaService.updateTag({ name: 'author', content: 'TecnoRia' });
  }
}