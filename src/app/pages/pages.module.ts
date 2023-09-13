import { NgModule } from '@angular/core';
import { SwiperModule } from 'swiper/angular';
import { ComponentsModule } from '../components/components.module';
import { FichaProgramaComponent } from '../components/ficha-programa/ficha-programa.component';
import { SliderComponent } from '../components/slider/slider.component';
import { ReductorService } from '../reducers/reductor.service';
import { BlogDetailsComponent } from './blog-details/blog-details.component';
import { CanalCompletoComponent } from './canal-completo/canal-completo.component';
import { CanalDetallesComponent } from './canal-detalles/canal-detalles.component';
import { HomeComponent } from './home/home.component';
import { ListaCanalesComponent } from './lista-canales/lista-canales.component';
import { MilistaComponent } from './milista/milista.component';
import { PagesRoutingModule } from './pages-routing.module';
import { ParrillaCanalesComponent } from './parrilla-canales/parrilla-canales.component';
import { PeliculasComponent } from './peliculas/peliculas.component';
import { ProgramFullDetailsComponent } from './program-full-details/program-full-details.component';
import { SeriesComponent } from './series/series.component';
import { Top10Component } from './top10/top10.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
    CanalCompletoComponent,
    BlogDetailsComponent,
  ],
  imports: [
    PagesRoutingModule,
    ComponentsModule,
    SwiperModule,
    NgxPaginationModule,
    CommonModule,
    FormsModule,
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
