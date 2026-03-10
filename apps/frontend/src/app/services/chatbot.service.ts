import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { UserAuthState } from './user.service';

export interface ChatbotRecommendation {
  catalogId?: string;
  detailPath?: string;
  source?: 'program' | 'tmdb';
  title: string;
  subtitle?: string;
  type: 'movie' | 'series' | 'program';
  platform?: string;
  channel?: string;
  time?: string;
  channelOrPlatform?: string;
  startTime?: string;
  endTime?: string;
  liveNow?: boolean;
  reason: string;
  tmdbId?: number;
  image?: string;
  actions?: {
    canOpenDetail: boolean;
    canSave: boolean;
    canTrack: boolean;
  };
  badges?: string[];
}

export interface ChatbotQueryContext {
  mode: 'tv_now' | 'tv_tonight' | 'streaming' | 'general';
  requestedTypes: Array<'movie' | 'series' | 'program'>;
  totalMatches: number;
  primaryMatches?: number;
  shownCount: number;
  hasMore: boolean;
  answerWindowLabel: string;
  hasAutonomicMatches?: boolean;
  autonomicPromptRequired?: boolean;
  savedAutonomousCommunity?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: ChatbotRecommendation[];
  moreRecommendations?: ChatbotRecommendation[];
  followUpSuggestions?: string[];
  queryContext?: ChatbotQueryContext;
  isLoading?: boolean;
}

export interface AssistantMemorySnapshot {
  likedGenres: string[];
  dislikedGenres: string[];
  preferredPlatforms: string[];
  avoidedPlatforms: string[];
  preferredDurations: string[];
  preferredViewingContexts: string[];
  favoriteFranchisesOrTitles: string[];
  recentTopics: string[];
  negativeSignals: string[];
  preferredAutonomousCommunity?: string;
  autonomicOptIn?: boolean | 'unknown';
  lastCommunityConfirmationAt?: string;
  updatedAt?: string;
}

export interface AssistantHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  recommendations?: ChatbotRecommendation[];
  moreRecommendations?: ChatbotRecommendation[];
  followUpSuggestions?: string[];
  queryContext?: ChatbotQueryContext;
}

interface AssistantHistoryPayload {
  conversationId: string | null;
  sessionTitle?: string;
  messages: AssistantHistoryMessage[];
  memory: AssistantMemorySnapshot | null;
  updatedAt?: string;
}

interface ChatbotApiPayload {
  text: string;
  recommendations?: ChatbotRecommendation[];
  moreRecommendations?: ChatbotRecommendation[];
  followUpSuggestions?: string[];
  conversationId?: string;
  queryContext?: ChatbotQueryContext;
  assistantMemorySnapshot?: AssistantMemorySnapshot | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message?: string;
  };
}

export type ChatbotSessionState =
  | 'unknown'
  | 'authenticated'
  | 'unauthenticated'
  | 'refreshing';

