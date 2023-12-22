import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgramListComponent } from './program-list/program-list.component';
import { RouterModule } from '@angular/router';
import { FilterComponent } from './filter/filter.component';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { SliderComponent } from './slider/slider.component';
import { SwiperModule } from 'swiper/angular';
import { ModalComponent } from './modal/modal.component';
import { FichaProgramaComponent } from './ficha-programa/ficha-programa.component';
import { CardComponent } from './card/card.component';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  declarations: [
    ProgramListComponent,
    FilterComponent,
    HeaderComponent,
    FooterComponent,
    SliderComponent,
    ModalComponent,
    FichaProgramaComponent,
    CardComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SwiperModule,
    RouterModule,
    ScrollingModule,
  ],
  exports: [
    ProgramListComponent,
    FilterComponent,
    HeaderComponent,
    FooterComponent,
    SliderComponent,
    ModalComponent,
    FichaProgramaComponent,
    CardComponent,
  ],
})
export class ComponentsModule {}
