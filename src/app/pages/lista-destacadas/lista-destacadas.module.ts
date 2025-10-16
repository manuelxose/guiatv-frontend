import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ListaDestacadasComponent } from './lista-destacadas.component';

const routes: Routes = [
  {
    path: '',
    component: ListaDestacadasComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class ListaDestacadasModule {}
