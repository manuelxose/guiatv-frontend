import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SeriesComponent } from './series.component';
import { SliderComponent } from 'src/app/components/slider/slider.component';

const routes: Routes = [
  {
    path: '',
    component: SeriesComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes),SliderComponent],
  exports: [RouterModule],
})
export class SeriesModule {}
