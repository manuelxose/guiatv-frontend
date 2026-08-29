import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserList } from '../../../../interfaces/user.interface';

const COVER_GRADIENTS = [
  'from-red-600/40 to-red-900/60',
  'from-amber-600/40 to-amber-900/60',
  'from-blue-600/40 to-blue-900/60',
  'from-emerald-600/40 to-emerald-900/60',
  'from-violet-600/40 to-violet-900/60',
  'from-sky-600/40 to-sky-900/60',
  'from-rose-600/40 to-rose-900/60',
  'from-teal-600/40 to-teal-900/60',
];

@Component({
  selector: 'app-user-lists',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-[var(--portal-text)]">Mis listas</h2>
          <p class="text-sm text-[var(--portal-text-muted)]">Organiza tu contenido favorito con control total.</p>
        </div>
        <button
          type="button"
          (click)="onOpenCreateModal()"
          class="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent-live-strong)] hover:opacity-90 text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
        >
          Crear lista
        </button>
      </div>

      <div *ngIf="lists.length === 0 && !inlineCreating" class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-8 text-center">
        <p class="text-[var(--portal-text)] font-medium mb-2">Aún no tienes listas.</p>
        <p class="text-sm text-[var(--portal-text-muted)] mb-6">Crea una lista para guardar series, programas y canales.</p>
        <button
          type="button"
          (click)="startInlineCreate()"
          class="min-h-[44px] px-6 py-2.5 rounded-xl border border-[var(--portal-border)] text-[var(--portal-text-soft)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
        >
          Crear primera lista
        </button>
      </div>

      <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <!-- Inline quick-create card -->
        <div
          *ngIf="!inlineCreating"
          role="button"
          tabindex="0"
          (click)="startInlineCreate()"
          (keydown.enter)="startInlineCreate()"
          class="group relative rounded-2xl border border-dashed border-[var(--portal-border)] bg-[var(--portal-surface-soft)] hover:bg-[var(--portal-surface-soft)] text-left p-5 min-h-[220px] flex flex-col items-center justify-center gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
        >
          <div class="h-12 w-12 rounded-full border border-[var(--portal-border)] flex items-center justify-center text-[var(--portal-text-soft)] text-xl">
            +
          </div>
          <span class="text-sm text-[var(--portal-text-soft)] font-medium">Crear nueva lista</span>
        </div>

        <!-- Active inline create form -->
        <div
          *ngIf="inlineCreating"
          class="rounded-2xl border border-[var(--accent-live)] bg-[var(--portal-surface-soft)] p-5 min-h-[220px] flex flex-col justify-center gap-3"
        >
          <div class="h-10 w-10 mx-auto rounded-full bg-[var(--accent-live-soft)] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[var(--accent-live)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <input
            #inlineInput
            type="text"
            [(ngModel)]="inlineTitle"
            (keydown.enter)="submitInlineCreate()"
            (keydown.escape)="cancelInlineCreate()"
            class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl px-4 text-sm text-[var(--portal-text)] placeholder:text-[var(--portal-text-faint)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
            placeholder="Nombre de la lista"
          />
          <div class="flex items-center justify-between gap-2">
            <button
              type="button"
              (click)="onOpenCreateModal()"
              class="text-xs text-[var(--portal-text-muted)] hover:text-[var(--portal-text-soft)] underline underline-offset-2"
            >
              Más opciones
            </button>
            <div class="flex gap-2">
              <button
                type="button"
                (click)="cancelInlineCreate()"
                class="min-h-[36px] px-3 rounded-lg border border-[var(--portal-border)] text-xs text-[var(--portal-text-soft)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="submitInlineCreate()"
                [disabled]="!inlineTitle.trim()"
                class="min-h-[36px] px-4 rounded-lg bg-[var(--accent-live-strong)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-white font-semibold"
              >
                Crear
              </button>
            </div>
          </div>
        </div>

        <!-- List cards -->
        <div
          *ngFor="let list of lists"
          role="button"
          tabindex="0"
          data-vertical="discover"
          (click)="onSelect(list)"
          (keydown.enter)="onSelect(list)"
          class="list-card group rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
        >
          <div class="relative aspect-video">
            <img
              *ngIf="list.cover"
              [src]="list.cover"
              class="absolute inset-0 w-full h-full object-cover opacity-80"
              alt=""
            />
            <div
              *ngIf="!list.cover"
              class="absolute inset-0 bg-gradient-to-br"
              [ngClass]="getGradientClass(list.title)"
            >
              <div class="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-[var(--portal-text)]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
            </div>
          </div>
          <div class="p-4 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-base font-semibold text-[var(--portal-text)] truncate">{{ list.title }}</h3>
                <p class="text-xs text-[var(--portal-text-muted)] line-clamp-2" *ngIf="list.description">
                  {{ list.description }}
                </p>
              </div>
              <span class="text-xs px-2 py-1 rounded-full border border-[var(--portal-border)] text-[var(--portal-text-soft)] whitespace-nowrap">
                {{ list.itemsCount }} items
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-[11px] uppercase tracking-[0.2em] text-[var(--portal-text-muted)]">
                {{ list.visibility === 'public' ? 'Público' : list.visibility === 'friends' ? 'Amigos' : 'Privado' }}
              </span>
              <button
                type="button"
                (click)="$event.stopPropagation(); onSelect(list)"
                class="min-h-[44px] px-4 rounded-lg border border-[var(--portal-border)] text-xs text-[var(--portal-text-soft)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
              >
                Abrir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use '../../../../../styles/card-accent' as cards;

      .list-card {
        @include cards.card-vertical-accent();
      }
    `,
  ],
})
export class UserListsComponent {
  @Input() lists: UserList[] = [];
  @Output() create = new EventEmitter<void>();
  @Output() quickCreate = new EventEmitter<{ title: string; description: string; visibility: 'public' | 'friends' | 'private' }>();
  @Output() select = new EventEmitter<UserList>();
  @ViewChild('inlineInput') inlineInput?: ElementRef<HTMLInputElement>;

  inlineCreating = false;
  inlineTitle = '';

  startInlineCreate(): void {
    this.inlineCreating = true;
    this.inlineTitle = '';
    setTimeout(() => this.inlineInput?.nativeElement?.focus(), 50);
  }

  cancelInlineCreate(): void {
    this.inlineCreating = false;
    this.inlineTitle = '';
  }

  submitInlineCreate(): void {
    const title = this.inlineTitle.trim();
    if (!title) return;
    this.quickCreate.emit({ title, description: '', visibility: 'public' });
    this.cancelInlineCreate();
  }

  onOpenCreateModal(): void {
    this.cancelInlineCreate();
    this.create.emit();
  }

  onSelect(list: UserList) {
    this.select.emit(list);
  }

  getGradientClass(title: string): string {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0;
    }
    return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
  }
}
