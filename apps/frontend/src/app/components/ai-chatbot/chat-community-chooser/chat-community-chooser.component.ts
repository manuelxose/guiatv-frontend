import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-community-chooser',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/60 p-3">
      <p class="text-xs leading-relaxed text-slate-300">{{ promptText }}</p>

      <div class="mt-3 flex flex-wrap gap-2">
        <ng-container *ngIf="savedCommunity && !isChooserOpen">
          <button
            type="button"
            (click)="useSaved.emit()"
            class="min-h-[34px] rounded-full border border-sky-500/40 bg-sky-600/15 px-3 text-xs font-semibold text-sky-200 transition-colors hover:bg-sky-600/25"
          >
            Usar {{ savedCommunity }}
          </button>
          <button
            type="button"
            (click)="toggleChooser()"
            class="min-h-[34px] rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs font-semibold text-slate-100 transition-colors hover:border-slate-500"
          >
            Cambiar
          </button>
        </ng-container>
        <ng-container *ngIf="!savedCommunity && !isChooserOpen">
          <button
            type="button"
            (click)="toggleChooser()"
            class="min-h-[34px] rounded-full border border-sky-500/40 bg-sky-600/15 px-3 text-xs font-semibold text-sky-200 transition-colors hover:bg-sky-600/25"
          >
            Elegir comunidad
          </button>
        </ng-container>
        <button
          *ngIf="!isChooserOpen"
          type="button"
          (click)="declined.emit()"
          class="min-h-[34px] rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500"
        >
          No incluir autonómicas
        </button>
      </div>

      <!-- Community grid -->
      <div *ngIf="isChooserOpen" class="mt-3">
        <div class="grid grid-cols-3 gap-1.5">
          <button
            *ngFor="let community of communities"
            type="button"
            (click)="communitySelected.emit(community)"
            class="rounded-lg border px-2 py-2 text-[11px] font-medium transition-all text-center leading-tight"
            [ngClass]="community === savedCommunity
              ? 'border-sky-500/50 bg-sky-600/20 text-sky-200'
              : 'border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-sky-500/30 hover:bg-sky-600/10 hover:text-sky-200'"
          >
            {{ community }}
          </button>
        </div>
        <button
          type="button"
          (click)="toggleChooser()"
          class="mt-2 text-[10px] text-slate-500 transition-colors hover:text-slate-300"
        >
          Cancelar
        </button>
      </div>
    </div>
  `,
})
export class ChatCommunityChooserComponent {
  @Input() savedCommunity: string | null = null;
  @Input() promptText = '';
  @Input() communities: string[] = [];
  @Output() useSaved = new EventEmitter<void>();
  @Output() communitySelected = new EventEmitter<string>();
  @Output() declined = new EventEmitter<void>();

  isChooserOpen = false;

  toggleChooser(): void {
    this.isChooserOpen = !this.isChooserOpen;
  }
}
