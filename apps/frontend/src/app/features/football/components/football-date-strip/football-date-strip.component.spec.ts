import { TestBed } from '@angular/core/testing';
import { FootballDateStripComponent } from './football-date-strip.component';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

describe('FootballDateStripComponent', () => {
  let component: FootballDateStripComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FootballDateStripComponent] });
    component = TestBed.createComponent(FootballDateStripComponent).componentInstance;
  });

  it('marks today as isToday and, by default, as isSelected', () => {
    const today = component.days.find((d) => d.isToday);
    expect(today?.key).toBe(todayKey());
    expect(today?.isSelected).toBeTrue();
  });

  it('marks the day matching `selected` as selected, not today', () => {
    const days = component.days;
    const someOtherDay = days.find((d) => !d.isToday)!;
    component.selected = someOtherDay.key;
    const selectedDay = component.days.find((d) => d.isSelected);
    expect(selectedDay?.key).toBe(someOtherDay.key);
    expect(selectedDay?.isToday).toBeFalse();
  });

  it('emits a YYYYMMDD key on select — the single source of truth the page reads back', () => {
    let emitted = '';
    component.dateChange.subscribe((key) => (emitted = key));
    const target = component.days[0].key;
    component.select(target);
    expect(emitted).toBe(target);
    expect(emitted).toMatch(/^\d{8}$/);
  });

  it('shift(-1)/shift(1) move exactly one calendar day from the current selection', () => {
    component.selected = todayKey();
    let emitted = '';
    component.dateChange.subscribe((key) => (emitted = key));

    component.shift(1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = `${tomorrow.getFullYear()}${String(tomorrow.getMonth() + 1).padStart(2, '0')}${String(
      tomorrow.getDate()
    ).padStart(2, '0')}`;
    expect(emitted).toBe(tomorrowKey);
  });

  it('the native date-picker change handler converts YYYY-MM-DD to YYYYMMDD', () => {
    let emitted = '';
    component.dateChange.subscribe((key) => (emitted = key));
    const input = document.createElement('input');
    input.value = '2026-12-25';
    component.onPickerChange({ target: input } as unknown as Event);
    expect(emitted).toBe('20261225');
  });
});
