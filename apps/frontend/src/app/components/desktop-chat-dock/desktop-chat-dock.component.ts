import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import {
  ChatConversation,
  ChatMessage,
  UserFriend,
} from '../../interfaces/user.interface';
import { AuthActionService } from '../../services/auth-action.service';
import {
  ChatConversationCreateResult,
  ChatService,
} from '../../services/chat.service';
import { UserService } from '../../services/user.service';

interface ChatWindowState {
  conversationId: string;
  minimized: boolean;
  draft: string;
  messages: ChatMessage[];
}

@Component({
  selector: 'app-desktop-chat-dock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="isAuthenticated && !isHiddenByRoute"
      class="hidden transition-opacity duration-200 lg:block"
      [class.invisible]="suspended"
      [class.opacity-0]="suspended"
      [class.pointer-events-none]="suspended"
      [attr.aria-hidden]="suspended ? 'true' : null"
    >
      <section
        *ngFor="let window of windows; let i = index; trackBy: trackByWindow"
        class="fixed bottom-3 w-80 rounded-t-xl border border-slate-700/90 bg-slate-950/95 shadow-[0_20px_48px_rgba(0,0,0,0.48)] backdrop-blur-md"
        [style.right.px]="getWindowRightOffset(i)"
        [style.z-index]="90 + i"
        [ngClass]="window.minimized ? 'h-12' : 'h-[430px]'"
      >
        <header class="h-12 border-b border-slate-800/80 px-3 flex items-center justify-between gap-2">
          <button
            type="button"
            class="min-w-0 flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            (click)="toggleWindowMinimized(window.conversationId)"
            [attr.aria-label]="'Alternar ventana de ' + getWindowTitle(window.conversationId)"
          >
            <span
              class="h-2.5 w-2.5 rounded-full"
              [ngClass]="isGeneralConversationId(window.conversationId) ? 'bg-red-400' : getConversationPrimaryParticipant(window.conversationId)?.isOnline ? 'bg-emerald-400' : 'bg-slate-500'"
            ></span>
            <span class="truncate text-xs font-semibold text-white">{{ getWindowTitle(window.conversationId) }}</span>
          </button>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="h-7 w-7 rounded-md border border-slate-700 text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              (click)="toggleWindowMinimized(window.conversationId)"
              [attr.aria-label]="window.minimized ? 'Expandir chat' : 'Minimizar chat'"
            >
              {{ window.minimized ? '▢' : '—' }}
            </button>
            <button
              type="button"
              class="h-7 w-7 rounded-md border border-slate-700 text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              (click)="closeWindow(window.conversationId)"
              aria-label="Cerrar chat"
            >
              ✕
            </button>
          </div>
        </header>

        <div *ngIf="!window.minimized" class="h-[calc(100%-3rem)] flex flex-col">
          <div class="px-3 py-2 border-b border-slate-800/70 bg-slate-900/40">
            <p class="text-[11px] text-slate-400">
              {{ getConversationStatusById(window.conversationId) }}
            </p>
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2 custom-scrollbar">
            <div
              *ngFor="let message of window.messages.slice(-35); trackBy: trackByMessage"
              class="flex"
              [ngClass]="message.senderId === currentUserId ? 'justify-end' : 'justify-start'"
            >
              <article
                class="max-w-[86%] rounded-xl px-2.5 py-2 text-xs border"
                [ngClass]="message.senderId === currentUserId ? 'bg-red-600 border-red-500/50 text-white' : 'bg-slate-800 border-slate-700 text-slate-100'"
              >
                <p class="break-words leading-relaxed">{{ message.text || 'Adjunto' }}</p>
                <p class="mt-1 text-[10px] opacity-70">{{ message.createdAt | date: 'shortTime' }}</p>
              </article>
            </div>

            <p
              *ngIf="!window.messages.length"
              class="text-center text-xs text-slate-500 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2"
            >
              Todavía no hay mensajes en esta conversación.
            </p>
          </div>

          <footer class="border-t border-slate-800/70 p-2.5 bg-slate-900/45">
            <div class="flex items-center gap-2">
              <textarea
                rows="1"
                [name]="'chat-window-' + window.conversationId"
                [(ngModel)]="window.draft"
                (keydown.enter)="onComposerEnter($event, window)"
                placeholder="Escribe un mensaje..."
                class="flex-1 min-h-[40px] max-h-24 resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                [attr.aria-label]="'Escribir a ' + getWindowTitle(window.conversationId)"
              ></textarea>
              <button
                type="button"
                class="min-h-[40px] px-3 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white disabled:opacity-50"
                [disabled]="!window.draft.trim()"
                (click)="sendWindowMessage(window)"
              >
                Enviar
              </button>
            </div>
          </footer>
        </div>
      </section>

      <aside
        *ngIf="isDockOpen"
        class="fixed bottom-16 right-4 z-[80] w-80 h-[520px] rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-[0_24px_56px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        <header class="px-4 py-3 border-b border-slate-800/70 bg-slate-900/60 rounded-t-2xl">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-[11px] uppercase tracking-[0.18em] text-slate-500">Comunidad</p>
              <h2 class="text-sm font-semibold text-white">Mensajes</h2>
            </div>
            <button
              type="button"
              class="h-8 w-8 rounded-lg border border-slate-700 text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              (click)="toggleDock()"
              aria-label="Cerrar panel de chat"
            >
              ✕
            </button>
          </div>

          <div class="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              class="flex-1 min-h-[40px] rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              (click)="openGeneralConversation()"
            >
              Abrir chat general
            </button>
            <span class="text-[11px] px-2.5 py-1 rounded-full border border-red-500/40 text-red-200 whitespace-nowrap">
              {{ connectedUsersCount }} conectados
            </span>
          </div>
          <p
            *ngIf="chatActionError"
            class="mt-2 text-[11px] rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-100 px-2.5 py-1.5"
          >
            {{ chatActionError }}
          </p>
        </header>

        <div class="h-[calc(100%-6.75rem)] overflow-y-auto custom-scrollbar">
          <section class="px-4 py-3 border-b border-slate-800/70">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[11px] uppercase tracking-[0.18em] text-slate-500">Conversaciones</p>
              <span class="text-[10px] text-slate-500">{{ conversations.length }}</span>
            </div>

            <div *ngIf="isLoadingConversations" class="space-y-2">
              <div
                *ngFor="let i of [1, 2, 3]"
                class="h-14 rounded-lg border border-slate-800/80 bg-slate-900/45 animate-pulse"
              ></div>
            </div>

            <div class="space-y-1" *ngIf="!isLoadingConversations && conversations.length; else noConversations">
              <button
                type="button"
                *ngFor="let conversation of conversations; trackBy: trackByConversation"
                class="w-full rounded-lg border border-slate-800/80 bg-slate-900/45 hover:bg-slate-900/75 px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                (click)="openConversationWindow(conversation)"
              >
                <div class="flex items-center justify-between gap-2">
                  <p class="text-xs text-white font-medium truncate">{{ getConversationTitle(conversation) }}</p>
                  <span
                    *ngIf="conversation.unreadCount"
                    class="min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] inline-flex items-center justify-center"
                  >
                    {{ conversation.unreadCount }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 truncate mt-0.5">
                  <span *ngIf="conversation.lastMessage?.senderId === currentUserId">Tú: </span>
                  {{ conversation.lastMessage?.text || 'Sin mensajes aún' }}
                </p>
              </button>
            </div>

            <ng-template #noConversations>
              <p
                *ngIf="!isLoadingConversations"
                class="text-xs text-slate-500 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2"
              >
                No hay conversaciones todavía.
              </p>
            </ng-template>
          </section>

          <section class="px-4 py-3">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[11px] uppercase tracking-[0.18em] text-slate-500">Usuarios conectados</p>
              <span class="text-[10px] text-slate-500">{{ onlineUsers.length }} visibles</span>
            </div>

            <div *ngIf="isLoadingOnlineUsers" class="space-y-2">
              <div
                *ngFor="let i of [1, 2, 3, 4]"
                class="h-20 rounded-lg border border-slate-800/80 bg-slate-900/45 animate-pulse"
              ></div>
            </div>

            <div class="space-y-1.5" *ngIf="!isLoadingOnlineUsers && onlineUsers.length; else noUsersOnline">
              <article
                *ngFor="let user of onlineUsers.slice(0, 14); trackBy: trackByUser"
                class="rounded-lg border border-slate-800/80 bg-slate-900/45 px-2.5 py-2"
              >
                <div class="flex items-center gap-2">
                  <img [src]="user.avatar" class="h-8 w-8 rounded-lg object-cover bg-slate-800" alt="" />
                  <button
                    type="button"
                    class="min-w-0 flex-1 text-left"
                    (click)="openProfile(user)"
                  >
                    <p class="text-xs text-white font-medium truncate">{{ user.name }}</p>
                    <p class="text-[10px] text-slate-400 truncate">{{ user.lastActivity }}</p>
                  </button>
                </div>

                <div class="mt-2 grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    class="min-h-[34px] rounded-md border border-slate-700 text-[10px] text-slate-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    (click)="openProfile(user)"
                  >
                    Perfil
                  </button>
                  <button
                    type="button"
                    class="min-h-[34px] rounded-md border border-red-500/40 bg-red-900/20 text-[10px] text-red-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    (click)="openOrCreateConversation(user)"
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    class="min-h-[34px] rounded-md text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    [ngClass]="
                      user.following
                        ? 'border border-emerald-500/40 bg-emerald-900/20 text-emerald-200'
                        : 'border border-slate-700 bg-slate-900/40 text-slate-200'
                    "
                    [attr.aria-pressed]="user.following"
                    (click)="toggleFollowOnlineUser(user)"
                  >
                    {{ user.following ? 'Siguiendo' : 'Seguir' }}
                  </button>
                </div>
              </article>
            </div>

            <ng-template #noUsersOnline>
              <p
                *ngIf="!isLoadingOnlineUsers"
                class="text-xs text-slate-500 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2"
              >
                No hay usuarios conectados ahora.
              </p>
            </ng-template>
          </section>
        </div>
      </aside>

      <button
        type="button"
        class="fixed bottom-4 right-4 z-[81] min-h-[46px] px-4 rounded-full border border-red-500/60 bg-slate-950/95 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,0,0,0.45)] hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        [attr.aria-expanded]="isDockOpen"
        (click)="toggleDock()"
      >
        <span class="inline-flex items-center gap-2">
          <span class="relative flex h-2.5 w-2.5">
            <span class="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          Chat
          <span class="text-red-200">{{ connectedUsersCount }}</span>
          <span class="text-slate-300">{{ isDockOpen ? '▼' : '▲' }}</span>
        </span>
      </button>

      <div
        *ngIf="selectedOnlineUser as profileUser"
        class="fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        (click)="closeProfile()"
        (keydown.escape)="closeProfile()"
        tabindex="-1"
      >
        <section
          class="w-full max-w-sm rounded-2xl border border-slate-700/80 bg-slate-900 p-4 shadow-[0_22px_50px_rgba(0,0,0,0.45)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="desktop-chat-profile-title"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <img [src]="profileUser.avatar" class="h-12 w-12 rounded-xl object-cover bg-slate-800" alt="" />
              <div class="min-w-0">
                <h3 id="desktop-chat-profile-title" class="text-sm font-semibold text-white truncate">{{ profileUser.name }}</h3>
                <p class="text-[11px] text-slate-400 truncate">{{ '@' }}{{ profileUser.username }}</p>
                <p class="text-[11px] mt-1" [ngClass]="profileUser.isOnline ? 'text-emerald-300' : 'text-slate-500'">
                  {{ profileUser.isOnline ? 'Conectado ahora' : profileUser.lastActivity }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="h-8 w-8 rounded-lg border border-slate-700 text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              (click)="closeProfile()"
              aria-label="Cerrar perfil"
            >
              ✕
            </button>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              class="min-h-[38px] rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              (click)="closeProfile()"
            >
              Cerrar
            </button>
            <button
              type="button"
              class="min-h-[38px] rounded-lg border border-red-500/40 bg-red-900/20 text-xs text-red-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              (click)="openOrCreateConversation(profileUser); closeProfile()"
            >
              Abrir chat
            </button>
            <button
              type="button"
              class="min-h-[38px] rounded-lg text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              [ngClass]="
                profileUser.following
                  ? 'border border-emerald-500/40 bg-emerald-900/20 text-emerald-200'
                  : 'border border-slate-700 bg-slate-900/40 text-slate-200'
              "
              [attr.aria-pressed]="profileUser.following"
              (click)="toggleFollowOnlineUser(profileUser)"
            >
              {{ profileUser.following ? 'Siguiendo' : 'Seguir' }}
            </button>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }

      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(15, 23, 42, 0.55);
      }

      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.35);
        border-radius: 999px;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(148, 163, 184, 0.55);
      }
    `,
  ],
})
export class DesktopChatDockComponent implements OnInit, OnDestroy {
  @Input() suspended = false;

  conversations: ChatConversation[] = [];
  onlineUsers: UserFriend[] = [];
  connectedUsersCount = 0;
  currentUserId: string | null = null;
  selectedOnlineUser: UserFriend | null = null;

  isAuthenticated = false;
  isDockOpen = false;
  isHiddenByRoute = false;
  isLoadingConversations = false;
  isLoadingOnlineUsers = false;
  chatActionError = '';

  readonly windows: ChatWindowState[] = [];

  private readonly maxWindows = 2;
  private readonly sub = new Subscription();
  private readonly messageSubs = new Map<string, Subscription>();

  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly authActionService: AuthActionService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.updateRouteVisibility(this.router.url);

    this.sub.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe((event) => {
          const navEnd = event as NavigationEnd;
          this.updateRouteVisibility(navEnd.urlAfterRedirects || navEnd.url);
        })
    );

    this.sub.add(
      this.userService.isAuthenticated$.subscribe((isAuthenticated) => {
        this.isAuthenticated = Boolean(isAuthenticated);
        if (!this.isAuthenticated) {
          this.isDockOpen = false;
          this.onlineUsers = [];
          this.conversations = [];
          this.connectedUsersCount = 0;
          this.chatActionError = '';
          this.isLoadingConversations = false;
          this.isLoadingOnlineUsers = false;
          this.closeAllWindows();
          return;
        }

        this.refreshDockData();
      })
    );

    this.sub.add(
      this.userService.getProfile().subscribe((profile) => {
        this.currentUserId = profile?.id || null;
      })
    );

    this.sub.add(
      this.chatService.getConversations().subscribe((conversations) => {
        this.conversations = conversations;

        const validConversationIds = new Set(conversations.map((conversation) => conversation.id));
        const staleWindows = this.windows
          .map((window) => window.conversationId)
          .filter((conversationId) => !validConversationIds.has(conversationId));

        staleWindows.forEach((conversationId) => this.closeWindow(conversationId));
      })
    );

    this.sub.add(
      this.chatService.getOnlineUsers().subscribe((users) => {
        this.onlineUsers = users;
        if (this.selectedOnlineUser) {
          this.selectedOnlineUser =
            users.find((entry) => entry.id === this.selectedOnlineUser?.id) || null;
        }
      })
    );

    this.sub.add(
      this.chatService.getConnectedUsersCount().subscribe((count) => {
        this.connectedUsersCount = Number.isFinite(count) && count >= 0 ? count : 0;
      })
    );
  }

  ngOnDestroy(): void {
    this.closeAllWindows();
    this.sub.unsubscribe();
  }

  toggleDock(): void {
    this.isDockOpen = !this.isDockOpen;
    this.chatActionError = '';
    if (this.isDockOpen) {
      this.refreshDockData();
    }
  }

  openGeneralConversation(): void {
    this.chatActionError = '';
    const general = this.findGeneralConversation();
    if (general) {
      this.openConversationWindow(general);
      return;
    }

    this.chatService.refreshConversations().subscribe((conversations) => {
      this.conversations = conversations;
      const resolvedGeneral = this.findGeneralConversation();
      if (resolvedGeneral) {
        this.openConversationWindow(resolvedGeneral);
        return;
      }
      this.chatActionError = 'No se pudo abrir el chat general en este momento.';
    });
  }

  openOrCreateConversation(user: UserFriend): void {
    this.chatActionError = '';
    const existing = this.findConversationByUser(user.id);
    if (existing) {
      this.openConversationWindow(existing);
      return;
    }

    this.chatService.createConversation(user.id).subscribe((result) => {
      if (!result.ok || !result.conversation) {
        this.chatActionError = this.resolveCreateConversationErrorMessage(
          result,
          user
        );
        return;
      }

      this.openConversationWindow(result.conversation);
      this.chatService.refreshConversations().subscribe();
    });
  }

  openConversationWindow(conversation: ChatConversation): void {
    this.isDockOpen = false;

    const existingIndex = this.windows.findIndex(
      (window) => window.conversationId === conversation.id
    );

    if (existingIndex >= 0) {
      this.windows[existingIndex] = {
        ...this.windows[existingIndex],
        minimized: false,
      };
      this.bringWindowToFront(conversation.id);
      this.chatService.markConversationRead(conversation.id).subscribe();
      return;
    }

    if (this.windows.length >= this.maxWindows) {
      const oldest = this.windows[0];
      if (oldest) {
        this.closeWindow(oldest.conversationId);
      }
    }

    this.windows.push({
      conversationId: conversation.id,
      minimized: false,
      draft: '',
      messages: [],
    });

    const messagesSub = this.chatService
      .getMessages(conversation.id)
      .subscribe((messages) => {
        const index = this.windows.findIndex(
          (window) => window.conversationId === conversation.id
        );
        if (index < 0) return;

        this.windows[index] = {
          ...this.windows[index],
          messages,
        };

        if (!this.windows[index].minimized) {
          this.chatService.markConversationRead(conversation.id).subscribe();
        }
      });

    this.messageSubs.set(conversation.id, messagesSub);
    this.bringWindowToFront(conversation.id);
  }

  toggleWindowMinimized(conversationId: string): void {
    const index = this.windows.findIndex(
      (window) => window.conversationId === conversationId
    );
    if (index < 0) return;

    const nextMinimized = !this.windows[index].minimized;
    this.windows[index] = {
      ...this.windows[index],
      minimized: nextMinimized,
    };

    this.bringWindowToFront(conversationId);

    if (!nextMinimized) {
      this.chatService.markConversationRead(conversationId).subscribe();
    }
  }

  closeWindow(conversationId: string): void {
    const sub = this.messageSubs.get(conversationId);
    sub?.unsubscribe();
    this.messageSubs.delete(conversationId);

    const index = this.windows.findIndex(
      (window) => window.conversationId === conversationId
    );
    if (index < 0) return;
    this.windows.splice(index, 1);
  }

  sendWindowMessage(window: ChatWindowState): void {
    const text = String(window.draft || '').trim();
    if (!text) return;

    window.draft = '';
    this.chatService.sendMessage(window.conversationId, text).subscribe();
  }

  onComposerEnter(event: Event, window: ChatWindowState): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendWindowMessage(window);
    }
  }

  openProfile(user: UserFriend): void {
    this.selectedOnlineUser = user;
  }

  closeProfile(): void {
    this.selectedOnlineUser = null;
  }

  toggleFollowOnlineUser(user: UserFriend): void {
    this.authActionService.toggleFollow(user.id).subscribe((following) => {
      if (typeof following !== 'boolean') return;

      this.onlineUsers = this.onlineUsers.map((entry) =>
        entry.id === user.id ? { ...entry, following } : entry
      );

      this.conversations = this.conversations.map((conversation) => ({
        ...conversation,
        participants: conversation.participants.map((participant) =>
          participant.id === user.id ? { ...participant, following } : participant
        ),
      }));

      if (this.selectedOnlineUser?.id === user.id) {
        this.selectedOnlineUser = { ...this.selectedOnlineUser, following };
      }
    });
  }

  getWindowRightOffset(windowIndex: number): number {
    const baseOffset = 352;
    const gap = 332;
    return baseOffset + windowIndex * gap;
  }

  getWindowTitle(conversationId: string): string {
    const conversation = this.findConversationById(conversationId);
    if (!conversation) return 'Conversación';
    return this.getConversationTitle(conversation);
  }

  getConversationTitle(conversation: ChatConversation): string {
    if (conversation.groupName) return conversation.groupName;
    return conversation.participants?.[0]?.name || 'Conversación';
  }

  getConversationStatusById(conversationId: string): string {
    const conversation = this.findConversationById(conversationId);
    if (!conversation) return 'Sin actividad reciente';

    if (this.isGeneralConversation(conversation)) {
      return `${this.connectedUsersCount} conectados ahora`;
    }

    const participant = conversation.participants?.[0];
    if (!participant) return 'Sin actividad reciente';
    return participant.isOnline ? 'En línea' : participant.lastActivity;
  }

  getConversationPrimaryParticipant(
    conversationId: string
  ): UserFriend | undefined {
    const conversation = this.findConversationById(conversationId);
    if (!conversation || this.isGeneralConversation(conversation)) {
      return undefined;
    }
    return conversation.participants?.[0];
  }

  isGeneralConversationId(conversationId: string): boolean {
    const conversation = this.findConversationById(conversationId);
    return this.isGeneralConversation(conversation || null);
  }

  isGeneralConversation(conversation: ChatConversation | null): boolean {
    if (!conversation) return false;
    if (conversation.groupName?.toLowerCase() === 'chat general') return true;
    return conversation.participants?.[0]?.id === 'general';
  }

  trackByWindow(index: number, window: ChatWindowState): string {
    return window.conversationId || String(index);
  }

  trackByConversation(index: number, conversation: ChatConversation): string {
    return conversation.id || String(index);
  }

  trackByUser(index: number, user: UserFriend): string {
    return user.id || String(index);
  }

  trackByMessage(index: number, message: ChatMessage): string {
    return message.id || String(index);
  }

  private findGeneralConversation(): ChatConversation | null {
    return (
      this.conversations.find((conversation) =>
        this.isGeneralConversation(conversation)
      ) || null
    );
  }

  private findConversationById(conversationId: string): ChatConversation | null {
    return (
      this.conversations.find((conversation) => conversation.id === conversationId) ||
      null
    );
  }

  private findConversationByUser(userId: string): ChatConversation | null {
    return (
      this.conversations.find((conversation) => {
        if (this.isGeneralConversation(conversation)) return false;
        return conversation.participants.some(
          (participant) => participant.id === userId
        );
      }) || null
    );
  }

  private bringWindowToFront(conversationId: string): void {
    const index = this.windows.findIndex(
      (window) => window.conversationId === conversationId
    );
    if (index < 0 || index === this.windows.length - 1) return;

    const [window] = this.windows.splice(index, 1);
    if (window) {
      this.windows.push(window);
    }
  }

  private closeAllWindows(): void {
    this.messageSubs.forEach((sub) => sub.unsubscribe());
    this.messageSubs.clear();
    this.windows.splice(0, this.windows.length);
  }

  private refreshDockData(): void {
    this.isLoadingConversations = true;
    this.isLoadingOnlineUsers = true;

    this.chatService.refreshConversations().subscribe(() => {
      this.isLoadingConversations = false;
    });

    this.chatService.refreshOnlineUsers().subscribe(() => {
      this.isLoadingOnlineUsers = false;
    });
  }

  private resolveCreateConversationErrorMessage(
    result: ChatConversationCreateResult,
    user: UserFriend
  ): string {
    if (result.reason === 'unauthorized') {
      return 'Necesitas iniciar sesión para abrir un chat.';
    }

    if (result.reason === 'not_found') {
      return `No se pudo abrir el chat con ${user.name} porque ya no está disponible.`;
    }

    if (result.reason === 'blocked') {
      return `No puedes abrir chat con ${user.name} por reglas de bloqueo o privacidad.`;
    }

    if (result.reason === 'forbidden') {
      return `No tienes permiso para iniciar chat con ${user.name}.`;
    }

    return result.message || `No se pudo abrir el chat con ${user.name}.`;
  }

  private updateRouteVisibility(url: string): void {
    const path = String(url || '').split('?')[0];
    this.isHiddenByRoute =
      path.startsWith('/admin') ||
      path.startsWith('/editorial') ||
      path.startsWith('/blog') ||
      path.startsWith('/iniciar-sesion') ||
      path.startsWith('/registro') ||
      path.startsWith('/mi-cuenta') ||
      path.startsWith('/comunidad');

    if (this.isHiddenByRoute) {
      this.isDockOpen = false;
      this.selectedOnlineUser = null;
      this.closeAllWindows();
    }
  }
}
