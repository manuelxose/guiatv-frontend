import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballContentType, FootballNewsDTO } from '@app/features/football/football.models';
import { FootballNewsCardComponent } from '@app/features/football/components/football-news-card/football-news-card.component';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema } from '@app/features/football/football-seo';
import { PortalLocalToolbarComponent } from '@app/components/portal-local-toolbar/portal-local-toolbar.component';
import { PortalContextDestination } from '@app/config/portal-navigation.config';

const PAGE_SIZE = 12;

const CONTENT_TYPE_LABELS: Record<FootballContentType, string> = {
  news: 'Noticias',
  analysis: 'Análisis',
  preview: 'Previas',
  'match-report': 'Crónicas',
  guide: 'Guías',
  ranking: 'Rankings',
  trend: 'Tendencias',
};

@Component({
  selector: 'app-football-news',
  standalone: true,
  imports: [CommonModule, FootballNewsCardComponent, PortalLocalToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './football-news.component.html',
  styleUrl: './football-news.component.scss',
})
export class FootballNewsComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  // Cumulative limit ("load more" grows this rather than paging with an
  // offset+merge) — simplest correct approach for a page this size, and it
  // naturally reuses the facade's TransferState cache per distinct limit.
  private readonly requestedCount = signal(PAGE_SIZE);
  readonly loadedCount$ = toObservable(this.requestedCount);

  private readonly newsResult = toSignal(
    this.loadedCount$.pipe(switchMap((limit) => this.facade.getNews({ limit }))),
    { initialValue: null as FootballNewsDTO[] | null }
  );

  readonly loading = computed(() => this.newsResult() === null);
  readonly news = computed(() => this.newsResult() ?? []);
  // Heuristic: if the last fetch returned fewer than requested, there's
  // nothing more to load — no separate total-count endpoint exists.
  readonly hasMore = computed(() => this.news().length >= this.requestedCount());

  // Content-type filter (spec §44): only ever shown when the real, already-
  // loaded data actually has 2+ distinct types with content — never an
  // empty or single-choice taxonomy tab strip.
  readonly availableTypes = computed(() => {
    const counts = new Map<FootballContentType, number>();
    for (const item of this.news()) {
      counts.set(item.contentType, (counts.get(item.contentType) ?? 0) + 1);
    }
    return Array.from(counts.keys());
  });
  readonly showTypeFilter = computed(() => this.availableTypes().length > 1);
  readonly typeItems = computed<readonly PortalContextDestination[]>(() => [
    { id: 'all', label: 'Todas', kind: 'action' },
    ...this.availableTypes().map((type) => ({ id: type, label: this.typeLabel(type), kind: 'action' as const })),
  ]);

  readonly activeType = signal<FootballContentType | 'all'>('all');
  readonly filteredNews = computed(() => {
    const type = this.activeType();
    return type === 'all' ? this.news() : this.news().filter((item) => item.contentType === type);
  });

  safeLdHtml: SafeHtml | null = null;

  ngOnInit(): void {
    this.meta.setMetaTags({
      title: 'Noticias de fútbol: última hora, previas y crónicas - Guía TV',
      description: 'Noticias de fútbol: última hora, previas, crónicas y análisis de LaLiga, Champions y más.',
      canonicalUrl: '/deportes/futbol/noticias',
    });

    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(
        generateFootballBreadcrumbSchema(
          [
            { name: 'Inicio', path: '/' },
            { name: 'Fútbol', path: '/deportes/futbol' },
            { name: 'Noticias', path: '/deportes/futbol/noticias' },
          ],
          baseUrl
        )
      )}</script>`
    );
  }

  typeLabel(type: FootballContentType): string {
    return CONTENT_TYPE_LABELS[type] ?? type;
  }

  selectType(type: string): void {
    this.activeType.set(type as FootballContentType | 'all');
  }

  loadMore(): void {
    this.requestedCount.update((count) => count + PAGE_SIZE);
  }

  trackByArticle(_index: number, article: FootballNewsDTO): string {
    return article.slug;
  }
}
