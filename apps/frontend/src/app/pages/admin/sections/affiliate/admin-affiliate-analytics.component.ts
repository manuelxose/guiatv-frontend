import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AdminAffiliateAnalyticsReport, AdminAffiliateService } from '../../../../services/admin-affiliate.service';

/**
 * Analytics tab — clicks/impressions/CTR by merchant, placement and offer,
 * plus top content driving clicks. Reads the same generic analytics event
 * store every impression/click beacon already writes to; there is no network
 * revenue/conversion feed behind the Affiliate Engine, so this view never
 * shows or estimates a revenue figure — `report.note` states that plainly.
 */
@Component({
  selector: 'app-admin-affiliate-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-affiliate-analytics.component.html',
})
export class AdminAffiliateAnalyticsComponent implements OnInit {
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  public report: AdminAffiliateAnalyticsReport | null = null;
  public loading = false;
  public error: string | null = null;

  constructor(private readonly service: AdminAffiliateService) {}

  ngOnInit(): void {
    this.load();
  }

  refresh(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.error = null;
    this.service.getAnalyticsReport().subscribe({
      next: (report) => {
        this.report = report;
        this.loading = false;
        this.lastUpdatedChange.emit(new Date());
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cargar el reporte de analytics.';
      },
    });
  }
}
