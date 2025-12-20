import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ChatConversation, ChatMessage } from '../interfaces/user.interface';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';

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
  private conversationsSubject = new BehaviorSubject<ChatConversation[]>([]);
  private currentUserId: string | null = null;

  constructor(private http: HttpClient, private userService: UserService) {
    this.userService.getProfile().subscribe((profile) => {
      this.currentUserId = profile?.id || null;
    });

    this.userService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.refreshConversations().subscribe();
      } else {
        this.conversationsSubject.next([]);
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

  getMessages(conversationId: string): Observable<ChatMessage[]> {
    if (!this.safeGetToken()) {
      return of([]);
    }

    const url = `${this.baseUrl}/chat/conversations/${conversationId}/messages`;
    return this.http
      .get<ApiResponse<{ messages: ChatMessage[] }>>(url, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((resp) => resp?.data?.messages || []),
        catchError(() => of([]))
      );
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
        tap(() => {
          this.refreshConversations().subscribe();
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
