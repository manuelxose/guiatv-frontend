import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ParrillaCanalesComponent } from './parrilla-canales/parrilla-canales.component';
import { ListaCanalesComponent } from './lista-canales/lista-canales.component';
import { ProgramFullDetailsComponent } from './program-full-details/program-full-details.component';
import { SeriesComponent } from './series/series.component';
import { PeliculasComponent } from './peliculas/peliculas.component';
import { Top10Component } from './top10/top10.component';
import { CanalCompletoComponent } from './canal-completo/canal-completo.component';
import { BlogDetailsComponent } from './blog-details/blog-details.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: '', component: ParrillaCanalesComponent },
      { path: 'guia-canales', component: ListaCanalesComponent },
      // { path: ':canal', component: CanalDetallesComponent },
      { path: 'detalles/:id', component: ProgramFullDetailsComponent },
      { path: 'series', component: SeriesComponent },
      { path: 'peliculas', component: PeliculasComponent },
      { path: 'ver-canal/:id', component: CanalCompletoComponent },
      { path: 'top-10', component: Top10Component },
      { path: 'top-10/:id', component: BlogDetailsComponent },
    ],
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
