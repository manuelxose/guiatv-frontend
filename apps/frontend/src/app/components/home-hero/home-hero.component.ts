import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';

export interface HomeHeroItem {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  meta: string;
  image: string;
  progress: number;
  primaryLabel: string;
  primaryPath: string;
  secondaryLabel?: string;
  secondaryPath?: string;
}

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-hero.component.html',
  styleUrl: './home-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHeroComponent implements OnChanges, OnDestroy {
  @Input() items: HomeHeroItem[] = [];

  readonly activeIndex = signal(0);
  readonly paused = signal(false);
  readonly imageLayout = signal<'cover' | 'contain'>('cover');
  private readonly platformId = inject(PLATFORM_ID);
  private rotationTimer: ReturnType<typeof setInterval> | null = null;

  get activeItem(): HomeHeroItem | null {
    return this.items[this.activeIndex()] || null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.activeIndex.set(0);
      this.restartRotation();
    }
  }

  ngOnDestroy(): void {
    this.stopRotation();
  }

  select(index: number): void {
    this.activeIndex.set(index);
    this.imageLayout.set('cover');
    this.restartRotation();
  }

  previous(): void {
    if (!this.items.length) return;
    this.select((this.activeIndex() - 1 + this.items.length) % this.items.length);
  }

  next(): void {
    if (!this.items.length) return;
    this.select((this.activeIndex() + 1) % this.items.length);
  }

  pause(): void {
    this.paused.set(true);
  }

  resume(): void {
    this.paused.set(false);
  }

  trackByItem(_index: number, item: HomeHeroItem): string {
    return item.id;
  }

  useFallbackImage(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith('/assets/images/default-movie-poster.svg')) {
      image.src = '/assets/images/default-movie-poster.svg';
    }
  }

  updateImageLayout(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.naturalWidth || !image.naturalHeight) return;

    // Poster-like and square artwork must remain entirely visible. Wide
    // backdrops can safely fill the stage without producing letterboxing.
    this.imageLayout.set(image.naturalWidth / image.naturalHeight < 1.55 ? 'contain' : 'cover');
  }

  private restartRotation(): void {
    this.stopRotation();
    if (!isPlatformBrowser(this.platformId) || this.items.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.rotationTimer = setInterval(() => {
      if (!this.paused()) {
        this.activeIndex.update((index) => (index + 1) % this.items.length);
      }
    }, 8_000);
  }

  private stopRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }
}
