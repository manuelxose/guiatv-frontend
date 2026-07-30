import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-chat-onboarding-card',
  standalone: true,
  template: `
    <div class="mx-4 mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
      <p class="font-semibold text-white">Mejoraré mucho si completas tus gustos.</p>
      <p class="mt-1 text-sky-100/90">
        Puedes escribirme tus géneros y plataformas favoritas aquí o ajustarlos desde tu perfil.
      </p>
      <button
        type="button"
        (click)="openSettings.emit()"
        class="mt-3 min-h-[36px] rounded-xl border border-sky-400/30 px-3 text-xs font-semibold text-sky-50 transition-colors hover:bg-sky-500/10"
      >
        Abrir ajustes
      </button>
    </div>
  `,
})
export class ChatOnboardingCardComponent {
  @Output() openSettings = new EventEmitter<void>();
}
