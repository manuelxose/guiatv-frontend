import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { combineLatest, map, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballMatchDTO } from '@app/features/football/football.models';
import { FootballMatchCardComponent } from '@app/features/football/components/football-match-card/football-match-card.component';
import { FootballSectionHeaderComponent } from '@app/features/football/components/football-section-header/football-section-header.component';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema } from '@app/features/football/football-seo';

type MatchesView = 'live' | 'today' | 'calendar';

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

@Component({
  selector: 'app-football-matches',
  standalone: true,
  imports: [CommonModule, FootballMatchCardComponent, FootballSectionHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>

      <header class="head">
        <h1 class="head__title">{{ title }}</h1>
        <p class="head__sub">{{ subtitle }}</p>
      </header>

      <nav class="tabs" aria-label="Filtros de partidos">
        <button
          *ngFor="let tab of tabs"
          class="tabs__item"
          [class.tabs__item--active]="activeTab() === tab.id"
          (click)="selectTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div *ngIf="view() === 'calendar'" class="datebar">
        <button class="datebar__item" (click)="shiftDay(-1)">← Ayer</button>
        <span class="datebar__label">{{ dateLabel }}</span>
        <button class="datebar__item" (click)="shiftDay(1)">Mañana →</button>
      </div>

      <main class="content">
        <ng-container *ngFor="let group of grouped()">
          <app-football-section-header [title]="group.competition"></app-football-section-header>
          <div class="grid">
            <app-football-match-card
              *ngFor="let match of group.matches"
              [match]="match"
            ></app-football-match-card>
          </div>
        </ng-container>

        <div *ngIf="!matches()?.length" class="empty">
          <p class="empty__title">{{ emptyTitle }}</p>
          <p class="empty__sub">
            No hay partidos para la selección actual. Prueba con otro día o revisa las noticias.
          </p>
        </div>
      </main>
    </div>
  `,
  styles: `
    .shell { max-width: 72rem; margin: 0 auto; padding: 1rem; }
    .head { margin-bottom: 0.75rem; }
    .head__title { margin: 0; font-size: 1.5rem; font-weight: 900; color: var(--football-text, #f1f5f9); }
    .head__sub { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--football-text-muted, #94a3b8); }

    .tabs {
      display: flex;
      gap: 0.25rem;
      overflow-x: auto;
      position: sticky;
      top: 0;
      background: var(--portal-bg, #0b1220);
      z-index: 10;
      padding: 0.25rem 0 0.75rem;
    }
    .tabs__item {
      flex: 0 0 auto;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.2));
      background: transparent;
      color: var(--football-text-muted, #94a3b8);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
    }
    .tabs__item--active { color: #0f172a; background: var(--football-accent, #22c55e); border-color: transparent; }

    .datebar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .datebar__item {
      padding: 0.4rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid var(--football-border, rgba(148, 163, 184, 0.2));
      background: transparent;
      color: var(--football-text-muted, #94a3b8);
      font-size: 0.8125rem;
      cursor: pointer;
    }
    .datebar__label { font-weight: 750; color: var(--football-text, #e2e8f0); }

    .content { display: flex; flex-direction: column; gap: 1rem; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 0.625rem; }
    @media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }

    .empty {
      border: 1px dashed var(--football-border, rgba(148, 163, 184, 0.25));
      border-radius: 0.75rem;
      padding: 2rem;
      text-align: center;
    }
    .empty__title { margin: 0 0 0.25rem; font-weight: 750; color: var(--football-text, #e2e8f0); }
    .empty__sub { margin: 0; font-size: 0.875rem; color: var(--football-text-muted, #94a3b8); }
  `,
})
export class FootballMatchesComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly tabs: Array<{ id: MatchesView; label: string }> = [
    { id: 'live', label: 'En directo' },
    { id: 'today', label: 'Hoy' },
    { id: 'calendar', label: 'Calendario' },
  ];

  readonly activeTab = signal<MatchesView>('today');
  readonly view = signal<MatchesView>('today');
  readonly dateOffset = signal(0);
  safeLdHtml: SafeHtml | null = null;

  private readonly matches$ = combineLatest([
    this.route.data,
    this.route.paramMap,
  ]).pipe(
    switchMap(([data, params]) => {
      const initial = (data?.['footballView'] as MatchesView) ?? 'today';
      this.activeTab.set(initial);
      this.view.set(initial);
      const date = params.get('date') || 'today';
      return this.loadFor(initial, date);
    })
  );

  readonly matches = toSignal(this.matches$, { initialValue: [] as FootballMatchDTO[] });

  readonly grouped = toSignal(
    this.matches$.pipe(
      map((matches) => {
        const groups = new Map<string, FootballMatchDTO[]>();
        for (const match of matches) {
          const key = match.competition.shortName || match.competition.name;
          const list = groups.get(key) || [];
          list.push(match);
          groups.set(key, list);
        }
        return Array.from(groups.entries()).map(([competition, items]) => ({ competition, matches: items }));
      })
    ),
    { initialValue: [] as Array<{ competition: string; matches: FootballMatchDTO[] }> }
  );

  get title(): string {
    if (this.view() === 'live') return 'Partidos en directo';
    if (this.view() === 'calendar') return 'Calendario de fútbol';
    return 'Partidos de fútbol hoy';
  }

  get subtitle(): string {
    if (this.view() === 'live') return 'Sigue en tiempo real los partidos de hoy.';
    if (this.view() === 'calendar') return 'Agenda de partidos por día.';
    return 'Todos los partidos de hoy, por competición.';
  }

  get emptyTitle(): string {
    if (this.view() === 'live') return 'No hay partidos en directo ahora mismo';
    return 'No hay partidos para este día';
  }

  get dateLabel(): string {
    const date = new Date();
    date.setDate(date.getDate() + this.dateOffset());
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  ngOnInit(): void {
    this.meta.setMetaTags({
      title: `${this.title} - Guía TV`,
      description: this.subtitle,
      canonicalUrl: '/deportes/futbol/partidos-hoy',
    });

    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(
        generateFootballBreadcrumbSchema(
          [
            { name: 'Inicio', path: '/' },
            { name: 'Fútbol', path: '/deportes/futbol' },
            { name: 'Partidos', path: '/deportes/futbol/partidos-hoy' },
          ],
          baseUrl
        )
      )}</script>`
    );
  }

  selectTab(tab: MatchesView): void {
    this.activeTab.set(tab);
    this.view.set(tab);
    this.dateOffset.set(0);
    void this.router.navigate([this.pathForTab(tab)]);
  }

  shiftDay(delta: number): void {
    this.dateOffset.update((offset) => offset + delta);
    void this.router.navigate(['/deportes/futbol/calendario'], {
      queryParams: { day: delta ? formatDateKey(this.offsetDate()) : undefined },
    });
  }

  private pathForTab(tab: MatchesView): string {
    if (tab === 'live') return '/deportes/futbol/en-directo';
    if (tab === 'calendar') return '/deportes/futbol/calendario';
    return '/deportes/futbol/partidos-hoy';
  }

  private offsetDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + this.dateOffset());
    return date;
  }

  private loadFor(view: MatchesView, date: string) {
    if (view === 'live') {
      return this.facade.getLiveMatches().pipe(map((res) => res.matches));
    }
    return this.facade.getMatches({ date }).pipe(map((res) => res.matches));
  }
}
