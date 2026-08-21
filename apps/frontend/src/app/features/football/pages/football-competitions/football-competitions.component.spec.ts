import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FootballCompetitionsComponent } from './football-competitions.component';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballCompetitionDTO } from '@app/features/football/football.models';
import { MetaService } from '@app/services/meta.service';

function competition(slug: string, name: string, country: string): FootballCompetitionDTO {
  return { id: slug, slug, name, country, type: 'league', providerIds: {}, lastUpdatedAt: '' };
}

describe('FootballCompetitionsComponent', () => {
  function setup(competitions: FootballCompetitionDTO[]) {
    TestBed.configureTestingModule({
      imports: [FootballCompetitionsComponent],
      providers: [
        provideRouter([]),
        { provide: FootballFacade, useValue: { getCompetitions: () => of(competitions) } },
        { provide: MetaService, useValue: { setMetaTags: () => {} } },
      ],
    });
    const fixture = TestBed.createComponent(FootballCompetitionsComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('pulls the known featured slugs out first, in the curated order', () => {
    const component = setup([
      competition('premier-league', 'Premier League', 'England'),
      competition('primera-division', 'Primera Division', 'Spain'),
      competition('serie-a', 'Serie A', 'Italy'),
    ]);
    expect(component.featured().map((c) => c.slug)).toEqual(['primera-division', 'premier-league']);
  });

  it('groups the remaining competitions by country, alphabetically', () => {
    const component = setup([
      competition('serie-a', 'Serie A', 'Italy'),
      competition('bundesliga', 'Bundesliga', 'Germany'),
    ]);
    expect(component.groups().map((g) => g.country)).toEqual(['Germany', 'Italy']);
  });

  it('does not duplicate a featured competition into its country group', () => {
    const component = setup([competition('primera-division', 'Primera Division', 'Spain')]);
    expect(component.featured().length).toBe(1);
    expect(component.groups().find((g) => g.country === 'Spain')).toBeUndefined();
  });

  it('falls back to "Otras" for a competition with no country', () => {
    const component = setup([{ id: 'x', slug: 'x', name: 'Mystery Cup', type: 'other', providerIds: {}, lastUpdatedAt: '' }]);
    expect(component.groups().map((g) => g.country)).toEqual(['Otras']);
  });
});
