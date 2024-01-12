import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ListaDestacadasComponent } from './lista-destacadas.component';
import { ComponentsModule } from 'src/app/components/components.module';

const routes: Routes = [
  {
    path: '',
    component: ListaDestacadasComponent,
  },
];

@NgModule({
  declarations: [ListaDestacadasComponent],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
})
export class ListaDestacadasModule {}
