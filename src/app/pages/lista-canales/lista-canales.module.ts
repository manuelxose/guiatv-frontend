import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListaCanalesComponent } from './lista-canales.component';
import { RouterModule, Routes } from '@angular/router';
import { SliderComponent } from 'src/app/components/slider/slider.component';

const routes: Routes = [
  {
    path: '',
    component: ListaCanalesComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes),SliderComponent],
})
export class ListaCanalesModule {}
