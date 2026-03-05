import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../../services/chat.service';
import { UserService } from '../../../../services/user.service';
import { ChatConversation, ChatMessage } from '../../../../interfaces/user.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-[720px] flex bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
      <!-- Sidebar -->
      <div class="w-80 border-r border-slate-800/80 flex flex-col bg-slate-950/40">
        <div class="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white">Mensajes</h2>
          <button
            type="button"
            class="min-h-[44px] px-3 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Nuevo
          </button>
        </div>

        <div class="p-4">
          <div class="relative">
            <input
              type="text"
              placeholder="Buscar chats..."
              aria-label="Buscar chats"
              class="w-full min-h-[44px] bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-slate-500 absolute left-3 top-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <button
            *ngFor="let conv of conversations"
            type="button"
            (click)="selectConversation(conv)"
            class="w-full text-left px-4 py-3 border-l-2 border-transparent hover:bg-slate-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            [ngClass]="selectedConversation?.id === conv.id ? 'bg-slate-900/60 border-red-500' : ''"
          >
            <div class="flex items-center gap-3">
              <div class="relative">
                <img [src]="conv.participants[0].avatar" class="h-11 w-11 rounded-xl object-cover bg-slate-800" alt="" />
                <div
                  *ngIf="conv.participants[0].isOnline"
                  class="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-red-500 border border-slate-900"
                ></div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline mb-1">
                  <h3 class="text-sm font-semibold text-white truncate">{{ conv.participants[0].name }}</h3>
                  <span class="text-xs text-slate-500">{{ conv.lastMessage?.createdAt | date: 'shortTime' }}</span>
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
      </div>

      <!-- Chat Window -->
      <div class="flex-1 flex flex-col bg-slate-950/40" *ngIf="selectedConversation; else noChatSelected">
        <div class="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div class="flex items-center gap-3">
            <img [src]="selectedConversation.participants[0].avatar" class="h-10 w-10 rounded-xl object-cover" alt="" />
            <div>
              <h3 class="text-sm font-semibold text-white">{{ selectedConversation.participants[0].name }}</h3>
              <span class="text-xs text-slate-500" *ngIf="!selectedConversation.participants[0].isOnline">
                Visto hace {{ selectedConversation.participants[0].lastActivity }}
              </span>
              <span class="text-xs text-red-400" *ngIf="selectedConversation.participants[0].isOnline">
                En linea
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="min-h-[44px] px-3 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Ver perfil"
            >
              Perfil
            </button>
            <button
              type="button"
              class="min-h-[44px] px-3 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Opciones"
            >
              Opciones
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div
            *ngFor="let msg of messages"
            class="flex"
            [ngClass]="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'"
          >
            <div class="max-w-[70%] space-y-1">
              <div
                class="p-3 rounded-2xl border"
                [ngClass]="msg.senderId === currentUserId ? 'bg-red-600 text-white border-red-500/40' : 'bg-slate-800 text-slate-100 border-slate-700'"
              >
                <p *ngIf="msg.type === 'text'" class="text-sm leading-relaxed">{{ msg.text }}</p>
                <div *ngIf="msg.type === 'recommendation' && msg.content" class="bg-black/20 rounded-xl p-3 mt-2">
                  <div class="flex gap-3">
                    <img [src]="msg.content.image" class="h-16 w-12 rounded-lg object-cover bg-slate-800" alt="" />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold truncate">{{ msg.content.title }}</p>
                      <p class="text-xs opacity-80">{{ msg.content.platform }}</p>
                      <button
                        type="button"
                        class="min-h-[44px] mt-3 px-3 rounded-lg border border-white/20 text-xs text-white/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        Ver info
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 text-[10px] text-slate-500" [ngClass]="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'">
                <span>{{ msg.createdAt | date: 'shortTime' }}</span>
                <span *ngIf="msg.senderId === currentUserId">{{ msg.readBy.length > 0 ? 'Leido' : 'Enviado' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-slate-900/60 border-t border-slate-800/80">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="min-h-[44px] px-3 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Agregar adjunto"
            >
              Adjuntar
            </button>
            <input
              type="text"
              [(ngModel)]="newMessage"
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
      </div>

      <ng-template #noChatSelected>
        <div class="flex-1 flex flex-col items-center justify-center bg-slate-950/40 text-center p-8">
          <div class="h-16 w-16 rounded-2xl border border-slate-800 flex items-center justify-center mb-6 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h8M8 14h5m7-2a8 8 0 11-16 0 8 8 0 0116 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">Tus mensajes</h3>
          <p class="text-sm text-slate-400 max-w-md">
            Selecciona una conversacion para empezar a chatear o inicia un mensaje nuevo.
          </p>
          <button
            type="button"
            class="min-h-[44px] px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Nuevo mensaje
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
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
  selectedConversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  currentUserId: string | null = null;

  private sub = new Subscription();
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private chatService: ChatService, private userService: UserService) {}

  ngOnInit() {
    this.sub.add(
      this.chatService.getConversations().subscribe((convs) => {
        this.conversations = convs;
      })
    );

    this.sub.add(
      this.userService.getProfile().subscribe((profile) => {
        this.currentUserId = profile?.id || null;
      })
    );
  }

  ngOnDestroy() {
    if (this.selectedConversation) {
      this.chatService.sendTyping(this.selectedConversation.id, false);
    }
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    this.sub.unsubscribe();
  }

  selectConversation(conv: ChatConversation) {
    this.selectedConversation = conv;
    this.sub.add(
      this.chatService.getMessages(conv.id).subscribe((msgs) => {
        this.messages = msgs;
        this.chatService.markConversationRead(conv.id).subscribe();
      })
    );
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    const text = this.newMessage;
    this.newMessage = '';

    const tempMsg: ChatMessage = {
      id: 'temp_' + Date.now(),
      conversationId: this.selectedConversation.id,
      senderId: this.currentUserId || 'me',
      text: text,
      type: 'text',
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    this.messages.push(tempMsg);

    this.chatService.sendMessage(this.selectedConversation.id, text).subscribe((message) => {
      if (!message) return;
      const idx = this.messages.findIndex((msg) => msg.id === tempMsg.id);
      if (idx >= 0) {
        this.messages[idx] = message;
      } else {
        this.messages.push(message);
      }
    });
  }

  onTyping() {
    if (!this.selectedConversation) return;
    this.chatService.sendTyping(this.selectedConversation.id, true);
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    this.typingTimer = setTimeout(() => {
      if (!this.selectedConversation) return;
      this.chatService.sendTyping(this.selectedConversation.id, false);
    }, 1200);
  }
}
