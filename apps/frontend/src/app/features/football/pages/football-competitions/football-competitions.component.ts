import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballCompetitionDTO } from '@app/features/football/football.models';
import { FootballCompetitionCardComponent } from '@app/features/football/components/football-competition-card/football-competition-card.component';
import { FootballSectionHeaderComponent } from '@app/features/football/components/football-section-header/football-section-header.component';
import { MetaService } from '@app/services/meta.service';
import { environment } from 'src/environments/environment';
import { generateFootballBreadcrumbSchema } from '@app/features/football/football-seo';

// A small, honest curation — not a data guess: these are real competitions
// already in the catalog, just surfaced first (spec §32 "Featured"). Falls
// back gracefully if any slug isn't present in the actual catalog.
const FEATURED_SLUGS = ['primera-division', 'uefa-champions-league', 'premier-league'];

interface CountryGroup {
  country: string;
  competitions: FootballCompetitionDTO[];
}

@Component({
  selector: 'app-football-competitions',
  standalone: true,
  imports: [CommonModule, RouterModule, FootballCompetitionCardComponent, FootballSectionHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './football-competitions.component.html',
  styleUrl: './football-competitions.component.scss',
})
export class FootballCompetitionsComponent implements OnInit {
  private readonly facade = inject(FootballFacade);
  private readonly meta = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly competitions = toSignal(this.facade.getCompetitions(), { initialValue: null as FootballCompetitionDTO[] | null });
  readonly loading = computed(() => this.competitions() === null);

  readonly featured = computed(() => {
    const all = this.competitions() ?? [];
    return FEATURED_SLUGS.map((slug) => all.find((c) => c.slug === slug)).filter(Boolean) as FootballCompetitionDTO[];
  });

  readonly groups = computed<CountryGroup[]>(() => {
    const all = this.competitions() ?? [];
    const featuredSlugs = new Set(this.featured().map((c) => c.slug));
    const rest = all.filter((c) => !featuredSlugs.has(c.slug));

    const byCountry = new Map<string, FootballCompetitionDTO[]>();
    for (const competition of rest) {
      const key = competition.country || 'Otras';
      const list = byCountry.get(key) || [];
      list.push(competition);
      byCountry.set(key, list);
    }
    return Array.from(byCountry.entries())
      .map(([country, competitions]) => ({ country, competitions }))
      .sort((a, b) => a.country.localeCompare(b.country, 'es'));
  });

  safeLdHtml: SafeHtml | null = null;

  ngOnInit(): void {
    this.meta.setMetaTags({
      title: 'Competiciones de fútbol: LaLiga, Champions, Premier - Guía TV',
      description: 'Todas las competiciones de fútbol: LaLiga, Champions League, Europa League, Copa del Rey y más.',
      canonicalUrl: '/deportes/futbol/competiciones',
    });

    const baseUrl = environment.SITE_URL || 'https://guiaprogramaciontv.com';
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(
        generateFootballBreadcrumbSchema(
          [
            { name: 'Inicio', path: '/' },
            { name: 'Fútbol', path: '/deportes/futbol' },
            { name: 'Competiciones', path: '/deportes/futbol/competiciones' },
          ],
          baseUrl
        )
      )}</script>`
    );
  }

  trackByCompetition(_index: number, competition: FootballCompetitionDTO): string {
    return competition.slug;
  }

  trackByCountry(_index: number, group: CountryGroup): string {
    return group.country;
  }
}
