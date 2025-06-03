import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { CanalCompletoComponent } from './canal-completo.component';
import { FormsModule } from '@angular/forms';
import { SliderComponent } from 'src/app/components/slider/slider.component';

const routes: Routes = [
  {
    path: '',
    component: CanalCompletoComponent,
  },
];

@NgModule({
  declarations: [CanalCompletoComponent],
  imports: [
    CommonModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    FormsModule,
    SliderComponent
  ],
})
export class CanalCompletoModule {}
