import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SeriesComponent } from './pages/series/series.component';

const routes: Routes = [
  { path: '', redirectTo: '/programacion-tv', pathMatch: 'full' },
  { path: 'series', component: SeriesComponent },
  {
    path: 'programacion-tv',
    loadChildren: () =>
      import('./pages/pages.module').then((m) => m.PagesModule),
  },
  // ... otras rutas
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