export type ChatbotRequestState =
  | 'idle'
  | 'sending'
  | 'login_required'
  | 'unavailable';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly isBrowser = typeof window !== 'undefined';
  private readonly baseUrl = environment.API_BASE_URL;
  private readonly conversationStorageKey = 'gtv_ai_conversation_id';

  private readonly messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private readonly memorySubject =
    new BehaviorSubject<AssistantMemorySnapshot | null>(null);
  private readonly sessionStateSubject =
    new BehaviorSubject<ChatbotSessionState>('unknown');
  private readonly chatStateSubject =
    new BehaviorSubject<ChatbotRequestState>('login_required');
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);

  private historyLoaded = false;
  private historyRequestInFlight: Observable<ChatMessage[]> | null = null;

  readonly messages$ = this.messagesSubject.asObservable();
  readonly memory$ = this.memorySubject.asObservable();
  readonly sessionState$ = this.sessionStateSubject.asObservable();
  readonly chatState$ = this.chatStateSubject.asObservable();
  readonly isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly userService: UserService
  ) {
    this.resetToWelcome();

    this.userService.authState$.subscribe((authState) => {
      this.applyAuthState(authState);
    });
  }

  hydrateConversation(force = false): Observable<ChatMessage[]> {
    if (this.sessionStateSubject.value !== 'authenticated' || !this.hasValidSessionToken()) {
      this.chatStateSubject.next('login_required');
      this.resetToWelcome();
      return of(this.messagesSubject.value);
    }

    if (this.historyLoaded && !force) {
      return of(this.messagesSubject.value);
    }

    if (this.historyRequestInFlight && !force) {
      return this.historyRequestInFlight;
    }

    const request$ = this.http
      .get(`${this.baseUrl}/ai/chat/history`, {
        headers: this.getAuthHeaders(),
        responseType: 'text',
      })
      .pipe(
        map((raw) => this.parseApiResponse<AssistantHistoryPayload>(raw)),
        map((response) => {
          if (!response.success) {
            throw new Error(
              String(response.error?.message || 'No se pudo cargar el historial del asistente.')
            );
          }

          const payload = response.data || {
            conversationId: null,
            messages: [],
            memory: null,
          };
          this.memorySubject.next(payload.memory || null);
          this.storeConversationId(payload.conversationId || null);
          this.historyLoaded = true;

          const messages = payload.messages?.length
            ? payload.messages.map((message) => this.mapHistoryMessage(message))
            : [this.buildWelcomeMessage(payload.memory || null)];

          this.messagesSubject.next(messages);
          this.chatStateSubject.next('idle');
          return messages;
        }),
        catchError((error: unknown) => {
          const resolved = this.resolveErrorState(error);
          this.chatStateSubject.next(resolved.chatState);
          if (resolved.chatState === 'login_required') {
            this.resetToWelcome();
          }
          return of(this.messagesSubject.value);
        }),
        finalize(() => {
          this.historyRequestInFlight = null;
        })
      );

    this.historyRequestInFlight = request$;
    return request$;
  }

  sendMessage(text: string): Observable<ChatMessage> {
    const normalized = String(text || '').trim();
    if (!normalized) {
      return throwError(() => new Error('EMPTY_MESSAGE'));
    }

    if (
      this.sessionStateSubject.value !== 'authenticated' ||
      !this.hasValidSessionToken()
    ) {
      this.chatStateSubject.next('login_required');
      return throwError(() => new Error('LOGIN_REQUIRED'));
    }

    if (this.chatStateSubject.value === 'sending') {
      return throwError(() => new Error('MESSAGE_IN_FLIGHT'));
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

    this.messagesSubject.next([...this.messagesSubject.value, userMessage, loadingMessage]);
    this.isLoadingSubject.next(true);
    this.chatStateSubject.next('sending');

    const history = this.messagesSubject.value
      .filter((message) => !message.isLoading && message.id !== 'welcome')
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    return this.http
      .post(
        `${this.baseUrl}/ai/chat`,
        {
          messages: history,
          conversationId: this.readConversationId(),
        },
        {
          headers: this.getAuthHeaders(),
          responseType: 'text',
        }
      )
      .pipe(
        map((raw) => this.parseApiResponse<ChatbotApiPayload>(raw)),
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(
              String(response.error?.message || 'El asistente no está disponible ahora mismo.')
            );
          }

          const data = response.data;
          if (data.conversationId) {
            this.storeConversationId(data.conversationId);
          }
          if (data.assistantMemorySnapshot) {
            this.memorySubject.next(data.assistantMemorySnapshot);
          }

          const topRecommendations = this.dedupeRecommendations(
            data.recommendations || []
          );

          const assistantMessage: ChatMessage = {
            id: this.createId(),
            role: 'assistant',
            content:
              String(data.text || '').trim() ||
              'No tengo una recomendación clara ahora mismo.',
            timestamp: new Date(),
            recommendations: topRecommendations,
            moreRecommendations: this.dedupeRecommendations(
              (data.moreRecommendations || []).filter(
                (candidate) =>
                  !topRecommendations.some(
                    (existing) => this.buildRecommendationKey(existing) === this.buildRecommendationKey(candidate)
                  )
              )
            ),
            followUpSuggestions: this.sanitizeSuggestions(
              data.followUpSuggestions || [],
              normalized,
              this.collectRecentSuggestionTexts()
            ),
            queryContext: data.queryContext,
          };

          this.messagesSubject.next(
            this.messagesSubject.value
              .filter((message) => !message.isLoading)
              .concat(assistantMessage)
          );
          this.isLoadingSubject.next(false);
          this.chatStateSubject.next('idle');
          this.historyLoaded = true;
          return assistantMessage;
        }),
        catchError((error: unknown) => {
          const resolved = this.resolveErrorState(error);
          this.isLoadingSubject.next(false);
          this.chatStateSubject.next(resolved.chatState);

          const messages = this.messagesSubject.value.filter(
            (message) => !message.isLoading
          );
          if (resolved.appendMessage) {
            messages.push({
              id: this.createId(),
              role: 'assistant',
              content: resolved.message,
              timestamp: new Date(),
              followUpSuggestions: resolved.followUpSuggestions,
            });
          }
          this.messagesSubject.next(messages);
          return throwError(() => error);
        })
      );
  }

  trackRecommendationAction(
    action:
      | 'open_recommendation'
      | 'save_recommendation'
      | 'follow_recommendation'
      | 'ignore_recommendation',
    recommendation: ChatbotRecommendation
  ): Observable<boolean> {
    if (
      this.sessionStateSubject.value !== 'authenticated' ||
      !this.hasValidSessionToken()
    ) {
      return of(false);
    }

    return this.http
      .post<ApiResponse<{ saved: boolean; memory?: AssistantMemorySnapshot | null }>>(
        `${this.baseUrl}/ai/chat/history`,
        {
          conversationId: this.readConversationId(),
          action,
          recommendation: {
            title: recommendation.title,
            type: recommendation.type,
            platform: recommendation.platform,
            channel: recommendation.channel,
          },
        },
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        tap((response) => {
          if (response?.data?.memory) {
            this.memorySubject.next(response.data.memory);
          }
        }),
        map((response) => Boolean(response?.data?.saved)),
        catchError(() => of(false))
      );
  }

  clearHistory(): Observable<boolean> {
    if (
      this.sessionStateSubject.value !== 'authenticated' ||
      !this.hasValidSessionToken()
    ) {
      this.storeConversationId(null);
      this.resetToWelcome();
      return of(true);
    }

    return this.http
      .delete<ApiResponse<{ cleared: boolean }>>(
        `${this.baseUrl}/ai/chat/history`,
        {
          headers: this.getAuthHeaders(),
          params: this.readConversationId()
            ? { conversationId: this.readConversationId() as string }
            : undefined,
        }
      )
      .pipe(
        map((response) => Boolean(response?.data?.cleared)),
        tap(() => {
          this.storeConversationId(null);
          this.historyLoaded = false;
          this.memorySubject.next(null);
          this.resetToWelcome();
        }),
        catchError(() => {
          this.storeConversationId(null);
          this.historyLoaded = false;
          this.memorySubject.next(null);
          this.resetToWelcome();
          return of(false);
        })
      );
  }

  resetDraftConversation(): void {
    this.storeConversationId(null);
    this.historyLoaded = false;
    this.memorySubject.next(null);
    this.resetToWelcome();
  }

  private applyAuthState(authState: UserAuthState): void {
    const nextSessionState = this.mapAuthState(authState);
    this.sessionStateSubject.next(nextSessionState);

    if (nextSessionState === 'authenticated') {
      if (this.chatStateSubject.value === 'login_required') {
        this.chatStateSubject.next('idle');
      }
      return;
    }

    if (nextSessionState === 'refreshing' || nextSessionState === 'unknown') {
      return;
    }

    this.chatStateSubject.next('login_required');
    this.isLoadingSubject.next(false);
    this.memorySubject.next(null);
    this.historyLoaded = false;
    this.storeConversationId(null);
    this.resetToWelcome();
  }

  private mapAuthState(authState: UserAuthState): ChatbotSessionState {
    switch (authState) {
      case 'authenticated':
        return 'authenticated';
      case 'refreshing':
        return 'refreshing';
      case 'unknown':
        return 'unknown';
      default:
        return 'unauthenticated';
    }
  }

  private parseApiResponse<T>(raw: unknown): ApiResponse<T> {
    if (typeof raw === 'object' && raw !== null) {
      return raw as ApiResponse<T>;
    }

    const text = String(raw || '').trim();
    if (!text || text.startsWith('<') || text.startsWith('<!--')) {
      throw new Error('AI_INVALID_PAYLOAD');
    }

    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch {
      throw new Error('AI_INVALID_PAYLOAD');
    }
  }

  private resolveErrorState(error: unknown): {
    message: string;
    chatState: ChatbotRequestState;
    appendMessage: boolean;
    followUpSuggestions?: string[];
  } {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 403) {
        return {
          message: 'Inicia sesión para usar el asistente personalizado.',
          chatState: 'login_required',
          appendMessage: false,
        };
      }

      const backendMessage = this.extractBackendMessage(error);
      return {
        message:
          backendMessage ||
          'El asistente no está disponible ahora mismo. Puedes reintentar dentro de unos minutos.',
        chatState: 'unavailable',
        appendMessage: true,
        followUpSuggestions: ['Reintentar', '¿Qué hay ahora mismo en TV?'],
      };
    }

    const rawMessage = String((error as any)?.message || '').trim();
    if (rawMessage === 'LOGIN_REQUIRED') {
      return {
        message: 'Inicia sesión para usar el asistente personalizado.',
        chatState: 'login_required',
        appendMessage: false,
      };
    }

    if (
      rawMessage === 'AI_INVALID_PAYLOAD' ||
      rawMessage.includes('Unexpected token')
    ) {
      return {
        message:
          'El servicio del asistente está temporalmente no disponible. Reintenta dentro de unos minutos.',
        chatState: 'unavailable',
        appendMessage: true,
        followUpSuggestions: ['Reintentar', '¿Qué hay esta noche en TV?'],
      };
    }

    return {
      message: rawMessage || 'No pude completar la recomendación ahora mismo.',
      chatState: 'unavailable',
      appendMessage: true,
      followUpSuggestions: ['Reintentar'],
    };
  }

  private extractBackendMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string') {
      const raw = error.error.trim();
      if (!raw || raw.startsWith('<') || raw.startsWith('<!--')) {
        return '';
      }

      try {
        const parsed = JSON.parse(raw) as ApiResponse<any>;
        return String(
          parsed?.error?.message || parsed?.data?.message || ''
        ).trim();
      } catch {
        return raw.includes('Unexpected token') ? '' : raw;
      }
    }

    return String(
      error.error?.error?.message || error.error?.message || ''
    ).trim();
  }

  private buildWelcomeMessage(
    memory: AssistantMemorySnapshot | null = null
  ): ChatMessage {
    const profile = this.userService.getProfileSnapshot();
    const hour = new Date().getHours();
    const lead =
      hour >= 20
        ? 'Puedo cruzar la parrilla de esta noche con tus plataformas y tus gustos.'
        : 'Puedo cruzar lo que hay ahora mismo en TV con tu catálogo en streaming.';
    const suggestions = this.buildSmartSuggestions(memory);

    return {
      id: 'welcome',
      role: 'assistant',
      content: `Soy tu asistente de recomendaciones. ${lead}`,
      timestamp: new Date(),
      followUpSuggestions: suggestions,
    };
  }

  private buildSmartSuggestions(
    memory: AssistantMemorySnapshot | null = null
  ): string[] {
    const profile = this.userService.getProfileSnapshot();
    const hour = new Date().getHours();
    const suggestions = new Set<string>();

    suggestions.add(
      hour >= 20
        ? '¿Qué películas hay esta noche en TV?'
        : '¿Qué películas hay ahora mismo en TV?'
    );
    suggestions.add(
      hour >= 20
        ? '¿Qué series hay esta noche en TV?'
        : '¿Qué series hay ahora mismo?'
    );

    const preferredPlatforms = [
      ...(memory?.preferredPlatforms || []),
      ...(profile.preferredPlatforms || []),
    ].filter(Boolean);
    if (preferredPlatforms.length > 1) {
      suggestions.add('Recomiéndame algo en mis plataformas');
    } else if (preferredPlatforms[0]) {
      suggestions.add(`Recomiéndame una serie en ${preferredPlatforms[0]}`);
    }

    const preferredGenre = memory?.likedGenres?.[0] || profile.favoriteGenres?.[0];
    if (preferredGenre && !['series', 'cine'].includes(this.normalize(preferredGenre))) {
      suggestions.add(`Quiero algo de ${preferredGenre.toLowerCase()}`);
    }

    suggestions.add('Algo corto para ver hoy');

    return Array.from(suggestions).slice(0, 4);
  }

  private mapHistoryMessage(message: AssistantHistoryMessage): ChatMessage {
    return {
      id: this.createId(),
      role: message.role,
      content: message.content,
      timestamp: new Date(message.createdAt),
      recommendations: this.dedupeRecommendations(message.recommendations || []),
      moreRecommendations: this.dedupeRecommendations(
        (message.moreRecommendations || []).filter(
          (candidate) =>
            !(message.recommendations || []).some(
              (existing) => this.buildRecommendationKey(existing) === this.buildRecommendationKey(candidate)
            )
        )
      ),
      followUpSuggestions: this.sanitizeSuggestions(
        message.followUpSuggestions || [],
        ''
      ),
      queryContext: message.queryContext,
    };
  }

  private resetToWelcome(): void {
    this.messagesSubject.next([this.buildWelcomeMessage(this.memorySubject.value)]);
  }

  private sanitizeSuggestions(
    suggestions: string[],
    latestUserMessage: string,
    excludedSuggestions: string[] = []
  ): string[] {
    const unique = new Map<string, string>();
    const normalizedLatest = this.normalize(latestUserMessage);
    const excluded = new Set(
      excludedSuggestions
        .map((entry) => this.normalize(entry))
        .filter(Boolean)
    );

    suggestions.forEach((suggestion) => {
      const safe = String(suggestion || '').trim();
      if (!safe) {
        return;
      }

      const normalized = this.normalize(safe);
      if (!normalized || normalized === normalizedLatest || excluded.has(normalized)) {
        return;
      }

      unique.set(normalized, safe);
    });

    return Array.from(unique.values()).slice(0, 3);
  }

  private collectRecentSuggestionTexts(): string[] {
    return this.messagesSubject.value
      .slice(-2)
      .flatMap((message) => message.followUpSuggestions || []);
  }

  private dedupeRecommendations(
    recommendations: ChatbotRecommendation[]
  ): ChatbotRecommendation[] {
    const deduped = new Map<string, ChatbotRecommendation>();

    recommendations.forEach((recommendation) => {
      const normalized = {
        ...recommendation,
        title: this.cleanDisplayTitle(recommendation.title, recommendation.type),
      };
      const key = this.buildRecommendationKey(normalized);
      if (!deduped.has(key)) {
        deduped.set(key, normalized);
      }
    });

    return Array.from(deduped.values());
  }

  private buildRecommendationKey(recommendation: ChatbotRecommendation): string {
    return [
      recommendation.catalogId || recommendation.detailPath || '',
      this.normalize(recommendation.title),
      this.normalize(recommendation.channel || recommendation.platform || ''),
    ]
      .filter(Boolean)
      .join('::');
  }

  private cleanDisplayTitle(
    value: string,
    contentType: 'movie' | 'series' | 'program'
  ): string {
    const raw = String(value || '').trim();
    if (!raw) {
      return '';
    }

    const segments = raw
      .split(/·|\||—|-/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length >= 2) {
      const [first, second] = segments;
      if (this.normalize(first) === this.normalize(second)) {
        return first;
      }
    }

    if (contentType === 'series') {
      return raw
        .replace(/\s*T\d+\s*E\d+.*$/i, '')
        .replace(/\s*S\d+\s*E\d+.*$/i, '')
        .replace(/\s*\([^)]*dobles[^)]*\).*$/i, '')
        .replace(/\s*·.*$/i, '')
        .trim();
    }

    return raw;
  }

  private normalize(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private getAuthHeaders(): HttpHeaders {
    if (!this.isBrowser) {
      return new HttpHeaders();
    }

    const token = this.readToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private readToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      return localStorage.getItem('gtv_id_token');
    } catch {
      return null;
    }
  }

  private hasValidSessionToken(): boolean {
    return Boolean(this.readToken());
  }

  private readConversationId(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      return localStorage.getItem(this.conversationStorageKey);
    } catch {
      return null;
    }
  }

  private storeConversationId(value: string | null): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      if (!value) {
        localStorage.removeItem(this.conversationStorageKey);
        return;
      }

      localStorage.setItem(this.conversationStorageKey, value);
    } catch {
      // ignore storage failures
    }
  }

  private createId(): string {
    if (this.isBrowser && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `msg-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  }
}
