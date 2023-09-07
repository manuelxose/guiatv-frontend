import { Component } from '@angular/core';
import { first } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-series',
  templateUrl: './series.component.html',
  styleUrls: ['./series.component.scss'],
})
export class SeriesComponent {
  public series: any[] = [];
  public categorias: any[] = [];

  constructor(private svcGuide: TvGuideService, private http: HttpService) {}

  ngOnInit(): void {
    try {
      this.http.programas$.pipe(first()).subscribe(async (data) => {
        //si no hay programas llamar a la api
        if (data.length === 0) {
          (await this.http.getProgramacion('today')).subscribe((data) => {
            this.http.setProgramas(data).then(() => {
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
