import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  styleUrls: ['./right-sidebar.component.scss'],
})
export class RightSidebarComponent {
  public popular_movies: any[] = [];
  public popular_series: any[] = [];

  constructor(private svcGuide: TvGuideService, private route: Router) {}

  async ngOnInit(): Promise<void> {
    this.svcGuide.getProgramsAndChannels().subscribe((data) => {
      if (data.length > 0) {
        console.log('Ya cargaron los datos: ', data);
        this.svcGuide.setData(data);

        this.manageList();
      }
    });
  }

  private async manageList() {
    this.svcGuide.setPeliculasDestacadas().then(() => {
      this.svcGuide.getPeliculasDestacadas().subscribe((data) => {
        this.popular_movies = data;
      });
    });

    this.svcGuide.setSeriesDestacadas().then(() => {
      this.svcGuide.getSeriesDestacadas().subscribe((data) => {
        this.popular_series = data;
      });
    });

    console.log('Peliculas: ', this.popular_movies);
    console.log('Series: ', this.popular_series);
  }

  public navigateTo(title: string) {
    this.route.navigate(['programacion-tv/detalles', title.replace(/s/g, '-')]);
  }
}
