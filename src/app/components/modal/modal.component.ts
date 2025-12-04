import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 1, 1)', style({ transform: 'scale(0.9)', opacity: 0 }))
      ])
    ])
  ]
})
export class ModalComponent implements OnInit {
  public program_modal: any = {};
  public isVisible = false;

  constructor(private modalService: ModalService) {}

  ngOnInit(): void {
    this.isVisible = false;
    this.modalService.programa$.subscribe((program) => {
      console.log('Programa recibido en modal:', program);
      this.program_modal = program;
      // Si no está vacío el objeto
      if (Object.keys(this.program_modal).length !== 0) {
        this.isVisible = true;
      } else {
        this.isVisible = false;
      }
    });
  }

  public closeModal(): void {
    this.isVisible = false;
    this.modalService.clearPrograma();
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
