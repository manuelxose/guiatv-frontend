import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListaCanalesComponent } from './lista-canales.component';
import { ComponentsModule } from 'src/app/components/components.module';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: ListaCanalesComponent,
  },
];

@NgModule({
  declarations: [ListaCanalesComponent],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
})
export class ListaCanalesModule {}
