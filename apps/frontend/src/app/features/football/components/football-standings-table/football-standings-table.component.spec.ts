import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { FootballStandingsTableComponent } from './football-standings-table.component';
import { FootballStandingRowDTO, FootballTeamDTO } from '@app/features/football/football.models';

function team(id: string, name: string): FootballTeamDTO {
  return { id, slug: id, name, aliases: [], providerIds: {}, lastUpdatedAt: '' };
}

function row(position: number, teamId: string): FootballStandingRowDTO {
  return {
    position,
    team: team(teamId, `Team ${teamId}`),
    played: 10,
    won: 5,
    drawn: 2,
    lost: 3,
    goalsFor: 15,
    goalsAgainst: 10,
    goalDifference: 5,
    points: 17,
  };
}

describe('FootballStandingsTableComponent', () => {
  let component: FootballStandingsTableComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FootballStandingsTableComponent],
      providers: [provideRouter([])],
    });
    component = TestBed.createComponent(FootballStandingsTableComponent).componentInstance;
  });

  // Regression: a real E2E run caught this — standings rows were plain
  // <div>s with no navigation at all, a dead end from a competition's
  // table straight to the team (spec §100 "no dead-end pages").
  it('renders each team name as a real link to its team page', () => {
    const fixture = TestBed.createComponent(FootballStandingsTableComponent);
    fixture.componentInstance.standings = [row(1, 'real-madrid')];
    fixture.detectChanges();
    const link = fixture.debugElement.query(By.css('.standings__name'));
    expect(link.nativeElement.getAttribute('href')).toBe('/deportes/futbol/equipos/real-madrid');
  });

  it('shows the full table when no window/highlight is configured', () => {
    component.standings = [row(1, 'a'), row(2, 'b'), row(3, 'c')];
    expect(component.visibleRows.length).toBe(3);
  });

  it('windows to rows around the highlighted teams only', () => {
    component.standings = [row(1, 'a'), row(2, 'b'), row(3, 'c'), row(4, 'd'), row(5, 'e'), row(6, 'f'), row(7, 'g')];
    component.highlightTeamIds = ['a']; // index 0
    component.windowSize = 1;
    // window is [index-1, index+1] clamped to bounds -> positions 1 and 2
    expect(component.visibleRows.map((r) => r.position)).toEqual([1, 2]);
  });

  it('merges windows for two highlighted teams that are far apart', () => {
    component.standings = [row(1, 'a'), row(2, 'b'), row(3, 'c'), row(4, 'd'), row(5, 'e'), row(6, 'f'), row(7, 'g')];
    component.highlightTeamIds = ['a', 'g']; // indexes 0 and 6
    component.windowSize = 1;
    // union of [0,1] and [5,6] -> positions 1,2,6,7
    expect(component.visibleRows.map((r) => r.position)).toEqual([1, 2, 6, 7]);
  });

  it('isHighlighted flags exactly the requested team ids', () => {
    component.highlightTeamIds = ['a'];
    expect(component.isHighlighted(row(1, 'a'))).toBeTrue();
    expect(component.isHighlighted(row(2, 'b'))).toBeFalse();
  });

  it('falls back to the full table if no highlighted team is actually present', () => {
    component.standings = [row(1, 'a'), row(2, 'b')];
    component.highlightTeamIds = ['not-in-table'];
    component.windowSize = 1;
    expect(component.visibleRows.length).toBe(2);
  });
});
