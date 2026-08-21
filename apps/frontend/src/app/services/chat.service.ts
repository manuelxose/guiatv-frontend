import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ChatConversation, ChatMessage, UserFriend } from '../interfaces/user.interface';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import type { Socket } from 'socket.io-client';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

interface OnlineUsersPayload {
  users: UserFriend[];
  totalLoggedUsers?: number;
  totalVisibleUsers?: number;
  connectedUsersNow?: number;
}

export type ChatConversationCreateReason =
  | 'blocked'
  | 'forbidden'
  | 'not_found'
  | 'unauthorized'
  | 'unknown';

export interface ChatConversationCreateResult {
  ok: boolean;
  conversation?: ChatConversation;
  reason?: ChatConversationCreateReason;
  message?: string;
  status?: number;
  code?: string;
}

export type ChatRealtimeMode = 'idle' | 'connecting' | 'connected' | 'fallback';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly isBrowser: boolean;
  private readonly baseUrl = environment.API_BASE_URL;
  private socket: Socket | null = null;
  private conversationsSubject = new BehaviorSubject<ChatConversation[]>([]);
  private onlineUsersSubject = new BehaviorSubject<UserFriend[]>([]);
  private connectedUsersCountSubject = new BehaviorSubject<number>(0);
  private realtimeModeSubject = new BehaviorSubject<ChatRealtimeMode>('idle');
  private messagesByConversation = new Map<string, BehaviorSubject<ChatMessage[]>>();
  private currentUserId: string | null = null;
  private fallbackTimer: ReturnType<typeof setInterval> | null = null;
  private onlineRefreshTimer: ReturnType<typeof setInterval> | null = null;
  private realtimeStartTimer: ReturnType<typeof setTimeout> | null = null;
  private lastOnlineRefreshAt = 0;
  /**
   * Gates online-presence polling and the Socket.IO connection behind the chat
   * UI actually being used at least once this session. `refreshConversations()`
   * stays eager on auth because unread-badge (user-area) and general-conversation
   * lookups (interaction-buttons) depend on it without ever opening chat — but
   * nothing outside chat components reads online-users/connected-count, so those
   * (and their recurring timers/socket) can wait for real activation instead of
   * running on every authenticated route.
   */
  private readonly chatActivatedSubject = new BehaviorSubject<boolean>(false);

  /** Emits when a component requests opening the chat shell with a specific user */
  private readonly requestOpenChatSubject = new Subject<string>();
  public readonly requestOpenChat$ = this.requestOpenChatSubject.asObservable();

  constructor(
    private http: HttpClient,
    private userService: UserService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (!this.isBrowser) return;

    this.userService.getProfile().subscribe((profile) => {
      this.currentUserId = profile?.id || null;
    });

    this.userService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.refreshConversations().subscribe();
      } else {
        this.chatActivatedSubject.next(false);
        this.disconnectSocket();
        this.clearOnlineRefreshPolling();
        this.conversationsSubject.next([]);
        this.onlineUsersSubject.next([]);
        this.connectedUsersCountSubject.next(0);
        this.realtimeModeSubject.next('idle');
        this.messagesByConversation.clear();
      }
    });

    combineLatest([this.userService.isAuthenticated$, this.chatActivatedSubject]).subscribe(
      ([isAuthenticated, activated]) => {
        if (isAuthenticated && activated) {
          this.refreshOnlineUsers().subscribe();
          this.ensureOnlineRefreshPolling();
          this.scheduleRealtimeConnection();
        }
      }
    );
  }

  /** Marks chat as actually in use this session, starting presence polling/realtime. */
  activateChat(): void {
    if (!this.isBrowser) return;
    this.chatActivatedSubject.next(true);
  }

  getConversations(): Observable<ChatConversation[]> {
    return this.conversationsSubject.asObservable();
  }

  getOnlineUsers(): Observable<UserFriend[]> {
    return this.onlineUsersSubject.asObservable();
  }

  getConnectedUsersCount(): Observable<number> {
    return this.connectedUsersCountSubject.asObservable();
  }

  getRealtimeMode(): Observable<ChatRealtimeMode> {
    return this.realtimeModeSubject.asObservable();
  }

  requestOpenChat(userId: string): void {
    this.activateChat();
    this.startRealtimeConnection();
    this.requestOpenChatSubject.next(userId);
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

  refreshOnlineUsers(): Observable<UserFriend[]> {
    if (!this.safeGetToken()) {
      return of([]);
    }

    const url = `${this.baseUrl}/chat/online-users`;
    return this.http
      .get<ApiResponse<OnlineUsersPayload>>(url, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((resp) => resp?.data || { users: [] }),
        tap((payload) => {
          const users = payload.users || [];
          const connectedNow = Number(payload.connectedUsersNow);
          const total =
            Number.isFinite(connectedNow) && connectedNow >= 0
              ? connectedNow
              : Number(payload.totalLoggedUsers) > 0
                ? Number(payload.totalLoggedUsers)
                : users.length;
          this.onlineUsersSubject.next(users);
          this.connectedUsersCountSubject.next(total);
        }),
        map((payload) => payload.users || []),
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

    const clientMessageId = this.createClientMessageId();
    const url = `${this.baseUrl}/chat/conversations/${conversationId}/messages`;
    return this.http
      .post<ApiResponse<{ message: ChatMessage }>>(
        url,
        { text, type, content, clientMessageId },
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map((resp) => resp?.data?.message || null),
        tap((message) => {
          this.refreshConversations().subscribe();
          if (!message) return;
          this.upsertConversationMessage(conversationId, {
            ...message,
            clientMessageId: message.clientMessageId || clientMessageId,
          });
        }),
        catchError(() => of(null))
      );
  }

  createConversation(participantId: string): Observable<ChatConversationCreateResult> {
    if (!this.safeGetToken()) {
      return of({
        ok: false,
        reason: 'unauthorized',
        status: 401,
        message: 'Necesitas iniciar sesión para abrir un chat.',
      });
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
        map((conversation) => {
          if (!conversation) {
            return {
              ok: false,
              reason: 'unknown',
              message: 'No se pudo abrir la conversación.',
            } as ChatConversationCreateResult;
          }
          return {
            ok: true,
            conversation,
          } as ChatConversationCreateResult;
        }),
        tap((result) => {
          if (!result.ok) return;
          this.refreshConversations().subscribe();
        }),
        catchError((error: HttpErrorResponse) =>
          of(this.mapCreateConversationError(error))
        )
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

  private async connectSocket(): Promise<void> {
    if (!this.isBrowser) return;
    const token = this.safeGetToken();
    if (!token) return;
    if (this.socket?.connected) return;

    this.disconnectSocket();

    const socketUrl = this.resolveSocketUrl();
    this.realtimeModeSubject.next('connecting');
    const { io } = await import('socket.io-client');
    // Authentication may have changed while the optional realtime bundle was
    // loading. Do not establish a stale connection in that case.
    if (!this.safeGetToken()) {
      this.realtimeModeSubject.next('idle');
      return;
    }
    this.socket = io(socketUrl, {
      path: '/v2/ws',
      auth: { token },
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: false,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.realtimeModeSubject.next('connected');
      this.clearFallbackPolling();
      this.refreshConversations().subscribe();
      this.throttledRefreshOnlineUsers();
    });

    this.socket.on('disconnect', () => {
      this.realtimeModeSubject.next('fallback');
      this.ensureFallbackPolling();
    });

    this.socket.on('connect_error', () => {
      this.realtimeModeSubject.next('fallback');
      this.ensureFallbackPolling();
    });

    this.socket.on('chat:conversation:update', () => {
      this.refreshConversations().subscribe();
    });

    this.socket.on('chat:presence', (payload: { onlineCount?: number } = {}) => {
      this.applyPresenceCount(payload.onlineCount);
      // Throttle HTTP refresh: socket presence events already carry the count
      this.throttledRefreshOnlineUsers();
      this.refreshConversations().subscribe();
    });

    this.socket.on('chat:presence:snapshot', (payload: { onlineCount?: number } = {}) => {
      this.applyPresenceCount(payload.onlineCount);
      this.throttledRefreshOnlineUsers();
      this.refreshConversations().subscribe();
    });

    this.socket.on(
      'chat:message:new',
      (payload: { conversationId?: string; message?: ChatMessage }) => {
        const conversationId = String(payload?.conversationId || '').trim();
        const message = payload?.message;
        if (!conversationId || !message) return;

        this.upsertConversationMessage(conversationId, message);
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

    this.socket.on('notification:new', () => {
      this.userService.fetchUnreadNotificationsCount().subscribe();
      this.userService.fetchNotifications().subscribe();
    });

    this.ensureFallbackPolling();
    // Note: ensureOnlineRefreshPolling is already called by the isAuthenticated$ subscriber
  }

  private scheduleRealtimeConnection(): void {
    if (this.realtimeStartTimer || this.socket) return;
    // Chat presence is useful but not render-critical. Give navigation and the
    // home experience time to become interactive before loading Socket.IO.
    this.realtimeStartTimer = setTimeout(() => {
      this.realtimeStartTimer = null;
      void this.connectSocket();
    }, 60000);
  }

  private startRealtimeConnection(): void {
    if (this.realtimeStartTimer) {
      clearTimeout(this.realtimeStartTimer);
      this.realtimeStartTimer = null;
    }
    void this.connectSocket();
  }

  private disconnectSocket(): void {
    if (this.realtimeStartTimer) {
      clearTimeout(this.realtimeStartTimer);
      this.realtimeStartTimer = null;
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.clearFallbackPolling();
    this.realtimeModeSubject.next(this.safeGetToken() ? 'connecting' : 'idle');
  }

  private ensureFallbackPolling(): void {
    if (this.fallbackTimer) return;
    this.realtimeModeSubject.next('fallback');
    this.fallbackTimer = setInterval(() => {
      if (this.socket?.connected) return;
      this.refreshConversations().subscribe();
      this.refreshOnlineUsers().subscribe();
    }, 25000);
  }

  private clearFallbackPolling(): void {
    if (!this.fallbackTimer) return;
    clearInterval(this.fallbackTimer);
    this.fallbackTimer = null;
  }

  private throttledRefreshOnlineUsers(): void {
    const now = Date.now();
    if (now - this.lastOnlineRefreshAt < 30000) return;
    this.lastOnlineRefreshAt = now;
    this.refreshOnlineUsers().subscribe();
  }

  private ensureOnlineRefreshPolling(): void {
    if (this.onlineRefreshTimer) return;
    this.onlineRefreshTimer = setInterval(() => {
      this.throttledRefreshOnlineUsers();
    }, 60000);
  }

  private clearOnlineRefreshPolling(): void {
    if (!this.onlineRefreshTimer) return;
    clearInterval(this.onlineRefreshTimer);
    this.onlineRefreshTimer = null;
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

  private upsertConversationMessage(conversationId: string, message: ChatMessage): void {
    const subject = this.getMessagesSubject(conversationId);
    const incomingId = String(message.id || '').trim();
    const incomingClientId = String(message.clientMessageId || '').trim();

    const filtered = subject.value.filter((row) => {
      const rowId = String(row.id || '').trim();
      const rowClientId = String(row.clientMessageId || '').trim();

      if (incomingId && rowId === incomingId) return false;
      if (incomingClientId && rowClientId && rowClientId === incomingClientId) return false;
      return true;
    });

    const merged = [...filtered, message].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return aTime - bTime;
    });

    subject.next(merged);
  }

  private applyPresenceCount(count?: number): void {
    const numeric = Number(count);
    if (Number.isFinite(numeric) && numeric >= 0) {
      this.connectedUsersCountSubject.next(numeric);
    }
  }

  private createClientMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private mapCreateConversationError(
    error: HttpErrorResponse
  ): ChatConversationCreateResult {
    const apiError = error?.error?.error || {};
    const code = String(apiError.code || '').toUpperCase();
    const rawMessage = String(apiError.message || '').trim();
    const message =
      rawMessage || 'No se pudo abrir la conversación con este usuario.';

    if (error.status === 401 || code === 'UNAUTHORIZED') {
      return {
        ok: false,
        reason: 'unauthorized',
        status: error.status,
        code,
        message,
      };
    }

    if (error.status === 404 || code === 'NOT_FOUND') {
      return {
        ok: false,
        reason: 'not_found',
        status: error.status,
        code,
        message,
      };
    }

    if (error.status === 403 || code === 'FORBIDDEN') {
      const lowered = message.toLowerCase();
      const blocked =
        lowered.includes('blocked') ||
        lowered.includes('bloque') ||
        lowered.includes('does not accept');
      return {
        ok: false,
        reason: blocked ? 'blocked' : 'forbidden',
        status: error.status,
        code,
        message,
      };
    }

    return {
      ok: false,
      reason: 'unknown',
      status: error.status || 0,
      code: code || 'UNKNOWN_ERROR',
      message,
    };
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
