import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { slugify } from 'src/app/utils/utils';
import { Observable } from 'rxjs';
import {
  map,
  startWith,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import { TvGuideService } from '../../services/tv-guide.service';

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
    MatOptionModule,
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
    // Always wire filteredData to the input valueChanges so the autocomplete
    // reacts even if the programas$ observable emits later.
    this.filteredData = this.dataInput.valueChanges.pipe(
      startWith(''),
      debounceTime(150),
      distinctUntilChanged(),
      map((value) => {
        const str = typeof value === 'string' ? value : value?.toString() || '';
        return this._filter(str);
      })
    );

    // Subscribe to the global programas$ to populate the underlying data
    // used by the filter function. The subscription only updates `this.data`.
    this.tvSvc.getProgramsAndChannels().subscribe((data: any) => {
      this.data = data || [];
      // console.log('Autocomplete: programas$ emitted, data length=', this.data.length);
    });
  }

  private _filter(value: string): any[] {
    const str = (value || '').trim();
    if (str.length === 0) return [];

    const filterValue = str.toLowerCase();

    // Filter the channels
    const channels = this.data.filter((option) =>
      option?.channel?.name?.toLowerCase().includes(filterValue)
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

    // Return the channels followed by the programs
    return [...channels, ...programs].slice(0, 5);
  }

  public navigateTo(data: any): void {
    if (data?.channel?.name) {
      this.router.navigate([
        '/programacion-tv/ver-canal',
        slugify(data?.channel?.name),
      ]);
      return;
    }
    this.tvSvc.setDetallesPrograma(data);
    const title = data?.title?.value || data?.title || '';
    const slug = slugify(title);
    // Heurística: si tiene poster or rating or releaseDate considerarla película
    const looksLikeMovie = !!(
      data?.poster ||
      data?.rating ||
      data?.releaseDate
    );
    if (looksLikeMovie) {
      this.router.navigate(['/peliculas', slug]);
    } else {
      this.router.navigate(['/programas', slug]);
    }
    // Clear input so selection doesn't stick
    try {
      setTimeout(() => this.dataInput.setValue(''), 50);
    } catch (_) {}
  }

  // display function for mat-autocomplete when value is an object or string
  public displayFn(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value?.channel?.name) return value.channel.name;
    if (value?.title?.value) return value.title.value;
    return String(value);
  }

  // ...existing code...
}
