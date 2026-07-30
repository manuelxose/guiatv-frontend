import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Params, RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { APP_PATHS } from '../../config/route-map';
import { getCatalogPlatformByKey } from '../../data/catalog-platforms.data';
import { MetaService } from '../../services/meta.service';
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
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './streaming-comparison.component.html',
  styleUrls: ['./streaming-comparison.component.scss'],
})
export class StreamingComparisonComponent implements OnInit {
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
  public readonly breadcrumbItems: BreadcrumbItem[] = [
    { name: 'Inicio', url: APP_PATHS.home },
    { name: 'Plataformas', url: APP_PATHS.platforms },
    { name: 'Comparador', url: APP_PATHS.streamingComparison },
  ];
  public readonly profileCards = STREAMING_COMPARISON_PROFILE_CARDS.map((profile) => ({
    ...profile,
    platformNames: profile.platformKeys
      .map((platformKey) => getCatalogPlatformByKey(platformKey)?.name)
      .filter((platformName): platformName is string => !!platformName),
  }));
  public readonly platformComparisons: StreamingComparisonViewModel[] =
    STREAMING_COMPARISON_ENTRIES.map((entry) => this.toComparisonViewModel(entry));

  constructor(private readonly metaService: MetaService) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: `Comparador de plataformas de streaming en España ${this.currentYear} | Guía TV`,
      description: `Compara precios de entrada, límites y encaje editorial de Netflix, Prime Video, Disney+, Max, Movistar+ y más plataformas conectadas al catálogo real de Guía TV. Revisión: ${this.lastReviewedAt}.`,
      canonicalUrl: APP_PATHS.streamingComparison,
      type: 'website',
    });
  }

  public trackByPlatformKey(index: number, comparison: StreamingComparisonViewModel): string {
    return comparison.platform.key;
  }

  public statusClasses(tone: StreamingComparisonTone): string {
    if (tone === 'positive') {
      return 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
    }
    if (tone === 'caution') {
      return 'border border-amber-500/30 bg-amber-500/10 text-amber-100';
    }
    return 'border border-slate-700 bg-slate-900/70 text-slate-300';
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
        platforms: platform.name,
        availability: 'streaming',
        types: 'movie,series',
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
