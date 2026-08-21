import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationSummary } from '../../../interfaces/chatbot.interface';

@Component({
  selector: 'app-chat-conversation-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop (mobile) -->
    <div
      class="absolute inset-0 bg-black/50 backdrop-blur-sm z-[var(--z-dropdown)] md:hidden"
      (click)="close.emit()"
      (keydown.escape)="close.emit()"
      tabindex="0"
      role="button"
      aria-label="Cerrar conversaciones"
    ></div>

    <!-- Sidebar panel -->
    <div
      class="absolute top-0 left-0 bottom-0 z-[var(--z-drawer)]
             w-full md:w-[min(280px,70%)] bg-[var(--portal-bg-deep)]
             border-r border-[var(--portal-border)]
             flex flex-col shadow-xl"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-3 py-2.5 border-b border-[var(--portal-border)]">
        <span class="text-sm font-semibold text-[var(--portal-text)]">Conversaciones</span>
        <div class="flex items-center gap-1">
          <button
            (click)="onNewConversation()"
            class="p-1.5 rounded-lg text-[var(--portal-text-muted)] hover:text-red-400 hover:bg-[var(--accent-live-soft)] transition-colors"
            title="Nueva conversación"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
          <button
            (click)="close.emit()"
            class="p-1.5 rounded-lg text-[var(--portal-text-muted)] hover:text-[var(--portal-text)] hover:bg-[var(--portal-surface-strong)] transition-colors"
            title="Cerrar"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="px-3 py-2 border-b border-[var(--portal-border)]/60">
        <div class="relative">
          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--portal-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Buscar conversaciones..."
            class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--portal-border)]
                   bg-[var(--portal-bg)] text-[var(--portal-text)]
                   placeholder:text-[var(--portal-text-faint)] focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50"
          />
        </div>
      </div>

      <!-- Conversation list -->
      <div class="flex-1 overflow-y-auto">
        <!-- Pinned section -->
        @if (pinnedList.length > 0) {
          <div class="px-3 pt-2 pb-1">
            <button
              (click)="pinnedCollapsed.set(!pinnedCollapsed())"
              class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--portal-text-muted)] hover:text-[var(--portal-text)]"
            >
              <svg class="w-3 h-3 transition-transform" [class.rotate-90]="!pinnedCollapsed()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
              <svg class="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              Fijadas
            </button>
          </div>
          @if (!pinnedCollapsed()) {
            @for (conv of pinnedList; track conv.conversationId) {
              <ng-container *ngTemplateOutlet="conversationItem; context: { $implicit: conv }"></ng-container>
            }
          }
        }

        <!-- Recent section -->
        @if (recentList.length > 0) {
          <div class="px-3 pt-2 pb-1">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--portal-text-muted)]">Recientes</span>
          </div>
          @for (conv of recentList; track conv.conversationId) {
            <ng-container *ngTemplateOutlet="conversationItem; context: { $implicit: conv }"></ng-container>
          }
        }

        <!-- Archived section -->
        @if (archivedList.length > 0) {
          <div class="px-3 pt-2 pb-1">
            <button
              (click)="archivedCollapsed.set(!archivedCollapsed())"
              class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--portal-text-muted)] hover:text-[var(--portal-text)]"
            >
              <svg class="w-3 h-3 transition-transform" [class.rotate-90]="!archivedCollapsed()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
              <svg class="w-3 h-3 text-[var(--portal-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/>
              </svg>
              Archivadas
            </button>
          </div>
          @if (!archivedCollapsed()) {
            @for (conv of archivedList; track conv.conversationId) {
              <ng-container *ngTemplateOutlet="conversationItem; context: { $implicit: conv }"></ng-container>
            }
          }
        }

        <!-- Empty state -->
        @if (displayList.length === 0) {
          <div class="flex flex-col items-center justify-center py-12 text-[var(--portal-text-muted)]">
            <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <span class="text-xs">{{ searchQuery ? 'Sin resultados' : 'Sin conversaciones' }}</span>
          </div>
        }
      </div>
    </div>

    <!-- Conversation item template -->
    <ng-template #conversationItem let-conv>
      <button
        (click)="onSelect(conv)"
        (contextmenu)="onContextMenu($event, conv)"
        class="w-full text-left px-3 py-2 hover:bg-[var(--portal-surface-strong)] transition-colors group relative"
        [ngClass]="{
          'bg-red-900/15 border-l-2 border-red-500': conv.conversationId === activeConversationId
        }"
      >
        <div class="flex items-start justify-between gap-2">
          <!-- Title + editing -->
          @if (editingId() === conv.conversationId) {
            <input
              #renameInput
              type="text"
              [value]="conv.sessionTitle"
              (keydown.enter)="onRenameConfirm($event, conv)"
              (keydown.escape)="editingId.set(null)"
              (blur)="onRenameConfirm($event, conv)"
              class="flex-1 text-xs px-1 py-0.5 rounded border border-red-500/40 bg-[var(--portal-bg)]
                     text-[var(--portal-text)] focus:outline-none focus:ring-1 focus:ring-red-400"
              (click)="$event.stopPropagation()"
            />
          } @else {
            <span class="flex-1 text-xs font-medium text-[var(--portal-text)] line-clamp-2 leading-snug">
              {{ conv.sessionTitle }}
            </span>
          }

          <!-- Actions (appear on hover) -->
          <div class="hidden group-hover:flex items-center gap-0.5 shrink-0" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
            <button
              (click)="onTogglePin(conv)"
              class="p-1 rounded text-[var(--portal-text-muted)] hover:text-amber-400 transition-colors"
              [title]="conv.pinned ? 'Desfijar' : 'Fijar'"
            >
              <svg class="w-3 h-3" [class.text-amber-500]="conv.pinned" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </button>
            <button
              (click)="editingId.set(conv.conversationId)"
              class="p-1 rounded text-[var(--portal-text-muted)] hover:text-blue-400 transition-colors"
              title="Renombrar"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button
              (click)="onToggleArchive(conv)"
              class="p-1 rounded text-[var(--portal-text-muted)] hover:text-purple-400 transition-colors"
              [title]="conv.archived ? 'Desarchivar' : 'Archivar'"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/>
              </svg>
            </button>
            <button
              (click)="onDelete(conv)"
              class="p-1 rounded text-[var(--portal-text-muted)] hover:text-red-400 transition-colors"
              title="Eliminar"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Meta line -->
        <div class="flex items-center gap-2 mt-0.5">
          <span class="text-[10px] text-[var(--portal-text-muted)]">{{ formatRelativeTime(conv.lastUsedAt) }}</span>
          @if (conv.messageCount > 0) {
            <span class="text-[10px] text-[var(--portal-text-muted)]">· {{ conv.messageCount }} msgs</span>
          }
        </div>

        <!-- Preview -->
        @if (conv.lastMessage) {
          <p class="text-[10px] text-[var(--portal-text-muted)] line-clamp-1 mt-0.5">{{ conv.lastMessage }}</p>
        }
      </button>
    </ng-template>
  `,
})
export class ChatConversationSidebarComponent {
  @Input() conversations: ConversationSummary[] = [];
  @Input() activeConversationId: string | null = null;

  @Output() selectConversation = new EventEmitter<string>();
  @Output() newConversation = new EventEmitter<void>();
  @Output() updateConversationEvent = new EventEmitter<{
    conversationId: string;
    updates: { sessionTitle?: string; pinned?: boolean; archived?: boolean };
  }>();
  @Output() deleteConversationEvent = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();

  searchQuery = '';
  editingId = signal<string | null>(null);
  pinnedCollapsed = signal(false);
  archivedCollapsed = signal(true);

  get displayList(): ConversationSummary[] {
    return [...this.pinnedList, ...this.recentList, ...this.archivedList];
  }

  get pinnedList(): ConversationSummary[] {
    return (this.conversations || []).filter((c) => c.pinned && !c.archived);
  }

  get recentList(): ConversationSummary[] {
    return (this.conversations || []).filter((c) => !c.pinned && !c.archived);
  }

  get archivedList(): ConversationSummary[] {
    return (this.conversations || []).filter((c) => c.archived);
  }

  onSearchChange(query: string): void {
    this.search.emit(query);
  }

  onSelect(conv: ConversationSummary): void {
    if (this.editingId()) return;
    this.selectConversation.emit(conv.conversationId);
  }

  onNewConversation(): void {
    this.newConversation.emit();
    this.close.emit();
  }

  onTogglePin(conv: ConversationSummary): void {
    this.updateConversationEvent.emit({
      conversationId: conv.conversationId,
      updates: { pinned: !conv.pinned },
    });
  }

  onToggleArchive(conv: ConversationSummary): void {
    this.updateConversationEvent.emit({
      conversationId: conv.conversationId,
      updates: { archived: !conv.archived },
    });
  }

  onRenameConfirm(event: Event, conv: ConversationSummary): void {
    const input = event.target as HTMLInputElement;
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== conv.sessionTitle) {
      this.updateConversationEvent.emit({
        conversationId: conv.conversationId,
        updates: { sessionTitle: newTitle },
      });
    }
    this.editingId.set(null);
  }

  onDelete(conv: ConversationSummary): void {
    this.deleteConversationEvent.emit(conv.conversationId);
  }

  onContextMenu(event: MouseEvent, conv: ConversationSummary): void {
    event.preventDefault();
    // Context menu actions are handled by hover buttons
  }

  formatRelativeTime(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `hace ${days}d`;
    return new Date(isoDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}
