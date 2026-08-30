import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

/**
 * Shared confirmation dialog for potentially destructive Admin actions
 * (cache invalidate, role change, suspend, delete). Replaces window.confirm
 * per the Admin action-safety spec — never native, always explicit.
 */
@Component({
  selector: 'app-admin-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-confirm-dialog.component.html',
  styleUrls: ['./admin-confirm-dialog.component.scss'],
})
export class AdminConfirmDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() title = 'Confirm action';
  @Input() description = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  /** Destructive styling (red confirm button) vs. neutral. */
  @Input() danger = true;
  @Input() busy = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('panel') private readonly panel?: ElementRef<HTMLElement>;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      setTimeout(() => this.panel?.nativeElement.focus());
    }
  }

  onCancel(): void {
    if (this.busy) return;
    this.cancelled.emit();
  }

  onConfirm(): void {
    if (this.busy) return;
    this.confirmed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.onCancel();
  }

  @HostListener('document:keydown', ['$event'])
  trapFocus(event: KeyboardEvent): void {
    if (!this.open || event.key !== 'Tab') return;
    const root = this.panel?.nativeElement;
    if (!root) return;
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>('button:not([disabled])')
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;
    if (event.shiftKey && (active === first || !root.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
