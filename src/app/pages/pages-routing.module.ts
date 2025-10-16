import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,

  },
  // },
  // {
  //   path: 'series',
  //   loadChildren: () =>
  //     import('./series/series.module').then((m) => m.SeriesModule),
  // },
  // {
  //   path: 'peliculas',
  //   loadChildren: () =>
  //     import('./peliculas/peliculas.module').then((m) => m.PeliculasModule),
  // },
  // {
  //   path: 'guia-canales',
  //   loadChildren: () =>
  //     import('./lista-canales/lista-canales.module').then(
  //       (m) => m.ListaCanalesModule
  //     ),
  // },
  // {
  //   path: 'que-ver-hoy',
  //   loadChildren: () =>
  //     import('./lista-destacadas/lista-destacadas.module').then(
  //       (m) => m.ListaDestacadasModule
  //     ),
  // },
  // {
  //   path: 'ver-canal/:id',
  //   loadChildren: () =>
  //     import('./canal-completo/canal-completo.module').then(
  //       (m) => m.CanalCompletoModule
  //     ),
  // },
  // {
  //   path: 'detalles/:?id',
  //   loadChildren: () =>
  //     import('./blog-details/blog-details.module').then(
  //       (m) => m.BlogDetailsModule
  //     ),
  // },
  // {
  //   path: 'noticias',
  //   loadChildren: () =>
  //     import('./blog-noticias/blog-noticias.module').then(
  //       (m) => m.BlogNoticiasModule
  //     ),
  // },
  // {
  //   path: 'en-directo',
  //   loadChildren: () =>
  //     import('./ahora-directo/ahora-directo.module').then(
  //       (m) => m.AhoraDirectoModule
  //     ),
  // },
  // {
  //   path: 'top-10',
  //   loadChildren: () =>
  //     import('./top10/top10.module').then((m) => m.Top10Module),
  // },
  // {
  //   path: 'ver-mas/detalles/:id',
  //   loadChildren: () =>
  //     import('./blog-post/blog-post.module').then((m) => m.BlogPostModule),
  // },
  // {
  //   path: 'ver-más/:id',
  //   loadChildren: () =>
  //     import('./blog-category/blog-category.module').then(
  //       (m) => m.BlogCategoryModule
  //     ),
  // },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
