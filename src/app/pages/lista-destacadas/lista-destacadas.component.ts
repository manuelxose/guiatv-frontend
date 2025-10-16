import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BannerComponent } from 'src/app/components/banner/banner.component';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-lista-destacadas',
  templateUrl: './lista-destacadas.component.html',
  styleUrls: ['./lista-destacadas.component.scss'],
  standalone: true,
  imports: [CommonModule,NavBarComponent,BannerComponent],
})
export class ListaDestacadasComponent implements OnInit {
  public canal: any;
  public destacada: any[] = [];
  public destacados: any[] = [];
  public isPelicula: boolean = false;
  public isSerie: boolean = false;

  constructor(private route: ActivatedRoute, private guiaSvc: TvGuideService) {}

  ngOnInit() {
    this.isPelicula = this.guiaSvc.getIsMovies();
    this.isSerie = this.guiaSvc.getIsSeries();

    if (this.isPelicula) {
      this.getPeliculasDestacadas();
    } else if (this.isSerie) {
      this.getSeriesDestacadas();
    }
  }

  ngOnDestroy(): void {
    // Asegúrate de cancelar la suscripción cuando el componente se destruya
  }

  public setListaDestacadas(data: any) {
    this.destacada = data;
  }

  public getPeliculasDestacadas() {
    this.guiaSvc.getPeliculasDestacadas().subscribe((data) => {
      this.destacados = data;
    });
  }

  public getSeriesDestacadas() {
    this.guiaSvc.getSeriesDestacadas().subscribe((data) => {
      this.destacados = data;
    });
  }
}
