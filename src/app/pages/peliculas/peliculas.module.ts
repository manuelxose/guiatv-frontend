import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PeliculasComponent } from './peliculas.component';
import { ComponentsModule } from 'src/app/components/components.module';

const routes: Routes = [
  {
    path: '',
    component: PeliculasComponent,
  },
];

@NgModule({
  declarations: [PeliculasComponent],
  imports: [CommonModule, RouterModule.forChild(routes), ComponentsModule],
})
export class PeliculasModule {}
