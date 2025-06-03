import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  standalone: true,
    imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatOptionModule
  ],
})
export class AutocompleteComponent {
  public data: any[];
  public filteredData: Observable<any[]>;
  public dataInput: FormControl;

  constructor(private tvSvc: TvGuideService, private router: Router) {
    this.data = [];
    this.filteredData = new Observable<any[]>();
    this.dataInput = new FormControl();
  }

  ngOnInit(): void {
    this.tvSvc.getProgramsAndChannels().subscribe((data: any) => {
      this.data = data;
      this.filteredData = this.dataInput.valueChanges.pipe(
        startWith(''),
        map((value) => this._filter(value))
      );
    });
  }

  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();

    // Filter the channels
    const channels = this.data.filter((option) =>
      option?.channel?.name.toLowerCase().includes(filterValue)
    );

    // Filter the programs
    const programs = this.data.flatMap(
      (option) =>
        option?.programs?.filter((program: any) =>
          program?.title?.value
            ? program.title.value.toLowerCase().includes(filterValue)
            : false
        ) || []
    );
    console.log('Filtered channels:', channels); // Log the filtered channels
    console.log('Filtered programs:', programs); // Log the filtered programs
    // Return the channels followed by the programs
    return [...channels, ...programs].slice(0, 5);
  }

  public navigateTo(data: any): void {
    if (data?.channel?.name) {
      this.router.navigate([
        '/programacion-tv/ver-canal',
        data?.channel?.name.replace(/\s/g, '-'),
      ]);
      return;
    }
    this.tvSvc.setDetallesPrograma(data);
    this.router.navigate([
      '/programacion-tv/detalles',
      data?.title?.value.replace(/\s/g, '-'),
    ]);
  }
}
