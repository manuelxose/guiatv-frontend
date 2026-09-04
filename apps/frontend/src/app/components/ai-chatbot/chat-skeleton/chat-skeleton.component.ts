import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-5 p-4" aria-hidden="true">
      <!-- Fake assistant bubble -->
      <div class="flex justify-start">
        <div class="w-[72%] space-y-2 rounded-[1.4rem] border border-[var(--portal-border)]/60 bg-[var(--portal-surface)] px-4 py-3 shadow-sm">
          <div class="h-3 w-[85%] animate-pulse rounded-full bg-[var(--portal-surface-strong)]"></div>
          <div class="h-3 w-[60%] animate-pulse rounded-full bg-[var(--portal-surface-strong)] [animation-delay:100ms]"></div>
          <div class="h-3 w-[45%] animate-pulse rounded-full bg-[var(--portal-surface-strong)] [animation-delay:200ms]"></div>
        </div>
      </div>

      <!-- Fake user bubble -->
      <div class="flex justify-end">
        <div class="w-[55%] space-y-2 rounded-[1.4rem] bg-[var(--accent-live-soft)] px-4 py-3 shadow-md">
          <div class="h-3 w-[90%] animate-pulse rounded-full bg-[var(--accent-live)]/20"></div>
          <div class="h-3 w-[50%] animate-pulse rounded-full bg-[var(--accent-live)]/20 [animation-delay:100ms]"></div>
        </div>
      </div>

      <!-- Fake assistant bubble -->
      <div class="flex justify-start">
        <div class="w-[80%] space-y-2 rounded-[1.4rem] border border-[var(--portal-border)]/60 bg-[var(--portal-surface)] px-4 py-3 shadow-sm">
          <div class="h-3 w-[70%] animate-pulse rounded-full bg-[var(--portal-surface-strong)]"></div>
          <div class="h-3 w-[90%] animate-pulse rounded-full bg-[var(--portal-surface-strong)] [animation-delay:100ms]"></div>
          <div class="h-3 w-[55%] animate-pulse rounded-full bg-[var(--portal-surface-strong)] [animation-delay:200ms]"></div>
          <div class="h-3 w-[35%] animate-pulse rounded-full bg-[var(--portal-surface-strong)] [animation-delay:300ms]"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @media (prefers-reduced-motion: reduce) {
      :host ::ng-deep .animate-pulse { animation: none; opacity: 0.75; }
    }
  `],
})
export class ChatSkeletonComponent {}
