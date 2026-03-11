import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotRecommendation } from '../../../interfaces/chatbot.interface';

@Component({
  selector: 'app-chat-recommendation-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="group relative rounded-2xl border border-slate-700/60 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.84))] transition-colors hover:border-slate-600/80"
    >
      <div class="flex gap-3 p-2.5">
        <!-- Poster thumbnail -->
        <div
          class="relative flex h-[110px] w-[75px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800 text-[10px] font-bold text-slate-400 ring-1 ring-white/5"
        >
          <img
            *ngIf="recommendation.image; else fallback"
            [src]="recommendation.image"
            [alt]="recommendation.title"
            class="h-full w-full object-cover"
            loading="lazy"
          />
          <ng-template #fallback>
            <span class="text-center leading-tight">
              {{ recommendation.type === 'program' ? 'TV' : 'VOD' }}
            </span>
          </ng-template>

          <!-- Live progress bar overlay -->
          <div
            *ngIf="isLiveNow && liveProgress > 0"
            class="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/80"
          >
            <div
              class="h-full rounded-full bg-emerald-400 transition-all"
              [style.width.%]="liveProgress"
            ></div>
          </div>
        </div>

        <!-- Info column -->
        <div class="min-w-0 flex-1 py-0.5">
          <!-- Title row + overflow menu trigger -->
          <div class="flex items-start gap-1">
            <p
              class="flex-1 text-[13px] font-semibold leading-snug text-white line-clamp-2"
            >
              {{ recommendation.title }}
            </p>
            <button
              type="button"
              (click)="menuOpen = !menuOpen"
              class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white"
              aria-label="Más opciones"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>
          </div>

          <!-- Meta row: state badge + time + platform -->
          <div class="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              class="rounded-full border px-1.5 py-px text-[9px] font-semibold whitespace-nowrap"
              [ngClass]="
                isLiveNow
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              "
            >
              {{ stateLabel }}
            </span>
            <span class="text-[11px] text-slate-300">
              {{
                recommendation.startTime ||
                  recommendation.time ||
                  ''
              }}
            </span>
          </div>

          <!-- Platform logo or color badge -->
          <div class="mt-1.5 flex items-center gap-1.5">
            <img
              *ngIf="recommendation.platformLogo; else platformBadge"
              [src]="recommendation.platformLogo"
              [alt]="platformName"
              class="h-4 max-w-[60px] object-contain"
              loading="lazy"
            />
            <ng-template #platformBadge>
              <span
                *ngIf="platformName"
                class="rounded-md px-1.5 py-px text-[9px] font-bold uppercase tracking-wider"
                [style.background-color]="platformColor + '22'"
                [style.color]="platformColor"
                [style.border]="'1px solid ' + platformColor + '44'"
              >
                {{ platformName }}
              </span>
            </ng-template>
          </div>

          <!-- Rating + Duration row -->
          <div
            *ngIf="recommendation.rating || recommendation.durationMinutes"
            class="mt-1.5 flex items-center gap-2.5 text-[11px]"
          >
            <span *ngIf="recommendation.rating" class="flex items-center gap-0.5 text-amber-400">
              <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
              {{ recommendation.rating | number : '1.1-1' }}
            </span>
            <span *ngIf="recommendation.durationMinutes" class="text-slate-400">
              {{ recommendation.durationMinutes }}min
            </span>
          </div>

          <!-- Badges -->
          <div *ngIf="displayBadges.length" class="mt-1.5 flex flex-wrap gap-1">
            <span
              *ngFor="let badge of displayBadges; trackBy: trackByText"
              class="rounded-full border border-slate-700/80 bg-slate-950/80 px-1.5 py-px text-[9px] font-medium text-slate-400"
            >
              {{ badge }}
            </span>
          </div>
        </div>
      </div>

      <!-- Expand inline: synopsis -->
      <div
        *ngIf="synopsisOpen && recommendation.synopsis"
        class="border-t border-slate-700/50 px-3 py-2"
      >
        <p class="text-xs leading-relaxed text-slate-300">
          {{ recommendation.synopsis }}
        </p>
      </div>

      <!-- Expand inline: reason -->
      <div
        *ngIf="reasonOpen"
        class="border-t border-slate-700/50 px-3 py-2"
      >
        <p class="text-xs leading-relaxed text-slate-300">
          {{ recommendation.reason }}
        </p>
      </div>

      <!-- Quick actions row (always visible) -->
      <div class="flex items-center justify-between border-t border-slate-700/40 px-2.5 py-1.5">
        <div class="flex items-center gap-1">
          <!-- Thumbs up -->
          <button
            type="button"
            (click)="ratePositive.emit(recommendation)"
            class="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
            [attr.aria-label]="'Me gusta ' + recommendation.title"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
            </svg>
          </button>
          <!-- Thumbs down -->
          <button
            type="button"
            (click)="rateNegative.emit(recommendation)"
            class="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
            [attr.aria-label]="'No me gusta ' + recommendation.title"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
            </svg>
          </button>
        </div>

        <div class="flex items-center gap-1">
          <!-- Synopsis toggle -->
          <button
            *ngIf="recommendation.synopsis"
            type="button"
            (click)="synopsisOpen = !synopsisOpen"
            class="flex h-7 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Sinopsis
          </button>
          <!-- Reason toggle -->
          <button
            type="button"
            (click)="reasonOpen = !reasonOpen"
            class="flex h-7 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            ¿Por qué?
          </button>
          <!-- Ver ficha -->
          <button
            type="button"
            (click)="openDetail.emit(recommendation)"
            class="flex h-7 items-center gap-1 rounded-full bg-slate-800/70 px-2.5 text-[10px] font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
          >
            Ver ficha
            <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Overflow menu -->
      <div
        *ngIf="menuOpen"
        class="absolute right-2 top-10 z-20 min-w-[160px] rounded-xl border border-slate-700 bg-slate-900 py-1 shadow-xl"
      >
        <button
          type="button"
          (click)="menuOpen = false; save.emit(recommendation)"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-slate-800"
        >
          <svg class="h-3.5 w-3.5 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Guardar en mi lista
        </button>
        <button
          type="button"
          (click)="menuOpen = false; followUp.emit(recommendation)"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-slate-800"
        >
          <svg class="h-3.5 w-3.5 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Seguir con este título
        </button>
        <button
          type="button"
          (click)="menuOpen = false; ignore.emit(recommendation)"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:bg-slate-800"
        >
          <svg class="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          No me interesa
        </button>
        <button
          *ngIf="recommendation.startTime && !recommendation.liveNow"
          type="button"
          (click)="menuOpen = false; remind.emit(recommendation)"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-slate-800"
        >
          <svg class="h-3.5 w-3.5 text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
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

  private static readonly PLATFORM_COLORS: Record<string, string> = {
    netflix: '#E50914',
    'prime-video': '#00A8E1',
    'disney-plus': '#113CCF',
    max: '#002BE7',
    'movistar-plus': '#00A19A',
    skyshowtime: '#6B3FA0',
    'apple-tv-plus': '#000000',
    filmin: '#D8231D',
    'rtve-play': '#E84E1B',
    atresplayer: '#5BC53A',
    mitele: '#ED1C24',
    'pluto-tv': '#FFDF00',
    'rakuten-tv': '#6E2E92',
  };

  get isLiveNow(): boolean {
    return this.stateLabel.startsWith('En emisión');
  }

  get stateLabel(): string {
    if (this.recommendation.liveNow) return 'En emisión';

    const scheduledTime =
      this.recommendation.startTime || this.recommendation.time;
    if (!scheduledTime) {
      return this.recommendation.channel ? 'TV' : 'Streaming';
    }

    const [hours, minutes] = scheduledTime.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return scheduledTime;

    const now = new Date();
    const candidate = new Date();
    candidate.setHours(hours, minutes, 0, 0);
    if (
      Math.abs(candidate.getTime() - now.getTime()) <= 2 * 60 * 60 * 1000 &&
      candidate <= now
    ) {
      return 'En emisión';
    }

    return scheduledTime;
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

  get platformName(): string {
    return (
      this.recommendation.channelOrPlatform ||
      this.recommendation.channel ||
      this.recommendation.platform ||
      ''
    );
  }

  get platformColor(): string {
    const key = (this.recommendation.platform || this.platformName || '')
      .toLowerCase()
      .replace(/\s+/g, '-');
    return ChatRecommendationCardComponent.PLATFORM_COLORS[key] || '#94a3b8';
  }

  get displayBadges(): string[] {
    const state = this.normalize(this.stateLabel);
    return (this.recommendation.badges || []).filter(
      (badge) => this.normalize(badge) !== state
    );
  }

  trackByText(_index: number, value: string): string {
    return value;
  }

  private normalize(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
