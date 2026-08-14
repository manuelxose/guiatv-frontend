import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  AdminUsersService,
  AdminUserReport,
} from '../../../../services/admin-users.service';

@Component({
  selector: 'app-admin-community-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-community-section.component.html',
  styleUrls: ['./admin-community-section.component.scss'],
})
export class AdminCommunitySectionComponent implements OnInit, OnDestroy {
  @Input() activeItem = 'reports';
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  /* reports */
  reports: AdminUserReport[] = [];
  reportsTotal = 0;
  reportsPage = 1;
  reportsLimit = 20;
  statusFilter: '' | 'open' | 'reviewing' | 'resolved' | 'dismissed' = '';
  loading = false;
  error = '';

  /* resolution modal */
  selectedReport: AdminUserReport | null = null;
  resolutionStatus: 'resolved' | 'dismissed' = 'resolved';
  resolutionNote = '';
  resolutionAction: 'none' | 'suspend' = 'none';
  resolving = false;

  private subs = new Subscription();

  readonly statusClasses: Record<string, string> = {
    open: 'border-amber-500/40 text-amber-200 bg-amber-500/10',
    reviewing: 'border-blue-500/40 text-blue-200 bg-blue-500/10',
    resolved: 'border-emerald-500/40 text-emerald-200 bg-emerald-500/10',
    dismissed: 'border-[var(--portal-border-strong)] text-[var(--portal-text-soft)] bg-[var(--portal-surface-strong)]',
  };

  constructor(private usersService: AdminUsersService) {}

  ngOnInit(): void {
    if (this.activeItem === 'reports') this.loadReports();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadReports(): void {
    this.loading = true;
    this.error = '';
    const query: any = { page: this.reportsPage, limit: this.reportsLimit };
    if (this.statusFilter) query.status = this.statusFilter;

    this.subs.add(
      this.usersService.getReports(query).subscribe({
        next: (resp) => {
          this.reports = resp.reports;
          this.reportsTotal = resp.pagination?.total ?? resp.reports.length;
          this.loading = false;
          this.lastUpdatedChange.emit(new Date());
        },
        error: (err) => {
          this.error = err?.message || 'Failed to load reports';
          this.loading = false;
        },
      })
    );
  }

  applyFilter(): void {
    this.reportsPage = 1;
    this.loadReports();
  }

  prevPage(): void {
    if (this.reportsPage > 1) {
      this.reportsPage--;
      this.loadReports();
    }
  }

  nextPage(): void {
    this.reportsPage++;
    this.loadReports();
  }

  openResolve(report: AdminUserReport): void {
    this.selectedReport = report;
    this.resolutionStatus = 'resolved';
    this.resolutionNote = '';
    this.resolutionAction = 'none';
  }

  cancelResolve(): void {
    this.selectedReport = null;
  }

  submitResolve(): void {
    if (!this.selectedReport) return;
    this.resolving = true;
    this.subs.add(
      this.usersService
        .updateReport(this.selectedReport.id, {
          status: this.resolutionStatus,
          resolutionNote: this.resolutionNote || undefined,
          action: this.resolutionAction,
        })
        .subscribe({
          next: () => {
            this.resolving = false;
            this.selectedReport = null;
            this.loadReports();
          },
          error: (err) => {
            this.error = err?.message || 'Failed to update report';
            this.resolving = false;
          },
        })
    );
  }

  get openCount(): number {
    return this.reports.filter((r) => r.status === 'open').length;
  }

  get reviewingCount(): number {
    return this.reports.filter((r) => r.status === 'reviewing').length;
  }
}
