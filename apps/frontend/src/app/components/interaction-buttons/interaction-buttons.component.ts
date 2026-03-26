import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { Router } from '@angular/router';
import { ChatConversation } from '../../interfaces/user.interface';
import { normalizeCatalogInteractionId } from '../../utils/catalog';

@Component({
  selector: 'app-interaction-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative flex items-center flex-wrap" [class.gap-1.5]="compact" [class.gap-3]="!compact">
      <!-- Watchlist Button -->
      <button
        (click)="toggleWatchlist()"
        [title]="isInWatchlist ? 'Quitar de mi lista' : 'Añadir a mi lista'"
        class="flex items-center border transition-all duration-150"
        [ngClass]="{
          'h-9 w-9 justify-center rounded-xl': compact,
          'gap-2 px-4 py-2 rounded-full': !compact,
          'bg-red-600/15 border-red-500/40': isInWatchlist,
          'bg-slate-800/70 hover:bg-slate-700 border-slate-700/60': !isInWatchlist
        }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          [class.h-5]="!compact" [class.w-5]="!compact"
          [class.h-4]="compact" [class.w-4]="compact"
          [ngClass]="isInWatchlist ? 'text-red-400' : 'text-slate-300'"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
        </svg>
        <span *ngIf="!compact" class="text-sm font-medium" [ngClass]="isInWatchlist ? 'text-red-300' : 'text-slate-300'">
          {{ isInWatchlist ? 'En lista' : 'Mi lista' }}
        </span>
      </button>

      <!-- Recommend Button -->
      <button
        (click)="showModal = true"
        title="Recomendar a amigos"
        class="flex items-center border border-slate-700/60 bg-slate-800/70 hover:bg-slate-700 transition-all duration-150"
        [ngClass]="{
          'h-9 w-9 justify-center rounded-xl': compact,
          'gap-2 px-4 py-2 rounded-full': !compact
        }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          class="text-slate-300"
          [class.h-5]="!compact" [class.w-5]="!compact"
          [class.h-4]="compact" [class.w-4]="compact"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
        </svg>
        <span *ngIf="!compact" class="text-sm font-medium text-slate-300">Recomendar</span>
      </button>

      <!-- Watching Button -->
      <button
        (click)="markAsWatching()"
        title="Marcar como viendo"
        class="flex items-center border transition-all duration-150"
        [ngClass]="{
          'h-9 w-9 justify-center rounded-xl': compact,
          'gap-2 px-4 py-2 rounded-full': !compact,
          'bg-emerald-600/15 border-emerald-500/40': isWatching,
          'bg-slate-800/70 hover:bg-slate-700 border-slate-700/60': !isWatching
        }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          [class.h-5]="!compact" [class.w-5]="!compact"
          [class.h-4]="compact" [class.w-4]="compact"
          [ngClass]="isWatching ? 'text-emerald-300' : 'text-slate-300'"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.55-2.27A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.89L15 14m-9 4h8a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <span *ngIf="!compact" class="text-sm font-medium" [ngClass]="isWatching ? 'text-emerald-200' : 'text-slate-300'">
          {{ isWatching ? 'Viendo' : 'Estoy viendo' }}
        </span>
      </button>

      <!-- Rate Button -->
      <button
        (click)="showRatingPanel = !showRatingPanel"
        title="Valorar"
        class="flex items-center border border-slate-700/60 bg-slate-800/70 hover:bg-slate-700 transition-all duration-150"
        [ngClass]="{
          'h-9 w-9 justify-center rounded-xl': compact,
          'gap-2 px-4 py-2 rounded-full': !compact
        }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          [class.h-5]="!compact" [class.w-5]="!compact"
          [class.h-4]="compact" [class.w-4]="compact"
          class="text-slate-300"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
        <span *ngIf="!compact" class="text-sm font-medium text-slate-300">
          {{ currentRating ? currentRating + '/10' : 'Valorar' }}
        </span>
      </button>

      <!-- Share to Chat Button -->
      <button
        (click)="shareToChat()"
        title="Compartir por chat"
        class="flex items-center border border-slate-700/60 bg-slate-800/70 hover:bg-slate-700 transition-all duration-150"
        [ngClass]="{
          'h-9 w-9 justify-center rounded-xl': compact,
          'gap-2 px-4 py-2 rounded-full': !compact
        }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          class="text-slate-300"
          [class.h-5]="!compact" [class.w-5]="!compact"
          [class.h-4]="compact" [class.w-4]="compact"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5m8-2a9 9 0 11-18 0a9 9 0 0118 0z"/>
        </svg>
        <span *ngIf="!compact" class="text-sm font-medium text-slate-300">Compartir chat</span>
      </button>

      <!-- Rating Panel -->
      <div
        *ngIf="showRatingPanel"
        class="absolute bottom-full left-0 z-20 mb-2 w-[min(20rem,90vw)] rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl"
      >
        <p class="mb-3 text-xs text-slate-400">¿Cuánto te gustó?</p>
        <div class="flex flex-wrap gap-1">
          <button
            *ngFor="let star of ratings"
            type="button"
            (click)="rate(star)"
            (mouseenter)="hoveredRating = star"
            (mouseleave)="hoveredRating = 0"
            class="h-7 w-7 rounded text-sm font-bold transition-colors"
            [ngClass]="(hoveredRating || currentRating) >= star ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'"
          >
            {{ star }}
          </button>
        </div>
        <div class="mt-3 flex gap-2">
          <button type="button" (click)="markAsSeen()" class="text-xs text-slate-400 hover:text-white">
            Solo marcar como visto
          </button>
        </div>
      </div>
    </div>

    <!-- Recommendation Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button (click)="showModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-white">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <h3 class="text-xl font-bold text-white mb-4">Recomendar a amigos</h3>
        <p class="text-slate-300 text-sm mb-6">Comparte "{{ title }}" con tus seguidores.</p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Nota (opcional)</label>
            <textarea
              #noteInput
              rows="3"
              class="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              placeholder="¿Por qué te ha gustado?"
            ></textarea>
          </div>
          <button
            (click)="submitRecommendation(noteInput.value)"
            class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Enviar recomendación
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class InteractionButtonsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() itemId: string = '';
  @Input() title: string = '';
  @Input() type: 'movie' | 'series' | 'program' = 'program';
  @Input() compact: boolean = false;
  @Input() tmdbId?: number;
  @Input() genres: string[] = [];
  @Input() image?: string;
  @Input() platform?: string;
  @Input() preloadInteraction: boolean = false;

  public isInWatchlist = false;
  public isWatching = false;
  public showModal = false;
  public showRatingPanel = false;
  public currentRating = 0;
  public hoveredRating = 0;
  public readonly ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  private sub = new Subscription();
  private generalConversationId: string | null = null;

  constructor(
    private userService: UserService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub.add(
      this.userService.getWatchlist().subscribe((items) => {
        if (!this.itemId) return;
        const normalizedId = this.getNormalizedItemId();
        this.isInWatchlist = items.some((item) => item.contentId === normalizedId);
      })
    );

    this.sub.add(
      this.userService.getInteractionHistory().subscribe((interactions) => {
        const normalizedId = this.getNormalizedItemId();
        if (!normalizedId) return;
        const interaction =
          interactions.find((entry) => entry.contentId === normalizedId) ||
          this.userService.peekContentInteraction(normalizedId);
        this.applyInteractionState(interaction);
      })
    );

    this.sub.add(
      this.chatService.getConversations().subscribe((conversations) => {
        this.generalConversationId = this.findGeneralConversationId(conversations);
      })
    );

    if (this.preloadInteraction) {
      this.loadCurrentInteraction();
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['itemId'] && !changes['itemId'].firstChange) || changes['preloadInteraction']) {
      const interaction = this.userService.peekContentInteraction(this.getNormalizedItemId());
      this.applyInteractionState(interaction);
    }

    if (this.preloadInteraction && changes['itemId'] && !changes['itemId'].firstChange) {
      this.loadCurrentInteraction();
    }
  }

  toggleWatchlist() {
    if (!this.title) return;
    const payload = {
      contentId: this.itemId || '',
      title: this.title,
      type: this.type,
    };
    this.userService.toggleWatchlistItem(payload).subscribe((inWatchlist) => {
      if (inWatchlist !== null) {
        this.isInWatchlist = inWatchlist;
        if (inWatchlist) {
          this.userService
            .addContentInteraction({
              contentId: this.itemId,
              contentTitle: this.title,
              contentType: this.type,
              tmdbId: this.tmdbId,
              genres: this.genres,
              status: 'pending',
            })
            .subscribe();
        }
      }
    });
  }

  submitRecommendation(note: string) {
    this.userService
      .addRecommendation({
        title: this.title,
        type: this.type,
        visibility: 'friends',
        note: note,
      })
      .subscribe({
        next: () => {
          this.showModal = false;
          this.userService
            .addContentInteraction({
              contentId: this.itemId,
              contentTitle: this.title,
              contentType: this.type,
              tmdbId: this.tmdbId,
              genres: this.genres,
              status: 'pending',
            })
            .subscribe();
        },
      });
  }

  rate(stars: number) {
    this.userService
      .addContentInteraction({
        contentId: this.itemId,
        contentTitle: this.title,
        contentType: this.type,
        tmdbId: this.tmdbId,
        genres: this.genres,
        rating: stars,
        status: 'seen',
      })
      .subscribe((saved) => {
        if (!saved) return;
        this.currentRating = stars;
        this.isWatching = false;
        this.showRatingPanel = false;
      });
  }

  markAsSeen() {
    this.userService
      .addContentInteraction({
        contentId: this.itemId,
        contentTitle: this.title,
        contentType: this.type,
        tmdbId: this.tmdbId,
        genres: this.genres,
        status: 'seen',
      })
      .subscribe(() => {
        this.isWatching = false;
        this.showRatingPanel = false;
      });
  }

  markAsWatching() {
    this.userService
      .addContentInteraction({
        contentId: this.itemId,
        contentTitle: this.title,
        contentType: this.type,
        tmdbId: this.tmdbId,
        genres: this.genres,
        status: 'watching',
        platform: this.platform,
      })
      .subscribe((saved) => {
        if (!saved) return;
        this.userService
          .updateWatchingNow({
            title: this.title,
            mood: 'Viéndolo ahora',
            visibility: 'friends',
          })
          .subscribe();
        this.isWatching = true;
      });
  }

  shareToChat() {
    if (!this.userService.isAuthenticatedSync()) {
      void this.router.navigate(['/iniciar-sesion']);
      return;
    }

    if (!this.generalConversationId) {
      void this.router.navigate(['/comunidad'], {
        queryParams: { tab: 'chat', share: this.itemId || this.title },
      });
      return;
    }

    this.chatService
      .sendMessage(
        this.generalConversationId,
        `Estoy viendo ${this.title}`,
        'recommendation',
        {
          id: this.itemId,
          title: this.title,
          image: this.image,
          platform: this.platform || '',
          type: this.type,
        }
      )
      .subscribe(() => {
        this.userService
          .addContentInteraction({
            contentId: this.itemId,
            contentTitle: this.title,
            contentType: this.type,
            tmdbId: this.tmdbId,
            genres: this.genres,
            status: 'watching',
            recommended: true,
            platform: this.platform,
          })
          .subscribe();
      });
  }

  private loadCurrentInteraction() {
    const normalizedId = this.getNormalizedItemId();
    if (!normalizedId) return;
    this.sub.add(
      this.userService.getContentInteraction(normalizedId).subscribe((interaction) => {
        this.applyInteractionState(interaction);
      })
    );
  }

  private applyInteractionState(interaction: any): void {
    this.currentRating = Number(interaction?.rating || 0);
    this.isWatching = interaction?.status === 'watching';
  }

  private getNormalizedItemId(): string {
    if (!this.itemId) {
      return '';
    }

    return normalizeCatalogInteractionId({
      contentId: this.itemId,
      contentType: this.type,
      tmdbId: this.tmdbId,
    });
  }

  private findGeneralConversationId(conversations: ChatConversation[]): string | null {
    const general = (conversations || []).find((conversation) => {
      if (conversation.groupName?.toLowerCase() === 'chat general') {
        return true;
      }
      return conversation.participants?.[0]?.id === 'general';
    });

    return general?.id || null;
  }
}
