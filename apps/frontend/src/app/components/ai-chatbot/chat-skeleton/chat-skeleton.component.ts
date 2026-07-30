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
        <div class="w-[72%] space-y-2 rounded-[1.4rem] border border-slate-800/60 bg-slate-900/60 px-4 py-3">
          <div class="h-3 w-[85%] animate-pulse rounded-full bg-slate-800"></div>
          <div class="h-3 w-[60%] animate-pulse rounded-full bg-slate-800 [animation-delay:100ms]"></div>
          <div class="h-3 w-[45%] animate-pulse rounded-full bg-slate-800 [animation-delay:200ms]"></div>
        </div>
      </div>

      <!-- Fake user bubble -->
      <div class="flex justify-end">
        <div class="w-[55%] space-y-2 rounded-[1.4rem] bg-red-900/30 px-4 py-3">
          <div class="h-3 w-[90%] animate-pulse rounded-full bg-red-800/40"></div>
          <div class="h-3 w-[50%] animate-pulse rounded-full bg-red-800/40 [animation-delay:100ms]"></div>
        </div>
      </div>

      <!-- Fake assistant bubble -->
      <div class="flex justify-start">
        <div class="w-[80%] space-y-2 rounded-[1.4rem] border border-slate-800/60 bg-slate-900/60 px-4 py-3">
          <div class="h-3 w-[70%] animate-pulse rounded-full bg-slate-800"></div>
          <div class="h-3 w-[90%] animate-pulse rounded-full bg-slate-800 [animation-delay:100ms]"></div>
          <div class="h-3 w-[55%] animate-pulse rounded-full bg-slate-800 [animation-delay:200ms]"></div>
          <div class="h-3 w-[35%] animate-pulse rounded-full bg-slate-800 [animation-delay:300ms]"></div>
        </div>
      </div>
    </div>
  `,
})
export class ChatSkeletonComponent {}
