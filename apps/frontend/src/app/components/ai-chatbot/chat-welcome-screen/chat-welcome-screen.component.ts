import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-welcome-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--accent-live-soft)] bg-[var(--accent-live-soft)]">
        <svg class="h-8 w-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3 13.8 8.2 19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" d="M18.5 3.5 19 5l1.5.5L19 6l-.5 1.5L18 6l-1.5-.5L18 5l.5-1.5Z"></path>
        </svg>
      </div>
      <p class="mb-2 text-lg font-bold text-[var(--portal-text)]">Asistente IA de recomendaciones</p>
      <p class="max-w-sm text-sm text-[var(--portal-text-muted)]">
        Regístrate o inicia sesión para acceder al asistente. Cruza tus gustos con la parrilla real y tus plataformas para darte recomendaciones personalizadas.
      </p>

      <div class="mt-5 flex max-w-sm flex-wrap justify-center gap-2">
        <button
          *ngFor="let suggestion of previewSuggestions; trackBy: trackByText"
          type="button"
          (click)="login.emit()"
          class="cursor-pointer rounded-full border border-[var(--portal-border)] bg-[var(--portal-bg)] px-3 py-1.5 text-xs text-[var(--portal-text)] transition-colors hover:bg-[var(--portal-surface-strong)]"
        >
          {{ suggestion }}
        </button>
      </div>

      <div class="mt-6 flex items-center gap-3">
        <button
          type="button"
          (click)="register.emit()"
          class="min-h-[44px] rounded-xl bg-red-600 px-5 text-sm font-semibold text-[var(--portal-text)] transition-colors hover:bg-red-500"
        >
          Crear cuenta gratis
        </button>
        <button
          type="button"
          (click)="login.emit()"
          class="min-h-[44px] rounded-xl border border-[var(--portal-border)] bg-[var(--portal-bg)] px-5 text-sm font-semibold text-[var(--portal-text)] transition-colors hover:border-slate-500 hover:text-[var(--portal-text)]"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  `,
})
export class ChatWelcomeScreenComponent {
  @Input() previewSuggestions: string[] = [];
  @Output() login = new EventEmitter<void>();
  @Output() register = new EventEmitter<void>();

  trackByText(_index: number, value: string): string {
    return value;
  }
}
