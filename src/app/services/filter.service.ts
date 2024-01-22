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

  private programsSubject:any = []

  constructor() { }


  private _channels = new BehaviorSubject<any[]>([]);
  channels$ = this._channels.asObservable();

  public setPrograms(programs: any[]) {
    this._channels.next(programs);
  }

  public getPrograms() {
    return this.programsSubject;
  }

  setFilter(filters: { day: string, time: string, country: string }) {
    this.filterSubject.next(filters);
  }

  getFilter(): BehaviorSubject<{ day: string, time: string, country: string }> {
    return this.filterSubject;
  }
}
