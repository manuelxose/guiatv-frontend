import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterService {

  private filterSubject = new BehaviorSubject<{ day: string, time: string, country: string }>({
    day: '',
    time: '',
    country: ''
  });

  setFilter(filters: { day: string, time: string, country: string }) {
    this.filterSubject.next(filters);
  }

  getFilter(): BehaviorSubject<{ day: string, time: string, country: string }> {
    return this.filterSubject;
  }
}
