import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Params, RouterModule } from '@angular/router';
import { APP_PATHS } from '../../config/route-map';
import { getCatalogPlatformByKey } from '../../data/catalog-platforms.data';
import {
  STREAMING_COMPARISON_ENTRIES,
  STREAMING_COMPARISON_FAQ_ITEMS,
  STREAMING_COMPARISON_LAST_REVIEWED_AT,
  STREAMING_COMPARISON_PROFILE_CARDS,
  STREAMING_COMPARISON_SUMMARY_CARDS,
  StreamingComparisonEntry,
  StreamingComparisonTone,
} from './streaming-comparison.data';

interface StreamingComparisonViewModel extends StreamingComparisonEntry {
  accentClass: string;
  initials: string;
  platform: NonNullable<ReturnType<typeof getCatalogPlatformByKey>>;
  queryParams: Params;
}

@Component({
  selector: 'app-streaming-comparison',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './streaming-comparison.component.html',
  styleUrls: ['./streaming-comparison.component.scss'],
})
export class StreamingComparisonComponent {
  public readonly appPaths = APP_PATHS;
  public readonly currentYear = new Date().getFullYear();
  public readonly lastReviewedAt = STREAMING_COMPARISON_LAST_REVIEWED_AT;
  public readonly summaryCards = STREAMING_COMPARISON_SUMMARY_CARDS;
  public readonly faqItems = STREAMING_COMPARISON_FAQ_ITEMS;
  public readonly legendItems: Array<{ label: string; tone: StreamingComparisonTone }> = [
    { label: 'Sí', tone: 'positive' },
    { label: 'Según plan / depende de la oferta', tone: 'caution' },
    { label: 'No o no aplica', tone: 'neutral' },
  ];
  public readonly profileCards = STREAMING_COMPARISON_PROFILE_CARDS.map((profile) => ({
    ...profile,
    platformNames: profile.platformKeys
      .map((platformKey) => getCatalogPlatformByKey(platformKey)?.name)
      .filter((platformName): platformName is string => !!platformName),
  }));
  public readonly platformComparisons: StreamingComparisonViewModel[] =
    STREAMING_COMPARISON_ENTRIES.map((entry) => this.toComparisonViewModel(entry));

  public trackByPlatformKey(index: number, comparison: StreamingComparisonViewModel): string {
    return comparison.platform.key;
  }

  public statusClasses(tone: StreamingComparisonTone): string {
    if (tone === 'positive') {
      return 'comparison-status--positive';
    }
    if (tone === 'caution') {
      return 'comparison-status--caution';
    }
    return 'comparison-status--neutral';
  }

  private toComparisonViewModel(entry: StreamingComparisonEntry): StreamingComparisonViewModel {
    const platform = getCatalogPlatformByKey(entry.platformKey);

    if (!platform) {
      throw new Error(`Missing catalog platform metadata for ${entry.platformKey}`);
    }

    return {
      ...entry,
      accentClass: this.getAccentClass(platform.key),
      platform,
      initials: this.getPlatformInitials(platform.name),
      queryParams: {
        platform: platform.name,
        availability: 'streaming',
      },
    };
  }

  private getPlatformInitials(name: string): string {
    const parts = String(name || '')
      .replace('+', ' ')
      .split(/\s+/)
      .filter(Boolean);

    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  private getAccentClass(platformKey: string): string {
    return `platform-avatar--${platformKey}`;
  }
}
