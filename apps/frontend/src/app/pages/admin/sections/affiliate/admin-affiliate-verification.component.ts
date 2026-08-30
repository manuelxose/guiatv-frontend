import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AdminAffiliateService, AdminVerificationQueueItem } from '../../../../services/admin-affiliate.service';

type VerificationFilter = 'all' | 'needs_review' | 'stale' | 'current';

/**
 * Verification tab — a review queue over Programs + Offers, sorted most
 * urgent first (needs_review, then stale by days, then current). Surfaces
 * last-verified date, source URL and days-since-verification; never lets a
 * stale row read as current (that badge/text comes straight from the
 * backend's `computeAffiliateVerificationDisplay`, not re-derived here).
 */
@Component({
  selector: 'app-admin-affiliate-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-affiliate-verification.component.html',
})
export class AdminAffiliateVerificationComponent implements OnInit {
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  public readonly filterOptions: Array<{ id: VerificationFilter; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'needs_review', label: 'Requiere revisión' },
    { id: 'stale', label: 'Desactualizado' },
    { id: 'current', label: 'Vigente' },
  ];

  public items: AdminVerificationQueueItem[] = [];
  public filter: VerificationFilter = 'all';
  public loading = false;
  public error: string | null = null;

  constructor(private readonly service: AdminAffiliateService) {}

  ngOnInit(): void {
    this.load();
  }

  get filteredItems(): AdminVerificationQueueItem[] {
    if (this.filter === 'all') return this.items;
    return this.items.filter((item) => item.displayStatus === this.filter);
  }

  setFilter(filter: VerificationFilter): void {
    this.filter = filter;
  }

  refresh(): void {
    this.load();
  }

  badgeClass(status: AdminVerificationQueueItem['displayStatus']): string {
    if (status === 'current') return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40';
    if (status === 'stale') return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    return 'bg-red-500/20 text-red-200 border-red-500/40';
  }

  badgeLabel(status: AdminVerificationQueueItem['displayStatus']): string {
    if (status === 'current') return 'Vigente';
    if (status === 'stale') return 'Desactualizado';
    return 'Requiere revisión';
  }

  trackById(_index: number, item: AdminVerificationQueueItem): string {
    return `${item.entityType}:${item.entityId}`;
  }

  private load(): void {
    this.loading = true;
    this.error = null;
    this.service.getVerificationQueue().subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
        this.lastUpdatedChange.emit(new Date());
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cargar la cola de verificación.';
      },
    });
  }
}
