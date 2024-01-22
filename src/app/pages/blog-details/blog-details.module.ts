import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogDetailsComponent } from './blog-details.component';
import { RouterModule, Routes } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';

const routes: Routes = [
  {
    path: '',
    component: BlogDetailsComponent,
  },
];

@NgModule({
  declarations: [BlogDetailsComponent],
  imports: [CommonModule, RouterModule.forChild(routes), ComponentsModule],
})
export class BlogDetailsModule {}
