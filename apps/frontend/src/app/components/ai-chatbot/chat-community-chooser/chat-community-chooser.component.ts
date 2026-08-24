import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-community-chooser',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mt-4 rounded-2xl border border-[var(--portal-border)]/70 bg-[var(--portal-bg-deep)]/60 p-3">
      <p class="text-xs leading-relaxed text-[var(--portal-text)]">{{ promptText }}</p>

      <div class="mt-3 flex flex-wrap gap-2">
        <ng-container *ngIf="savedCommunity && !isChooserOpen">
          <button
            type="button"
            (click)="useSaved.emit()"
            class="min-h-[34px] rounded-full border border-transparent bg-[var(--accent-discover-soft)] px-3 text-xs font-semibold text-[var(--accent-discover)] transition-colors hover:opacity-90"
          >
            Usar {{ savedCommunity }}
          </button>
          <button
            type="button"
            (click)="toggleChooser()"
            class="min-h-[34px] rounded-full border border-[var(--portal-border)] bg-[var(--portal-bg)] px-3 text-xs font-semibold text-[var(--portal-text)] transition-colors hover:border-[var(--portal-border-strong)]"
          >
            Cambiar
          </button>
        </ng-container>
        <ng-container *ngIf="!savedCommunity && !isChooserOpen">
          <button
            type="button"
            (click)="toggleChooser()"
            class="min-h-[34px] rounded-full border border-transparent bg-[var(--accent-discover-soft)] px-3 text-xs font-semibold text-[var(--accent-discover)] transition-colors hover:opacity-90"
          >
            Elegir comunidad
          </button>
        </ng-container>
        <button
          *ngIf="!isChooserOpen"
          type="button"
          (click)="declined.emit()"
          class="min-h-[34px] rounded-full border border-[var(--portal-border)] bg-[var(--portal-bg)] px-3 text-xs font-semibold text-[var(--portal-text)] transition-colors hover:border-[var(--portal-border-strong)]"
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
              ? 'border-transparent bg-[var(--accent-discover-soft)] text-[var(--accent-discover)]'
              : 'border-[var(--portal-border)]/60 bg-[var(--portal-bg)] text-[var(--portal-text)] hover:border-[var(--accent-discover)]/30 hover:bg-[var(--accent-discover-soft)] hover:text-[var(--accent-discover)]'"
          >
            {{ community }}
          </button>
        </div>
        <button
          type="button"
          (click)="toggleChooser()"
          class="mt-2 text-[10px] text-[var(--portal-text-muted)] transition-colors hover:text-[var(--portal-text)]"
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
