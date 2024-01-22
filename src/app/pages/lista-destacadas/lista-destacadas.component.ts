import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-lista-destacadas',
  templateUrl: './lista-destacadas.component.html',
  styleUrls: ['./lista-destacadas.component.scss'],
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
