import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanalDetallesComponent } from './canal-detalles/canal-detalles.component';
import { ListaCanalesComponent } from './lista-canales/lista-canales.component';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PagesRoutingModule } from './pages-routing.module';
import { ComponentsModule } from '../components/components.module';
import { PrimeNgModule } from '../prime-ng.module';
import { ParrillaCanalesComponent } from './parrilla-canales/parrilla-canales.component';
import { ProgramFullDetailsComponent } from './program-full-details/program-full-details.component';
import { SwiperModule } from 'swiper/angular';
import { ReductorService } from '../reducers/reductor.service';

const routes: Routes = [];

@NgModule({
  declarations: [
    CanalDetallesComponent,
    ListaCanalesComponent,
    HomeComponent,
    ParrillaCanalesComponent,
    ProgramFullDetailsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    PagesRoutingModule,
    ComponentsModule,
    PrimeNgModule,
    SwiperModule,
  ],

  exports: [CanalDetallesComponent, ListaCanalesComponent, HomeComponent],
  providers: [ReductorService],
})
export class PagesModule {}
