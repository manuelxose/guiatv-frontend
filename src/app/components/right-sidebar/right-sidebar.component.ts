import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { AutocompleteComponent } from '../autocomplete/autocomplete.component';

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  styleUrls: ['./right-sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule,AutocompleteComponent],
})
export class RightSidebarComponent {
  public popular_movies: any[] = [];
  public popular_series: any[] = [];

  constructor(private svcGuide: TvGuideService, private route: Router) {}

  async ngOnInit(): Promise<void> {
    this.svcGuide.getProgramsAndChannels().subscribe((data) => {
      if (data.length > 0) {
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
  }

  public navigateTo(data: any) {
    this.svcGuide.setDetallesPrograma(data);
    this.route.navigate([
      'programacion-tv/detalles',
      data.title.value.replace(/s/g, '-'),
    ]);
  }

  public navigateTo2(data: any) {
    if (data === 'movie') {
      this.svcGuide.setIsMovies();
    }
    if (data === 'serie') {
      this.svcGuide.setIsSeries();
    }
    this.route.navigate(['programacion-tv/que-ver-hoy']);
  }
}
