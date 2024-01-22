import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AhoraDirectoComponent } from './ahora-directo.component';

const routes: Routes = [
  {
    path: '',
    component: AhoraDirectoComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class AhoraDirectoModule {}
