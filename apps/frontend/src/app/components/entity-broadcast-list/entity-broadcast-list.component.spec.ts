import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EntityBroadcast, EntityBroadcasts } from '../../pages/entity-detail/entity-detail.model';
import { EntityBroadcastListComponent } from './entity-broadcast-list.component';

const item = (over: Partial<EntityBroadcast> = {}): EntityBroadcast => ({
  airingId: 'a1', channel: { id: 'amc', name: 'AMC', icon: '/storage/channel_icons/amc.webp', path: '/canales/amc' }, programmeTitle: 'La cura del bienestar',
  start: '2026-10-23T15:29:00.000Z', end: '2026-10-23T17:53:00.000Z', startLocal: '2026-10-23T17:29:00+02:00', localDate: '2026-10-23', localTime: '17:29', durationMinutes: 144, ...over,
});
const list = (status: EntityBroadcasts['status'], items: EntityBroadcast[] = []): EntityBroadcasts => ({ status, items, generatedAt: '2026-10-22T10:00:00.000Z', timeZone: 'Europe/Madrid' });

function render(broadcasts: EntityBroadcasts | undefined, now = new Date('2026-10-22T10:00:00Z')) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(EntityBroadcastListComponent);
  fixture.componentRef.setInput('broadcasts', broadcasts);
  fixture.componentRef.setInput('now', now);
  fixture.componentRef.setInput('entityTitle', 'La cura del bienestar');
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('EntityBroadcastListComponent', () => {
  it('lists each broadcast with a channel link, Madrid time, duration and time until', () => {
    const el = render(list('ok', [item(), item({ airingId: 'a2', channel: { id: 'la_1', name: 'La 1', path: '/canales/la-1' }, start: '2026-10-26T20:00:00.000Z', end: '2026-10-26T22:00:00.000Z', localTime: '22:00', startLocal: '2026-10-26T21:00:00+01:00', durationMinutes: 120 })]));
    const cards = el.querySelectorAll('li');
    expect(cards.length).toBe(2);
    const first = cards[0];
    expect(first.querySelector('a')!.getAttribute('href')).toBe('/canales/amc');
    expect(first.textContent).toContain('AMC');
    expect(first.textContent).toContain('Mañana · 17:29');
    expect(first.textContent).toContain('2 h 24 min');
    expect(first.textContent).toContain('mañana');
    expect(first.querySelector('time')!.getAttribute('datetime')).toBe('2026-10-23T17:29:00+02:00');
    expect(first.querySelector('time')!.getAttribute('aria-label')).toContain('CEST');
    expect(first.querySelector('img')!.getAttribute('alt')).toBe('');
    expect(cards[1].textContent).toContain('en 4 días');
    expect(el.querySelector('h2')!.textContent).toContain('Próximas emisiones');
    expect(el.textContent).toContain('Horario peninsular');
  });

  it('marks a live broadcast and says what the guide calls the film when it differs', () => {
    const el = render(list('ok', [item({ programmeTitle: 'La cura del bienestar (2017)', start: '2026-10-22T09:00:00.000Z', end: '2026-10-22T11:00:00.000Z', subtitle: 'Cine de terror' })]));
    expect(el.textContent).toContain('En emisión ahora');
    expect(el.textContent).toContain('Emitida como «La cura del bienestar (2017)»');
    expect(el.textContent).toContain('Cine de terror');
  });

  it('drops what ended since the page was built, and falls to the empty state if nothing is left', () => {
    const el = render(list('ok', [item({ start: '2026-10-22T07:00:00.000Z', end: '2026-10-22T09:00:00.000Z' })]));
    expect(el.querySelectorAll('li').length).toBe(0);
    expect(el.textContent).toContain('No hay emisiones programadas');
  });

  it('empty and unavailable states are distinct and never claim a schedule', () => {
    const empty = render(list('none'));
    expect(empty.textContent).toContain('No hay emisiones programadas en la programación disponible');
    expect(empty.querySelector('a')!.getAttribute('href')).toBe('/programacion-tv/que-ver-hoy');
    TestBed.resetTestingModule();
    const down = render(list('unavailable'));
    expect(down.textContent).toContain('No hemos podido comprobar la programación');
    expect(down.querySelector('[role="status"]')).not.toBeNull();
    expect(down.textContent).not.toContain('No hay emisiones programadas');
    TestBed.resetTestingModule();
    expect(render(undefined).textContent).toContain('No hay emisiones programadas');
  });
});
