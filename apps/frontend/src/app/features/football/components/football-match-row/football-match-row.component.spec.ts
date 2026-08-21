import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { FootballMatchRowComponent } from './football-match-row.component';
import { FootballMatchDTO } from '@app/features/football/football.models';

function match(overrides: Partial<FootballMatchDTO> = {}): FootballMatchDTO {
  return {
    id: 'm1',
    slug: 'real-madrid-barcelona-2026',
    providerIds: {},
    competition: { id: 'c', slug: 'laliga', name: 'LaLiga' },
    kickoffAt: '2026-08-21T19:00:00.000Z',
    status: 'scheduled',
    homeTeam: { id: 'h', slug: 'real-madrid', name: 'Real Madrid', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    awayTeam: { id: 'a', slug: 'barcelona', name: 'Barcelona', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    score: { home: null, away: null },
    broadcasts: [],
    sourceProvenance: { source: 'test', confidence: 'high' },
    lastUpdatedAt: '',
    ...overrides,
  };
}

describe('FootballMatchRowComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FootballMatchRowComponent],
      providers: [provideRouter([])],
    });
  });

  it('links to the match centre by slug', () => {
    const fixture = TestBed.createComponent(FootballMatchRowComponent);
    fixture.componentInstance.match = match();
    fixture.detectChanges();
    const link = fixture.debugElement.query(By.css('a.row'));
    expect(link.nativeElement.getAttribute('href')).toBe('/deportes/futbol/partido/real-madrid-barcelona-2026');
  });

  it('applies the live modifier class only for live/halftime matches', () => {
    const fixture = TestBed.createComponent(FootballMatchRowComponent);
    fixture.componentInstance.match = match({ status: 'live', minute: 42 });
    fixture.detectChanges();
    const link = fixture.debugElement.query(By.css('a.row'));
    expect(link.nativeElement.classList.contains('row--live')).toBeTrue();
  });

  it('does not apply the live class to a finished match', () => {
    const fixture = TestBed.createComponent(FootballMatchRowComponent);
    fixture.componentInstance.match = match({ status: 'finished', score: { home: 2, away: 1 } });
    fixture.detectChanges();
    const link = fixture.debugElement.query(By.css('a.row'));
    expect(link.nativeElement.classList.contains('row--live')).toBeFalse();
  });

  it('exposes a coherent accessible label, not just numbers', () => {
    const fixture = TestBed.createComponent(FootballMatchRowComponent);
    fixture.componentInstance.match = match({ status: 'live', minute: 10, score: { home: 1, away: 0 } });
    fixture.detectChanges();
    const link = fixture.debugElement.query(By.css('a.row'));
    expect(link.nativeElement.getAttribute('aria-label')).toContain('Real Madrid contra Barcelona');
  });
});
