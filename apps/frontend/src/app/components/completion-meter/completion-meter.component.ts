import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/**
 * Reusable, accessible onboarding-completion meter. Purely presentational —
 * every caller supplies its own real `done`/`total` counts (see
 * utils/personalization-completion.ts for the shared computation used by
 * Mi GuíaTV's Overview and Asistente tab), so this component never invents a
 * percentage on its own. Renders nothing when `total` is 0, since a meter
 * with no measurable fields is not useful and would just be noise.
 */
@Component({
  selector: 'app-completion-meter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="total > 0"
      class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-4"
    >
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-[var(--portal-text)]">{{ label }}</p>
        <span class="text-xs text-[var(--portal-text-muted)]">{{ done }}/{{ total }}</span>
      </div>
      <div
        class="mt-3 h-2 overflow-hidden rounded-full bg-[var(--portal-surface-strong)]"
        role="progressbar"
        [attr.aria-valuenow]="done"
        aria-valuemin="0"
        [attr.aria-valuemax]="total"
        [attr.aria-label]="label + ': ' + done + ' de ' + total + ' preferencias completadas'"
      >
        <div
          class="h-full rounded-full bg-[var(--accent-live-strong)] transition-[width] duration-300"
          [style.width.%]="(done / total) * 100"
        ></div>
      </div>
      <p *ngIf="done < total" class="mt-2 text-xs text-[var(--portal-text-muted)]">
        Añade {{ total - done }} preferencia{{ total - done === 1 ? '' : 's' }} más para mejorar tus
        recomendaciones. Es opcional.
      </p>
      <p *ngIf="done === total" class="mt-2 text-xs text-[var(--portal-text-muted)]">
        Tu personalización está completa.
      </p>
    </div>
  `,
})
export class CompletionMeterComponent {
  @Input() label = 'Mejora tus recomendaciones';
  @Input() done = 0;
  @Input() total = 0;
}
