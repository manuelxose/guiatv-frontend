/**
 * ProgramDetailModalComponent
 * Modal fullscreen para mostrar detalles del programa en móvil
 * Ubicación: src/app/components/program-detail-modal/program-detail-modal.component.ts
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, transition, animate } from '@angular/animations';
import { IProgramItem } from 'src/app/interfaces';
import { BannerComponent } from '../banner/banner.component';

@Component({
  selector: 'app-program-detail-modal',
  standalone: true,
  imports: [CommonModule, BannerComponent],
  templateUrl: './program-detail-modal.component.html',
  styleUrls: ['./program-detail-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(100%)' }),
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms cubic-bezier(0.4, 0, 1, 1)',
          style({ opacity: 0, transform: 'translateY(100%)' })
        ),
      ]),
    ]),
    trigger('backdropAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
})
export class ProgramDetailModalComponent {
  @Input() program: IProgramItem | null = null;
  @Input() channelName: string = '';
  @Input() channelLogo: string = '';

  @Output() close = new EventEmitter<void>();

  public readonly isVisible = signal(false);

  // Computed para datos del banner
  public readonly bannerData = computed(() => {
    const prog = this.program;
    if (!prog) return null;
    // Ensure poster is always a string (banner expects poster?: string)
    const posterFromProg = (prog as any).poster || prog.desc?.value || '';

    const descObj = prog.desc
      ? prog.desc
      : { details: '', value: '', lang: '' };

    return {
      title: prog.title,
      channel: this.channelName,
      channelName: this.channelName,
      icon: this.channelLogo,
      poster: posterFromProg || this.channelLogo || '',
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
    };
  });

  // Helper para formatear tiempo desde la plantilla (usa en template)
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
   * Cierra el modal
   */
  public onClose(): void {
    this.close.emit();
  }

  /**
   * Previene el cierre al hacer clic dentro del contenido
   */
  public onContentClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Maneja el escape key
   */
  public onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onClose();
    }
  }
}
