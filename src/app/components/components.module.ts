import { SliderComponent } from './slider/slider.component';
import { SwiperModule } from 'swiper/angular';
import { ModalComponent } from './modal/modal.component';
import { FichaProgramaComponent } from './ficha-programa/ficha-programa.component';
import { CardComponent } from './card/card.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FilterComponent } from './filter/filter.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { ProgramListComponent } from './program-list/program-list.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { LeftSidebarComponent } from './left-sidebar/left-sidebar.component';
import { RightSidebarComponent } from './right-sidebar/right-sidebar.component';
import { MenuComponent } from './menu/menu.component';
import { BannerComponent } from './banner/banner.component';
import { AutocompleteComponent } from './autocomplete/autocomplete.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
    NavBarComponent,
    LeftSidebarComponent,
    RightSidebarComponent,
    MenuComponent,
    BannerComponent,
    AutocompleteComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SwiperModule,
    ScrollingModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
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
    NavBarComponent,
    LeftSidebarComponent,
    RightSidebarComponent,
    MenuComponent,
    BannerComponent,
    AutocompleteComponent,
  ],
})
export class ComponentsModule {}
