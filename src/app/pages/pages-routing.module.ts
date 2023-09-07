import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CanalDetallesComponent } from './canal-detalles/canal-detalles.component';
import { HomeComponent } from './home/home.component';
import { ParrillaCanalesComponent } from './parrilla-canales/parrilla-canales.component';
import { ListaCanalesComponent } from './lista-canales/lista-canales.component';
import { ProgramFullDetailsComponent } from './program-full-details/program-full-details.component';
import { SeriesComponent } from './series/series.component';
import { PeliculasComponent } from './peliculas/peliculas.component';
import { Top10Component } from './top10/top10.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: '', component: ParrillaCanalesComponent },
      { path: 'guia-canales', component: ListaCanalesComponent },
      // { path: ':canal', component: CanalDetallesComponent },
      { path: 'detalles/:id', component: ProgramFullDetailsComponent },
      { path: 'series-tv', component: SeriesComponent },
      { path: 'peliculas-tv', component: PeliculasComponent },
      { path: 'top-10', component: Top10Component },
      { path: '**', redirectTo: '' },
    ],
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
