import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ProgramFullDetailsComponent } from './program-full-details.component';
import { ComponentsModule } from 'src/app/components/components.module';

const routes: Routes = [
  {
    path: '',
    component: ProgramFullDetailsComponent,
  },
];

@NgModule({
  declarations: [ProgramFullDetailsComponent],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
})
export class ProgramFullDetailsModule {}
