/**
 * ProgramDetailModalComponent
 * Modal fullscreen para mostrar detalles del programa en móvil
 * Ubicación: src/app/components/program-detail-modal/program-detail-modal.component.ts
 */

import {
  Component,
  ElementRef,
  HostListener,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnChanges, SimpleChanges } from '@angular/core';
import { trigger, style, transition, animate } from '@angular/animations';
import { IProgramItem } from 'src/app/interfaces';
import { InteractionButtonsComponent } from '../interaction-buttons/interaction-buttons.component';
import { WhereToWatchComponent } from '../where-to-watch/where-to-watch.component';
import { APP_PATHS } from '../../config/route-map';

@Component({
  selector: 'app-program-detail-modal',
  standalone: true,
  imports: [CommonModule, InteractionButtonsComponent, WhereToWatchComponent],
  templateUrl: './program-detail-modal.component.html',
  styleUrls: ['./program-detail-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    // Durations bound via params so prefers-reduced-motion collapses them.
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(100%)' }),
        animate(
          '{{ enterMs }}ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ], { params: { enterMs: 300 } }),
      transition(':leave', [
        animate(
          '{{ leaveMs }}ms cubic-bezier(0.4, 0, 1, 1)',
          style({ opacity: 0, transform: 'translateY(100%)' })
        ),
      ], { params: { leaveMs: 200 } }),
    ]),
    trigger('backdropAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('{{ enterMs }}ms ease-out', style({ opacity: 1 })),
      ], { params: { enterMs: 200 } }),
      transition(':leave', [animate('{{ leaveMs }}ms ease-in', style({ opacity: 0 }))], {
        params: { leaveMs: 150 },
      }),
    ]),
  ],
})
export class ProgramDetailModalComponent implements OnChanges {
  public readonly appPaths = APP_PATHS;

  @Input() program: IProgramItem | null = null;
  @Input() channelName: string = '';
  @Input() channelLogo: string = '';

  @Output() close = new EventEmitter<void>();

  public readonly isVisible = signal(false);

  @ViewChild('modalContent') private modalContent?: ElementRef<HTMLElement>;
  private previouslyFocused: HTMLElement | null = null;

  public readonly modalMotionParams: { enterMs: number; leaveMs: number };
  public readonly backdropMotionParams: { enterMs: number; leaveMs: number };

  constructor() {
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.modalMotionParams = reducedMotion ? { enterMs: 1, leaveMs: 1 } : { enterMs: 300, leaveMs: 200 };
    this.backdropMotionParams = reducedMotion ? { enterMs: 1, leaveMs: 1 } : { enterMs: 200, leaveMs: 150 };
  }

  // Document-level so it fires regardless of focus location inside the
  // dialog (the content pane stops propagation on its own keydown to keep
  // internal shortcuts from bubbling into page-level handlers).
  @HostListener('document:keydown.escape')
  public onDocumentEscape(): void {
    if (this.program) {
      this.onClose();
    }
  }

  // Computed para datos del banner
  public readonly bannerData = computed(() => {
    const prog = this.program;
    if (!prog) return null;

    const posterFromProg =
      (prog as any).image ||
      (prog as any).poster ||
      (prog as any).background ||
      '';

    const descObj = prog.desc
      ? prog.desc
      : { details: '', value: '', lang: '' };

    return {
      title: prog.title,
      channel: this.channelName,
      channelName: this.channelName,
      icon: this.channelLogo,
      poster: posterFromProg,
      start: prog.start,
      stop: prog.stop,
      startTime: prog.start,
      endTime: prog.stop,
      desc: descObj,
      description: descObj.details || descObj.value || '',
      year: (descObj as any).year || '',
      rating:
        prog.starRating !== undefined && prog.starRating !== null
          ? String(prog.starRating)
          : '',
      starRating:
        prog.starRating !== undefined && prog.starRating !== null
          ? prog.starRating
          : '',
      category: prog.category?.value || '',
      id: prog.id,
      background: posterFromProg,
    };
  });

  public getProgramTitle(): string {
    const t = this.program?.title as any;
    if (!t) return '';
    if (typeof t === 'string') return t;
    if (typeof t === 'object' && 'value' in t) return String(t.value ?? '');
    return String(t);
  }

  public onPosterError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-movie-poster.svg';
  }

  /**
   * Helper para formatear tiempo desde la plantilla
   */
  public formatTime(timeString: string | undefined | null): string {
    if (!timeString) return '';
    try {
      const d = new Date(timeString);
      if (isNaN(d.getTime())) return String(timeString);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return String(timeString);
    }
  }

  /**
   * Calcula la duración del programa en minutos
   */
  public getDuration(): number {
    if (!this.program?.start || !this.program?.stop) return 0;
    try {
      const start = new Date(this.program.start);
      const stop = new Date(this.program.stop);
      return Math.round((stop.getTime() - start.getTime()) / 60000);
    } catch {
      return 0;
    }
  }

  /**
   * Cierra el modal
   */
  public onClose(): void {
    this.close.emit();
    this.previouslyFocused?.focus?.();
    this.previouslyFocused = null;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['program'] && this.program && !changes['program'].previousValue) {
      this.previouslyFocused = (typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null) ?? null;
      setTimeout(() => {
        const closeBtn = this.modalContent?.nativeElement.querySelector<HTMLElement>('.close-button');
        closeBtn?.focus();
      }, 0);
    }
  }

  private readonly focusableSelector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  @HostListener('document:keydown.tab', ['$event'])
  public onDocumentTab(event: KeyboardEvent): void {
    if (!this.program) return;
    const root = this.modalContent?.nativeElement;
    if (!root) return;
    const focusable = Array.from(root.querySelectorAll<HTMLElement>(this.focusableSelector)).filter(
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
   * Previene el cierre al hacer clic dentro del contenido
   */
  public onContentClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Deliberate no-op paired with (click) above so keyboard events keep
   * bubbling to the document-level Escape/Tab handlers (needed for the
   * focus trap); satisfies the click-events-have-key-events a11y lint rule
   * without breaking that bubbling.
   */
  public onContentKeydown(_event: KeyboardEvent): void {}

  /**
   * Maneja el escape key
   */
  public onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onClose();
    }
  }
}
