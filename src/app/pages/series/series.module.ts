import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SeriesComponent } from './series.component';
import { ComponentsModule } from 'src/app/components/components.module';
import { SliderComponent } from 'src/app/components/slider/slider.component';

const routes: Routes = [
  {
    path: '',
    component: SeriesComponent,
  },
];

@NgModule({
  declarations: [SeriesComponent],
  imports: [CommonModule, RouterModule.forChild(routes), ComponentsModule,SliderComponent],
  exports: [RouterModule],
})
export class SeriesModule {}
