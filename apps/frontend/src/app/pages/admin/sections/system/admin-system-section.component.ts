import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AdminSystemService } from '../../../../services/admin-system.service';
import { HealthResponse } from '../../../../services/admin-schedules.service';

@Component({
  selector: 'app-admin-system-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-system-section.component.html',
  styleUrls: ['./admin-system-section.component.scss'],
})
export class AdminSystemSectionComponent implements OnInit, OnDestroy {
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  health: HealthResponse | null = null;
  loading = false;
  error: string | null = null;

  private subs = new Subscription();

  constructor(private systemService: AdminSystemService) {}

  ngOnInit(): void {
    this.loadHealth();
    this.subs.add(
      interval(30_000)
        .pipe(switchMap(() => this.systemService.getHealth()))
        .subscribe({
          next: (h) => {
            this.health = h;
            this.lastUpdatedChange.emit(new Date());
          },
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadHealth(): void {
    this.loading = true;
    this.error = null;
    this.subs.add(
      this.systemService.getHealth().subscribe({
        next: (h) => {
          this.health = h;
          this.loading = false;
          this.lastUpdatedChange.emit(new Date());
        },
        error: (e) => {
          this.error = e?.error?.message || 'Failed to load health';
          this.loading = false;
        },
      })
    );
  }

  get cacheStatus(): string {
    return this.health?.services?.cache?.status || 'unknown';
  }
}
