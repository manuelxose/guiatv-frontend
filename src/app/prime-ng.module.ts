import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenubarModule } from 'primeng/menubar';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { SliderModule } from 'primeng/slider';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MenubarModule,
    DropdownModule,
    CalendarModule,
    SliderModule,
    TableModule,
    TabViewModule
  ],
  exports: [
    MenubarModule,
    DropdownModule,
    CalendarModule,
    SliderModule,
    TableModule,
    TabViewModule
  ]
})
export class PrimeNgModule {}
