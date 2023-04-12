import { Component } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { FilterMatchMode, PrimeNGConfig } from 'primeng/api';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Guía de Programación TV - Encuentra tus programas favoritos';
  //añadir etiquetas para seo

  constructor(
    private primengConfig: PrimeNGConfig,
    private metaService: Meta
    ) {}

  ngOnInit() {
    this.updateMetaData();
    this.primengConfig.ripple = true;
    this.primengConfig.zIndex = {
      modal: 1100,    // dialog, sidebar
      overlay: 1000,  // dropdown, overlaypanel
      menu: 1000,     // overlay menus
      tooltip: 1100   // tooltip
  };
  this.primengConfig.filterMatchModeOptions = {
    text: [FilterMatchMode.STARTS_WITH, FilterMatchMode.CONTAINS, FilterMatchMode.NOT_CONTAINS, FilterMatchMode.ENDS_WITH, FilterMatchMode.EQUALS, FilterMatchMode.NOT_EQUALS],
    numeric: [FilterMatchMode.EQUALS, FilterMatchMode.NOT_EQUALS, FilterMatchMode.LESS_THAN, FilterMatchMode.LESS_THAN_OR_EQUAL_TO, FilterMatchMode.GREATER_THAN, FilterMatchMode.GREATER_THAN_OR_EQUAL_TO],
    date: [FilterMatchMode.DATE_IS, FilterMatchMode.DATE_IS_NOT, FilterMatchMode.DATE_BEFORE, FilterMatchMode.DATE_AFTER]
};
  }

  updateMetaData(): void {

    // Agregar o actualizar etiquetas meta
    this.metaService.updateTag({ name: 'description', content: 'Consulta nuestra completa guía de programación TV y descubre los horarios de tus programas, series y películas favoritas en todos los canales de televisión.' });
    this.metaService.updateTag({ name: 'keywords', content: 'guía TV, programación TV, horarios televisión, guía de programas, series, películas, canales de televisión, programación de canales, televisión en vivo' });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    this.metaService.updateTag({ name: 'author', content: 'TecnoRia' });

    // Puedes agregar más etiquetas según sea necesario
  }
}
