import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Top10Component } from './top10.component';
import { RouterModule, Routes } from '@angular/router';
import { SliderComponent } from 'src/app/components/slider/slider.component';

const routes: Routes = [
  {
    path: '',
    component: Top10Component,
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SliderComponent
  ],
})
export class Top10Module {}
