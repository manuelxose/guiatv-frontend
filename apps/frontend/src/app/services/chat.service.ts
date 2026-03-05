import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ChatConversation, ChatMessage } from '../interfaces/user.interface';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { io, Socket } from 'socket.io-client';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly isBrowser = typeof window !== 'undefined';
  private readonly baseUrl = environment.API_BASE_URL;
  private socket: Socket | null = null;
  private conversationsSubject = new BehaviorSubject<ChatConversation[]>([]);
  private messagesByConversation = new Map<string, BehaviorSubject<ChatMessage[]>>();
  private currentUserId: string | null = null;
  private fallbackTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private http: HttpClient, private userService: UserService) {
    this.userService.getProfile().subscribe((profile) => {
      this.currentUserId = profile?.id || null;
    });

    this.userService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.refreshConversations().subscribe();
        this.connectSocket();
      } else {
        this.disconnectSocket();
        this.conversationsSubject.next([]);
        this.messagesByConversation.clear();
      }
    });
  }

  getConversations(): Observable<ChatConversation[]> {
    return this.conversationsSubject.asObservable();
  }

  refreshConversations(): Observable<ChatConversation[]> {
    if (!this.safeGetToken()) {
      return of([]);
    }

    const url = `${this.baseUrl}/chat/conversations`;
    return this.http
      .get<ApiResponse<{ conversations: ChatConversation[] }>>(url, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((resp) => resp?.data?.conversations || []),
        map((conversations) => conversations.map((conv) => this.reorderParticipants(conv))),
        tap((conversations) => this.conversationsSubject.next(conversations)),
        catchError(() => of([]))
      );
  }

  private getMessagesSubject(conversationId: string): BehaviorSubject<ChatMessage[]> {
    const key = String(conversationId || '').trim();
    if (!this.messagesByConversation.has(key)) {
      this.messagesByConversation.set(key, new BehaviorSubject<ChatMessage[]>([]));
    }
    return this.messagesByConversation.get(key)!;
  }

  getMessages(conversationId: string): Observable<ChatMessage[]> {
    if (!this.safeGetToken()) {
      return of([]);
    }

    const subject = this.getMessagesSubject(conversationId);
    const url = `${this.baseUrl}/chat/conversations/${conversationId}/messages`;
    this.http
      .get<ApiResponse<{ messages: ChatMessage[] }>>(url, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((resp) => resp?.data?.messages || []),
        catchError(() => of([]))
      )
      .subscribe((messages) => subject.next(messages));

    return subject.asObservable();
  }

  sendMessage(
    conversationId: string,
    text: string,
    type: 'text' | 'image' | 'recommendation' | 'list' = 'text',
    content?: any
  ): Observable<ChatMessage | null> {
    if (!this.safeGetToken()) {
      return of(null);
    }

    const url = `${this.baseUrl}/chat/conversations/${conversationId}/messages`;
    return this.http
      .post<ApiResponse<{ message: ChatMessage }>>(
        url,
        { text, type, content },
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map((resp) => resp?.data?.message || null),
        tap((message) => {
          this.refreshConversations().subscribe();
          if (!message) return;
          const subject = this.getMessagesSubject(conversationId);
          subject.next([...subject.value, message]);
        }),
        catchError(() => of(null))
      );
  }

  createConversation(participantId: string): Observable<ChatConversation | null> {
    if (!this.safeGetToken()) {
      return of(null);
    }

    const url = `${this.baseUrl}/chat/conversations`;
    return this.http
      .post<ApiResponse<{ conversation: ChatConversation }>>(
        url,
        { participantId },
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map((resp) => resp?.data?.conversation || null),
        tap(() => {
          this.refreshConversations().subscribe();
        }),
        catchError(() => of(null))
      );
  }

  markConversationRead(conversationId: string): Observable<boolean> {
    if (!this.safeGetToken()) {
      return of(false);
    }

    const url = `${this.baseUrl}/chat/conversations/${conversationId}/read`;
    return this.http
      .post<ApiResponse<{ updated: number }>>(url, {}, { headers: this.getAuthHeaders() })
      .pipe(
        map((resp) => Number(resp?.data?.updated || 0) >= 0),
        tap(() => {
          this.socket?.emit('chat:read', { conversationId });
          this.refreshConversations().subscribe();
        }),
        catchError(() => of(false))
      );
  }

  sendTyping(conversationId: string, isTyping: boolean): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('chat:typing', { conversationId, isTyping });
  }

  private connectSocket(): void {
    if (!this.isBrowser) return;
    const token = this.safeGetToken();
    if (!token) return;
    if (this.socket?.connected) return;

    this.disconnectSocket();

    const socketUrl = this.resolveSocketUrl();
    this.socket = io(socketUrl, {
      path: '/v2/ws',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.clearFallbackPolling();
      this.refreshConversations().subscribe();
    });

    this.socket.on('disconnect', () => {
      this.ensureFallbackPolling();
    });

    this.socket.on('chat:conversation:update', () => {
      this.refreshConversations().subscribe();
    });

    this.socket.on(
      'chat:message:new',
      (payload: { conversationId?: string; message?: ChatMessage }) => {
        const conversationId = String(payload?.conversationId || '').trim();
        const message = payload?.message;
        if (!conversationId || !message) return;
        const subject = this.getMessagesSubject(conversationId);
        const without = subject.value.filter((row) => row.id !== message.id);
        subject.next([...without, message]);
        this.refreshConversations().subscribe();
      }
    );

    this.socket.on('chat:read:updated', (payload: { conversationId?: string; userId?: string; readAt?: string }) => {
      const conversationId = String(payload?.conversationId || '').trim();
      const readerId = String(payload?.userId || '').trim();
      if (!conversationId || !readerId) return;
      const subject = this.getMessagesSubject(conversationId);
      const updated = subject.value.map((message) => {
        if (message.senderId !== this.currentUserId) return message;
        if (message.readBy.includes(readerId)) return message;
        return {
          ...message,
          readBy: [...message.readBy, readerId],
        };
      });
      subject.next(updated);
      this.refreshConversations().subscribe();
    });

    this.ensureFallbackPolling();
  }

  private disconnectSocket(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.clearFallbackPolling();
  }

  private ensureFallbackPolling(): void {
    if (this.fallbackTimer) return;
    this.fallbackTimer = setInterval(() => {
      if (this.socket?.connected) return;
      this.refreshConversations().subscribe();
    }, 25000);
  }

  private clearFallbackPolling(): void {
    if (!this.fallbackTimer) return;
    clearInterval(this.fallbackTimer);
    this.fallbackTimer = null;
  }

  private resolveSocketUrl(): string {
    const base = String(this.baseUrl || '').trim();
    if (base.startsWith('http://') || base.startsWith('https://')) {
      return base.replace(/\/v2\/?$/, '');
    }
    if (this.isBrowser) {
      return window.location.origin;
    }
    return 'http://127.0.0.1:4000';
  }

  private reorderParticipants(conversation: ChatConversation): ChatConversation {
    if (!this.currentUserId || !conversation?.participants?.length) return conversation;

    const participants = conversation.participants.slice();
    participants.sort((a) => (a.id === this.currentUserId ? 1 : -1));
    return { ...conversation, participants };
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.safeGetToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private safeGetToken(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem('gtv_id_token');
    } catch {
      return null;
    }
  }
}
