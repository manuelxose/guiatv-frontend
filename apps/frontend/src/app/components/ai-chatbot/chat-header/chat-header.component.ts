import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssistantMemorySnapshot } from '../../../interfaces/chatbot.interface';

interface ProfileCategory {
  key: string;
  label: string;
  items: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="border-b border-[var(--portal-border)]/80 bg-[var(--portal-surface-strong)] px-5 py-3 backdrop-blur-xl">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <p class="text-base font-bold text-[var(--portal-text)] truncate">Asistente IA</p>
          <span class="shrink-0 rounded-full border border-[var(--portal-border)] bg-[var(--accent-live-soft)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--accent-live)]">
            Pro
          </span>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            *ngIf="isAuthenticated"
            type="button"
            (click)="toggleSidebar.emit()"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--portal-text-muted)] transition-colors hover:bg-[var(--portal-surface-strong)] hover:text-[var(--portal-text)]"
            aria-label="Conversaciones"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"></path>
            </svg>
          </button>
          <button
            *ngIf="isAuthenticated"
            type="button"
            (click)="toggleMemoryEditor.emit()"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--portal-text-muted)] transition-colors hover:bg-[var(--portal-surface-strong)] hover:text-[var(--portal-text)]"
            [attr.aria-label]="memoryEditorOpen ? 'Cerrar preferencias' : 'Editar preferencias'"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
          <button
            *ngIf="isAuthenticated"
            type="button"
            (click)="newConversation.emit()"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--portal-text-muted)] transition-colors hover:bg-[var(--portal-surface-strong)] hover:text-[var(--portal-text)]"
            aria-label="Nueva conversación"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
          <button
            type="button"
            (click)="closePanel.emit()"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--portal-text-muted)] transition-colors hover:bg-[var(--portal-surface-strong)] hover:text-[var(--portal-text)]"
            aria-label="Cerrar asistente"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Memory profile summary -->
      <ng-container *ngIf="isAuthenticated && profileCategories.length">
        <!-- Collapsed: compact highlights -->
        <div *ngIf="!profileExpanded" class="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            *ngFor="let cat of profileCategories | slice:0:3; trackBy: trackByCatKey"
            class="rounded-full border px-2 py-0.5 text-[10px] font-medium"
            [ngStyle]="{ color: cat.color, 'background-color': cat.bgColor, 'border-color': cat.borderColor }"
          >
            {{ cat.label }}: {{ cat.items.slice(0, 2).join(', ') }}
            <span *ngIf="cat.items.length > 2" class="opacity-60">+{{ cat.items.length - 2 }}</span>
          </span>
          <button
            type="button"
            (click)="profileExpanded = true"
            class="text-[10px] text-[var(--portal-text-muted)] hover:text-[var(--portal-text)] transition-colors"
          >
            Tu perfil IA ▾
          </button>
        </div>

        <!-- Expanded: full profile -->
        <div *ngIf="profileExpanded" class="mt-3 rounded-xl border border-[var(--portal-border)]/60 bg-[var(--portal-surface-strong)] p-3">
          <div class="flex items-center justify-between mb-2.5">
            <span class="text-xs font-semibold text-[var(--portal-text)]">Tu perfil IA</span>
            <button
              type="button"
              (click)="profileExpanded = false"
              class="text-[10px] text-[var(--portal-text-muted)] hover:text-[var(--portal-text)] transition-colors"
            >
              Cerrar ▴
            </button>
          </div>
          <div *ngFor="let cat of profileCategories; trackBy: trackByCatKey" class="mb-2 last:mb-0">
            <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider" [ngStyle]="{ color: cat.color }">
              {{ cat.label }}
            </p>
            <div class="flex flex-wrap gap-1">
              <span
                *ngFor="let item of cat.items; trackBy: trackByText"
                class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                [ngStyle]="{ color: cat.color, 'background-color': cat.bgColor, 'border-color': cat.borderColor }"
              >
                {{ item }}
                <button
                  type="button"
                  (click)="onRemoveTag(cat.key, item)"
                  class="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                  [attr.aria-label]="'Eliminar ' + item"
                >&times;</button>
              </span>
            </div>
          </div>
          <div *ngIf="community" class="mb-2">
            <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-sky-400">Comunidad</p>
            <span class="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
              {{ community }}
            </span>
          </div>
        </div>
      </ng-container>
    </header>
  `,
})
export class ChatHeaderComponent {
  @Input() isAuthenticated = false;
  @Input() memoryHighlights: string[] = [];
  @Input() memory: AssistantMemorySnapshot | null = null;
  @Input() memoryEditorOpen = false;
  @Output() newConversation = new EventEmitter<void>();
  @Output() closePanel = new EventEmitter<void>();
  @Output() toggleMemoryEditor = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() removeTag = new EventEmitter<{ key: string; value: string }>();

  profileExpanded = false;

  private static readonly CATEGORY_CONFIG: Array<{
    key: keyof AssistantMemorySnapshot;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }> = [
    { key: 'preferredPlatforms', label: 'Plataformas', color: '#38bdf8', bgColor: '#0c4a6e22', borderColor: '#0ea5e944' },
    { key: 'likedGenres', label: 'Géneros', color: '#f87171', bgColor: '#7f1d1d22', borderColor: '#ef444444' },
    { key: 'preferredViewingContexts', label: 'Contexto', color: '#a78bfa', bgColor: '#4c1d9522', borderColor: '#8b5cf644' },
    { key: 'preferredDurations', label: 'Duración', color: '#fbbf24', bgColor: '#78350f22', borderColor: '#f59e0b44' },
    { key: 'favoriteFranchisesOrTitles', label: 'Favoritos', color: '#34d399', bgColor: '#064e3b22', borderColor: '#10b98144' },
    { key: 'dislikedGenres', label: 'Evitar', color: '#fb923c', bgColor: '#7c2d1222', borderColor: '#f9731644' },
    { key: 'avoidedPlatforms', label: 'Plat. evitadas', color: '#fb923c', bgColor: '#7c2d1222', borderColor: '#f9731644' },
    { key: 'negativeSignals', label: 'No me gusta', color: '#f43f5e', bgColor: '#881337 22', borderColor: '#e11d4844' },
    { key: 'recentTopics', label: 'Temas recientes', color: '#94a3b8', bgColor: '#1e293b44', borderColor: '#47556944' },
  ];

  get profileCategories(): ProfileCategory[] {
    if (!this.memory) return [];
    return ChatHeaderComponent.CATEGORY_CONFIG
      .filter((cfg) => {
        const arr = this.memory?.[cfg.key];
        return Array.isArray(arr) && arr.length > 0;
      })
      .map((cfg) => ({
        key: cfg.key,
        label: cfg.label,
        items: this.memory![cfg.key] as string[],
        color: cfg.color,
        bgColor: cfg.bgColor,
        borderColor: cfg.borderColor,
      }));
  }

  get community(): string | null {
    return this.memory?.preferredAutonomousCommunity || null;
  }

  trackByCatKey(_index: number, cat: ProfileCategory): string {
    return cat.key;
  }

  trackByText(_index: number, value: string): string {
    return value;
  }

  onRemoveTag(key: string, value: string): void {
    this.removeTag.emit({ key, value });
  }
}
