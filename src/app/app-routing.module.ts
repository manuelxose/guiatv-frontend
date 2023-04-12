import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/programacion-tv', pathMatch: 'full' },
  { path:'programacion-tv/guia-tv-ahora', redirectTo: '/programacion-tv', pathMatch: 'full'},
  //todo lo que sea programacion-tv/... lo redirige a programacion-tv
  { path:'programacion-tv/', redirectTo: '/programacion-tv', pathMatch: 'full'},
  { path: 'programacion-tv', loadChildren: () => import('./components/components.module').then(m => m.ComponentsModule) },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
