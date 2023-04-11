import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes } from '@angular/router';

const routes: Routes = [

  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadChildren: () => import('./components.module').then(m => m.ComponentsModule), data: { title: 'Guía de Televisión' }  },

];


@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class ComponentsRoutingModule { }
