import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FootballMatchDTO } from '@app/features/football/football.models';

export interface FootballBroadcastSummary {
  name: string;
  matchCount: number;
}

export function summarizeFootballBroadcasts(matches: FootballMatchDTO[]): FootballBroadcastSummary[] {
  const providers = new Map<string, Set<string>>();

  for (const match of matches) {
    const names = new Set(
      (match.broadcasts || [])
        .filter((broadcast) => broadcast.confidence !== 'low')
        .map((broadcast) => broadcast.channelName.trim())
        .filter(Boolean)
    );
    for (const name of names) {
      const matchIds = providers.get(name) ?? new Set<string>();
      matchIds.add(match.id);
      providers.set(name, matchIds);
    }
  }

  return Array.from(providers, ([name, matchIds]) => ({ name, matchCount: matchIds.size }))
    .sort((left, right) => right.matchCount - left.matchCount || left.name.localeCompare(right.name, 'es'));
}

@Component({
  selector: 'app-football-broadcast-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="broadcast-widget" aria-labelledby="football-broadcast-title">
      <div class="broadcast-widget__head">
        <div>
          <h2 id="football-broadcast-title">Dónde ver el fútbol hoy</h2>
          <p>Canales y plataformas confirmados</p>
        </div>
        @if (activeProvider) {
        <button type="button" (click)="providerSelect.emit(null)">Ver todos</button>
        }
      </div>

      @if (providers.length) {
      <ul>
        @for (provider of providers; track provider.name) {
        <li>
          <button
            type="button"
            [class.is-active]="activeProvider === provider.name"
            [attr.aria-pressed]="activeProvider === provider.name"
            (click)="providerSelect.emit(provider.name)"
          >
            <span>{{ provider.name }}</span>
            <strong>{{ provider.matchCount }} {{ provider.matchCount === 1 ? 'partido' : 'partidos' }}</strong>
          </button>
        </li>
        }
      </ul>
      } @else {
      <p class="broadcast-widget__empty">Aún no hay emisiones confirmadas para esta fecha.</p>
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    .broadcast-widget { border: 1px solid var(--football-border); border-radius: var(--radius-md); background: var(--football-surface); padding: 1rem; }
    .broadcast-widget__head { display: flex; align-items: start; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.75rem; }
    h2, p { margin: 0; }
    h2 { color: var(--portal-text); font-size: var(--text-md); line-height: 1.25; }
    .broadcast-widget__head p { margin-top: 0.2rem; color: var(--football-muted); font-size: var(--text-xs); }
    .broadcast-widget__head button { min-height: 44px; border: 0; background: transparent; color: var(--accent-sports); font-weight: 750; cursor: pointer; }
    ul { display: grid; gap: 0.2rem; margin: 0; padding: 0; list-style: none; }
    li button { width: 100%; min-height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--portal-text); padding: 0.5rem 0.65rem; text-align: left; cursor: pointer; }
    li button:hover, li button:focus-visible { border-color: var(--football-border); background: var(--football-surface-subtle); }
    li button:focus-visible { outline: 2px solid var(--accent-sports); outline-offset: 1px; }
    li button.is-active { background: var(--accent-sports-soft); border-color: color-mix(in srgb, var(--accent-sports) 35%, var(--football-border)); }
    li span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-sm); font-weight: 700; }
    li strong { flex: 0 0 auto; color: var(--football-provider); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
    .broadcast-widget__empty { color: var(--football-muted); font-size: var(--text-sm); line-height: 1.5; }
  `,
})
export class FootballBroadcastWidgetComponent {
  @Input() providers: FootballBroadcastSummary[] = [];
  @Input() activeProvider: string | null = null;
  @Output() readonly providerSelect = new EventEmitter<string | null>();
}
