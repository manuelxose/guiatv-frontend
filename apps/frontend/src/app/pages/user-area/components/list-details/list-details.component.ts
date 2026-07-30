import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserList, UserListItem } from '../../../../interfaces/user.interface';

const COVER_GRADIENTS = [
  'from-red-600/50 to-red-950/80',
  'from-amber-600/50 to-amber-950/80',
  'from-blue-600/50 to-blue-950/80',
  'from-emerald-600/50 to-emerald-950/80',
  'from-violet-600/50 to-violet-950/80',
  'from-sky-600/50 to-sky-950/80',
  'from-rose-600/50 to-rose-950/80',
  'from-teal-600/50 to-teal-950/80',
];

@Component({
  selector: 'app-list-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="list" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70" (click)="close()" aria-hidden="true"></div>

      <div
        class="relative w-full max-w-5xl h-[80vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-details-title"
      >
        <div class="relative h-48 flex-shrink-0">
          <img
            *ngIf="list.cover"
            [src]="list.cover"
            class="absolute inset-0 w-full h-full object-cover opacity-70"
            alt=""
          />
          <img
            *ngIf="!list.cover && getFirstPoster()"
            [src]="getFirstPoster()"
            class="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
            alt=""
          />
          <div
            *ngIf="!list.cover && !getFirstPoster()"
            class="absolute inset-0 bg-gradient-to-br"
            [ngClass]="getCoverGradient(list.title)"
          >
            <div class="absolute inset-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          </div>
          <div class="absolute inset-0 bg-black/50"></div>
          <div class="relative z-10 h-full flex items-end justify-between p-6 gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <h2 id="list-details-title" class="text-2xl font-semibold text-white">{{ list.title }}</h2>
                <span
                  *ngIf="list.isDefault"
                  class="text-[10px] uppercase tracking-[0.3em] px-2 py-1 rounded-full border border-red-500/40 text-red-200"
                >
                  Default
                </span>
              </div>
              <p class="text-sm text-slate-200 max-w-xl">{{ list.description }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="onAddItem()"
                class="min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Anadir contenido
              </button>
              <button
                type="button"
                (click)="close()"
                class="min-h-[44px] px-4 rounded-xl border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <div *ngIf="items.length === 0" class="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-10 text-center">
            <p class="text-white font-medium mb-2">Esta lista esta vacia.</p>
            <p class="text-sm text-slate-400">Explora la guia y agrega contenido.</p>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" *ngIf="items.length > 0">
            <div
              *ngFor="let item of items"
              class="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden flex flex-col"
            >
              <div class="aspect-[2/3] bg-slate-900/80 flex items-center justify-center">
                <img *ngIf="item.poster" [src]="item.poster" class="w-full h-full object-cover" [alt]="item.title" />
                <span *ngIf="!item.poster" class="text-xs text-slate-400">Sin poster</span>
              </div>
              <div class="p-4 space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="text-sm font-semibold text-white truncate">{{ item.title }}</h3>
                    <p class="text-xs text-slate-500 capitalize">{{ item.type }}</p>
                  </div>
                  <span class="text-[10px] uppercase font-semibold px-2 py-1 rounded-full border border-slate-700 text-slate-300">
                    {{ item.state }}
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    (click)="onRemoveItem(item.id, $event)"
                    class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    Quitar
                  </button>
                  <button
                    type="button"
                    class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    Abrir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ListDetailsComponent {
  @Input() list: UserList | null = null;
  @Input() items: UserListItem[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() removeItem = new EventEmitter<string>();
  @Output() addItem = new EventEmitter<void>();

  close() {
    this.closeModal.emit();
  }

  onAddItem() {
    this.addItem.emit();
  }

  onRemoveItem(itemId: string, event: Event) {
    event.stopPropagation();
    this.removeItem.emit(itemId);
  }

  getFirstPoster(): string | null {
    const poster = this.items.find((item) => item.poster)?.poster;
    return poster || null;
  }

  getCoverGradient(title: string): string {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0;
    }
    return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
  }
}
