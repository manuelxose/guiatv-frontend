import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { trigger, style, transition, animate } from '@angular/animations';
import { ModalService } from '../../services/modal.service';

import { InteractionButtonsComponent } from '../interaction-buttons/interaction-buttons.component';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  standalone: true,
  imports: [CommonModule, InteractionButtonsComponent],
  animations: [
    // Durations are bound via params so prefers-reduced-motion (checked once,
    // SSR-safe, in the constructor) can collapse them to near-zero without a
    // second set of triggers.
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('{{ enterMs }}ms ease-out', style({ opacity: 1 }))
      ], { params: { enterMs: 200 } }),
      transition(':leave', [
        animate('{{ leaveMs }}ms ease-in', style({ opacity: 0 }))
      ], { params: { leaveMs: 150 } })
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate('{{ enterMs }}ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ], { params: { enterMs: 300 } }),
      transition(':leave', [
        animate('{{ leaveMs }}ms cubic-bezier(0.4, 0, 1, 1)', style({ transform: 'scale(0.9)', opacity: 0 }))
      ], { params: { leaveMs: 200 } })
    ])
  ]
})
export class ModalComponent implements OnInit {
  public program_modal: any = {};
  public isVisible = false;

  @ViewChild('modalContainer') private modalContainer?: ElementRef<HTMLElement>;
  private previouslyFocused: HTMLElement | null = null;

  /** Animation params consumed by the fadeIn/slideIn triggers in the template. */
  public readonly fadeParams: { enterMs: number; leaveMs: number };
  public readonly slideParams: { enterMs: number; leaveMs: number };

  constructor(private modalService: ModalService) {
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.fadeParams = reducedMotion ? { enterMs: 1, leaveMs: 1 } : { enterMs: 200, leaveMs: 150 };
    this.slideParams = reducedMotion ? { enterMs: 1, leaveMs: 1 } : { enterMs: 300, leaveMs: 200 };
  }

  ngOnInit(): void {
    this.isVisible = false;
    this.modalService.programa$.subscribe((program) => {
      this.program_modal = program;
      // Si no está vacío el objeto
      const shouldShow = Object.keys(this.program_modal).length !== 0;
      if (shouldShow && !this.isVisible) {
        this.previouslyFocused = (document.activeElement as HTMLElement) ?? null;
        this.isVisible = true;
        // Wait for the :enter animation frame so the container exists.
        setTimeout(() => this.focusFirstElement(), 0);
      } else if (!shouldShow) {
        this.isVisible = false;
      }
    });
  }

  public closeModal(): void {
    this.isVisible = false;
    this.modalService.clearPrograma();
    this.previouslyFocused?.focus?.();
    this.previouslyFocused = null;
  }

  @HostListener('document:keydown.escape')
  public onEscape(): void {
    if (this.isVisible) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  public onTabKey(event: KeyboardEvent): void {
    if (!this.isVisible) return;
    const root = this.modalContainer?.nativeElement;
    if (!root) return;
    const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (!root.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  /**
   * The container's (click) only shields clicks inside it from bubbling to
   * the overlay's close-on-click handler; this paired (keydown) is a
   * deliberate no-op so keyboard events keep bubbling to the document-level
   * Escape/Tab handlers above (a11y lint requires click to have a key-event
   * sibling, but stopping propagation here would break the focus trap).
   */
  public onContainerKeydown(_event: KeyboardEvent): void {}

  private focusFirstElement(): void {
    const root = this.modalContainer?.nativeElement;
    const target = root?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    target?.focus();
  }

  public getFallbackImage(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzNzQxNTEiLz48L3N2Zz4=';
  }

  public onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const fallback = this.getFallbackImage();
    // Prevent loop if fallback also fails or is already set
    if (img.src !== fallback) {
      img.src = fallback;
    }
  }

  public formatTime(timeString: string): string {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  }

  public getDuration(): number {
    if (!this.program_modal?.start || !this.program_modal?.stop) return 0;
    try {
      const start = new Date(this.program_modal.start);
      const stop = new Date(this.program_modal.stop);
      return Math.round((stop.getTime() - start.getTime()) / 60000); // minutos
    } catch {
      return 0;
    }
  }
}
