import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../../services/chat.service';
import { ChatConversation, ChatMessage, UserFriend } from '../../../../interfaces/user.interface';
import { Observable, Subscription, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-user-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-[700px] flex bg-gray-800/60 border border-gray-700/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/30 backdrop-blur-sm">
      <!-- Sidebar: Conversations -->
      <div class="w-80 border-r border-gray-700/50 flex flex-col bg-gray-900/30">
        <!-- Header -->
        <div class="p-4 border-b border-gray-700/50 flex items-center justify-between">
          <h2 class="font-bold text-white text-lg">Mensajes</h2>
          <button class="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>

        <!-- Search -->
        <div class="p-4">
          <div class="relative">
            <input 
              type="text" 
              placeholder="Buscar chats..." 
              class="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Conversations List -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <div *ngFor="let conv of conversations" 
               (click)="selectConversation(conv)"
               class="p-4 hover:bg-white/5 cursor-pointer transition-colors border-l-4"
               [ngClass]="selectedConversation?.id === conv.id ? 'bg-white/5 border-red-500' : 'border-transparent'">
            <div class="flex items-center gap-3">
              <div class="relative">
                <img [src]="conv.participants[0].avatar" class="h-12 w-12 rounded-full object-cover bg-gray-700">
                <div *ngIf="conv.participants[0].isOnline" class="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-gray-900"></div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline mb-1">
                  <h3 class="font-semibold text-white truncate">{{ conv.participants[0].name }}</h3>
                  <span class="text-xs text-gray-500">{{ conv.lastMessage?.createdAt | date:'shortTime' }}</span>
                </div>
                <p class="text-sm text-gray-400 truncate" [ngClass]="{'font-bold text-white': conv.unreadCount > 0}">
                  <span *ngIf="conv.lastMessage?.senderId === 'me'">Tú: </span>
                  {{ conv.lastMessage?.type === 'text' ? conv.lastMessage?.text : '📎 Adjunto' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Window -->
      <div class="flex-1 flex flex-col bg-gray-900/50" *ngIf="selectedConversation; else noChatSelected">
        <!-- Header -->
        <div class="p-4 border-b border-gray-700/50 flex items-center justify-between bg-gray-800/30 backdrop-blur-md">
          <div class="flex items-center gap-3">
            <img [src]="selectedConversation.participants[0].avatar" class="h-10 w-10 rounded-full object-cover">
            <div>
              <h3 class="font-bold text-white">{{ selectedConversation.participants[0].name }}</h3>
              <span class="text-xs text-green-400 flex items-center gap-1" *ngIf="selectedConversation.participants[0].isOnline">
                <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span> En línea
              </span>
              <span class="text-xs text-gray-500" *ngIf="!selectedConversation.participants[0].isOnline">
                Visto hace {{ selectedConversation.participants[0].lastActivity }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Ver perfil">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Más opciones">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div *ngFor="let msg of messages" 
               class="flex" 
               [ngClass]="msg.senderId === 'me' ? 'justify-end' : 'justify-start'">
            
            <div class="max-w-[70%] space-y-1">
              <!-- Message Bubble -->
              <div class="p-3 rounded-2xl shadow-sm"
                   [ngClass]="msg.senderId === 'me' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-gray-700 text-gray-100 rounded-tl-none'">
                
                <!-- Text Content -->
                <p *ngIf="msg.type === 'text'" class="leading-relaxed">{{ msg.text }}</p>

                <!-- Recommendation Content -->
                <div *ngIf="msg.type === 'recommendation' && msg.content" class="bg-black/20 rounded-xl p-2 mt-1">
                  <div class="flex gap-3">
                    <img [src]="msg.content.image" class="h-16 w-12 rounded-lg object-cover bg-gray-800">
                    <div class="flex-1 min-w-0 py-1">
                      <p class="font-bold text-sm truncate">{{ msg.content.title }}</p>
                      <p class="text-xs opacity-80">{{ msg.content.platform }}</p>
                      <button class="mt-2 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors w-full">Ver Info</button>
                    </div>
                  </div>
                </div>

              </div>
              
              <!-- Meta -->
              <div class="flex items-center gap-1 text-[10px] text-gray-500 px-1" [ngClass]="msg.senderId === 'me' ? 'justify-end' : 'justify-start'">
                <span>{{ msg.createdAt | date:'shortTime' }}</span>
                <span *ngIf="msg.senderId === 'me'">
                    <svg *ngIf="msg.readBy.length > 0" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
                    </svg>
                    <span *ngIf="msg.readBy.length === 0">✓</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="p-4 bg-gray-800/50 border-t border-gray-700/50">
          <div class="flex items-center gap-2">
            <button class="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <input 
              type="text" 
              [(ngModel)]="newMessage"
              (keyup.enter)="sendMessage()"
              placeholder="Escribe un mensaje..." 
              class="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            >
            <button 
              (click)="sendMessage()"
              [disabled]="!newMessage.trim()"
              class="p-2.5 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-lg shadow-red-900/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <ng-template #noChatSelected>
        <div class="flex-1 flex flex-col items-center justify-center bg-gray-900/50 text-center p-8">
          <div class="h-24 w-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-xl">
            <span class="text-4xl">💬</span>
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">Tus Mensajes</h3>
          <p class="text-gray-400 max-w-md">Selecciona una conversación para empezar a chatear o busca un amigo para enviarle una recomendación.</p>
          <button class="mt-8 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20">
            Nuevo Mensaje
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `]
})
export class UserChatComponent implements OnInit, OnDestroy {
  conversations: ChatConversation[] = [];
  selectedConversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  
  private sub = new Subscription();

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.sub.add(
      this.chatService.getConversations().subscribe(convs => {
        this.conversations = convs;
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  selectConversation(conv: ChatConversation) {
    this.selectedConversation = conv;
    this.sub.add(
      this.chatService.getMessages(conv.id).subscribe(msgs => {
        this.messages = msgs;
      })
    );
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    const text = this.newMessage;
    this.newMessage = '';

    // Optimistic update
    const tempMsg: ChatMessage = {
      id: 'temp_' + Date.now(),
      conversationId: this.selectedConversation.id,
      senderId: 'me',
      text: text,
      type: 'text',
      createdAt: new Date().toISOString(),
      readBy: []
    };
    this.messages.push(tempMsg);

    this.chatService.sendMessage(this.selectedConversation.id, text).subscribe();
  }
}
