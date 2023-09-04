import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgramListComponent } from './program-list/program-list.component';
import { ComponentsRoutingModule } from './components-routing.module';
import { RouterModule } from '@angular/router';
import { FilterComponent } from './filter/filter.component';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';

@NgModule({
  declarations: [
    ProgramListComponent,
    FilterComponent,
    HeaderComponent,
    FooterComponent,
  ],
  imports: [CommonModule, ComponentsRoutingModule, RouterModule, FormsModule],
  exports: [
    ProgramListComponent,
    FilterComponent,
    HeaderComponent,
    FooterComponent,
  ],
})
export class ComponentsModule {}
