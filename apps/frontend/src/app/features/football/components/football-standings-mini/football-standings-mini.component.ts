import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FootballCompetitionDTO, FootballStandingRowDTO } from '@app/features/football/football.models';

@Component({
  selector: 'app-football-standings-mini',
  standalone: true,
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="standings-mini" [attr.aria-labelledby]="headingId">
      <div class="standings-mini__head">
        <div>
          <h2 [id]="headingId">Clasificación</h2>
          <p>{{ competition.shortName || competition.name }}</p>
        </div>
        @if (competition.logo) {
        <img [src]="competition.logo" alt="" width="32" height="32" loading="lazy" decoding="async" />
        }
      </div>
      <table>
        <thead><tr><th scope="col">#</th><th scope="col">Equipo</th><th scope="col">PJ</th><th scope="col">PTS</th></tr></thead>
        <tbody>
          @for (row of rows; track row.team.id) {
          <tr><td>{{ row.position }}</td><th scope="row">{{ row.team.shortName || row.team.name }}</th><td>{{ row.played }}</td><td><strong>{{ row.points }}</strong></td></tr>
          }
        </tbody>
      </table>
      <a [routerLink]="['/deportes/futbol/competiciones', competition.slug]" fragment="clasificacion">Ver clasificación completa</a>
    </section>
  `,
  styles: `
    :host { display: block; }
    .standings-mini { border: 1px solid var(--football-border); border-radius: var(--radius-md); background: var(--football-surface); padding: 1rem; }
    .standings-mini__head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.65rem; }
    h2, p { margin: 0; }
    h2 { color: var(--portal-text); font-size: var(--text-md); }
    p { margin-top: 0.15rem; color: var(--football-muted); font-size: var(--text-xs); }
    img { width: 2rem; height: 2rem; object-fit: contain; }
    table { width: 100%; border-collapse: collapse; color: var(--portal-text); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
    th, td { border-bottom: 1px solid var(--portal-divider); padding: 0.5rem 0.25rem; text-align: right; }
    th:nth-child(2), td:nth-child(2) { text-align: left; }
    tbody th { max-width: 10rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 650; }
    thead th { color: var(--football-muted); font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: 0.05em; }
    a { display: inline-flex; min-height: 44px; align-items: center; margin-top: 0.45rem; color: var(--accent-sports); font-size: var(--text-xs); font-weight: 750; text-decoration: none; }
    a:hover { text-decoration: underline; text-underline-offset: 0.2em; }
    a:focus-visible { outline: 2px solid var(--accent-sports); outline-offset: 2px; }
  `,
})
export class FootballStandingsMiniComponent {
  @Input({ required: true }) competition!: FootballCompetitionDTO;
  @Input() rows: FootballStandingRowDTO[] = [];
  readonly headingId = 'football-standings-title';
}
