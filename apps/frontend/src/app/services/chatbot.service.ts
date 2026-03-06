import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ChatbotRecommendation {
  title: string;
  type: 'movie' | 'series' | 'program';
  platform?: string;
  channel?: string;
  time?: string;
  reason: string;
  tmdbId?: number;
  image?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: ChatbotRecommendation[];
  followUpSuggestions?: string[];
  isLoading?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly isBrowser = typeof window !== 'undefined';
  private readonly baseUrl = environment.API_BASE_URL;
  private readonly messagesSubject = new BehaviorSubject<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Soy tu asistente de recomendaciones. Puedo ayudarte a decidir que ver esta noche en TV o en streaming.',
      timestamp: new Date(),
      followUpSuggestions: [
        'Que dan esta noche en TV?',
        'Recomiendame una pelicula de accion',
        'Que series de suspense hay en Netflix?',
        'Algo para ver en familia',
      ],
    },
  ]);

  readonly messages$ = this.messagesSubject.asObservable();
  readonly isLoading$ = new BehaviorSubject<boolean>(false);

  constructor(private readonly http: HttpClient) {}

  sendMessage(text: string): Observable<ChatMessage> {
    const normalized = String(text || '').trim();
    if (!normalized) {
      return throwError(() => new Error('Message cannot be empty'));
    }

    const userMessage: ChatMessage = {
      id: this.createId(),
      role: 'user',
      content: normalized,
      timestamp: new Date(),
    };
    const loadingMessage: ChatMessage = {
      id: 'loading',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    this.messagesSubject.next([
      ...this.messagesSubject.value,
      userMessage,
      loadingMessage,
    ]);
    this.isLoading$.next(true);

    const history = [...this.messagesSubject.value]
      .filter((message) => !message.isLoading && message.id !== 'welcome')
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    return this.http
      .post<ApiResponse<any>>(
        `${this.baseUrl}/ai/chat`,
        { messages: history },
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map((resp) => {
          const data = resp?.data || {};
          const assistantMessage: ChatMessage = {
            id: this.createId(),
            role: 'assistant',
            content: data.text || 'No tengo una recomendacion clara ahora mismo.',
            timestamp: new Date(),
            recommendations: data.recommendations || [],
            followUpSuggestions: data.followUpSuggestions || [],
          };

          this.messagesSubject.next(
            this.messagesSubject.value
              .filter((message) => !message.isLoading)
              .concat(assistantMessage)
          );
          this.isLoading$.next(false);
          return assistantMessage;
        }),
        catchError((error) => {
          const fallback: ChatMessage = {
            id: this.createId(),
            role: 'assistant',
            content:
              'No pude procesar tu consulta ahora mismo. Intentalo de nuevo dentro de un momento.',
            timestamp: new Date(),
          };
          this.messagesSubject.next(
            this.messagesSubject.value
              .filter((message) => !message.isLoading)
              .concat(fallback)
          );
          this.isLoading$.next(false);
          return throwError(() => error);
        })
      );
  }

  clearHistory(): void {
    this.messagesSubject.next(this.messagesSubject.value.slice(0, 1));
  }

  private getAuthHeaders(): HttpHeaders {
    if (!this.isBrowser) {
      return new HttpHeaders();
    }

    const token = localStorage.getItem('gtv_id_token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private createId(): string {
    if (this.isBrowser && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `msg-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  }
}
