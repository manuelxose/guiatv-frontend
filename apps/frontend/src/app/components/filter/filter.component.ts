import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit {
  @Output() filterChange = new EventEmitter<any>();

  menuItems: any[] = [
    {
      label: 'País',
      items: [
        { label: 'España', value: 'ES', command: (event: { item: { value: string; }; }) => this.onCountryChange(event.item.value) },
        // ...otros países
      ]
    },
    {
      label: 'Día',
      items: [
        { label: 'Lunes', value: 1, command: (event: { item: { value: number; }; }) => this.onDayChange(event.item.value) },
        { label: 'Martes', value: 2, command: (event: { item: { value: number; }; }) => this.onDayChange(event.item.value) },
        // ...otros días
      ]
    },
    {
      label: 'Fecha',
      items: [
        { label: 'Fecha', command: () => {} } // Dejar vacío para que se muestre el calendario
      ],
      content: '<p-calendar [(ngModel)]="selectedDate" [showIcon]="true" [showButtonBar]="true" dateFormat="dd/mm/yy" (onSelect)="onDateChange()"></p-calendar>'
    }
  ];

  programTypes: any[] = [
    { label: 'Películas', value: 'movies' },
    { label: 'Series', value: 'series' },
    // ...otros tipos de programas
  ];

  timeRanges: any[] = [
    { label: '11:00-12:00', value: '11-12' },
    { label: '12:00-13:00', value: '12-13' },
    // ...otras franjas horarias
  ];

  selectedCountry: string = 'ES';
  selectedDay: number = new Date().getDay();
  selectedDate: Date = new Date();
  selectedProgramType!: string;
  selectedTimeRange!: string;

  constructor() {}

  ngOnInit(): void {}

  onCountryChange(country: string) {
    this.selectedCountry = country;
    this.emitFilterChangeEvent();
  }

  onDayChange(day: number) {
    this.selectedDay = day;
    this.emitFilterChangeEvent();

  }

  onDateChange() {
  this.emitFilterChangeEvent();
  }

  onProgramTypeChange() {
  this.emitFilterChangeEvent();
  }

  onTimeRangeChange(timeRange: string) {
  this.selectedTimeRange = timeRange;
  this.emitFilterChangeEvent();
  }

  emitFilterChangeEvent() {
  this.filterChange.emit({
  country: this.selectedCountry,
  day: this.selectedDay,
  date: this.selectedDate,
  programType: this.selectedProgramType,
  timeRange: this.selectedTimeRange,
  });
  }
  }

