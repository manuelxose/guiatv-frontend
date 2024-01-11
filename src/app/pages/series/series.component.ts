import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-series',
  templateUrl: './series.component.html',
  styleUrls: ['./series.component.scss'],
})
export class SeriesComponent {
  public series: any[] = [];
  public categorias: any[] = [];
  public popular_series: any[] = [];
  public logo: string = '';
  public destacada: any = {};

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

    try {
      this.http.programas$.pipe(first()).subscribe(async (data) => {
        //si no hay programas llamar a la api
        if (data.length === 0) {
          this.http.getProgramacion('today').subscribe((data) => {
            this.http.setProgramas(data, 'today').then(() => {
              this.svcGuide.setData(data);
              this.manageSeries();
            });
          });
        } else {
          this.svcGuide.setData(data);
          this.manageSeries();
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  private manageSeries() {
    console.log('Gestion de series');
    this.series = this.svcGuide.getAllSeries();
    this.categorias = this.svcGuide
      .getSeriesCategories()
      .filter((categoria) => categoria !== undefined);
    console.log('Categorias:', this.categorias);
  }

  public getSeriesByCategory(categoria: string) {
    return this.svcGuide.getSeriesByCategory(categoria);
  }
}
