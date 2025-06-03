//app.routes.ts

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/programacion-tv', pathMatch: 'full' },
  {
    path: 'programacion-tv',
    loadChildren: () =>
      import('./pages/pages.module').then((m) => m.PagesModule),
  },
];