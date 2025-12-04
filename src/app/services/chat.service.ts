import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { ChatConversation, ChatMessage, UserFriend } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private conversationsSubject = new BehaviorSubject<ChatConversation[]>([]);
  
  constructor() {
    this.loadMockConversations();
  }

  getConversations(): Observable<ChatConversation[]> {
    return this.conversationsSubject.asObservable();
  }

  getMessages(conversationId: string): Observable<ChatMessage[]> {
    // Mock messages
    return of([
      {
        id: '1',
        conversationId,
        senderId: 'friend1',
        text: '¡Hola! ¿Has visto el último episodio?',
        type: 'text',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        readBy: ['me']
      },
      {
        id: '2',
        conversationId,
        senderId: 'me',
        text: 'Sii, ¡estuvo increíble! El final me dejó en shock.',
        type: 'text',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        readBy: ['friend1']
      },
      {
        id: '3',
        conversationId,
        senderId: 'friend1',
        type: 'recommendation',
        content: {
          id: 'rec1',
          title: 'Inception',
          image: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
          platform: 'Netflix',
          type: 'movie'
        },
        createdAt: new Date(Date.now() - 900000).toISOString(),
        readBy: ['me']
      }
    ]);
  }

  sendMessage(conversationId: string, text: string, type: 'text' | 'image' | 'recommendation' | 'list' = 'text', content?: any): Observable<boolean> {
    // Logic to add message to mock store would go here
    console.log('Sending message:', { conversationId, text, type, content });
    return of(true);
  }

  createConversation(friendId: string): Observable<string> {
    // Logic to create or get existing conversation
    return of('conv_new');
  }

  private loadMockConversations() {
    const mockConversations: ChatConversation[] = [
      {
        id: 'c1',
        participants: [
          {
            id: 'f1',
            name: 'Ana García',
            username: 'anag',
            avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
            isOnline: true,
            lastActivity: 'Hace 5 min',
            favoriteGenres: ['Drama', 'Sci-Fi'],
            following: true
          }
        ],
        lastMessage: {
            id: 'm1',
            conversationId: 'c1',
            senderId: 'f1',
            text: 'Tienes que ver esta serie...',
            type: 'text',
            createdAt: new Date().toISOString(),
            readBy: []
        },
        unreadCount: 1,
        updatedAt: new Date().toISOString(),
        isGroup: false
      },
      {
        id: 'c2',
        participants: [
          {
            id: 'f2',
            name: 'Carlos Ruiz',
            username: 'cruiz',
            avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
            isOnline: false,
            lastActivity: 'Hace 2 horas',
            favoriteGenres: ['Action', 'Comedy'],
            following: true
          }
        ],
        lastMessage: {
            id: 'm2',
            conversationId: 'c2',
            senderId: 'me',
            text: 'Nos vemos luego!',
            type: 'text',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            readBy: ['f2']
        },
        unreadCount: 0,
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        isGroup: false
      }
    ];
    this.conversationsSubject.next(mockConversations);
  }
}
