import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Output,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import {
  AssistantMemorySnapshot,
  ChatMessage,
  ChatbotRecommendation,
  ChatbotRequestState,
  ChatbotSessionState,
  ConversationSummary,
} from '../../interfaces/chatbot.interface';
import { ChatbotService } from '../../services/chatbot.service';
import { UserService } from '../../services/user.service';

import { ChatHeaderComponent } from './chat-header/chat-header.component';
import { ChatMemoryEditorComponent } from './chat-memory-editor/chat-memory-editor.component';
import { ChatWelcomeScreenComponent } from './chat-welcome-screen/chat-welcome-screen.component';
import { ChatOnboardingWizardComponent, OnboardingWizardResult } from './chat-onboarding-wizard/chat-onboarding-wizard.component';
import { ChatMessageBubbleComponent } from './chat-message-bubble/chat-message-bubble.component';
import { ChatInputBarComponent } from './chat-input-bar/chat-input-bar.component';
import { ChatPreferencePromptComponent } from './chat-preference-prompt/chat-preference-prompt.component';
import { ChatSkeletonComponent } from './chat-skeleton/chat-skeleton.component';
import { ChatConversationSidebarComponent } from './chat-conversation-sidebar/chat-conversation-sidebar.component';

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    ChatHeaderComponent,
    ChatMemoryEditorComponent,
    ChatWelcomeScreenComponent,
    ChatOnboardingWizardComponent,
    ChatMessageBubbleComponent,
    ChatInputBarComponent,
    ChatPreferencePromptComponent,
    ChatSkeletonComponent,
    ChatConversationSidebarComponent,
  ],
  templateUrl: './ai-chatbot.component.html',
  styleUrl: './ai-chatbot.component.scss',
})
export class AIChatbotComponent implements AfterViewInit {
  @Output() close = new EventEmitter<void>();
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('inputBar') inputBar?: ChatInputBarComponent;
  @ViewChild('memoryEditor') memoryEditor?: ChatMemoryEditorComponent;

  public messages: ChatMessage[] = [];
  public needsOnboarding = false;
  public sessionState: ChatbotSessionState = 'unknown';
  public chatState: ChatbotRequestState = 'login_required';
  public previewSuggestions: string[] = [];
  public assistantMemory: AssistantMemorySnapshot | null = null;
  public dismissedPreferencePromptKeys = new Set<string>();
  public showScrollFab = false;
  public conversations: ConversationSummary[] = [];
  public activeConversationId: string | null = null;
  public readonly memoryEditorFields: Array<{ key: string; label: string; placeholder: string }> = [
    { key: 'likedGenres', label: 'Géneros favoritos', placeholder: 'Añadir género…' },
    { key: 'dislikedGenres', label: 'Géneros a evitar', placeholder: 'Añadir género…' },
    { key: 'preferredPlatforms', label: 'Plataformas', placeholder: 'Añadir plataforma…' },
    { key: 'avoidedPlatforms', label: 'Plataformas a evitar', placeholder: 'Añadir plataforma…' },
    { key: 'preferredViewingContexts', label: 'Contexto', placeholder: 'Solo, pareja…' },
    { key: 'preferredDurations', label: 'Duración', placeholder: 'Corto, largo…' },
  ];
  public readonly autonomousCommunities = [
    'Andalucía',
    'Aragón',
    'Asturias',
    'Baleares',
    'Canarias',
    'Cantabria',
    'Castilla-La Mancha',
    'Castilla y León',
    'Cataluña',
    'Comunidad Valenciana',
    'Extremadura',
    'Galicia',
    'La Rioja',
    'Madrid',
    'Murcia',
    'Navarra',
    'País Vasco',
  ];

  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  private get isMobile(): boolean {
    return isPlatformBrowser(this.platformId) && window.innerWidth < 768;
  }

