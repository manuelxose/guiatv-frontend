import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatConversation, ChatMessage, UserFriend } from '../../../../interfaces/user.interface';
import {
  ChatConversationCreateResult,
  ChatService,
} from '../../../../services/chat.service';
import { UserService } from '../../../../services/user.service';
import { AuthActionService } from '../../../../services/auth-action.service';

@Component({
  selector: 'app-user-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="relative w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/50 shadow-[0_20px_40px_rgba(0,0,0,0.35)] flex flex-col md:flex-row"
      [ngClass]="isMobileView ? 'h-[calc(100dvh-var(--top-bar-h,0px)-var(--bottom-nav-h,0px)-env(safe-area-inset-bottom)-1rem)] min-h-[420px] rounded-xl' : 'md:h-[78vh] min-h-[480px] max-h-[680px]'"
    >
      <aside
        class="border-b border-slate-800/80 md:border-b-0 md:border-r md:w-80 md:min-w-80 flex-col bg-slate-950/70"
        [ngClass]="isMobileView && mobilePanel === 'chat' ? 'hidden md:flex' : 'flex'"
      >
        <div class="p-4 border-b border-slate-800/80">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-white">Mensajes</h2>
            <span
              class="text-[11px] px-2 py-1 rounded-full border border-red-500/40 text-red-200"
              aria-live="polite"
            >
              {{ connectedUsersCount }} conectados
            </span>
          </div>

          <button
            type="button"
            (click)="openGeneralConversation()"
            class="mt-3 w-full min-h-[44px] px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Entrar al chat general
          </button>

          <p
            *ngIf="chatActionError"
            class="mt-2 text-[11px] rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-100 px-2.5 py-1.5"
          >
            {{ chatActionError }}
          </p>

          <div class="mt-3">
            <p class="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">Usuarios online</p>
            <ul
              *ngIf="onlineUsers.length > 0; else noOnlineUsers"
              role="list"
              class="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1"
            >
              <li
                *ngFor="let user of onlineUsers; trackBy: trackByUser"
                class="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5"
              >
                <div class="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    (click)="openOrCreateConversation(user)"
                    class="min-w-0 flex items-center gap-2 text-left rounded-lg px-1 py-1 hover:bg-slate-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    [attr.aria-label]="'Abrir chat con ' + user.name"
                  >
                    <img [src]="user.avatar" class="h-8 w-8 rounded-lg object-cover bg-slate-800" alt="" />
                    <span class="min-w-0">
                      <span class="block text-xs text-white font-medium truncate">{{ user.name }}</span>
                      <span class="block text-[11px] text-slate-400 truncate">{{ user.lastActivity }}</span>
                    </span>
                  </button>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      (click)="openOnlineProfile(user, $event)"
                      class="min-h-[36px] px-2.5 rounded-lg border border-slate-700 text-[11px] text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      Perfil
                    </button>
                    <button
                      type="button"
                      (click)="toggleFollowOnlineUser(user, $event)"
                      [attr.aria-pressed]="user.following"
                      class="min-h-[36px] px-2.5 rounded-lg text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      [ngClass]="
                        user.following
                          ? 'border border-emerald-500/40 text-emerald-200 bg-emerald-900/20 hover:bg-emerald-900/30'
                          : 'border border-red-500/40 text-red-200 bg-red-900/20 hover:bg-red-900/30'
                      "
                    >
                      {{ user.following ? 'Siguiendo' : 'Seguir' }}
                    </button>
                  </div>
                </div>
              </li>
            </ul>
            <ng-template #noOnlineUsers>
              <p class="text-xs text-slate-500 rounded-xl border border-slate-800/80 bg-slate-900/40 px-3 py-2">
                No hay usuarios conectados ahora.
              </p>
            </ng-template>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <button
            *ngFor="let conv of conversations; trackBy: trackByConversation"
            type="button"
            (click)="selectConversation(conv)"
            class="w-full text-left px-4 py-3 border-l-2 border-transparent hover:bg-slate-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            [ngClass]="selectedConversation?.id === conv.id ? 'bg-slate-900/60 border-red-500' : ''"
          >
            <div class="flex items-center gap-3">
              <div class="relative">
                <img [src]="getConversationAvatar(conv)" class="h-10 w-10 rounded-xl object-cover bg-slate-800" alt="" />
                <div
                  *ngIf="getConversationOnline(conv)"
                  class="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-red-500 border border-slate-900"
                ></div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline gap-2 mb-1">
                  <h3 class="text-sm font-semibold text-white truncate">{{ getConversationTitle(conv) }}</h3>
                  <span class="text-[11px] text-slate-500">{{ conv.lastMessage?.createdAt | date: 'shortTime' }}</span>
                </div>
                <p class="text-xs text-slate-400 truncate" [ngClass]="{ 'text-white': conv.unreadCount > 0 }">
                  <span *ngIf="conv.lastMessage?.senderId === currentUserId">Tu: </span>
                  {{ conv.lastMessage?.type === 'text' ? conv.lastMessage?.text : 'Adjunto' }}
                </p>
              </div>
              <span
                *ngIf="conv.unreadCount > 0"
                class="text-[10px] px-2 py-1 rounded-full border border-red-500/50 text-red-200"
              >
                {{ conv.unreadCount }}
              </span>
            </div>
          </button>
        </div>
      </aside>

      <section
        class="flex-1 flex-col bg-slate-950/40"
        [ngClass]="isMobileView && mobilePanel === 'list' ? 'hidden md:flex' : 'flex'"
      >
        <ng-container *ngIf="selectedConversation; else noChatSelected">
          <div class="p-4 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-slate-900/50">
            <div class="flex items-center gap-3 min-w-0">
              <button
                *ngIf="isMobileView"
                type="button"
                (click)="showConversationList()"
                class="min-h-[40px] min-w-[40px] rounded-lg border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Volver a conversaciones"
              >
                ←
              </button>
              <img [src]="getConversationAvatar(selectedConversation)" class="h-10 w-10 rounded-xl object-cover bg-slate-800" alt="" />
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-white truncate">{{ getConversationTitle(selectedConversation) }}</h3>
                <span class="text-xs" [ngClass]="getConversationOnline(selectedConversation) ? 'text-red-400' : 'text-slate-500'">
                  {{ getConversationStatus(selectedConversation) }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 custom-scrollbar">
            <div
              *ngFor="let msg of messages; trackBy: trackByMessage"
              class="flex"
              [ngClass]="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'"
            >
              <div class="max-w-[88%] md:max-w-[72%] space-y-1">
                <p
                  *ngIf="isGeneralConversation(selectedConversation) && msg.senderId !== currentUserId"
                  class="text-[11px] text-slate-500 px-1"
                >
                  Usuario {{ msg.senderId.slice(-4) }}
                </p>
                <div
                  class="p-3 rounded-2xl border"
                  [ngClass]="msg.senderId === currentUserId ? 'bg-red-600 text-white border-red-500/40' : 'bg-slate-800 text-slate-100 border-slate-700'"
                >
                  <p *ngIf="msg.type === 'text'" class="text-sm leading-relaxed break-words">{{ msg.text }}</p>
                  <div *ngIf="msg.type === 'recommendation' && msg.content" class="bg-black/20 rounded-xl p-3 mt-2">
                    <div class="flex gap-3">
                      <img [src]="msg.content.image" class="h-16 w-12 rounded-lg object-cover bg-slate-800" alt="" />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold truncate">{{ msg.content.title }}</p>
                        <p class="text-xs opacity-80">{{ msg.content.platform }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="flex items-center gap-2 text-[10px] text-slate-500"
                  [ngClass]="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'"
                >
                  <span>{{ msg.createdAt | date: 'shortTime' }}</span>
                  <span *ngIf="msg.senderId === currentUserId">{{ msg.readBy.length > 0 ? 'Leido' : 'Enviado' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="sticky bottom-0 z-10 p-3 md:p-4 bg-slate-900/70 border-t border-slate-800/80"
            [ngClass]="isMobileView ? 'pb-[calc(env(safe-area-inset-bottom)+0.75rem)]' : 'pb-[calc(env(safe-area-inset-bottom)+0.7rem)]'"
          >
            <div class="flex items-center gap-2">
              <input
                type="text"
                [(ngModel)]="newMessage"
                (ngModelChange)="onMessageDraftChange($event)"
                (input)="onTyping()"
                (keyup.enter)="sendMessage()"
                placeholder="Escribe un mensaje..."
                aria-label="Mensaje"
                class="flex-1 min-h-[44px] bg-slate-950/60 border border-slate-800 rounded-xl px-4 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              />
              <button
                type="button"
                (click)="sendMessage()"
                [disabled]="!newMessage.trim()"
                class="min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Enviar
              </button>
            </div>
          </div>
        </ng-container>

        <ng-template #noChatSelected>
          <div class="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/30">
            <h3 class="text-lg md:text-xl font-semibold text-white mb-2">Chat listo para conversar</h3>
            <p class="text-sm text-slate-400 max-w-md">
              Usa el chat general para hablar con usuarios conectados aunque no tengas amigos agregados.
            </p>
            <button
              type="button"
              (click)="openGeneralConversation()"
              class="min-h-[44px] mt-5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Abrir chat general
            </button>
          </div>
        </ng-template>
      </section>

      <div
        *ngIf="selectedOnlineUser as profileUser"
        class="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center"
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="online-profile-title"
          class="w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <img [src]="profileUser.avatar" class="h-14 w-14 rounded-xl object-cover bg-slate-800" alt="" />
              <div class="min-w-0">
                <h3 id="online-profile-title" class="text-base font-semibold text-white truncate">{{ profileUser.name }}</h3>
                <p class="text-xs text-slate-400 truncate">{{ '@' }}{{ profileUser.username }}</p>
                <p class="text-xs mt-1" [ngClass]="profileUser.isOnline ? 'text-red-300' : 'text-slate-500'">
                  {{ profileUser.isOnline ? 'Conectado ahora' : profileUser.lastActivity }}
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="closeOnlineProfile()"
              class="min-h-[36px] min-w-[36px] rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Cerrar perfil de usuario"
            >
              ✕
            </button>
          </div>

          <div class="mt-4">
            <p class="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">Géneros favoritos</p>
            <div class="flex flex-wrap gap-2" *ngIf="profileUser.favoriteGenres?.length; else emptyGenres">
              <span
                *ngFor="let genre of profileUser.favoriteGenres"
                class="text-[11px] px-2 py-1 rounded-full border border-slate-700 text-slate-200 bg-slate-950/40"
              >
                {{ genre }}
              </span>
            </div>
            <ng-template #emptyGenres>
              <p class="text-xs text-slate-500">Sin géneros destacados.</p>
            </ng-template>
          </div>

          <p class="mt-4 text-xs text-slate-400">
            Si ambos os seguís mutuamente, aparecerá como amigo en tu red social.
          </p>

          <div class="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              (click)="toggleFollowOnlineUser(profileUser)"
              class="min-h-[40px] px-4 rounded-lg text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              [ngClass]="
                profileUser.following
                  ? 'border border-emerald-500/40 text-emerald-200 bg-emerald-900/20 hover:bg-emerald-900/30'
                  : 'border border-red-500/40 text-red-200 bg-red-900/20 hover:bg-red-900/30'
              "
            >
              {{ profileUser.following ? 'Siguiendo' : 'Seguir' }}
            </button>
            <button
              type="button"
              (click)="openOrCreateConversation(profileUser); closeOnlineProfile()"
              class="min-h-[40px] px-4 rounded-lg border border-slate-700 text-sm text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Abrir chat
            </button>
            <button
              type="button"
              (click)="closeOnlineProfile()"
              class="min-h-[40px] px-4 rounded-lg border border-slate-800 text-sm text-slate-400 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Cerrar
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
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    `,
  ],
})
export class UserChatComponent implements OnInit, OnDestroy {
  conversations: ChatConversation[] = [];
  onlineUsers: UserFriend[] = [];
  connectedUsersCount = 0;
  selectedOnlineUser: UserFriend | null = null;
  selectedConversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  currentUserId: string | null = null;
  isMobileView = false;
  mobilePanel: 'list' | 'chat' = 'list';
  chatActionError = '';

  private sub = new Subscription();
  private messagesSub?: Subscription;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly draftsByConversation = new Map<string, string>();

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private authActionService: AuthActionService
  ) {}

  ngOnInit(): void {
    this.updateViewportState();

    this.sub.add(
      this.chatService.getConversations().subscribe((convs) => {
        this.conversations = convs;

        if (this.selectedConversation) {
          const refreshed = convs.find((conv) => conv.id === this.selectedConversation?.id) || null;
          this.selectedConversation = refreshed;
          if (!refreshed) {
            this.messages = [];
          }
        }

        if (!this.selectedConversation) {
          const preferred = this.findGeneralConversation() || convs[0] || null;
          if (preferred) {
            this.selectConversation(preferred);
          } else if (this.isMobileView) {
            this.mobilePanel = 'list';
          }
        }
      })
    );

    this.sub.add(
      this.chatService.getOnlineUsers().subscribe((users) => {
        this.onlineUsers = users;
        if (this.selectedOnlineUser) {
          this.selectedOnlineUser =
            users.find((user) => user.id === this.selectedOnlineUser?.id) || null;
        }
      })
    );

    this.sub.add(
      this.chatService.getConnectedUsersCount().subscribe((count) => {
        this.connectedUsersCount = count;
      })
    );

    this.sub.add(
      this.userService.getProfile().subscribe((profile) => {
        this.currentUserId = profile?.id || null;
      })
    );

    this.chatService.refreshConversations().subscribe();
    this.chatService.refreshOnlineUsers().subscribe();
  }

  ngOnDestroy(): void {
    if (this.selectedConversation) {
      this.chatService.sendTyping(this.selectedConversation.id, false);
    }
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    this.messagesSub?.unsubscribe();
    this.sub.unsubscribe();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportState();
  }

  selectConversation(conv: ChatConversation): void {
    this.chatActionError = '';
    if (this.selectedConversation?.id === conv.id && this.messagesSub) {
      if (this.isMobileView) {
        this.mobilePanel = 'chat';
      }
      return;
    }

    this.selectedConversation = conv;
    this.newMessage = this.draftsByConversation.get(conv.id) || '';
    this.messagesSub?.unsubscribe();
    this.messagesSub = this.chatService.getMessages(conv.id).subscribe((msgs) => {
      this.messages = msgs;
      this.chatService.markConversationRead(conv.id).subscribe();
    });

    if (this.isMobileView) {
      this.mobilePanel = 'chat';
    }
  }

  showConversationList(): void {
    this.mobilePanel = 'list';
  }

  openGeneralConversation(): void {
    this.chatActionError = '';
    const general = this.findGeneralConversation();
    if (general) {
      this.selectConversation(general);
      return;
    }
    this.chatActionError = 'No se pudo abrir el chat general en este momento.';
  }

  openOrCreateConversation(user: UserFriend): void {
    this.chatActionError = '';
    const existing = this.conversations.find((conv) => {
      if (this.isGeneralConversation(conv)) return false;
      return conv.participants.some((participant) => participant.id === user.id);
    });

    if (existing) {
      this.selectConversation(existing);
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
      this.selectConversation(result.conversation);
    });
  }

  openOnlineProfile(user: UserFriend, event?: Event): void {
    event?.stopPropagation();
    this.selectedOnlineUser = user;
  }

  closeOnlineProfile(): void {
    this.selectedOnlineUser = null;
  }

  toggleFollowOnlineUser(user: UserFriend, event?: Event): void {
    event?.stopPropagation();
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
        this.selectedOnlineUser = {
          ...this.selectedOnlineUser,
          following,
        };
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    const text = this.newMessage.trim();
    const conversationId = this.selectedConversation.id;
    this.newMessage = '';
    this.draftsByConversation.delete(conversationId);

    this.chatService.sendMessage(conversationId, text).subscribe();
  }

  onTyping(): void {
    if (!this.selectedConversation) return;
    this.draftsByConversation.set(this.selectedConversation.id, this.newMessage);
    this.chatService.sendTyping(this.selectedConversation.id, true);

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    this.typingTimer = setTimeout(() => {
      if (!this.selectedConversation) return;
      this.chatService.sendTyping(this.selectedConversation.id, false);
    }, 1200);
  }

  onMessageDraftChange(value: string): void {
    if (!this.selectedConversation) return;
    this.newMessage = value;
    this.draftsByConversation.set(this.selectedConversation.id, value);
  }

  getConversationTitle(conversation: ChatConversation | null): string {
    if (!conversation) return 'Conversacion';
    if (conversation.groupName) return conversation.groupName;
    return conversation.participants?.[0]?.name || 'Conversacion';
  }

  getConversationAvatar(conversation: ChatConversation | null): string {
    if (!conversation) return '/assets/gpt-avatar.png';
    return conversation.groupAvatar || conversation.participants?.[0]?.avatar || '/assets/gpt-avatar.png';
  }

  getConversationOnline(conversation: ChatConversation | null): boolean {
    if (!conversation) return false;
    if (this.isGeneralConversation(conversation)) return true;
    return Boolean(conversation.participants?.[0]?.isOnline);
  }

  getConversationStatus(conversation: ChatConversation | null): string {
    if (!conversation) return '';
    if (this.isGeneralConversation(conversation)) {
      return `${this.connectedUsersCount} conectados ahora`;
    }

    const participant = conversation.participants?.[0];
    if (!participant) return 'Sin actividad reciente';
    return participant.isOnline ? 'En linea' : participant.lastActivity;
  }

  isGeneralConversation(conversation: ChatConversation | null): boolean {
    if (!conversation) return false;
    if (conversation.groupName?.toLowerCase() === 'chat general') return true;
    return conversation.participants?.[0]?.id === 'general';
  }

  trackByConversation(index: number, conv: ChatConversation): string {
    return conv.id || String(index);
  }

  trackByUser(index: number, user: UserFriend): string {
    return user.id || String(index);
  }

  trackByMessage(index: number, message: ChatMessage): string {
    return message.id || String(index);
  }

  private findGeneralConversation(): ChatConversation | null {
    return this.conversations.find((conv) => this.isGeneralConversation(conv)) || null;
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

  private updateViewportState(): void {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const wasMobile = this.isMobileView;
    this.isMobileView = width < 768;

    if (this.isMobileView) {
      this.mobilePanel = this.selectedConversation ? 'chat' : 'list';
      return;
    }

    if (wasMobile && !this.isMobileView) {
      this.mobilePanel = 'chat';
      if (!this.selectedConversation) {
        const preferred = this.findGeneralConversation() || this.conversations[0] || null;
        if (preferred) {
          this.selectConversation(preferred);
        }
      }
    }
  }
}
