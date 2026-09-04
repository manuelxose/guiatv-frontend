import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { TvReadItemDTO } from '../../api/models';
import { CatalogItem } from '../../services/catalog.service';
import { UserService } from '../../services/user.service';
import { normalizeCatalogInteractionId } from '../../utils/catalog';
import { normalizeToCard } from '../../utils/tv-normalizers';
import { PlatformBadgeComponent } from '../platform-badge/platform-badge.component';
import { PrefetchDetailDirective } from '../../directives/prefetch-detail.directive';
import { AffiliateService } from '../../services/affiliate.service';
import { AffiliateCTAComponent } from '../affiliate-cta/affiliate-cta.component';
import { AffiliateImpressionDirective } from '../../directives/affiliate-impression.directive';
import {
  AffiliateContext,
  AffiliatePlacementKey,
  AffiliateResolvedOffer,
} from '../../interfaces/affiliate.interface';

export type UnifiedProgramCardVariant =
  | 'live'
  | 'feature'
  | 'discover'
  | 'streaming'
  | 'sport'
  | 'compact'
  | 'epg-row';

@Component({
  selector: 'app-unified-program-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PlatformBadgeComponent,
    PrefetchDetailDirective,
    AffiliateCTAComponent,
    AffiliateImpressionDirective,
  ],
  templateUrl: './unified-program-card.component.html',
  styleUrl: './unified-program-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedProgramCardComponent implements OnChanges {
  readonly isAuthenticated = toSignal(this.userService.isAuthenticated$, { initialValue: false });
  readonly watchlist = toSignal(this.userService.getWatchlist(), { initialValue: [] });

  @Input({ required: true }) item!: TvReadItemDTO | CatalogItem;
  @Input() variant: UnifiedProgramCardVariant = 'discover';
  @Input() showChannel = true;
  @Input() showActions = true;
  /**
   * Opt-in only — most callers (EPG rows, live rails, compact cards) never
   * set this, so they never trigger an affiliate lookup. A caller enables it
   * only for a bounded, curated set of cards (see HomeComponent), never for
   * every card in a long list.
   */
  @Input() enableAffiliateCta = false;
  @Input() affiliatePlacement: AffiliatePlacementKey = 'home';

  @Output() selected = new EventEmitter<TvReadItemDTO | CatalogItem>();

  readonly affiliateOffer = signal<AffiliateResolvedOffer | null>(null);
  private readonly affiliateService = inject(AffiliateService);

  constructor(private readonly userService: UserService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item'] || changes['enableAffiliateCta'] || changes['affiliatePlacement']) {
      this.resolveAffiliateOffer();
    }
  }

  private normalizedItem?: TvReadItemDTO | CatalogItem;
  private normalizedCard?: ReturnType<typeof normalizeToCard>;

  get card() {
    if (this.normalizedItem !== this.item || !this.normalizedCard) {
      this.normalizedItem = this.item;
      this.normalizedCard = normalizeToCard(this.item);
    }
    return this.normalizedCard;
  }

  get hasVisual(): boolean {
    return Boolean(this.card.image);
  }

  get imageUrl(): string {
    return optimizeCardImageUrl(this.card.image);
  }

  get progressClass(): string {
    const bucket = Math.max(0, Math.min(100, Math.round(this.card.progressPercent / 10) * 10));
    return `program-card__progress-fill--${bucket}`;
  }

  get timeLabel(): string {
    return formatTimeRange(this.card.startTime, this.card.endTime);
  }

  get actionLabel(): string {
    if (this.variant === 'sport') {
      return 'Seguir evento';
    }
    if (this.variant === 'live' || this.variant === 'feature' || this.variant === 'epg-row') {
      return 'Abrir emisión';
    }
    if (this.variant === 'streaming') {
      return 'Ver ficha';
    }
    return 'Abrir detalle';
  }

  get normalizedContentId(): string {
    return normalizeCatalogInteractionId({
      contentId: this.card.id,
      contentType: this.card.contentType,
    });
  }

  get isSaved(): boolean {
    return this.watchlist().some((item) => item.contentId === this.normalizedContentId);
  }

  get quickPlatforms(): string[] {
    return this.card.platforms.slice(0, 2);
  }

  affiliateImpressionContext(): Pick<AffiliateContext, 'market' | 'placement' | 'contentType' | 'contentId'> {
    return {
      market: 'ES',
      placement: this.affiliatePlacement,
      contentType: this.card.contentType,
      contentId: this.card.id,
    };
  }

  onSelect(): void {
    this.selected.emit(this.item);
  }

  useFallbackImage(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith('/assets/images/default-movie-poster.svg')) {
      image.src = '/assets/images/default-movie-poster.svg';
    }
  }

  hideBrokenImage(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
  }

  toggleWatchlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isAuthenticated()) {
      return;
    }
    this.userService
      .toggleWatchlistItem({
        contentId: this.card.id,
        title: this.card.title,
        type: this.card.contentType,
      })
      .subscribe();
  }

  /**
   * One resolve per card, only for the bounded set of cards a caller opted
   * in — never on a full rail/grid. Never blocks rendering: the card is
   * already built from `this.card` before this fires, and the CTA fades in
   * only once (if) an offer resolves.
   */
  private resolveAffiliateOffer(): void {
    this.affiliateOffer.set(null);
    if (!this.enableAffiliateCta) return;

    const card = this.card;
    if (!card.id || !card.contentType) return;

    this.affiliateService
      .resolve({
        market: 'ES',
        placement: this.affiliatePlacement,
        contentType: card.contentType,
        contentId: card.id,
      })
      .subscribe((offer) => this.affiliateOffer.set(offer));
  }
}

function formatTimeRange(start?: string, end?: string): string {
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  if (!startLabel && !endLabel) {
    return '';
  }
  return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
}

export function optimizeCardImageUrl(url?: string): string {
  const value = String(url || '');
  if (value.startsWith('https://image.tmdb.org/t/p/original/')) {
    return value.replace('/t/p/original/', '/t/p/w780/');
  }
  return value;
}

function formatTime(value?: string): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
