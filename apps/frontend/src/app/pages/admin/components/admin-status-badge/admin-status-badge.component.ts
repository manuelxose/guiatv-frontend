import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/**
 * One consistent semantic status vocabulary for Admin (spec §29): each
 * status maps to exactly one tone. Never color alone — label text always
 * renders alongside the dot, and an icon reinforces it for anyone relying
 * on shape rather than color.
 */
export type AdminStatusTone = 'positive' | 'warning' | 'critical' | 'neutral' | 'unknown';

const STATUS_TONE: Record<string, AdminStatusTone> = {
  healthy: 'positive',
  current: 'positive',
  active: 'positive',
  configured: 'positive',
  completed: 'positive',
  resolved: 'positive',
  warning: 'warning',
  stale: 'warning',
  reviewing: 'warning',
  pending: 'warning',
  degraded: 'warning',
  critical: 'critical',
  failed: 'critical',
  missing: 'critical',
  unavailable: 'critical',
  unconfigured: 'critical',
  dismissed: 'critical',
  queued: 'neutral',
  running: 'neutral',
  info: 'neutral',
  unknown: 'unknown',
};

const TONE_CLASSES: Record<AdminStatusTone, string> = {
  positive: 'border-emerald-500/40 text-emerald-200 bg-emerald-500/10',
  warning: 'border-amber-500/40 text-amber-200 bg-amber-500/10',
  critical: 'border-red-500/40 text-red-200 bg-red-500/10',
  neutral: 'border-blue-500/40 text-blue-200 bg-blue-500/10',
  unknown: 'border-[var(--portal-border-strong)] text-[var(--portal-text-soft)] bg-[var(--portal-surface-strong)]',
};

@Component({
  selector: 'app-admin-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-status-badge.component.html',
  styleUrls: ['./admin-status-badge.component.scss'],
})
export class AdminStatusBadgeComponent {
  /** Any raw status string from a backend payload — case-insensitive. */
  @Input() status = 'unknown';
  /** Override the displayed text; defaults to a capitalized `status`. */
  @Input() label?: string;

  get tone(): AdminStatusTone {
    return STATUS_TONE[(this.status || '').toLowerCase()] || 'unknown';
  }

  get toneClasses(): string {
    return TONE_CLASSES[this.tone];
  }

  get displayLabel(): string {
    if (this.label) return this.label;
    const raw = this.status || 'unknown';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
}
