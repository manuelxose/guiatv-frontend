import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ProgramFullDetailsComponent } from './program-full-details.component';

const routes: Routes = [
  {
    path: '',
    component: ProgramFullDetailsComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class ProgramFullDetailsModule {}
