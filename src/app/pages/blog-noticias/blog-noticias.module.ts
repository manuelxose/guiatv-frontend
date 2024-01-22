import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogNoticiasComponent } from './blog-noticias.component';
import { RouterModule, Routes } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';

const routes: Routes = [
  {
    path: '',
    component: BlogNoticiasComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class BlogNoticiasModule {}
