import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/programacion-tv', pathMatch: 'full' },
  {
    path: 'programacion-tv',
    loadChildren: () =>
      import('./pages/pages.module').then((m) => m.PagesModule),
  },
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
