import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { first, filter } from 'rxjs';
import { BannerComponent } from 'src/app/components/banner/banner.component';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { SliderComponent } from 'src/app/components/slider/slider.component';
import { HttpService } from 'src/app/services/http.service';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { isLive } from 'src/app/utils/utils';

@Component({
  selector: 'app-series',
  templateUrl: './series.component.html',
  styleUrls: ['./series.component.scss'],
  standalone: true,
  imports: [CommonModule,SliderComponent,NavBarComponent,BannerComponent],
})
export class SeriesComponent {
  public series: any[] = [];
  public categorias: any[] = [];
  public popular_series: any[] = [];
  public logo: string = '';
  public destacada: any = {};
  public en_emision: any[] = [];

  constructor(
    private svcGuide: TvGuideService,
    private http: HttpService,
    private metaSvc: MetaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const canonicalUrl = this.router.url;

    this.metaSvc.setMetaTags({
      title: 'Series de TV',
      description:
        'Listado de series de television de España, como El Hormiguero, La Voz, Masterchef, etc.',
      canonicalUrl: canonicalUrl,
    });

    try {      this.http.programas$.pipe(first()).subscribe(async (data) => {
        //si no hay programas, esperar a que HomeComponent los cargue
        if (data.length === 0) {
          console.log(`⏳ SERIES - No hay datos, esperando a que se carguen desde HomeComponent...`);
          // En lugar de hacer una llamada API, suscribirse al observable para esperar datos
          this.http.programas$.pipe(
            filter(programs => programs.length > 0),
            first()
          ).subscribe((programs) => {
            console.log(`📦 SERIES - Datos recibidos del observable global`);
            this.svcGuide.setData(programs);
            this.manageSeries();
          });
        } else {
          console.log(`📋 SERIES - Usando datos ya disponibles en cache`);
          this.svcGuide.setData(data);
          this.manageSeries();
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  private manageSeries() {
    this.series = this.svcGuide.getAllSeries();
    this.en_emision = this.series.filter((serie) => {
      if (isLive(serie.start, serie.stop)) {
        return serie;
      }
    });
    this.categorias = this.svcGuide
      .getSeriesCategories()
      .filter(
        (categoria) =>
          categoria !== undefined && categoria.toLowerCase().trim() !== 'otros'
      );
    this.svcGuide.getSeriesDestacadas().subscribe((data) => {
      this.destacada = data[0];
    });
  }

  public getSeriesByCategory(categoria: string) {
    return this.svcGuide.getSeriesByCategory(categoria);
  }
}
