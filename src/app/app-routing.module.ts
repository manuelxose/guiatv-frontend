import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/programacion', pathMatch: 'full' },
  { path: 'programacion', loadChildren: () => import('./components/components.module').then(m => m.ComponentsModule) },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
