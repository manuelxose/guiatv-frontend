import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserProfile, UserTvPreferences } from '../../../../interfaces/user.interface';

// 'assistant' used to be a third area handled by this component, but it only
// ever rendered the football groups below (a mislabeled duplicate of the
// 'sports' area — the AI assistant's real preferences live in assistant
// memory, not tvPreferences). See AssistantPreferencesComponent, which now
// owns the "Asistente" tab in Mi GuíaTV.
type PreferenceArea = 'tv' | 'sports';

@Component({
  selector: 'app-personalization-preferences',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="mx-auto max-w-4xl space-y-5" [attr.aria-labelledby]="area + '-heading'">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 [id]="area + '-heading'" class="text-2xl font-semibold text-[var(--portal-text)]">{{ title }}</h2>
          <p class="mt-1 text-sm text-[var(--portal-text-muted)]">{{ description }}</p>
        </div>
        <a [routerLink]="browsePath" class="inline-flex min-h-11 items-center rounded-xl border border-[var(--portal-border)] px-4 text-sm font-semibold text-[var(--portal-text-soft)] hover:text-[var(--portal-text)]">
          Explorar {{ browseLabel }}
        </a>
      </header>

      <div class="preference-panel overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-5" [attr.data-vertical]="vertical">
        <ng-container *ngFor="let group of groups">
          <div class="border-b border-[var(--portal-border)] py-4 first:pt-0 last:border-0 last:pb-0">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 class="text-sm font-semibold text-[var(--portal-text)]">{{ group.title }}</h3>
                <p class="mt-1 text-xs leading-5 text-[var(--portal-text-muted)]">{{ group.help }}</p>
              </div>
              <span class="rounded-full bg-[var(--portal-surface-strong)] px-2.5 py-1 text-xs text-[var(--portal-text-muted)]">{{ group.items.length }}</span>
            </div>
            <div *ngIf="group.items.length; else empty" class="mt-3 flex flex-wrap gap-2">
              <button *ngFor="let id of group.items" type="button" (click)="remove(group.key, id)" class="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] px-3 text-xs text-[var(--portal-text-soft)] hover:border-[var(--accent-live)] hover:text-[var(--portal-text)]">
                <span class="max-w-48 truncate">{{ id }}</span><span aria-hidden="true">×</span><span class="sr-only">Eliminar</span>
              </button>
            </div>
            <ng-template #empty><p class="mt-3 text-sm text-[var(--portal-text-muted)]">Aún no has añadido preferencias. Selecciónalas desde {{ browseLabel | lowercase }} para guardar sus identificadores oficiales.</p></ng-template>
          </div>
        </ng-container>
      </div>
    </section>
  `,
  styles: [
    `
      // Shared wayfinding mixin (see styles/_card-accent.scss), also used by
      // CatalogCardComponent/UnifiedProgramCardComponent — a chip-restyle,
      // not a new visual language. Channel/team IDs are still shown raw;
      // resolving them to display names/logos needs a backend lookup that
      // doesn't exist yet (see the component's own top-of-file note).
      @use '../../../../../styles/card-accent' as cards;

      .preference-panel {
        @include cards.card-vertical-accent();
      }
    `,
  ],
})
export class PersonalizationPreferencesComponent {
  @Input({ required: true }) area: PreferenceArea = 'tv';
  @Input() profile: UserProfile | null = null;
  @Output() preferencesChange = new EventEmitter<UserTvPreferences>();

  /** 'tv' -> 'live' (in-guide TV), 'sports' -> 'sports' — real accent buckets from styles/_card-accent.scss. */
  get vertical(): 'live' | 'sports' { return this.area === 'tv' ? 'live' : 'sports'; }

  get title(): string { return this.area === 'tv' ? 'Mi TV' : 'Deportes'; }
  get description(): string { return this.area === 'tv' ? 'Canales y avisos relevantes para tu guía.' : 'Equipos y competiciones de fútbol que quieres seguir.'; }
  get browsePath(): string { return this.area === 'tv' ? '/canales' : '/deportes/futbol'; }
  get browseLabel(): string { return this.area === 'tv' ? 'canales' : 'fútbol'; }
  get preferences(): UserTvPreferences { return this.profile?.tvPreferences || { favoriteChannelIds: [], favoriteFootballTeamIds: [], favoriteFootballCompetitionIds: [], preferredContentLanguages: [] }; }
  get groups(): Array<{ key: keyof UserTvPreferences; title: string; help: string; items: string[] }> {
    const p = this.preferences;
    if (this.area === 'tv') return [{ key: 'favoriteChannelIds', title: 'Canales favoritos', help: 'Referencias canónicas de los canales que priorizas.', items: p.favoriteChannelIds }, { key: 'preferredContentLanguages', title: 'Idiomas de contenido', help: 'Preferencias de idioma para descubrir programas y películas.', items: p.preferredContentLanguages }];
    return [{ key: 'favoriteFootballTeamIds', title: 'Equipos favoritos', help: 'Referencias oficiales del dominio de fútbol.', items: p.favoriteFootballTeamIds }, { key: 'favoriteFootballCompetitionIds', title: 'Competiciones favoritas', help: 'Referencias oficiales del dominio de fútbol.', items: p.favoriteFootballCompetitionIds }];
  }
  remove(key: keyof UserTvPreferences, id: string): void { this.preferencesChange.emit({ ...this.preferences, [key]: this.preferences[key].filter((value) => value !== id) }); }
}
