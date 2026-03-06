import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  AdminSchedulesService,
  AdminChannel,
  HealthResponse,
} from '../../../../services/admin-schedules.service';

type ActionResult = { success: boolean; message: string; time: Date };

@Component({
  selector: 'app-admin-schedules-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-schedules-section.component.html',
  styleUrls: ['./admin-schedules-section.component.scss'],
})
export class AdminSchedulesSectionComponent implements OnInit, OnDestroy {
  @Input() activeItem = 'epg';
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  channels: AdminChannel[] = [];
  health: HealthResponse | null = null;
  loading = false;
  error: string | null = null;
  actionResults: ActionResult[] = [];

  // Form controls
  syncDate = '';
  syncForceRefresh = false;
  syncAsync = false;
  precomputeDate = '';
  precomputeFields: 'minimal' | 'full' = 'full';
  cleanupDays = 7;
  confirmReset = false;

  // Action loading states
  syncLoading = false;
  precomputeLoading = false;
  precomputeWindowLoading = false;
  cleanupLoading = false;
  resetLoading = false;

  private subs = new Subscription();

  constructor(private schedulesService: AdminSchedulesService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    this.subs.add(
      this.schedulesService.getHealth().subscribe({
        next: (h) => {
          this.health = h;
          this.emitUpdated();
        },
        error: (e) => this.error = e?.error?.message || 'Failed to load health',
      })
    );

    this.subs.add(
      this.schedulesService.getChannels().subscribe({
        next: (ch) => {
          this.channels = ch;
          this.loading = false;
        },
        error: () => this.loading = false,
      })
    );
  }

  runSync(): void {
    this.syncLoading = true;
    this.subs.add(
      this.schedulesService
        .triggerSync({
          date: this.syncDate || undefined,
          forceRefresh: this.syncForceRefresh,
          async: this.syncAsync,
        })
        .subscribe({
          next: () => {
            this.addResult(true, 'EPG sync ' + (this.syncAsync ? 'started' : 'completed'));
            this.syncLoading = false;
            this.loadData();
          },
          error: (e) => {
            this.addResult(false, e?.error?.message || 'Sync failed');
            this.syncLoading = false;
          },
        })
    );
  }

  runPrecompute(): void {
    this.precomputeLoading = true;
    this.subs.add(
      this.schedulesService
        .triggerPrecompute({
          date: this.precomputeDate || undefined,
          fields: this.precomputeFields,
        })
        .subscribe({
          next: () => {
            this.addResult(true, 'Precompute completed');
            this.precomputeLoading = false;
          },
          error: (e) => {
            this.addResult(false, e?.error?.message || 'Precompute failed');
            this.precomputeLoading = false;
          },
        })
    );
  }

  runPrecomputeWindow(): void {
    this.precomputeWindowLoading = true;
    this.subs.add(
      this.schedulesService
        .triggerPrecomputeWindow({ fields: this.precomputeFields })
        .subscribe({
          next: () => {
            this.addResult(true, 'Rolling window precomputed');
            this.precomputeWindowLoading = false;
          },
          error: (e) => {
            this.addResult(false, e?.error?.message || 'Window precompute failed');
            this.precomputeWindowLoading = false;
          },
        })
    );
  }

  runCleanup(): void {
    this.cleanupLoading = true;
    this.subs.add(
      this.schedulesService
        .triggerCleanup({ daysToKeep: this.cleanupDays })
        .subscribe({
          next: () => {
            this.addResult(true, `Cleanup completed (kept ${this.cleanupDays} days)`);
            this.cleanupLoading = false;
          },
          error: (e) => {
            this.addResult(false, e?.error?.message || 'Cleanup failed');
            this.cleanupLoading = false;
          },
        })
    );
  }

  runReset(): void {
    if (!this.confirmReset) return;
    this.resetLoading = true;
    this.subs.add(
      this.schedulesService
        .triggerReset({ async: true })
        .subscribe({
          next: () => {
            this.addResult(true, 'System reset started (async)');
            this.resetLoading = false;
            this.confirmReset = false;
          },
          error: (e) => {
            this.addResult(false, e?.error?.message || 'Reset failed');
            this.resetLoading = false;
          },
        })
    );
  }

  get activeChannels(): number {
    return this.channels.filter((c) => c.isActive).length;
  }

  get channelTypes(): string[] {
    return [...new Set(this.channels.map((c) => c.type))];
  }

  private addResult(success: boolean, message: string): void {
    this.actionResults.unshift({ success, message, time: new Date() });
    if (this.actionResults.length > 20) this.actionResults.pop();
  }

  private emitUpdated(): void {
    const now = new Date();
    this.lastUpdatedChange.emit(now);
  }
}
