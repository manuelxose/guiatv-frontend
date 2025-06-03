import { ModalComponent } from './modal/modal.component';
import { FichaProgramaComponent } from './ficha-programa/ficha-programa.component';
import { CardComponent } from './card/card.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FilterComponent } from './filter/filter.component';
import { ProgramListComponent } from './program-list/program-list.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { BannerComponent } from './banner/banner.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PostCardComponent } from './post-card/post-card.component';
import { PostCardLastComponent } from './post-card-last/post-card-last.component';


@NgModule({
  declarations: [
    ProgramListComponent,
    FilterComponent,
    ModalComponent,
    FichaProgramaComponent,
    CardComponent,
    NavBarComponent,
    BannerComponent,
    PostCardComponent,
    PostCardLastComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ScrollingModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  exports: [
    ProgramListComponent,
    FilterComponent,
    ModalComponent,
    FichaProgramaComponent,
    CardComponent,
    NavBarComponent,  
    BannerComponent,
    PostCardComponent,
    PostCardLastComponent,
  ],
})
export class ComponentsModule {}
