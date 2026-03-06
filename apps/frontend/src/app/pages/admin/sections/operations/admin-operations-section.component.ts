import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminOperationsService } from '../../../../services/admin-operations.service';
import { HealthResponse } from '../../../../services/admin-schedules.service';

type ActionResult = { success: boolean; message: string; time: Date };

@Component({
  selector: 'app-admin-operations-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-operations-section.component.html',
  styleUrls: ['./admin-operations-section.component.scss'],
})
export class AdminOperationsSectionComponent implements OnInit, OnDestroy {
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  health: HealthResponse | null = null;
  loading = false;
  error: string | null = null;
  cachePattern = '';
  clearLoading = false;
  actionResults: ActionResult[] = [];

  private subs = new Subscription();

  constructor(private opsService: AdminOperationsService) {}

  ngOnInit(): void {
    this.loadHealth();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadHealth(): void {
    this.loading = true;
    this.error = null;
    this.subs.add(
      this.opsService.getHealth().subscribe({
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

  clearCache(): void {
    this.clearLoading = true;
    this.subs.add(
      this.opsService.clearCache(this.cachePattern || undefined).subscribe({
        next: () => {
          this.addResult(true, this.cachePattern ? `Cache cleared (pattern: ${this.cachePattern})` : 'Full cache cleared');
          this.clearLoading = false;
          this.loadHealth();
        },
        error: (e) => {
          this.addResult(false, e?.error?.message || 'Cache clear failed');
          this.clearLoading = false;
        },
      })
    );
  }

  private addResult(success: boolean, message: string): void {
    this.actionResults.unshift({ success, message, time: new Date() });
    if (this.actionResults.length > 20) this.actionResults.pop();
  }
}
