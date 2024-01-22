import { Component } from '@angular/core';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Guía de Programación TV - Encuentra tus programas favoritos';
  //añadir etiquetas para seo

  constructor(private metaService: Meta) {}

  ngOnInit() {
    this.updateMetaData();
  }

  updateMetaData(): void {
    // Agregar o actualizar etiquetas meta
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

    // Puedes agregar más etiquetas según sea necesario
  }
}