  // Single "which panel is open" state for the header's profile block, the
  // memory editor, and the conversation sidebar — they used to be three
  // independent booleans that could all be true at once, which is what
  // caused them to visually overlap and obscure each other. Opening any one
  // now closes the others. Kept as getter/setter pairs (rather than renaming
  // every call site to a method) so `sidebarOpen`/`memoryEditorOpen` keep
  // working exactly as before everywhere they're already read/assigned,
  // including directly from templates (e.g. `(close)="sidebarOpen = false"`).
  private _activePanel: 'none' | 'profile' | 'memory' | 'sidebar' = 'none';

  get sidebarOpen(): boolean {
    return this._activePanel === 'sidebar';
  }
  set sidebarOpen(value: boolean) {
    this._activePanel = value ? 'sidebar' : this._activePanel === 'sidebar' ? 'none' : this._activePanel;
  }

  get memoryEditorOpen(): boolean {
    return this._activePanel === 'memory';
  }
  set memoryEditorOpen(value: boolean) {
    this._activePanel = value ? 'memory' : this._activePanel === 'memory' ? 'none' : this._activePanel;
  }

  get profileExpanded(): boolean {
    return this._activePanel === 'profile';
  }
  set profileExpanded(value: boolean) {
    this._activePanel = value ? 'profile' : this._activePanel === 'profile' ? 'none' : this._activePanel;
  }

  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly userService: UserService,
    private readonly router: Router
  ) {}

  ngAfterViewInit(): void {
    this.chatbotService.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((messages) => {
        this.messages = messages;
        this.previewSuggestions = messages[0]?.followUpSuggestions || [];
        this.cdr.detectChanges();
        if (!this.showScrollFab) {
          queueMicrotask(() => this.scrollToBottom());
        }
      });

    this.chatbotService.memory$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((memory) => {
        this.assistantMemory = memory;
        this.cdr.detectChanges();
      });

    this.chatbotService.sessionState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.sessionState = state;
        this.cdr.detectChanges();
        if (state === 'authenticated') {
          this.chatbotService.hydrateConversation().subscribe({
            error: () => undefined,
          });
        }
      });

    this.chatbotService.chatState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.chatState = state;
        this.cdr.detectChanges();
        if (!this.showScrollFab) {
          queueMicrotask(() => this.scrollToBottom());
        }
      });

    combineLatest([
      this.userService.isAuthenticated$,
      this.userService.getProfile(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([isAuthenticated, profile]) => {
        this.needsOnboarding = Boolean(
          isAuthenticated &&
            (!profile.favoriteGenres?.length || !profile.preferredPlatforms?.length)
        );
      });
  }

  onMessageSent(text: string): void {
    if (
      !text ||
      this.chatState === 'sending' ||
      this.sessionState !== 'authenticated'
    ) {
      return;
    }

    this.chatbotService.sendMessageStream(text).subscribe({
      error: () => undefined,
    });
  }

  useSuggestion(text: string): void {
    this.sendQuickMessage(text);
  }

  onUseSavedCommunity(message: ChatMessage): void {
    const savedCommunity = this.getSavedCommunity(message);
    if (!savedCommunity) {
      return;
    }

    this.sendQuickMessage(`Sí, usa ${savedCommunity} para las autonómicas`);
  }

  selectCommunity(community: string): void {
    this.sendQuickMessage(`Mi comunidad es ${community}. Incluye autonómicas`);
  }

  declineAutonomics(): void {
    this.sendQuickMessage('No incluyas autonómicas');
  }

  openRecommendation(recommendation: ChatbotRecommendation): void {
    this.chatbotService
      .trackRecommendationAction('open_recommendation', recommendation)
      .subscribe();

    const catalogId = recommendation.catalogId;

    // Only navigate to /contenido/ for real catalog IDs (tmdb:movie:* or tmdb:tv:*).
    // EPG program IDs (program:*) are ephemeral and have no catalog detail page.
    if (catalogId && !catalogId.startsWith('program:')) {
      this.close.emit();
      void this.router.navigate(['/contenido', catalogId]);
      return;
    }

    // Navigate to detailPath if available (any device, any path type including /programas/).
    if (recommendation.detailPath) {
      this.close.emit();
      void this.router.navigateByUrl(recommendation.detailPath);
      return;
    }

    // No detailPath at all: open chatbot search as fallback.
    this.inputBar?.setDraft(`Cuéntame más sobre ${recommendation.title}`);
    queueMicrotask(() => this.inputBar?.focus());
  }

  saveRecommendation(recommendation: ChatbotRecommendation): void {
    this.chatbotService
      .trackRecommendationAction('save_recommendation', recommendation)
      .subscribe();

    this.userService
      .toggleWatchlistItem({
        contentId: String(
          recommendation.catalogId || recommendation.tmdbId || recommendation.title
        ),
        title: recommendation.title,
        type: recommendation.type,
      })
      .subscribe();
  }

  askAboutTitle(recommendation: ChatbotRecommendation): void {
    this.chatbotService
      .trackRecommendationAction('follow_recommendation', recommendation)
      .subscribe();
    this.inputBar?.setDraft(`Quiero algo parecido a ${recommendation.title}`);
    queueMicrotask(() => this.inputBar?.focus());
  }

  ignoreRecommendation(recommendation: ChatbotRecommendation): void {
    this.chatbotService
      .trackRecommendationAction('ignore_recommendation', recommendation)
      .subscribe();
  }

  ratePositiveRecommendation(recommendation: ChatbotRecommendation): void {
    this.chatbotService
      .trackRecommendationAction('rate_positive', recommendation)
      .subscribe();
  }

  rateNegativeRecommendation(recommendation: ChatbotRecommendation): void {
    this.chatbotService
      .trackRecommendationAction('rate_negative', recommendation)
      .subscribe();
  }

  onFeedbackPositive(message: ChatMessage): void {
    this.applyMessageFeedback(message, 'positive');
  }

  onFeedbackNegative(message: ChatMessage): void {
    this.applyMessageFeedback(message, 'negative');
  }

  private applyMessageFeedback(message: ChatMessage, rating: 'positive' | 'negative'): void {
    message.feedback = { rating };
    const conversationId = this.chatbotService.getActiveConversationId();
    if (!conversationId) return;

    const messageIndex = this.messages.indexOf(message);
    if (messageIndex < 0) return;

    this.chatbotService
      .trackMessageFeedback(conversationId, messageIndex, rating)
      .subscribe();
  }

  onRemindProgram(recommendation: ChatbotRecommendation): void {
    this.chatbotService.createProgramReminder(recommendation).subscribe();
  }

  retryHistory(): void {
    this.chatbotService.hydrateConversation(true).subscribe({
      error: () => undefined,
    });
  }

  startNewConversation(): void {
    this.chatbotService.startNewConversation();
    this.activeConversationId = null;
    this.dismissedPreferencePromptKeys.clear();
    this.inputBar?.setDraft('');
    queueMicrotask(() => this.inputBar?.focus());
    if (this.sidebarOpen) {
      this.chatbotService.listConversations().subscribe((list) => {
        this.conversations = list;
      });
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    if (this.sidebarOpen) {
      this.activeConversationId = this.chatbotService.getActiveConversationId();
      this.chatbotService.listConversations().subscribe((list) => {
        this.conversations = list;
      });
    }
  }

  onSelectConversation(conversationId: string): void {
    this.chatbotService.switchConversation(conversationId).subscribe(() => {
      this.activeConversationId = conversationId;
      this.sidebarOpen = false;
      this.dismissedPreferencePromptKeys.clear();
    });
  }

  onUpdateConversation(event: { conversationId: string; updates: { sessionTitle?: string; pinned?: boolean; archived?: boolean } }): void {
    this.chatbotService.updateConversation(event.conversationId, event.updates).subscribe(() => {
      this.chatbotService.listConversations().subscribe((list) => {
        this.conversations = list;
      });
    });
  }

  onDeleteConversation(conversationId: string): void {
    this.chatbotService.deleteConversation(conversationId).subscribe(() => {
      if (this.activeConversationId === conversationId) {
        this.activeConversationId = null;
      }
      this.chatbotService.listConversations().subscribe((list) => {
        this.conversations = list;
      });
    });
  }

  onSearchConversations(query: string): void {
    if (!query.trim()) {
      this.chatbotService.listConversations().subscribe((list) => {
        this.conversations = list;
      });
      return;
    }
    this.chatbotService.searchConversations(query).subscribe((list) => {
      this.conversations = list;
    });
  }

  goToLogin(): void {
    this.close.emit();
    void this.router.navigate(['/iniciar-sesion']);
  }

  goToRegister(): void {
    this.close.emit();
    void this.router.navigate(['/registro']);
  }

  goToAccountSettings(): void {
    this.close.emit();
    void this.router.navigate(['/mi-cuenta'], {
      queryParams: { tab: 'settings' },
    });
  }

  scrollToBottom(): void {
    if (!this.messagesContainer) {
      return;
    }

    const element = this.messagesContainer.nativeElement;
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
  }

  onMessagesScroll(): void {
    if (!this.messagesContainer) return;
    const el = this.messagesContainer.nativeElement;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.showScrollFab = distanceFromBottom > 120;
  }

  getMessageSuggestions(message: ChatMessage): string[] {
    const latestUserMessage = this.getLatestUserMessage();
    const seen = new Set<string>();
    const normalizedLast = this.normalize(latestUserMessage);
    const previousAssistantSuggestions = this.getPreviousAssistantSuggestions(message);

    return (message.followUpSuggestions || [])
      .filter((suggestion) => {
        const safe = suggestion.trim();
        if (!safe) {
          return false;
        }
        const normalized = this.normalize(safe);
        if (
          !normalized ||
          normalized === normalizedLast ||
          seen.has(normalized) ||
          previousAssistantSuggestions.has(normalized)
        ) {
          return false;
        }
        seen.add(normalized);
        return true;
      })
      .slice(0, 3);
  }

  shouldShowAutonomicPrompt(message: ChatMessage): boolean {
    return Boolean(
      message.role === 'assistant' &&
        message.queryContext?.autonomicPromptRequired &&
        message.queryContext?.hasAutonomicMatches
    );
  }

  getSavedCommunity(message: ChatMessage): string | null {
    const savedCommunity = String(
      message.queryContext?.savedAutonomousCommunity || ''
    ).trim();
    return savedCommunity || null;
  }

  getAutonomicPromptText(message: ChatMessage): string {
    const savedCommunity = this.getSavedCommunity(message);
    if (savedCommunity) {
      return `También puedo incluir autonómicas. Tengo guardada ${savedCommunity}. ¿Sigo usando esa comunidad?`;
    }

    return 'También puedo incluir autonómicas si me dices tu comunidad autónoma.';
  }

  getPreferencePromptKey(checkDismissed = true): string {
    if (this.sessionState !== 'authenticated' || this.chatState === 'sending') {
      return '';
    }

    const userMessageCount = this.getUserMessageCount();
    if (userMessageCount < 2) {
      return '';
    }

    const profile = this.userService.getProfileSnapshot();
    const knownPlatforms = new Set([
      ...(profile.preferredPlatforms || []),
      ...(this.assistantMemory?.preferredPlatforms || []),
    ].filter(Boolean));
    const knownGenres = new Set([
      ...(profile.favoriteGenres || []),
      ...(this.assistantMemory?.likedGenres || []),
    ].filter(Boolean));

    let key = '';
    if (!knownPlatforms.size) {
      key = 'platforms';
    } else if (!knownGenres.size) {
      key = 'genres';
    } else if (!(this.assistantMemory?.preferredViewingContexts || []).length) {
      key = 'context';
    } else if (!(this.assistantMemory?.preferredDurations || []).length) {
      key = 'duration';
    } else if (!(this.assistantMemory?.favoriteFranchisesOrTitles || []).length) {
      key = 'titles';
    } else if (
      this.messages.some((message) => Boolean(message.queryContext?.hasAutonomicMatches)) &&
      !this.assistantMemory?.preferredAutonomousCommunity
    ) {
      key = 'community';
    } else if (
      userMessageCount >= 3 &&
      !(this.assistantMemory?.negativeSignals || []).length
    ) {
      key = 'avoid';
    }

    if (!key) {
      return '';
    }

    return checkDismissed && this.dismissedPreferencePromptKeys.has(key) ? '' : key;
  }

  getPreferencePrompt(): string {
    if (this.sessionState !== 'authenticated' || this.chatState === 'sending') {
      return '';
    }
    switch (this.getPreferencePromptKey()) {
      case 'platforms':
        return '¿Dónde sueles ver más cosas? Si me dices tus plataformas principales, ajusto mejor entre streaming y TV.';
      case 'genres':
        return '¿Qué te suele apetecer más? Con un par de géneros afino mucho mejor desde el siguiente turno.';
      case 'context':
        return '¿Sueles buscar plan para ver solo, en pareja, en familia o con amigos?';
      case 'duration':
        return '¿Hoy te encaja mejor algo corto o también una película larga?';
      case 'titles':
        return 'Dime una serie, película o saga que te represente y usaré esa referencia para afinar mejor.';
      case 'community':
        return 'Si quieres incluir autonómicas cuando toque, dime tu comunidad autónoma y la recordaré.';
      case 'avoid':
        return 'Si quieres, también dime qué prefieres evitar casi siempre. Solo lo usaré como filtro secundario.';
      default:
        return '';
    }
  }

  getPreferenceOptions(): string[] {
    switch (this.getPreferencePromptKey()) {
      case 'platforms':
        return [
          'Uso Netflix y Prime Video',
          'Tengo Movistar+ y Max',
          'Ahora mismo tiro más de TV',
        ];
      case 'genres':
        return [
          'Suspense y drama',
          'Comedia y series',
          'Más cine que series',
        ];
      case 'context':
        return ['Para ver solo', 'En pareja', 'En familia', 'Con amigos'];
      case 'duration':
        return [
          'Algo corto hoy',
          'Me va bien una peli larga',
          'Mejor episodios de 30-45 min',
        ];
      case 'titles':
        return [
          'Me encantó Succession',
          'The Bear es muy mi rollo',
          'Quiero algo tipo La infiltrada',
        ];
      case 'community':
        return ['Andalucía', 'Madrid', 'Cataluña'];
      case 'avoid':
        return [
          'Prefiero evitar terror',
          'Mejor sin deportes',
          'Paso de realities',
        ];
      default:
        return [];
    }
  }

  dismissPreferencePrompt(): void {
    const promptKey = this.getPreferencePromptKey(false);
    if (!promptKey) {
      return;
    }
    this.dismissedPreferencePromptKeys.add(promptKey);
  }

  getResultSummary(message: ChatMessage): string {
    const context = message.queryContext;
    if (!context || !context.totalMatches) {
      return '';
    }

    const noun = this.buildRequestedLabel(context.requestedTypes);
    const scope = context.primaryMatches && context.primaryMatches > 0
      ? `${Math.min(context.shownCount || 0, context.primaryMatches)} de ${context.primaryMatches}`
      : `${context.totalMatches}`;
    return `${scope} ${noun} · ${context.answerWindowLabel}`;
  }

  private getLatestUserMessage(): string {
    const latest = [...this.messages].reverse().find((message) => message.role === 'user');
    return latest?.content || '';
  }

  private getUserMessageCount(): number {
    return this.messages.filter((message) => message.role === 'user').length;
  }

  private buildRequestedLabel(
    requestedTypes: Array<'movie' | 'series' | 'program'> = []
  ): string {
    if (requestedTypes.includes('movie') && !requestedTypes.includes('series')) {
      return 'películas';
    }
    if (requestedTypes.includes('series') && !requestedTypes.includes('movie')) {
      return 'series';
    }
    return 'resultados';
  }

  private normalize(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  public sendQuickMessage(text: string): void {
    const normalized = text.trim();
    if (
      !normalized ||
      this.chatState === 'sending' ||
      this.sessionState !== 'authenticated'
    ) {
      return;
    }

    const promptKey = this.getPreferencePromptKey(false);
    if (promptKey) {
      this.dismissedPreferencePromptKeys.add(promptKey);
    }

    this.chatbotService.sendMessageStream(normalized).subscribe({
      error: () => undefined,
    });
  }

  onWizardCompleted(result: OnboardingWizardResult): void {
    const memoryUpdate: Record<string, string[]> = {
      preferredPlatforms: result.preferredPlatforms,
      likedGenres: result.likedGenres,
    };
    if (result.preferredViewingContexts.length) {
      memoryUpdate['preferredViewingContexts'] = result.preferredViewingContexts;
    }
    if (result.preferredDurations.length) {
      memoryUpdate['preferredDurations'] = result.preferredDurations;
    }

    this.chatbotService
      .updateAssistantMemory(memoryUpdate, result.preferredAutonomousCommunity)
      .subscribe({ error: () => undefined });

    this.userService
      .saveGenrePreferences(result.likedGenres, result.preferredPlatforms)
      .subscribe({ error: () => undefined });

    this.needsOnboarding = false;
  }

  onWizardSkipped(): void {
    this.needsOnboarding = false;
  }

  onMemorySaved(draft: Record<string, string[]>): void {
    this.chatbotService.updateAssistantMemory(draft).subscribe({
      next: () => {
        this.memoryEditor?.onSaveComplete();
        this.memoryEditorOpen = false;
      },
      error: () => undefined,
    });
  }

  onRemoveMemoryTag(event: { key: string; value: string }): void {
    if (!this.assistantMemory) return;
    const current = (this.assistantMemory as any)[event.key];
    if (!Array.isArray(current)) return;
    const updated = current.filter((v: string) => v !== event.value);
    this.chatbotService
      .updateAssistantMemory({ [event.key]: updated })
      .subscribe({ error: () => undefined });
  }

  getMemoryHighlights(): string[] {
    const highlights: string[] = [];

    if (this.assistantMemory?.preferredPlatforms?.length) {
      highlights.push(
        `Plataformas: ${this.assistantMemory.preferredPlatforms.slice(0, 2).join(', ')}`
      );
    }
    if (this.assistantMemory?.likedGenres?.length) {
      highlights.push(
        `Gustos: ${this.assistantMemory.likedGenres.slice(0, 2).join(', ')}`
      );
    }
    if (this.assistantMemory?.preferredViewingContexts?.length) {
      highlights.push(
        `Contexto: ${this.assistantMemory.preferredViewingContexts[0]}`
      );
    }

    return highlights.slice(0, 3);
  }

  toggleMemoryEditor(): void {
    this.memoryEditorOpen = !this.memoryEditorOpen;
  }

  trackByMessage(_index: number, message: ChatMessage): string {
    return message.id;
  }

  private getPreviousAssistantSuggestions(message: ChatMessage): Set<string> {
    const index = this.messages.findIndex((entry) => entry.id === message.id);
    if (index <= 0) {
      return new Set();
    }

    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      const previous = this.messages[cursor];
      if (previous.role !== 'assistant') {
        continue;
      }

      return new Set(
        (previous.followUpSuggestions || [])
          .map((suggestion) => this.normalize(suggestion))
          .filter(Boolean)
      );
    }

    return new Set();
  }
}
