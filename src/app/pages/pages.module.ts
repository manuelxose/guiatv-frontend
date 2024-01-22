import { NgModule } from '@angular/core';
import { ReductorService } from '../reducers/reductor.service';
import { PagesRoutingModule } from './pages-routing.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [],
  imports: [PagesRoutingModule, CommonModule, FormsModule],

  exports: [],
  providers: [ReductorService],
})
export class PagesModule {}
