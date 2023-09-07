import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanalDetallesComponent } from './canal-detalles/canal-detalles.component';
import { ListaCanalesComponent } from './lista-canales/lista-canales.component';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PagesRoutingModule } from './pages-routing.module';
import { ComponentsModule } from '../components/components.module';
import { ParrillaCanalesComponent } from './parrilla-canales/parrilla-canales.component';
import { ProgramFullDetailsComponent } from './program-full-details/program-full-details.component';
import { ReductorService } from '../reducers/reductor.service';
import { SwiperModule } from 'swiper/angular';
import { SliderComponent } from '../components/slider/slider.component';
import { SeriesComponent } from './series/series.component';
import { PeliculasComponent } from './peliculas/peliculas.component';
import { Top10Component } from './top10/top10.component';
import { MilistaComponent } from './milista/milista.component';
import { ModalComponent } from '../components/modal/modal.component';
import { FichaProgramaComponent } from '../components/ficha-programa/ficha-programa.component';

const routes: Routes = [];

@NgModule({
  declarations: [
    CanalDetallesComponent,
    ListaCanalesComponent,
    HomeComponent,
    ParrillaCanalesComponent,
    ProgramFullDetailsComponent,
    SeriesComponent,
    PeliculasComponent,
    Top10Component,
    MilistaComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    PagesRoutingModule,
    ComponentsModule,
    SwiperModule,
  ],

  exports: [
    CanalDetallesComponent,
    ListaCanalesComponent,
    HomeComponent,
    SliderComponent,
    SeriesComponent,
    PeliculasComponent,
    FichaProgramaComponent,
  ],
  providers: [ReductorService],
})
export class PagesModule {}
