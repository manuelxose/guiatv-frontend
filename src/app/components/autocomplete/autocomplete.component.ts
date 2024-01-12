import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
})
export class AutocompleteComponent {
  public data: any[];
  public filteredData: Observable<any[]>;
  public dataInput: FormControl;

  constructor(private tvSvc: TvGuideService) {
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

    return this.data.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }
}
