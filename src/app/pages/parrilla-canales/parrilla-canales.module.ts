import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParrillaCanalesComponent } from './parrilla-canales.component';
import { RouterModule, Routes } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';

const routes: Routes = [
  {
    path: '',
    component: ParrillaCanalesComponent,
  },
];

@NgModule({
  declarations: [ParrillaCanalesComponent],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
})
export class ParrillaCanalesModule {}
