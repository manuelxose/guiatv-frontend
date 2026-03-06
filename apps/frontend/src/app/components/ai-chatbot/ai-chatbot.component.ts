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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { ChatMessage, ChatbotRecommendation, ChatbotService } from '../../services/chatbot.service';
import { UserService } from '../../services/user.service';
import { GenreOnboardingComponent } from '../genre-onboarding/genre-onboarding.component';

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, GenreOnboardingComponent],
  template: `
    <div class="flex h-full flex-col bg-[#0b0f14] text-slate-100">
      <header class="flex items-start justify-between border-b border-slate-800/80 px-4 py-4">
        <div>
          <p class="text-lg font-bold text-white">Asistente IA</p>
          <p class="text-xs text-slate-400">Basado en tus gustos y en la TV de hoy</p>
        </div>
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
      </header>

      <ng-container *ngIf="isAuthenticated$ | async; else loginState">
        <ng-container *ngIf="needsOnboarding; else chatState">
          <app-genre-onboarding (completed)="needsOnboarding = false"></app-genre-onboarding>
        </ng-container>
      </ng-container>

      <ng-template #chatState>
        <div #messagesContainer class="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <ng-container *ngFor="let message of messages">
            <div
              class="flex"
              [ngClass]="message.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[88%] rounded-2xl px-4 py-3"
                [ngClass]="message.role === 'user'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-100'"
              >
                <ng-container *ngIf="!message.isLoading; else loadingBubble">
                  <p class="whitespace-pre-line text-sm leading-relaxed">
                    {{ message.content }}
                  </p>

                  <div *ngIf="message.recommendations?.length" class="mt-3 space-y-2">
                    <button
                      *ngFor="let recommendation of message.recommendations"
                      type="button"
                      (click)="addRecommendationToList(recommendation)"
                      class="flex w-full items-start gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/60 p-3 text-left"
                    >
                      <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xs font-bold text-white">
                        {{ recommendation.type === 'program' ? 'TV' : 'VOD' }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-semibold text-white">
                          {{ recommendation.title }}
                        </p>
                        <p class="text-xs text-slate-400">
                          {{ recommendation.platform || recommendation.channel || 'Guia TV' }}
                          <span *ngIf="recommendation.time"> · {{ recommendation.time }}</span>
                        </p>
                        <p class="mt-1 text-xs text-slate-300">
                          {{ recommendation.reason }}
                        </p>
                      </div>
                    </button>
                  </div>

                  <div *ngIf="message.followUpSuggestions?.length" class="mt-3 flex flex-wrap gap-2">
                    <button
                      *ngFor="let suggestion of message.followUpSuggestions"
                      type="button"
                      (click)="sendSuggestion(suggestion)"
                      class="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200"
                    >
                      {{ suggestion }}
                    </button>
                  </div>
                </ng-container>

                <ng-template #loadingBubble>
                  <div class="flex items-center gap-1.5 py-1">
                    <span class="h-2 w-2 animate-pulse rounded-full bg-slate-400"></span>
                    <span class="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]"></span>
                    <span class="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]"></span>
                  </div>
                </ng-template>
              </div>
            </div>
          </ng-container>
        </div>

        <div class="border-t border-slate-800/80 p-4">
          <div class="flex items-end gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-2">
            <textarea
              [(ngModel)]="draft"
              rows="1"
              (keydown)="onKeydown($event)"
              class="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none"
              placeholder="Escribe tu pregunta..."
            ></textarea>
            <button
              type="button"
              (click)="sendMessage()"
              [disabled]="loading || !draft.trim()"
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white disabled:opacity-40"
              aria-label="Enviar mensaje"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      </ng-template>

      <ng-template #loginState>
        <div class="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p class="mb-3 text-lg font-bold text-white">Inicia sesion para usar el asistente</p>
          <p class="max-w-sm text-sm text-slate-400">
            El asistente personaliza las recomendaciones con tus generos favoritos,
            tus valoraciones y la programacion disponible.
          </p>
        </div>
      </ng-template>
    </div>
  `,
})
export class AIChatbotComponent implements AfterViewInit {
  @Output() close = new EventEmitter<void>();
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  public readonly isAuthenticated$ = this.userService.isAuthenticated$;
  public draft = '';
  public messages: ChatMessage[] = [];
  public loading = false;
  public needsOnboarding = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly userService: UserService
  ) {}

  ngAfterViewInit(): void {
    this.chatbotService.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((messages) => {
        this.messages = messages;
        queueMicrotask(() => this.scrollToBottom());
      });

    this.chatbotService.isLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => {
        this.loading = loading;
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
    if (!text || this.loading) {
      return;
    }

    this.draft = '';
    this.chatbotService.sendMessage(text).subscribe({
      error: () => undefined,
    });
  }

  sendSuggestion(text: string): void {
    this.draft = text;
    this.sendMessage();
  }

  addRecommendationToList(recommendation: ChatbotRecommendation): void {
    this.userService
      .toggleWatchlistItem({
        contentId: String(recommendation.tmdbId || recommendation.title),
        title: recommendation.title,
        type: recommendation.type,
      })
      .subscribe();
  }

  private scrollToBottom(): void {
    if (!this.messagesContainer) {
      return;
    }

    const element = this.messagesContainer.nativeElement;
    element.scrollTop = element.scrollHeight;
  }
}
