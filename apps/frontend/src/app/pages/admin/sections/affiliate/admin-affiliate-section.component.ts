import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminAffiliateMerchantsComponent } from './admin-affiliate-merchants.component';
import { AdminAffiliateNetworksComponent } from './admin-affiliate-networks.component';
import { AdminAffiliateProgramsComponent } from './admin-affiliate-programs.component';
import { AdminAffiliateOffersComponent } from './admin-affiliate-offers.component';
import { AdminAffiliatePlacementsComponent } from './admin-affiliate-placements.component';
import { AdminAffiliateVerificationComponent } from './admin-affiliate-verification.component';
import { AdminAffiliateAnalyticsComponent } from './admin-affiliate-analytics.component';

type AffiliateTabId = 'merchants' | 'programs' | 'offers' | 'networks' | 'placements' | 'verification' | 'analytics';

/**
 * Phase 9 — Affiliate / Monetization admin area orchestrator. Mirrors
 * `AdminAnalyticsSectionComponent`'s own in-page tab strip (rather than
 * relying only on the left sidebar, which is collapsed by default on
 * mobile) and delegates each tab to its own bounded feature component —
 * every tab owns its own list + form + HTTP state independently.
 */
@Component({
  selector: 'app-admin-affiliate-section',
  standalone: true,
  imports: [
    CommonModule,
    AdminAffiliateMerchantsComponent,
    AdminAffiliateNetworksComponent,
    AdminAffiliateProgramsComponent,
    AdminAffiliateOffersComponent,
    AdminAffiliatePlacementsComponent,
    AdminAffiliateVerificationComponent,
    AdminAffiliateAnalyticsComponent,
  ],
  templateUrl: './admin-affiliate-section.component.html',
})
export class AdminAffiliateSectionComponent {
  @Input() activeItem: string = 'merchants';
  @Output() activeItemChange = new EventEmitter<string>();
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  public readonly tabs: Array<{ id: AffiliateTabId; label: string }> = [
    { id: 'merchants', label: 'Merchants' },
    { id: 'programs', label: 'Programs' },
    { id: 'offers', label: 'Offers' },
    { id: 'networks', label: 'Networks' },
    { id: 'placements', label: 'Placements' },
    { id: 'verification', label: 'Verification' },
    { id: 'analytics', label: 'Analytics' },
  ];

  selectTab(tabId: string): void {
    this.activeItem = tabId;
    this.activeItemChange.emit(tabId);
  }

  onLastUpdated(date: Date): void {
    this.lastUpdatedChange.emit(date);
  }
}
