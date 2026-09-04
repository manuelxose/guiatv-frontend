import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotRecommendation } from '../../../interfaces/chatbot.interface';
import { PlatformBadgeComponent } from '../../platform-badge/platform-badge.component';
import { AffiliateCTAComponent } from '../../affiliate-cta/affiliate-cta.component';
import { AffiliateDisclosureComponent } from '../../affiliate-disclosure/affiliate-disclosure.component';
import { AffiliateImpressionDirective } from '../../../directives/affiliate-impression.directive';
import { AffiliateResolvedOffer } from '../../../interfaces/affiliate.interface';

@Component({
  selector: 'app-chat-recommendation-card',
  standalone: true,
  imports: [
    CommonModule,
    PlatformBadgeComponent,
    AffiliateCTAComponent,
    AffiliateDisclosureComponent,
    AffiliateImpressionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .recommendation-card {
      background: var(--assistant-card-bg);
      border-color: var(--assistant-card-border);
      box-shadow: var(--assistant-card-shadow);
    }
    /* app-platform-badge is sized for looser layouts (unified-program-card);
       compact it here to fit this card's dense info column. */
    .rec-platform-badge ::ng-deep .platform-badge {
      min-height: 20px;
      gap: 0.3rem;
      padding: 0.15rem 0.5rem 0.15rem 0.3rem;
      font-size: 0.62rem;
    }
    .rec-platform-badge ::ng-deep .platform-badge__mark,
    .rec-platform-badge ::ng-deep .platform-badge img {
      width: 1rem;
      height: 1rem;
    }
  `],
  template: `
    <div
      class="recommendation-card group relative overflow-hidden rounded-2xl border transition-colors duration-200"
      [ngClass]="isLiveNow
        ? 'border-[color-mix(in_oklch,var(--accent-live)_50%,transparent)] hover:border-[var(--accent-live)]'
        : 'border-[var(--assistant-card-border)] hover:border-[var(--portal-border-strong)]'"
    >
      <!-- Live accent stripe -->
      <div
        *ngIf="isLiveNow"
        class="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[var(--accent-live)] to-[color-mix(in_oklch,var(--accent-live)_70%,black)] rounded-l-2xl"
      ></div>

      <div class="flex gap-3 p-3" [class.pl-4]="isLiveNow">
        <!-- Poster thumbnail -->
        <div
          class="relative flex h-[120px] w-[80px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--portal-surface-strong)] text-[10px] font-bold text-[var(--portal-text-muted)] ring-1 ring-white/5"
        >
          <img
            *ngIf="recommendation.image; else fallback"
            [src]="recommendation.image"
            [alt]="recommendation.title"
            width="80"
            height="120"
            class="h-full w-full object-cover"
            loading="lazy"
          />
          <ng-template #fallback>
            <div class="flex flex-col items-center gap-1">
              <svg class="h-6 w-6 text-[var(--portal-text-faint)]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v12.375M6 18.375a1.125 1.125 0 001.125 1.125h9.75a1.125 1.125 0 001.125-1.125M6 18.375V12m9 6.375V12m0 0H9m6 0a3 3 0 00-6 0" />
              </svg>
              <span class="text-center text-[9px] leading-tight text-[var(--portal-text-muted)]">
                {{ recommendation.type === 'program' ? 'TV' : 'VOD' }}
              </span>
            </div>
          </ng-template>

          <!-- Rating overlay (top-right). Deliberately fixed (not token) colors:
               this sits directly on unpredictable poster artwork, not a themed
               app surface, so it needs a fixed dark scrim + fixed bright amber
               for legibility regardless of data-theme — same reasoning as the
               user message bubble's fixed white-on-red text. -->
          <div
            *ngIf="recommendation.rating"
            class="absolute right-1 top-1 flex items-center gap-0.5 rounded-md bg-black/75 px-1 py-0.5 backdrop-blur-sm"
          >
            <svg class="h-2.5 w-2.5 text-[var(--spotify-warning)]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span class="text-[9px] font-bold text-[var(--spotify-warning)]">{{ recommendation.rating | number:'1.1-1' }}</span>
          </div>

          <!-- Live badge (top-left) -->
          <div
            *ngIf="isLiveNow"
            class="absolute left-1 top-1 rounded-md bg-[color-mix(in_oklch,var(--accent-live)_90%,transparent)] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white"
          >
            LIVE
          </div>

          <!-- Live progress bar (track stays a fixed dark scrim, same reasoning as the rating overlay above) -->
          <div
            *ngIf="isLiveNow && liveProgress > 0"
            class="absolute bottom-0 left-0 right-0 h-1 bg-black/50"
          >
            <div
              class="h-full rounded-full bg-[var(--accent-live)] transition-[width]"
              [style.width.%]="liveProgress"
            ></div>
          </div>
        </div>

        <!-- Info column -->
        <div class="min-w-0 flex-1 py-0.5">
          <!-- Title row + overflow menu trigger -->
          <div class="flex items-start gap-1">
            <p class="flex-1 text-[13px] font-semibold leading-snug text-[var(--portal-text)] line-clamp-2">
              {{ recommendation.title }}
            </p>
            <button
              type="button"
              (click)="menuOpen = !menuOpen"
              class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-[var(--portal-text-muted)] transition-colors hover:bg-[var(--portal-surface-strong)] hover:text-[var(--portal-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--guide-accent)]"
              aria-label="Más opciones"
              aria-haspopup="menu"
              [attr.aria-expanded]="menuOpen"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>
          </div>

          <!-- Platform -->
          <div class="mt-1.5 flex items-center gap-1.5 rec-platform-badge">
            <app-platform-badge
              *ngIf="platformName"
              [label]="platformName"
              [logoUrl]="recommendation.platformLogo || ''"
            />
          </div>

          <!-- Time + duration row -->
          <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
            <span
              *ngIf="timeLabel"
              class="font-medium"
              [class]="isLiveNow ? 'text-[var(--accent-live)]' : 'text-[var(--portal-text)]'"
            >
              {{ timeLabel }}
            </span>
            <span *ngIf="recommendation.durationMinutes" class="text-[var(--portal-text-muted)]">
              {{ recommendation.durationMinutes }}min
            </span>
          </div>
          <!-- Live elapsed info -->
          <div *ngIf="isLiveNow && liveElapsedLabel" class="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--portal-text-muted)]">
            <svg class="h-2.5 w-2.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 6v6l4 2"/>
            </svg>
            {{ liveElapsedLabel }}
          </div>

          <!-- Badges (max 3) -->
          <div *ngIf="displayBadges.length" class="mt-1.5 flex flex-wrap gap-1">
            <span
              *ngFor="let badge of displayBadges; trackBy: trackByText"
              class="max-w-full truncate rounded-full border border-[var(--assistant-badge-border)] bg-[var(--assistant-badge-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--assistant-badge-text)]"
              [title]="badge"
            >
              {{ badge }}
            </span>
          </div>

          <!-- Synopsis inline preview -->
          <p
            *ngIf="recommendation.synopsis && !synopsisOpen"
            class="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-[var(--portal-text-muted)]"
          >
            {{ recommendation.synopsis }}
          </p>
        </div>
      </div>

      <!-- Expanded synopsis -->
      <div
        *ngIf="synopsisOpen && recommendation.synopsis"
        class="border-t border-[var(--portal-border)]/50 px-3 py-2"
      >
        <p class="text-xs leading-relaxed text-[var(--portal-text)]">{{ recommendation.synopsis }}</p>
      </div>

      <!-- Expanded reason -->
      <div
        *ngIf="reasonOpen && recommendation.reason"
        class="border-t border-[var(--portal-border)]/50 px-3 py-2"
      >
        <p class="text-[11px] leading-relaxed text-[var(--portal-text-muted)]">
          <span class="mr-1 text-[var(--accent-editorial)]">✦</span>{{ recommendation.reason }}
        </p>
      </div>

      <!-- Action bar -->
      <div class="flex flex-wrap items-center justify-between gap-1 border-t border-[var(--portal-border)] px-2 py-2">
        <!-- Left: thumbs -->
        <div class="flex items-center gap-0.5">
          <button
            type="button"
            (click)="ratePositive.emit(recommendation)"
            class="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--portal-text-muted)] transition-colors hover:bg-[var(--accent-streaming-soft)] hover:text-[var(--accent-streaming)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--guide-accent)]"
            [attr.aria-label]="'Me gusta ' + recommendation.title"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
            </svg>
          </button>
          <button
            type="button"
            (click)="rateNegative.emit(recommendation)"
            class="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--portal-text-muted)] transition-colors hover:bg-[var(--accent-live-soft)] hover:text-[var(--accent-live)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--guide-accent)]"
            [attr.aria-label]="'No me gusta ' + recommendation.title"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
            </svg>
          </button>
        </div>

        <!-- Right: secondary actions + CTA -->
        <div class="flex items-center gap-1">
          <!-- Reason toggle -->
          <button
            *ngIf="recommendation.reason"
            type="button"
            (click)="reasonOpen = !reasonOpen; synopsisOpen = false"
            class="flex min-h-11 items-center gap-1 rounded-xl px-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--guide-accent)]"
            [class]="reasonOpen ? 'bg-[var(--accent-editorial-soft)] text-[var(--accent-editorial)]' : 'text-[var(--portal-text-muted)] hover:bg-[var(--portal-border)]/50 hover:text-[var(--portal-text)]'"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            ¿Por qué?
          </button>

          <!-- Affiliate CTA — resolved server-side, never invented by the LLM -->
          <div
            *ngIf="primaryAffiliateAction as offer"
            [appAffiliateImpression]="impressionOffer"
            [appAffiliateImpressionContext]="impressionContext"
            appAffiliateImpressionPage="chatbot"
          >
            <app-affiliate-cta
              [cta]="{ label: offer.label, sponsored: offer.sponsored }"
              [href]="offer.outboundPath"
              variant="secondary"
            ></app-affiliate-cta>
          </div>

          <!-- Ver ficha CTA -->
          <button
            type="button"
            (click)="openDetail.emit(recommendation)"
            class="flex min-h-11 min-w-[88px] items-center justify-center gap-1 rounded-xl border border-[var(--assistant-chip-selected-border)] bg-[var(--assistant-chip-selected-bg)] px-3 text-xs font-bold text-[var(--assistant-chip-selected-text)] transition-colors hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--guide-accent)]"
          >
            Ver ficha
            <svg class="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Affiliate disclosure — one line per card, only when the CTA is sponsored -->
      <div
        *ngIf="primaryAffiliateAction as offer"
        class="border-t border-[var(--portal-border)]/50 px-3 py-1.5"
      >
        <app-affiliate-disclosure [text]="offer.disclosure" [sponsored]="offer.sponsored" [compact]="true"></app-affiliate-disclosure>
      </div>

      <!-- Overflow menu -->
      <div
        *ngIf="menuOpen"
        class="absolute right-2 top-14 z-[var(--z-dropdown)] min-w-[210px] rounded-xl border border-[var(--portal-border)] bg-[var(--portal-bg-elevated)] py-1 shadow-xl"
        role="menu"
        aria-label="Acciones de la recomendación"
      >
        <button
          type="button"
          role="menuitem"
          (click)="menuOpen = false; save.emit(recommendation)"
          class="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--portal-text)] transition-colors hover:bg-[var(--portal-surface-strong)]"
        >
          <svg class="h-3.5 w-3.5 text-[var(--accent-live)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Guardar en mi lista
        </button>
        <button
          type="button"
          role="menuitem"
          (click)="menuOpen = false; followUp.emit(recommendation)"
          class="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--portal-text)] transition-colors hover:bg-[var(--portal-surface-strong)]"
        >
          <svg class="h-3.5 w-3.5 text-[var(--accent-discover)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Seguir con este título
        </button>
        <button
          type="button"
          role="menuitem"
          (click)="menuOpen = false; ignore.emit(recommendation)"
          class="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--portal-text)] transition-colors hover:bg-[var(--portal-surface-strong)]"
        >
          <svg class="h-3.5 w-3.5 text-[var(--portal-text-muted)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          No me interesa
        </button>
        <button
          *ngIf="recommendation.synopsis"
          type="button"
          role="menuitem"
          (click)="menuOpen = false; synopsisOpen = !synopsisOpen"
          class="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--portal-text)] transition-colors hover:bg-[var(--portal-surface-strong)]"
        >
          <svg class="h-3.5 w-3.5 text-[var(--portal-text-muted)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ synopsisOpen ? 'Ocultar sinopsis' : 'Ver sinopsis' }}
        </button>
        <button
          *ngIf="recommendation.startTime && !recommendation.liveNow"
          type="button"
          role="menuitem"
          (click)="menuOpen = false; remind.emit(recommendation)"
          class="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--portal-text)] transition-colors hover:bg-[var(--portal-surface-strong)]"
        >
          <svg class="h-3.5 w-3.5 text-[var(--status-warning)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Recordar
        </button>
      </div>
    </div>
  `,
})
export class ChatRecommendationCardComponent {
  @Input({ required: true }) recommendation!: ChatbotRecommendation;
  @Output() openDetail = new EventEmitter<ChatbotRecommendation>();
  @Output() save = new EventEmitter<ChatbotRecommendation>();
  @Output() followUp = new EventEmitter<ChatbotRecommendation>();
  @Output() ignore = new EventEmitter<ChatbotRecommendation>();
  @Output() ratePositive = new EventEmitter<ChatbotRecommendation>();
  @Output() rateNegative = new EventEmitter<ChatbotRecommendation>();
  @Output() remind = new EventEmitter<ChatbotRecommendation>();

  menuOpen = false;
  synopsisOpen = false;
  reasonOpen = false;

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen) return;
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.menuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen = false;
  }

  get isLiveNow(): boolean {
    if (this.recommendation.liveNow) return true;
    const scheduledTime = this.recommendation.startTime || this.recommendation.time;
    if (!scheduledTime) return false;
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return false;
    const now = new Date();
    const candidate = new Date();
    candidate.setHours(hours, minutes, 0, 0);
    return Math.abs(candidate.getTime() - now.getTime()) <= 2 * 60 * 60 * 1000 && candidate <= now;
  }

  get timeLabel(): string {
    if (this.isLiveNow) return 'En emisión';
    const t = this.recommendation.startTime || this.recommendation.time;
    if (!t) return this.recommendation.channel ? 'TV' : '';
    return t;
  }

  get liveElapsedLabel(): string {
    const start = this.recommendation.startTime || this.recommendation.time;
    if (!start) return '';
    const [h, m] = start.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return '';
    const now = new Date();
    const s = new Date();
    s.setHours(h, m, 0, 0);
    if (s > now) return '';
    const elapsedMin = Math.floor((now.getTime() - s.getTime()) / 60000);
    if (elapsedMin < 1) return `Empezó a las ${start}`;
    let elapsed: string;
    if (elapsedMin < 60) {
      elapsed = `${elapsedMin} min`;
    } else {
      const hrs = Math.floor(elapsedMin / 60);
      const mins = elapsedMin % 60;
      elapsed = mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
    }
    return `Empezó a las ${start} · lleva ${elapsed}`;
  }

  get liveProgress(): number {
    if (!this.recommendation.liveNow) return 0;
    const start = this.recommendation.startTime || this.recommendation.time;
    const end = this.recommendation.endTime;
    if (!start || !end) return 0;

    const now = new Date();
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if ([sh, sm, eh, em].some(Number.isNaN)) return 0;

    const s = new Date();
    s.setHours(sh, sm, 0, 0);
    const e = new Date();
    e.setHours(eh, em, 0, 0);
    if (e <= s) e.setDate(e.getDate() + 1);

    const total = e.getTime() - s.getTime();
    const elapsed = now.getTime() - s.getTime();
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  }

  get primaryAffiliateAction() {
    return this.recommendation.affiliateActions?.[0] ?? null;
  }

  /** Minimal `AffiliateResolvedOffer`-shaped value — the impression directive only reads `offerId`. */
  get impressionOffer(): AffiliateResolvedOffer | null {
    const action = this.primaryAffiliateAction;
    return action ? ({ offerId: action.offerId } as AffiliateResolvedOffer) : null;
  }

  get impressionContext() {
    return {
      market: 'ES' as const,
      placement: 'chatbot-answer',
      contentType: this.recommendation.type,
      contentId: this.recommendation.catalogId,
    };
  }

  get platformName(): string {
    return (
      this.recommendation.channelOrPlatform ||
      this.recommendation.channel ||
      this.recommendation.platform ||
      ''
    );
  }

  get displayBadges(): string[] {
    const norm = (v: string) =>
      String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const exclude = new Set([norm(this.timeLabel), norm(this.platformName)]);
    return (this.recommendation.badges || [])
      .filter((b) => !exclude.has(norm(b)))
      .slice(0, 3);
  }

  trackByText(_index: number, value: string): string {
    return value;
  }
}
