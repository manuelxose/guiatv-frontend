import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import {
  AssistantMemorySnapshot,
  ChatMessage,
  ChatbotRecommendation,
  ChatbotRequestState,
  ChatbotService,
  ChatbotSessionState,
} from '../../services/chatbot.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex h-full flex-col overflow-hidden bg-[#0b0f14] text-slate-100">
      <header class="border-b border-slate-800/80 bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.92))] px-5 py-4 backdrop-blur-xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-lg font-bold text-white">Asistente IA</p>
              <span class="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-100">
                Premium
              </span>
            </div>
            <p class="mt-1 text-xs text-slate-400">Parrilla real, streaming real y memoria útil de tus gustos</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              *ngIf="sessionState === 'authenticated'"
              type="button"
              (click)="startNewConversation()"
              class="min-h-[36px] rounded-xl border border-slate-700 px-3 text-xs font-semibold text-slate-200"
            >
              Nueva
            </button>
            <button
              type="button"
              (click)="close.emit()"
              class="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-white"
              aria-label="Cerrar asistente"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div
          *ngIf="sessionState === 'authenticated' && getMemoryHighlights().length"
          class="mt-3 flex flex-wrap gap-2"
        >
          <span
            *ngFor="let highlight of getMemoryHighlights(); trackBy: trackByText"
            class="rounded-full border border-slate-700/80 bg-slate-900/70 px-2.5 py-1 text-[10px] font-medium text-slate-200"
          >
            {{ highlight }}
          </span>
        </div>
      </header>

      <ng-container *ngIf="sessionState === 'unauthenticated'; else authenticatedShell">
        <div class="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p class="mb-3 text-lg font-bold text-white">Inicia sesión para usar el asistente</p>
          <p class="max-w-sm text-sm text-slate-400">
            El asistente cruza tus gustos con la parrilla real y tus plataformas para responder con datos, no con plantillas.
          </p>

          <div class="mt-6 flex max-w-sm flex-wrap justify-center gap-2">
            <span
              *ngFor="let suggestion of previewSuggestions"
              class="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300"
            >
              {{ suggestion }}
            </span>
          </div>

          <button
            type="button"
            (click)="goToLogin()"
            class="mt-6 min-h-[44px] rounded-xl bg-red-600 px-5 text-sm font-semibold text-white"
          >
            Iniciar sesión
          </button>
        </div>
      </ng-container>

      <ng-template #authenticatedShell>
        <div
          *ngIf="sessionState === 'unknown' || sessionState === 'refreshing'"
          class="mx-4 mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300"
        >
          Recuperando tu sesión y tus preferencias…
        </div>

        <div
          *ngIf="chatState === 'unavailable'"
          class="mx-4 mt-4 flex items-start justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
        >
          <p>El asistente está temporalmente limitado. Puedes reintentar o cambiar la consulta.</p>
          <button
            type="button"
            (click)="retryHistory()"
            class="rounded-lg border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-50"
          >
            Reintentar
          </button>
        </div>

        <div
          *ngIf="needsOnboarding"
          class="mx-4 mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100"
        >
          <p class="font-semibold text-white">Mejoraré mucho si completas tus gustos.</p>
          <p class="mt-1 text-sky-100/90">
            Puedes escribirme tus géneros y plataformas favoritas aquí o ajustarlos desde tu perfil.
          </p>
          <button
            type="button"
            (click)="goToAccountSettings()"
            class="mt-3 min-h-[36px] rounded-xl border border-sky-400/30 px-3 text-xs font-semibold text-sky-50"
          >
            Abrir ajustes
          </button>
        </div>

        <div
          #messagesContainer
          class="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(185,28,28,0.10),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(11,15,20,0.98))] px-4 py-4 md:px-5 md:py-5"
        >
          <ng-container *ngFor="let message of messages; trackBy: trackByMessage">
            <div
              class="flex"
              [ngClass]="message.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[94%] rounded-[1.4rem] px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.28)] md:max-w-[88%]"
                [ngClass]="message.role === 'user'
                  ? 'bg-gradient-to-br from-red-600 to-red-700 text-white'
                  : 'border border-slate-800/90 bg-slate-900/96 text-slate-100'"
              >
                <ng-container *ngIf="!message.isLoading; else loadingBubble">
                  <p class="whitespace-pre-line text-sm leading-relaxed">
                    {{ message.content }}
                  </p>

                  <div *ngIf="message.recommendations?.length" class="mt-4 rounded-[1.4rem] border border-slate-800/90 bg-slate-950/70 p-3 md:p-4">
                    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <span
                          class="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                          [ngClass]="message.queryContext?.mode === 'tv_now'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                            : message.queryContext?.mode === 'tv_tonight'
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                              : 'border-sky-500/30 bg-sky-500/10 text-sky-100'"
                        >
                          {{ getContextBadge(message) }}
                        </span>
                        <span
                          *ngIf="getResultSummary(message)"
                          class="text-[11px] font-medium text-slate-400"
                        >
                          {{ getResultSummary(message) }}
                        </span>
                      </div>
                      <button
                        *ngIf="getHiddenRecommendationsCount(message) > 0"
                        type="button"
                        (click)="toggleMore(message.id)"
                        class="min-h-[32px] rounded-full border border-slate-700 bg-slate-900/80 px-3 text-[11px] font-semibold text-slate-100"
                      >
                        {{ isExpanded(message.id) ? 'Mostrar menos' : 'Ver más (' + getHiddenRecommendationsCount(message) + ')' }}
                      </button>
                    </div>

                    <div
                      class="space-y-2"
                      [ngClass]="isExpanded(message.id) && getHiddenRecommendationsCount(message) > 0 ? 'max-h-[22rem] overflow-y-auto pr-1' : ''"
                    >
                      <div
                        *ngFor="let recommendation of getVisibleRecommendations(message); trackBy: trackByRecommendation"
                        class="rounded-[1.35rem] border border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.82))] p-3 md:p-4"
                      >
                        <div class="flex items-start gap-3">
                          <div class="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-800 text-xs font-bold text-white ring-1 ring-white/5">
                            <img
                              *ngIf="recommendation.image; else recommendationFallback"
                              [src]="recommendation.image"
                              [alt]="recommendation.title"
                              class="h-full w-full object-cover"
                              loading="lazy"
                            />
                            <ng-template #recommendationFallback>
                              {{ recommendation.type === 'program' ? 'TV' : 'VOD' }}
                            </ng-template>
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap items-start justify-between gap-2">
                              <p class="min-w-0 flex-1 text-sm font-semibold leading-snug text-white break-words md:text-[15px]">
                                {{ recommendation.title }}
                              </p>
                            </div>
                            <div class="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                class="rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                                [ngClass]="getRecommendationState(recommendation).startsWith('En emisión')
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                  : 'border-slate-700 bg-slate-800 text-slate-300'"
                              >
                                {{ getRecommendationState(recommendation) }}
                              </span>
                              <span class="text-xs font-medium text-slate-200">
                                {{ recommendation.startTime || recommendation.time || 'Sin hora' }}
                              </span>
                              <span class="text-xs text-slate-400">
                                {{ recommendation.channelOrPlatform || recommendation.channel || recommendation.platform || 'Guía TV' }}
                              </span>
                            </div>
                            <p
                              *ngIf="recommendation.subtitle"
                              class="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500"
                            >
                              {{ recommendation.subtitle }}
                            </p>
                            <p class="mt-2 text-xs leading-relaxed text-slate-300">
                              {{ recommendation.reason }}
                            </p>
                            <div *ngIf="recommendation.badges?.length" class="mt-2 flex flex-wrap gap-1.5">
                              <span
                                *ngFor="let badge of recommendation.badges; trackBy: trackByText"
                                class="rounded-full border border-slate-700 bg-slate-950/80 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                              >
                                {{ badge }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div class="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            (click)="openRecommendation(recommendation)"
                            [attr.aria-label]="'Abrir ficha de ' + recommendation.title"
                            class="min-h-[36px] rounded-full border border-slate-700 px-3 text-xs font-semibold text-slate-100"
                          >
                            Ver ficha
                          </button>
                          <button
                            type="button"
                            (click)="saveRecommendation(recommendation)"
                            [attr.aria-label]="'Guardar ' + recommendation.title + ' en mi lista'"
                            class="min-h-[36px] rounded-full border border-red-500/40 bg-red-500/10 px-3 text-xs font-semibold text-red-100"
                          >
                            Guardar en mi lista
                          </button>
                          <button
                            type="button"
                            (click)="askAboutTitle(recommendation)"
                            [attr.aria-label]="'Seguir preguntando por ' + recommendation.title"
                            class="min-h-[36px] rounded-full border border-slate-700 bg-slate-800/70 px-3 text-xs font-semibold text-slate-200"
                          >
                            Seguir con este título
                          </button>
                          <button
                            type="button"
                            (click)="ignoreRecommendation(recommendation)"
                            [attr.aria-label]="'Marcar que no te interesa ' + recommendation.title"
                            class="min-h-[36px] rounded-full border border-slate-800 bg-slate-950/80 px-3 text-xs font-semibold text-slate-400"
                          >
                            No me interesa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    *ngIf="shouldShowAutonomicPrompt(message)"
                    class="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/60 p-3"
                  >
                    <p class="text-xs leading-relaxed text-slate-300">
                      {{ getAutonomicPromptText(message) }}
                    </p>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <ng-container *ngIf="getSavedCommunity(message) as community; else chooseCommunityBtn">
                        <button
                          type="button"
                          (click)="useSavedCommunity(message)"
                          class="min-h-[34px] rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-100"
                        >
                          Usar {{ community }}
                        </button>
                        <button
                          type="button"
                          (click)="toggleCommunityChooser(message.id)"
                          class="min-h-[34px] rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs font-semibold text-slate-100"
                        >
                          Cambiar comunidad
                        </button>
                        <button
                          type="button"
                          (click)="declineAutonomics()"
                          class="min-h-[34px] rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs font-semibold text-slate-300"
                        >
                          No incluir autonómicas
                        </button>
                      </ng-container>
                      <ng-template #chooseCommunityBtn>
                        <button
                          type="button"
                          (click)="toggleCommunityChooser(message.id)"
                          class="min-h-[34px] rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-100"
                        >
                          Elegir comunidad
                        </button>
                        <button
                          type="button"
                          (click)="declineAutonomics()"
                          class="min-h-[34px] rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs font-semibold text-slate-300"
                        >
                          No incluir autonómicas
                        </button>
                      </ng-template>
                    </div>

                    <div *ngIf="communityChooserMessageId === message.id" class="mt-3 flex flex-wrap gap-2">
                      <button
                        *ngFor="let community of autonomousCommunities"
                        type="button"
                        (click)="selectCommunity(community)"
                        class="min-h-[34px] rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs font-medium text-slate-200"
                      >
                        {{ community }}
                      </button>
                    </div>
                  </div>

                  <div *ngIf="message.id !== 'welcome' && getMessageSuggestions(message).length" class="mt-3 flex flex-wrap gap-2">
                    <button
                      *ngFor="let suggestion of getMessageSuggestions(message); trackBy: trackByText"
                      type="button"
                      (click)="useSuggestion(suggestion)"
                      class="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200"
                    >
                      {{ suggestion }}
                    </button>
                  </div>
                </ng-container>

                <ng-template #loadingBubble>
                  <div class="flex items-center gap-1.5 py-1">
                    <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-slate-400"></span>
                    <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]"></span>
                    <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]"></span>
                  </div>
                </ng-template>
              </div>
            </div>
          </ng-container>
        </div>

        <div class="border-t border-slate-800/80 bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.96))] p-4 backdrop-blur-xl">
          <div
            *ngIf="getPreferencePrompt() as preferencePrompt"
            class="mb-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Para afinar mejor
                </p>
                <p class="mt-1 text-sm text-slate-100">{{ preferencePrompt }}</p>
              </div>
              <button
                type="button"
                (click)="dismissPreferencePrompt()"
                class="min-h-[32px] rounded-full border border-slate-700 bg-slate-950/80 px-3 text-[11px] font-semibold text-slate-300"
              >
                Más tarde
              </button>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                *ngFor="let option of getPreferenceOptions(); trackBy: trackByText"
                type="button"
                (click)="sendQuickMessage(option)"
                class="min-h-[34px] rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs font-medium text-slate-200"
              >
                {{ option }}
              </button>
            </div>
          </div>

          <div class="flex items-end gap-2 rounded-[1.35rem] border border-slate-700 bg-slate-900/90 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <textarea
              #chatInput
              [(ngModel)]="draft"
              rows="1"
              (keydown)="onKeydown($event)"
              [disabled]="sessionState !== 'authenticated' || chatState === 'sending'"
              class="max-h-32 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Pregúntame qué hay ahora, qué merece la pena esta noche o qué ver en tus plataformas"
            ></textarea>
            <button
              type="button"
              (click)="sendMessage()"
              [disabled]="sessionState !== 'authenticated' || chatState === 'sending' || !draft.trim()"
              class="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white transition-transform disabled:opacity-40"
              aria-label="Enviar mensaje"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class AIChatbotComponent implements AfterViewInit {
  @Output() close = new EventEmitter<void>();
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('chatInput') private chatInput?: ElementRef<HTMLTextAreaElement>;

  public draft = '';
  public messages: ChatMessage[] = [];
  public needsOnboarding = false;
  public sessionState: ChatbotSessionState = 'unknown';
  public chatState: ChatbotRequestState = 'login_required';
  public previewSuggestions: string[] = [];
  public assistantMemory: AssistantMemorySnapshot | null = null;
  public communityChooserMessageId: string | null = null;
  public expandedMessageIds = new Set<string>();
  public dismissedPreferencePromptKeys = new Set<string>();
  public readonly autonomousCommunities = [
    'Andalucía',
    'Aragón',
    'Asturias',
    'Baleares',
    'Canarias',
    'Castilla-La Mancha',
    'Castilla y León',
    'Cataluña',
    'Comunidad Valenciana',
    'Extremadura',
    'Galicia',
    'Madrid',
    'Murcia',
    'Navarra',
    'País Vasco',
  ];

  private readonly destroyRef = inject(DestroyRef);

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
        this.communityChooserMessageId = null;
        queueMicrotask(() => this.scrollToBottom());
      });

    this.chatbotService.memory$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((memory) => {
        this.assistantMemory = memory;
      });

    this.chatbotService.sessionState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.sessionState = state;
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
        queueMicrotask(() => this.scrollToBottom());
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

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const text = this.draft.trim();
    if (
      !text ||
      this.chatState === 'sending' ||
      this.sessionState !== 'authenticated'
    ) {
      return;
    }

    this.draft = '';
    this.chatbotService.sendMessage(text).subscribe({
      error: () => undefined,
    });
  }

  useSuggestion(text: string): void {
    const normalized = text.trim();
    if (!normalized) {
      return;
    }

    if (this.draft.trim() === normalized) {
      this.sendMessage();
      return;
    }

    this.draft = normalized;
    queueMicrotask(() => this.chatInput?.nativeElement.focus());
  }

  toggleCommunityChooser(messageId: string): void {
    this.communityChooserMessageId =
      this.communityChooserMessageId === messageId ? null : messageId;
  }

  useSavedCommunity(message: ChatMessage): void {
    const savedCommunity = this.getSavedCommunity(message);
    if (!savedCommunity) {
      return;
    }

    this.communityChooserMessageId = null;
    this.sendQuickMessage(`Sí, usa ${savedCommunity} para las autonómicas`);
  }

  selectCommunity(community: string): void {
    this.communityChooserMessageId = null;
    this.sendQuickMessage(`Mi comunidad es ${community}. Incluye autonómicas`);
  }

  declineAutonomics(): void {
    this.communityChooserMessageId = null;
    this.sendQuickMessage('No incluyas autonómicas');
  }

  openRecommendation(recommendation: ChatbotRecommendation): void {
    this.chatbotService
      .trackRecommendationAction('open_recommendation', recommendation)
      .subscribe();

    if (recommendation.detailPath) {
      void this.router.navigateByUrl(recommendation.detailPath);
      return;
    }

    if (recommendation.catalogId) {
      void this.router.navigate(['/contenido', recommendation.catalogId]);
      return;
    }

    this.draft = `Cuéntame más sobre ${recommendation.title}`;
    queueMicrotask(() => this.chatInput?.nativeElement.focus());
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
    this.draft = `Quiero algo parecido a ${recommendation.title}`;
    queueMicrotask(() => this.chatInput?.nativeElement.focus());
  }

  ignoreRecommendation(recommendation: ChatbotRecommendation): void {
    this.chatbotService
      .trackRecommendationAction('ignore_recommendation', recommendation)
      .subscribe();
  }

  retryHistory(): void {
    this.chatbotService.hydrateConversation(true).subscribe({
      error: () => undefined,
    });
  }

  startNewConversation(): void {
    this.chatbotService.clearHistory().subscribe({
      next: () => {
        this.draft = '';
        queueMicrotask(() => this.chatInput?.nativeElement.focus());
      },
      error: () => undefined,
    });
  }

  goToLogin(): void {
    this.close.emit();
    void this.router.navigate(['/iniciar-sesion']);
  }

  goToAccountSettings(): void {
    this.close.emit();
    void this.router.navigate(['/mi-cuenta'], {
      queryParams: { tab: 'settings' },
    });
  }

  private scrollToBottom(): void {
    if (!this.messagesContainer) {
      return;
    }

    const element = this.messagesContainer.nativeElement;
    element.scrollTop = element.scrollHeight;
  }

  toggleMore(messageId: string): void {
    if (this.expandedMessageIds.has(messageId)) {
      this.expandedMessageIds.delete(messageId);
      return;
    }

    this.expandedMessageIds.add(messageId);
    queueMicrotask(() => this.scrollToBottom());
  }

  isExpanded(messageId: string): boolean {
    return this.expandedMessageIds.has(messageId);
  }

  getVisibleRecommendations(message: ChatMessage): ChatbotRecommendation[] {
    const top = message.recommendations || [];
    if (!message.moreRecommendations?.length || !this.isExpanded(message.id)) {
      return top;
    }

    return top.concat(message.moreRecommendations);
  }

  getHiddenRecommendationsCount(message: ChatMessage): number {
    return message.moreRecommendations?.length || 0;
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
    } else if (!(this.assistantMemory?.negativeSignals || []).length) {
      key = 'avoid';
    } else if (!(this.assistantMemory?.preferredDurations || []).length) {
      key = 'duration';
    } else if (!(this.assistantMemory?.preferredViewingContexts || []).length) {
      key = 'context';
    } else if (!(this.assistantMemory?.favoriteFranchisesOrTitles || []).length) {
      key = 'titles';
    } else if (
      this.messages.some((message) => Boolean(message.queryContext?.hasAutonomicMatches)) &&
      !this.assistantMemory?.preferredAutonomousCommunity
    ) {
      key = 'community';
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
        return '¿Qué plataformas usas más? Lo guardo para priorizar mejor streaming frente a TV.';
      case 'genres':
        return '¿Qué géneros te suelen apetecer más? Me sirve para priorizar mejor entre cine, series y tonos.';
      case 'avoid':
        return '¿Hay algo que prefieras evitar casi siempre? Por ejemplo terror, deportes o realities.';
      case 'duration':
        return '¿Sueles preferir algo corto o te encajan también películas largas?';
      case 'context':
        return '¿Buscas más planes para ver solo, en pareja o en familia?';
      case 'titles':
        return '¿Qué serie, película o saga te encanta? Así afino mejor por referencias reales.';
      case 'community':
        return 'Si quieres incluir autonómicas cuando toque, dime tu comunidad autónoma y la recordaré.';
      default:
        return '';
    }
  }

  getPreferenceOptions(): string[] {
    switch (this.getPreferencePromptKey()) {
      case 'platforms':
        return ['Uso Netflix y Prime Video', 'Tengo Movistar+ y Max', 'Ahora mismo prefiero TV'];
      case 'genres':
        return ['Me van más las series', 'Prefiero cine y thriller', 'Suelo buscar comedia y drama'];
      case 'avoid':
        return ['Sin terror', 'Sin deportes', 'Sin realities'];
      case 'duration':
        return ['Prefiero algo corto', 'También me van pelis largas', 'Mejor episodios de 30 minutos'];
      case 'context':
        return ['Para ver solo', 'En pareja', 'En familia'];
      case 'community':
        return ['Andalucía', 'Madrid', 'Cataluña'];
      default:
        return ['Me encantó Succession', 'Me gusta The Bear', 'Me van los thrillers'];
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
    return `${context.totalMatches} ${noun} · ${context.answerWindowLabel}`;
  }

  getContextBadge(message: ChatMessage): string {
    switch (message.queryContext?.mode) {
      case 'tv_now':
        return 'Ahora';
      case 'tv_tonight':
        return 'Esta noche';
      case 'streaming':
        return 'Streaming';
      default:
        return 'Asistente';
    }
  }

  getRecommendationState(recommendation: ChatbotRecommendation): string {
    if (recommendation.liveNow) {
      return 'En emisión ahora';
    }

    const scheduledTime = recommendation.startTime || recommendation.time;
    if (!scheduledTime) {
      return recommendation.channel ? 'TV' : 'Streaming';
    }

    const now = new Date();
    const [hours, minutes] = scheduledTime.split(':').map((value) => Number(value));
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return scheduledTime;
    }

    const candidate = new Date();
    candidate.setHours(hours, minutes, 0, 0);

    if (Math.abs(candidate.getTime() - now.getTime()) <= 2 * 60 * 60 * 1000 && candidate <= now) {
      return 'En emisión ahora';
    }

    return `Empieza a las ${scheduledTime}`;
  }

  private getLatestUserMessage(): string {
    const latest = [...this.messages].reverse().find((message) => message.role === 'user');
    return latest?.content || '';
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

    this.draft = '';
    this.chatbotService.sendMessage(normalized).subscribe({
      error: () => undefined,
    });
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

  trackByMessage(_index: number, message: ChatMessage): string {
    return message.id;
  }

  trackByRecommendation(_index: number, recommendation: ChatbotRecommendation): string {
    return [
      recommendation.catalogId || recommendation.detailPath || '',
      recommendation.title,
      recommendation.channelOrPlatform || recommendation.channel || recommendation.platform || '',
      recommendation.startTime || recommendation.time || '',
    ]
      .filter(Boolean)
      .join('::');
  }

  trackByText(_index: number, value: string): string {
    return value;
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
