import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatConversation, ChatMessage, UserFriend } from '../../interfaces/user.interface';
import {
  ChatConversationCreateResult,
  ChatService,
} from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { AuthActionService } from '../../services/auth-action.service';

@Component({
  selector: 'app-desktop-chat-rail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative h-full flex flex-col">
      <div class="p-4 border-b border-slate-800/70 bg-slate-950/70">
        <div class="flex items-center justify-between gap-2">
          <div>
            <p class="text-[11px] uppercase tracking-[0.18em] text-slate-500">Comunidad</p>
            <h2 class="text-sm font-semibold text-white">Chat en vivo</h2>
          </div>
          <span class="text-[11px] px-2 py-1 rounded-full border border-red-500/40 text-red-200">
            {{ connectedUsersCount }} conectados
          </span>
        </div>

        <button
          type="button"
          (click)="openGeneralConversation()"
          class="w-full mt-3 min-h-[40px] rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Entrar al chat general
        </button>
        <p
          *ngIf="chatActionError"
          class="mt-2 text-[11px] rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-100 px-2.5 py-1.5"
        >
          {{ chatActionError }}
        </p>
      </div>

      <div class="p-3 border-b border-slate-800/70 bg-slate-950/45">
        <div class="flex items-center justify-between mb-2">
          <p class="text-[11px] uppercase tracking-[0.18em] text-slate-500">Usuarios online</p>
          <span class="text-[10px] text-slate-500">{{ onlineUsers.length }} visibles</span>
        </div>

        <ul class="space-y-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar" *ngIf="onlineUsers.length; else noOnlineUsers">
          <li
            *ngFor="let user of onlineUsers.slice(0, 12); trackBy: trackByUser"
            class="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2"
          >
            <div class="flex items-center justify-between gap-2">
              <button
                type="button"
                (click)="openOrCreateConversation(user)"
                class="min-w-0 flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                [attr.aria-label]="'Abrir chat con ' + user.name"
              >
                <img [src]="user.avatar" class="h-7 w-7 rounded-lg object-cover bg-slate-800" alt="" />
                <span class="min-w-0 text-left">
                  <span class="block text-xs text-white font-medium truncate">{{ user.name }}</span>
                  <span class="block text-[10px] text-slate-400 truncate">{{ user.lastActivity }}</span>
                </span>
              </button>

              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  (click)="openProfile(user, $event)"
                  class="min-h-[32px] px-2 rounded-md border border-slate-700 text-[10px] text-slate-300 hover:text-white"
                >
                  Perfil
                </button>
                <button
                  type="button"
                  (click)="toggleFollowOnlineUser(user, $event)"
                  [attr.aria-pressed]="user.following"
                  class="min-h-[32px] px-2 rounded-md text-[10px] font-semibold"
                  [ngClass]="
                    user.following
                      ? 'border border-emerald-500/40 text-emerald-200 bg-emerald-900/20'
                      : 'border border-red-500/40 text-red-200 bg-red-900/20'
                  "
                >
                  {{ user.following ? 'Siguiendo' : 'Seguir' }}
                </button>
              </div>
            </div>
          </li>
        </ul>

        <ng-template #noOnlineUsers>
          <p class="text-xs text-slate-500 rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-2">
            No hay usuarios conectados ahora.
          </p>
        </ng-template>
      </div>

      <div class="p-3 border-b border-slate-800/70 bg-slate-950/40">
        <p class="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">Conversaciones</p>
        <div class="space-y-1 max-h-44 overflow-y-auto custom-scrollbar pr-1">
          <button
            *ngFor="let conv of conversations; trackBy: trackByConversation"
            type="button"
            (click)="selectConversation(conv)"
            class="w-full text-left rounded-lg border px-2.5 py-2 transition-colors"
            [ngClass]="
              selectedConversation?.id === conv.id
                ? 'border-red-500/50 bg-slate-900/80'
                : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/70'
            "
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs text-white font-medium truncate">{{ getConversationTitle(conv) }}</p>
              <span class="text-[10px] text-slate-500">{{ conv.lastMessage?.createdAt | date: 'shortTime' }}</span>
            </div>
            <p class="text-[11px] text-slate-400 truncate mt-0.5">
              <span *ngIf="conv.lastMessage?.senderId === currentUserId">Tú: </span>
              {{ conv.lastMessage?.text || 'Sin mensajes' }}
            </p>
          </button>
        </div>
      </div>

      <div class="flex-1 min-h-0 flex flex-col">
        <div class="px-3 py-2 border-b border-slate-800/60 bg-slate-900/40" *ngIf="selectedConversation as conv">
          <p class="text-xs text-white font-medium truncate">{{ getConversationTitle(conv) }}</p>
          <p class="text-[11px] text-slate-500">{{ getConversationStatus(conv) }}</p>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scrollbar" *ngIf="selectedConversation; else emptyConversation">
          <div
            *ngFor="let msg of messages.slice(-20); trackBy: trackByMessage"
            class="flex"
            [ngClass]="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[90%] rounded-xl border px-2.5 py-2 text-xs"
              [ngClass]="msg.senderId === currentUserId ? 'bg-red-600 text-white border-red-500/40' : 'bg-slate-800 text-slate-100 border-slate-700'"
            >
              <p class="break-words">{{ msg.text || 'Adjunto' }}</p>
              <p class="text-[10px] opacity-70 mt-1">{{ msg.createdAt | date: 'shortTime' }}</p>
            </div>
          </div>
        </div>

        <ng-template #emptyConversation>
          <div class="flex-1 flex items-center justify-center p-4 text-center text-xs text-slate-500">
            Selecciona una conversación para empezar.
          </div>
        </ng-template>

        <div class="p-3 border-t border-slate-800/70 bg-slate-900/50">
          <div class="flex items-center gap-2" *ngIf="selectedConversation; else disabledComposer">
            <input
              type="text"
              [(ngModel)]="newMessage"
              (keyup.enter)="sendMessage()"
              placeholder="Escribe un mensaje..."
              aria-label="Mensaje rápido"
              class="flex-1 min-h-[40px] rounded-lg border border-slate-800 bg-slate-950/70 px-3 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            />
            <button
              type="button"
              (click)="sendMessage()"
              [disabled]="!newMessage.trim()"
              class="min-h-[40px] px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
          <ng-template #disabledComposer>
            <p class="text-[11px] text-slate-500">Abre el chat general o una conversación para escribir.</p>
          </ng-template>
        </div>
      </div>

      <div
        *ngIf="selectedOnlineUser as profileUser"
        class="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm p-3 flex items-center justify-center"
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="desktop-profile-title"
          class="w-full rounded-xl border border-slate-700/80 bg-slate-900 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <img [src]="profileUser.avatar" class="h-12 w-12 rounded-lg object-cover bg-slate-800" alt="" />
              <div class="min-w-0">
                <h3 id="desktop-profile-title" class="text-sm font-semibold text-white truncate">{{ profileUser.name }}</h3>
                <p class="text-[11px] text-slate-400 truncate">{{ '@' }}{{ profileUser.username }}</p>
                <p class="text-[11px] mt-1" [ngClass]="profileUser.isOnline ? 'text-red-300' : 'text-slate-500'">
                  {{ profileUser.isOnline ? 'Conectado ahora' : profileUser.lastActivity }}
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="closeProfile()"
              class="min-h-[32px] min-w-[32px] rounded-lg border border-slate-700 text-slate-300 hover:text-white"
              aria-label="Cerrar perfil"
            >
              ✕
            </button>
          </div>

          <div class="mt-4 flex items-center gap-2">
            <button
              type="button"
              (click)="toggleFollowOnlineUser(profileUser)"
              class="min-h-[36px] px-3 rounded-lg text-xs font-semibold"
              [ngClass]="
                profileUser.following
                  ? 'border border-emerald-500/40 text-emerald-200 bg-emerald-900/20'
                  : 'border border-red-500/40 text-red-200 bg-red-900/20'
              "
            >
              {{ profileUser.following ? 'Siguiendo' : 'Seguir' }}
            </button>
            <button
              type="button"
              (click)="openOrCreateConversation(profileUser); closeProfile()"
              class="min-h-[36px] px-3 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white"
            >
              Abrir chat
            </button>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 5px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.14);
        border-radius: 999px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.24);
      }
    `,
  ],
})
export class DesktopChatRailComponent implements OnInit, OnDestroy {
  conversations: ChatConversation[] = [];
  onlineUsers: UserFriend[] = [];
  connectedUsersCount = 0;
  selectedConversation: ChatConversation | null = null;
  selectedOnlineUser: UserFriend | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  currentUserId: string | null = null;
  chatActionError = '';

  private sub = new Subscription();
  private messagesSub?: Subscription;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private authActionService: AuthActionService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.chatService.getConversations().subscribe((conversations) => {
        this.conversations = conversations;

        if (this.selectedConversation) {
          const refreshed =
            conversations.find((entry) => entry.id === this.selectedConversation?.id) || null;
          this.selectedConversation = refreshed;
          if (!refreshed) {
            this.messages = [];
          }
        }

        if (!this.selectedConversation) {
          const preferred = this.findGeneralConversation() || conversations[0] || null;
          if (preferred) {
            this.selectConversation(preferred);
          }
        }
      })
    );

    this.sub.add(
      this.chatService.getOnlineUsers().subscribe((users) => {
        this.onlineUsers = users;
        if (this.selectedOnlineUser) {
          this.selectedOnlineUser = users.find((entry) => entry.id === this.selectedOnlineUser?.id) || null;
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
    this.messagesSub?.unsubscribe();
    this.sub.unsubscribe();
  }

  selectConversation(conversation: ChatConversation): void {
    if (this.selectedConversation?.id === conversation.id && this.messagesSub) {
      return;
    }

    this.selectedConversation = conversation;
    this.messagesSub?.unsubscribe();
    this.messagesSub = this.chatService.getMessages(conversation.id).subscribe((messages) => {
      this.messages = messages;
      this.chatService.markConversationRead(conversation.id).subscribe();
    });
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
    const existing = this.conversations.find((conversation) => {
      if (this.isGeneralConversation(conversation)) return false;
      return conversation.participants.some((participant) => participant.id === user.id);
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

  openProfile(user: UserFriend, event?: Event): void {
    event?.stopPropagation();
    this.selectedOnlineUser = user;
  }

  closeProfile(): void {
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
    if (!this.selectedConversation || !this.newMessage.trim()) return;

    const text = this.newMessage.trim();
    this.newMessage = '';
    this.chatService.sendMessage(this.selectedConversation.id, text).subscribe();
  }

  getConversationTitle(conversation: ChatConversation): string {
    if (conversation.groupName) return conversation.groupName;
    return conversation.participants?.[0]?.name || 'Conversación';
  }

  getConversationStatus(conversation: ChatConversation): string {
    if (this.isGeneralConversation(conversation)) {
      return `${this.connectedUsersCount} conectados ahora`;
    }

    const participant = conversation.participants?.[0];
    if (!participant) return 'Sin actividad reciente';
    return participant.isOnline ? 'En línea' : participant.lastActivity;
  }

  isGeneralConversation(conversation: ChatConversation | null): boolean {
    if (!conversation) return false;
    if (conversation.groupName?.toLowerCase() === 'chat general') return true;
    return conversation.participants?.[0]?.id === 'general';
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
    return this.conversations.find((conversation) => this.isGeneralConversation(conversation)) || null;
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
}
