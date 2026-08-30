import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminGroupId, AdminNavGroup } from '../../admin.types';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
})
export class AdminSidebarComponent implements OnChanges, OnDestroy {
  @Input() navGroups: AdminNavGroup[] = [];
  @Input() activeGroup: AdminGroupId = 'analytics';
  @Input() activeItem = '';
  /** Mobile/tablet overlay drawer — transient, closes after a selection. */
  @Input() mobileOpen = false;
  /** Desktop icon-rail collapse — persistent, independent of mobileOpen. */
  @Input() desktopCollapsed = false;
  @Input() environmentLabel = 'Development';

  @Output() sectionSelected = new EventEmitter<{
    group: AdminGroupId;
    item: string;
  }>();
  @Output() closeMobile = new EventEmitter<void>();
  @Output() toggleDesktopCollapsed = new EventEmitter<void>();

  @ViewChild('asideEl') private readonly asideEl?: ElementRef<HTMLElement>;

  private static readonly BODY_SCROLL_LOCK_CLASS = 'portal-overlay-open';
  private static readonly TRIGGER_SELECTOR = '[data-admin-sidebar-trigger]';

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!('mobileOpen' in changes)) return;
    if (this.mobileOpen) {
      this.document.body.classList.add(AdminSidebarComponent.BODY_SCROLL_LOCK_CLASS);
      setTimeout(() => this.focusFirstElement());
    } else if (!changes['mobileOpen'].firstChange) {
      this.document.body.classList.remove(AdminSidebarComponent.BODY_SCROLL_LOCK_CLASS);
      this.restoreTriggerFocus();
    }
  }

  ngOnDestroy(): void {
    // Never leave scroll locked if the drawer unmounts while open.
    this.document.body.classList.remove(AdminSidebarComponent.BODY_SCROLL_LOCK_CLASS);
  }

  selectSection(group: AdminGroupId, item: string): void {
    this.sectionSelected.emit({ group, item });
  }

  isActive(group: AdminGroupId, item: string): boolean {
    return this.activeGroup === group && this.activeItem === item;
  }

  onBackdropOrCloseClick(): void {
    this.closeMobile.emit();
  }

  onToggleDesktopCollapsed(): void {
    this.toggleDesktopCollapsed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mobileOpen) {
      this.closeMobile.emit();
    }
  }

  @HostListener('document:keydown', ['$event'])
  trapFocus(event: KeyboardEvent): void {
    if (!this.mobileOpen || event.key !== 'Tab') return;
    const aside = this.asideEl?.nativeElement;
    if (!aside) return;
    const focusable = this.getFocusable(aside);
    if (!focusable.length) {
      event.preventDefault();
      aside.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;
    if (event.shiftKey && (active === first || !aside.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusFirstElement(): void {
    const aside = this.asideEl?.nativeElement;
    if (!aside) return;
    const focusable = this.getFocusable(aside);
    (focusable[0] || aside).focus();
  }

  private restoreTriggerFocus(): void {
    setTimeout(() => {
      this.document
        .querySelector<HTMLElement>(AdminSidebarComponent.TRIGGER_SELECTOR)
        ?.focus();
    });
  }

  private getFocusable(root: HTMLElement): HTMLElement[] {
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }
}
