import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../services/user.service';
import { UserNotification } from '../../interfaces/user.interface';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="toggleDropdown()"
        [attr.aria-expanded]="isOpen"
        class="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-text)] transition-colors hover:border-[var(--portal-border-strong)]"
        [attr.aria-label]="unreadCount > 0 ? 'Notificaciones (' + unreadCount + ' sin leer)' : 'Notificaciones'"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span
          *ngIf="unreadCount > 0"
          class="absolute -top-1 -right-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[var(--accent-live)] px-1 py-0.5 text-[10px] font-bold text-white"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <div
        *ngIf="isOpen"
        class="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] backdrop-blur-xl shadow-[var(--shadow-lg)] z-[80]"
      >
        <div class="flex items-center justify-between border-b border-[var(--portal-divider)] px-4 py-3">
          <h3 class="text-sm font-semibold text-[var(--portal-text)]">Notificaciones</h3>
          <button
            *ngIf="unreadCount > 0"
            type="button"
            (click)="markAllRead()"
            class="text-xs text-[var(--accent-live)] hover:text-[var(--accent-live)] font-medium min-h-[32px] px-2"
          >
            Marcar todas
          </button>
        </div>

        <div *ngIf="notifications.length === 0" class="px-4 py-8 text-center text-sm text-[var(--portal-text-muted)]">
          No tienes notificaciones
        </div>

        <div *ngFor="let notification of notifications"
          (click)="onNotificationClick(notification)"
          (keydown.enter)="onNotificationClick(notification)"
          (keydown.space)="$event.preventDefault(); onNotificationClick(notification)"
          role="button"
          tabindex="0"
          class="flex items-start gap-3 px-4 py-3 border-b border-[var(--portal-divider)] cursor-pointer transition-colors hover:bg-[var(--portal-surface-soft)]"
          [ngClass]="!notification.readAt ? 'bg-[var(--portal-surface-soft)]' : ''"
        >
          <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            [ngClass]="getTypeIconClass(notification.type)">
            <span class="text-sm">{{ getTypeIcon(notification.type) }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm text-[var(--portal-text)] line-clamp-2" [ngClass]="!notification.readAt ? 'font-medium' : ''">
              {{ notification.title }}
            </p>
            <p *ngIf="notification.description" class="text-xs text-[var(--portal-text-muted)] mt-0.5 line-clamp-1">
              {{ notification.description }}
            </p>
            <p class="text-[10px] text-[var(--portal-text-faint)] mt-1">{{ formatTime(notification.createdAt) }}</p>
          </div>
          <div *ngIf="!notification.readAt" class="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-live)]"></div>
        </div>
      </div>
    </div>

    <div *ngIf="isOpen" class="fixed inset-0 z-[75]" (click)="isOpen = false" (keydown.escape)="isOpen = false" tabindex="-1"></div>
  `,
  styles: [],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: UserNotification[] = [];
  unreadCount = 0;
  isOpen = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly userService: UserService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.userService
      .getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notifications = notifications;
      });

    this.userService
      .getUnreadNotificationsCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadCount = count;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.notifications.length === 0) {
      this.userService.fetchNotifications().subscribe();
    }
  }

  markAllRead(): void {
    this.userService.markNotificationsRead([], true).subscribe();
  }

  onNotificationClick(notification: UserNotification): void {
    if (!notification.readAt) {
      this.userService.markNotificationsRead([notification.id]).subscribe();
    }
    this.isOpen = false;

    if (notification.entityType === 'user' && notification.entityId) {
      this.router.navigateByUrl(`/mi-cuenta`);
    } else if (notification.entityType === 'conversation' && notification.entityId) {
      this.router.navigateByUrl(`/mi-cuenta`);
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'follow': return '👤';
      case 'message': return '💬';
      case 'recommendation': return '⭐';
      case 'report_status': return '📋';
      default: return '🔔';
    }
  }

  getTypeIconClass(type: string): string {
    switch (type) {
      case 'follow': return 'bg-blue-500/20';
      case 'message': return 'bg-green-500/20';
      case 'recommendation': return 'bg-yellow-500/20';
      case 'report_status': return 'bg-purple-500/20';
      default: return 'bg-[var(--portal-surface-strong)]';
    }
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}
