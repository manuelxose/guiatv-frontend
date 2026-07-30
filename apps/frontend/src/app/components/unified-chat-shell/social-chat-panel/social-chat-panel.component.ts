import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  ChatConversation,
  ChatMessage as SocialChatMessage,
  UserFriend,
} from '../../../interfaces/user.interface';
import { ChatService } from '../../../services/chat.service';
import { UserService } from '../../../services/user.service';

interface ChatWindowState {
  conversationId: string;
  draft: string;
  messages: SocialChatMessage[];
}

@Component({
  selector: 'app-social-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Active conversation view -->
    <ng-container *ngIf="activeWindow; else listView">
      <div class="flex h-full flex-col">
        <!-- Conversation header -->
        <div class="flex items-center gap-2 border-b border-slate-800/70 px-4 py-2.5">
          <button
            type="button"
            (click)="closeActiveWindow()"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-white">{{ getWindowTitle(activeWindow.conversationId) }}</p>
            <p class="text-[10px] text-slate-400">{{ getConversationStatus(activeWindow.conversationId) }}</p>
          </div>
        </div>

        <!-- Messages -->
        <div class="flex-1 overflow-y-auto px-4 py-3 space-y-2 [overscroll-behavior-y:contain]">
          <div
            *ngFor="let msg of activeWindow.messages.slice(-50); trackBy: trackByMessage"
            class="flex"
            [ngClass]="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[85%] rounded-2xl px-3 py-2 text-xs"
              [ngClass]="msg.senderId === currentUserId
                ? 'bg-red-600 text-white'
                : 'border border-slate-800 bg-slate-900 text-slate-100'"
            >
              <p *ngIf="msg.senderId !== currentUserId && isGroupConversation(activeWindow.conversationId)"
                 class="mb-0.5 text-[10px] font-semibold text-red-300">{{ getSenderName(msg.senderId) }}</p>
              <p class="break-words leading-relaxed">{{ msg.text || 'Adjunto' }}</p>
              <p class="mt-1 text-[10px] opacity-60">{{ msg.createdAt | date: 'shortTime' }}</p>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="border-t border-slate-800/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div class="flex items-center gap-2">
            <input
              type="text"
              [(ngModel)]="activeWindow.draft"
              (keydown.enter)="sendMessage()"
              placeholder="Escribe un mensaje..."
              class="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30"
            />
            <button
              type="button"
              (click)="sendMessage()"
              [disabled]="!activeWindow.draft?.trim()"
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white transition-colors hover:bg-red-500 disabled:opacity-40"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- Conversations/users list view -->
    <ng-template #listView>
      <div class="flex h-full flex-col overflow-y-auto">
        <!-- General chat button -->
        <div class="px-4 pt-4 pb-2">
          <button
            type="button"
            (click)="openGeneralChat()"
            class="flex w-full items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left transition-colors hover:bg-red-500/20"
          >
            <span class="relative flex h-3 w-3">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
            <span class="flex-1 text-sm font-semibold text-white">Chat general</span>
            <span class="text-xs text-red-300">{{ connectedUsersCount }} online</span>
          </button>
        </div>

        <!-- Conversations -->
        <div class="px-4 pt-2 pb-1">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Conversaciones</p>
        </div>

        <div *ngIf="isLoadingConversations" class="space-y-2 px-4">
          <div *ngFor="let i of [1,2,3]" class="h-14 animate-pulse rounded-xl border border-slate-800 bg-slate-900/40"></div>
        </div>

        <div *ngIf="!isLoadingConversations && conversations.length" class="space-y-1 px-4">
          <button
            type="button"
            *ngFor="let conv of conversations; trackBy: trackByConversation"
            class="w-full rounded-xl border border-slate-800/70 bg-slate-900/40 px-3 py-2.5 text-left transition-colors hover:bg-slate-800/60"
            (click)="openConversation(conv)"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="truncate text-xs font-medium text-white">{{ getConversationTitle(conv) }}</p>
              <span
                *ngIf="conv.unreadCount"
                class="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white"
              >{{ conv.unreadCount }}</span>
            </div>
            <p class="mt-0.5 truncate text-[11px] text-slate-400">
              <span *ngIf="conv.lastMessage?.senderId === currentUserId">Tú: </span>
              {{ conv.lastMessage?.text || 'Sin mensajes' }}
            </p>
          </button>
        </div>

        <p *ngIf="!isLoadingConversations && !conversations.length"
           class="mx-4 mt-1 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-500">
          No hay conversaciones.
        </p>

        <!-- Online users -->
        <div class="px-4 pt-4 pb-1 flex items-center justify-between">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Conectados</p>
          <span class="text-[10px] text-slate-600">{{ getOnlineCount() }}</span>
        </div>

        <div *ngIf="isLoadingOnlineUsers" class="space-y-2 px-4">
          <div *ngFor="let i of [1,2,3]" class="h-12 animate-pulse rounded-xl border border-slate-800 bg-slate-900/40"></div>
        </div>

        <div *ngIf="!isLoadingOnlineUsers && onlineUsers.length" class="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1 px-4 pb-4">
          <button
            type="button"
            *ngFor="let user of onlineUsers; trackBy: trackByUser"
            class="flex w-full items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-900/40 px-3 py-2.5 text-left transition-colors hover:bg-slate-800/60"
            (click)="openOrCreateConversationWithUser(user)"
          >
            <div class="relative flex-shrink-0">
              <img *ngIf="user.avatar" [src]="user.avatar" class="h-8 w-8 rounded-lg bg-slate-800 object-cover" alt="" />
              <div *ngIf="!user.avatar" class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-white">
                {{ user.name?.slice(0, 2)?.toUpperCase() }}
              </div>
              <span
                class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950"
                [ngClass]="user.isOnline ? 'bg-emerald-400' : 'bg-slate-600'"
              ></span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-medium text-white">{{ user.name }}</p>
              <p class="truncate text-[10px] text-slate-400">{{ user.isOnline ? 'En línea' : user.lastActivity }}</p>
            </div>
          </button>
        </div>

        <p *ngIf="!isLoadingOnlineUsers && !onlineUsers.length"
           class="mx-4 mt-1 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-500">
          Nadie conectado ahora.
        </p>
      </div>
    </ng-template>
  `,
})
export class SocialChatPanelComponent implements OnInit, OnDestroy {
  conversations: ChatConversation[] = [];
  onlineUsers: UserFriend[] = [];
  connectedUsersCount = 0;
  currentUserId: string | null = null;
  isLoadingConversations = false;
  isLoadingOnlineUsers = false;
  activeWindow: ChatWindowState | null = null;

  private readonly sub = new Subscription();
  private readonly messageSubs = new Map<string, Subscription>();

  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.userService.getProfile().subscribe((profile) => {
        this.currentUserId = profile?.id || null;
        this.cdr.markForCheck();
      })
    );

    this.isLoadingConversations = true;
    this.isLoadingOnlineUsers = true;

    this.sub.add(
      this.chatService.getConversations().subscribe((conversations) => {
        this.conversations = conversations;
        this.isLoadingConversations = false;
        this.cdr.markForCheck();
      })
    );

    this.sub.add(
      this.chatService.getOnlineUsers().subscribe((users) => {
        this.onlineUsers = users;
        this.isLoadingOnlineUsers = false;
        this.cdr.markForCheck();
      })
    );

    this.sub.add(
      this.chatService.getConnectedUsersCount().subscribe((count) => {
        this.connectedUsersCount = Number.isFinite(count) && count >= 0 ? count : 0;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.messageSubs.forEach((s) => s.unsubscribe());
    this.sub.unsubscribe();
  }

  openGeneralChat(): void {
    const general = this.findGeneralConversation();
    if (general) {
      this.openConversation(general);
      return;
    }
    this.chatService.refreshConversations().subscribe((convs) => {
      this.conversations = convs;
      const g = this.findGeneralConversation();
      if (g) this.openConversation(g);
      this.cdr.markForCheck();
    });
  }

  openConversation(conv: ChatConversation): void {
    this.activeWindow = {
      conversationId: conv.id,
      draft: '',
      messages: [],
    };
    this.subscribeToMessages(conv.id);
    this.cdr.markForCheck();
  }

  openOrCreateConversationWithUser(user: UserFriend): void {
    const existing = this.conversations.find(
      (c) => !c.isGroup && c.participants?.some((p) => p.id === user.id)
    );
    if (existing) {
      this.openConversation(existing);
      return;
    }
    this.chatService.createConversation(user.id).subscribe((result) => {
      if (result?.ok && result.conversation) {
        this.activeWindow = {
          conversationId: result.conversation.id,
          draft: '',
          messages: [],
        };
        this.subscribeToMessages(result.conversation.id);
        this.chatService.refreshConversations().subscribe((convs) => {
          this.conversations = convs;
          this.cdr.markForCheck();
        });
      }
    });
  }

  closeActiveWindow(): void {
    if (this.activeWindow) {
      const sub = this.messageSubs.get(this.activeWindow.conversationId);
      if (sub) {
        sub.unsubscribe();
        this.messageSubs.delete(this.activeWindow.conversationId);
      }
    }
    this.activeWindow = null;
    this.cdr.markForCheck();
  }

  sendMessage(): void {
    if (!this.activeWindow?.draft?.trim()) return;
    const text = this.activeWindow.draft.trim();
    this.activeWindow.draft = '';
    this.chatService
      .sendMessage(this.activeWindow.conversationId, text)
      .subscribe();
  }

  getWindowTitle(conversationId: string): string {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) return 'Chat';
    if (this.isGeneralConversation(conv)) return 'Chat general';
    const other = conv.participants?.find((p) => p.id !== this.currentUserId);
    return other?.name || conv.groupName || 'Chat';
  }

  getConversationTitle(conv: ChatConversation): string {
    if (this.isGeneralConversation(conv)) return 'Chat general';
    const other = conv.participants?.find((p) => p.id !== this.currentUserId);
    return other?.name || conv.groupName || 'Chat';
  }

  getConversationStatus(conversationId: string): string {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) return '';
    if (this.isGeneralConversation(conv)) return `${this.connectedUsersCount} conectados`;
    const other = conv.participants?.find((p) => p.id !== this.currentUserId);
    return other?.isOnline ? 'En línea' : 'Desconectado';
  }

  isGroupConversation(conversationId: string): boolean {
    const conv = this.conversations.find((c) => c.id === conversationId);
    return !!conv?.isGroup;
  }

  getSenderName(senderId: string): string {
    for (const conv of this.conversations) {
      const p = conv.participants?.find((u) => u.id === senderId);
      if (p) return p.name;
    }
    return 'Usuario';
  }

  trackByMessage(_: number, msg: SocialChatMessage): string {
    return msg.id || msg.createdAt?.toString() || String(_);
  }

  trackByConversation(_: number, conv: ChatConversation): string {
    return conv.id;
  }

  trackByUser(_: number, user: UserFriend): string {
    return user.id;
  }

  getOnlineCount(): string {
    const online = this.onlineUsers.filter(u => u.isOnline).length;
    return `${online} / ${this.onlineUsers.length}`;
  }

  private isGeneralConversation(conv: ChatConversation | null): boolean {
    if (!conv) return false;
    if (conv.groupName?.toLowerCase() === 'chat general') return true;
    return conv.participants?.[0]?.id === 'general';
  }

  private findGeneralConversation(): ChatConversation | null {
    return this.conversations.find((c) => this.isGeneralConversation(c)) || null;
  }

  private subscribeToMessages(conversationId: string): void {
    const existing = this.messageSubs.get(conversationId);
    if (existing) existing.unsubscribe();

    const sub = this.chatService.getMessages(conversationId).subscribe((messages) => {
      if (this.activeWindow?.conversationId === conversationId) {
        this.activeWindow.messages = messages;
        this.cdr.markForCheck();
      }
    });
    this.messageSubs.set(conversationId, sub);
  }
}
