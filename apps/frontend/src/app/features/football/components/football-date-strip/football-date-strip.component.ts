import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface FootballDateStripDay {
  key: string; // YYYYMMDD
  label: string; // "Lun 17"
  isToday: boolean;
  isSelected: boolean;
}

function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function fromKey(key: string): Date | null {
  const match = /^(\d{4})(\d{2})(\d{2})$/.exec(key);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/**
 * Horizontal date navigation (spec §11/§57): Yesterday/Today/Tomorrow plus a
 * short scrollable strip, today visually obvious, keyboard accessible, plus
 * a native date picker for jumping further out. Emits a canonical YYYYMMDD
 * key — the caller owns writing it to the `date` query param.
 */
@Component({
  selector: 'app-football-date-strip',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="strip" role="group" aria-label="Selección de fecha">
      <button type="button" class="strip__nav" (click)="shift(-1)" aria-label="Día anterior">‹</button>

      <div class="strip__days">
        <button
          *ngFor="let day of days"
          type="button"
          class="strip__day"
          [class.strip__day--today]="day.isToday"
          [class.strip__day--selected]="day.isSelected"
          [attr.aria-current]="day.isSelected ? 'date' : null"
          (click)="select(day.key)"
        >
          {{ day.label }}
        </button>
      </div>

      <button type="button" class="strip__nav" (click)="shift(1)" aria-label="Día siguiente">›</button>

      <label class="strip__picker">
        <span class="sr-only">Elegir fecha en el calendario</span>
        <input type="date" [value]="pickerValue" (change)="onPickerChange($event)" />
      </label>
    </div>
  `,
  styles: `
    // Flat row, not a boxed pill container — matches the borderless filter
    // rows on every other section (MASTER §1: spacing/typography separate
    // sections, not cards).
    .strip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      overflow: hidden;
      padding: 0.25rem 0;
    }
    .strip__nav {
      flex: 0 0 auto;
      width: 2rem;
      height: 2rem;
      min-width: 44px;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--portal-border);
      border-radius: var(--radius-pill);
      background: var(--portal-card);
      color: var(--portal-text-muted);
      font-size: 1rem;
      cursor: pointer;
    }
    .strip__nav:hover, .strip__nav:focus-visible { border-color: var(--accent-sports); color: var(--portal-text); }

    .strip__days {
      display: flex;
      gap: 0.25rem;
      overflow-x: auto;
      scrollbar-width: none;
      flex: 1 1 auto;
    }
    .strip__days::-webkit-scrollbar { display: none; }

    .strip__day {
      flex: 0 0 auto;
      min-width: 44px;
      min-height: 44px;
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-pill);
      border: 1px solid transparent;
      background: transparent;
      color: var(--portal-text-muted);
      font-size: 0.8125rem;
      font-weight: 650;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      white-space: nowrap;
    }
    .strip__day--today { border-color: var(--portal-border-strong); color: var(--portal-text); }
    .strip__day--selected {
      background: color-mix(in srgb, var(--guide-accent, var(--accent-sports)) 12%, var(--portal-surface-strong));
      border-color: color-mix(in srgb, var(--guide-accent, var(--accent-sports)) 45%, var(--portal-border));
      color: var(--portal-text);
      font-weight: 800;
    }

    .strip__picker {
      flex: 0 0 auto;
      display: inline-flex;
    }
    .strip__picker input {
      min-width: 44px;
      min-height: 44px;
      padding: 0.25rem 0.4rem;
      border: 1px solid var(--portal-border);
      border-radius: var(--radius-pill);
      background: var(--portal-card);
      color: var(--portal-text);
      font-size: 0.8125rem;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
  `,
})
export class FootballDateStripComponent {
  /** Selected date key (YYYYMMDD). Defaults to today when empty. */
  @Input() selected = '';
  @Output() dateChange = new EventEmitter<string>();

  get days(): FootballDateStripDay[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = toKey(today);
    const selectedKey = this.selected || todayKey;

    const result: FootballDateStripDay[] = [];
    for (let offset = -2; offset <= 4; offset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      const key = toKey(date);
      result.push({
        key,
        label: offset === 0
          ? 'Hoy'
          : offset === -1
            ? 'Ayer'
            : offset === 1
              ? 'Mañana'
              : date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        isToday: key === todayKey,
        isSelected: key === selectedKey,
      });
    }
    return result;
  }

  get pickerValue(): string {
    const key = this.selected || toKey(new Date());
    const date = fromKey(key);
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  select(key: string): void {
    this.dateChange.emit(key);
  }

  shift(delta: number): void {
    const base = fromKey(this.selected || toKey(new Date())) ?? new Date();
    base.setDate(base.getDate() + delta);
    this.dateChange.emit(toKey(base));
  }

  onPickerChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value; // YYYY-MM-DD
    if (!value) return;
    this.dateChange.emit(value.replace(/-/g, ''));
  }
}
