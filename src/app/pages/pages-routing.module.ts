import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
  },
  {
    path: 'series',
    loadChildren: () =>
      import('./series/series.module').then((m) => m.SeriesModule),
  },
  {
    path: 'peliculas',
    loadChildren: () =>
      import('./peliculas/peliculas.module').then((m) => m.PeliculasModule),
  },
  {
    path: 'guia-canales',
    loadChildren: () =>
      import('./lista-canales/lista-canales.module').then(
        (m) => m.ListaCanalesModule
      ),
  },
  // {
  //   path: 'detalles/:id',
  //   loadChildren: () =>
  //     import('./program-full-details/program-full-details.module').then(
  //       (m) => m.ProgramFullDetailsModule
  //     ),
  // },
  {
    path: 'ver-canal/:id',
    loadChildren: () =>
      import('./canal-completo/canal-completo.module').then(
        (m) => m.CanalCompletoModule
      ),
  },
  {
    path: 'detalles/:?id',
    loadChildren: () =>
      import('./blog-details/blog-details.module').then(
        (m) => m.BlogDetailsModule
      ),
  },
  // {
  //   path: 'milista',
  //   loadChildren: () =>
  //     import('./milista/milista.module').then((m) => m.MilistaModule),
  // },
  {
    path: 'top10',
    loadChildren: () =>
      import('./top10/top10.module').then((m) => m.Top10Module),
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
