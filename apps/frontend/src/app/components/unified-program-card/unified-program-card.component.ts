import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { TvReadItemDTO } from '../../api/models';
import { CatalogItem } from '../../services/catalog.service';
import { UserService } from '../../services/user.service';
import { normalizeCatalogInteractionId } from '../../utils/catalog';
import { normalizeToCard } from '../../utils/tv-normalizers';
import { PlatformBadgeComponent } from '../platform-badge/platform-badge.component';
import { PrefetchDetailDirective } from '../../directives/prefetch-detail.directive';

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
  imports: [CommonModule, RouterModule, PlatformBadgeComponent, PrefetchDetailDirective],
  templateUrl: './unified-program-card.component.html',
  styleUrl: './unified-program-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedProgramCardComponent {
  readonly isAuthenticated = toSignal(this.userService.isAuthenticated$, { initialValue: false });
  readonly watchlist = toSignal(this.userService.getWatchlist(), { initialValue: [] });

  @Input({ required: true }) item!: TvReadItemDTO | CatalogItem;
  @Input() variant: UnifiedProgramCardVariant = 'discover';
  @Input() showChannel = true;
  @Input() showActions = true;

  @Output() selected = new EventEmitter<TvReadItemDTO | CatalogItem>();

  constructor(private readonly userService: UserService) {}

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
