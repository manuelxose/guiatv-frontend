import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Input,
  PLATFORM_ID,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { interval } from 'rxjs';
import { TvReadItemDTO } from '../../api/models';
import { normalizeToCard, UnifiedCardData } from '../../utils/tv-normalizers';
import { formatMadridHM, madridMinutesSinceMidnight, minutesBetween } from '../../utils/madrid-time';

/** Pixels per minute of broadcast time — controls the horizontal density of the timeline. */
const PX_PER_MINUTE = 2.6;
/** Minimum on-screen width for a program block, so very short slots stay clickable/readable. */
const MIN_CELL_WIDTH_PX = 46;
/** Safety cap on the rendered window so a bad data point can't blow up the DOM width. */
const MAX_WINDOW_MINUTES = 30 * 60;

interface EpgGridCell {
  item: TvReadItemDTO;
  card: UnifiedCardData;
  leftPx: number;
  widthPx: number;
  timeLabel: string;
  ariaLabel: string;
}

interface EpgGridRow {
  channelId: string;
  channelName: string;
  channelIcon: string;
  cells: EpgGridCell[];
}

interface EpgGridTick {
  leftPx: number;
  label: string;
}

/**
 * True channel×time grid for the EPG (Direction 3 "Hybrid Signal" — grid is
 * the ≥1024px default view on `programacion-tv/guia-canales`). Channels are
 * rows, a horizontal time axis runs left→right, program blocks are
 * positioned/sized from their real `airing.start`/`airing.end`.
 *
 * Purely presentational: consumes the same `TvReadItemDTO[]` the rail view
 * already fetches via `TvDataFacade.getAllPrograms()` (`readView('all')`) —
 * no separate API call. SSR-safe: the row/cell layout is computed from plain
 * data with `Date`/`Intl` math, no `isBrowser` gate on rendering. The only
 * browser-only behavior is the periodic refresh of the "now" line and
 * roving-focus DOM `.focus()` calls, both cosmetic/interaction concerns, not
 * data gates.
 */
@Component({
  selector: 'app-epg-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './epg-grid.component.html',
  styleUrl: './epg-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpgGridComponent {
  @ViewChild('gridBody') private readonly gridBody?: ElementRef<HTMLElement>;

  private readonly itemsSignal = signal<TvReadItemDTO[]>([]);
  @Input({ required: true })
  set items(value: TvReadItemDTO[] | null | undefined) {
    this.itemsSignal.set(value || []);
  }
  get items(): TvReadItemDTO[] {
    return this.itemsSignal();
  }

  private readonly nowSignal = signal(new Date());
  private readonly focusedRow = signal(0);
  private readonly focusedCol = signal(0);

  private readonly window = computed(() => computeWindow(this.itemsSignal()));

  readonly rows = computed<EpgGridRow[]>(() => buildRows(this.itemsSignal(), this.window()));
  readonly ticks = computed<EpgGridTick[]>(() => buildTicks(this.window()));
  readonly timelineWidthPx = computed(() => {
    const win = this.window();
    return Math.max(minutesBetween(win.start, win.end) * PX_PER_MINUTE, MIN_CELL_WIDTH_PX);
  });
  readonly nowLeftPx = computed<number | null>(() => {
    const win = this.window();
    const now = this.nowSignal();
    if (now.getTime() < win.start.getTime() || now.getTime() > win.end.getTime()) {
      return null;
    }
    return minutesBetween(win.start, now) * PX_PER_MINUTE;
  });

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {
    if (isPlatformBrowser(this.platformId)) {
      interval(30_000)
        .pipe(takeUntilDestroyed())
        .subscribe(() => this.nowSignal.set(new Date()));
    }
  }

  isFocused(rowIndex: number, colIndex: number): boolean {
    return this.focusedRow() === rowIndex && this.focusedCol() === colIndex;
  }

  setFocus(rowIndex: number, colIndex: number): void {
    this.focusedRow.set(rowIndex);
    this.focusedCol.set(colIndex);
  }

  onCellKeydown(event: KeyboardEvent, rowIndex: number, colIndex: number): void {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.moveHorizontal(rowIndex, colIndex, 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.moveHorizontal(rowIndex, colIndex, -1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveVertical(rowIndex, colIndex, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveVertical(rowIndex, colIndex, -1);
        break;
      case ' ':
      case 'Spacebar':
        // Anchors don't natively activate on Space (only Enter) — trigger
        // the same navigation a click/Enter would, so the requirement
        // "Enter/Space opens program detail" holds for both keys.
        event.preventDefault();
        (event.currentTarget as HTMLElement).click();
        break;
      default:
        break;
    }
  }

  trackRow(_index: number, row: EpgGridRow): string {
    return row.channelId;
  }

  trackCell(_index: number, cell: EpgGridCell): string {
    return cell.item.id;
  }

  trackTick(_index: number, tick: EpgGridTick): string {
    return tick.label;
  }

  private moveHorizontal(rowIndex: number, colIndex: number, direction: 1 | -1): void {
    const row = this.rows()[rowIndex];
    if (!row) {
      return;
    }
    const nextCol = colIndex + direction;
    if (nextCol < 0 || nextCol >= row.cells.length) {
      return;
    }
    this.focusCell(rowIndex, nextCol);
  }

  private moveVertical(rowIndex: number, colIndex: number, direction: 1 | -1): void {
    const rows = this.rows();
    const nextRow = rowIndex + direction;
    if (nextRow < 0 || nextRow >= rows.length) {
      return;
    }
    const targetCells = rows[nextRow].cells;
    if (!targetCells.length) {
      return;
    }
    const referenceLeft = rows[rowIndex]?.cells[colIndex]?.leftPx ?? 0;
    let bestIndex = 0;
    let bestDelta = Infinity;
    targetCells.forEach((cell, index) => {
      const delta = Math.abs(cell.leftPx - referenceLeft);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIndex = index;
      }
    });
    this.focusCell(nextRow, bestIndex);
  }

  private focusCell(rowIndex: number, colIndex: number): void {
    this.setFocus(rowIndex, colIndex);
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    queueMicrotask(() => {
      const root = this.gridBody?.nativeElement;
      const el = root?.querySelector<HTMLElement>(`[data-cell="${rowIndex}-${colIndex}"]`);
      el?.focus();
    });
  }
}

interface TimeWindow {
  start: Date;
  end: Date;
}

/** Floors an instant to the start of its Europe/Madrid hour (e.g. 22:47 → 22:00), using only the exported madrid-time helpers. */
function floorToMadridHour(date: Date): Date {
  const minutes = madridMinutesSinceMidnight(date);
  const deltaMinutes = minutes - Math.floor(minutes / 60) * 60;
  return new Date(date.getTime() - deltaMinutes * 60_000);
}

function ceilToMadridHour(date: Date): Date {
  const floored = floorToMadridHour(date);
  return floored.getTime() === date.getTime() ? floored : new Date(floored.getTime() + 60 * 60_000);
}

function computeWindow(items: TvReadItemDTO[]): TimeWindow {
  const now = new Date();
  if (!items.length) {
    return { start: floorToMadridHour(now), end: new Date(floorToMadridHour(now).getTime() + 6 * 60 * 60_000) };
  }

  let minStart = Number.POSITIVE_INFINITY;
  let maxEnd = Number.NEGATIVE_INFINITY;
  items.forEach((item) => {
    const start = new Date(item.airing.start).getTime();
    const end = new Date(item.airing.end).getTime();
    if (!Number.isNaN(start)) {
      minStart = Math.min(minStart, start);
    }
    if (!Number.isNaN(end)) {
      maxEnd = Math.max(maxEnd, end);
    }
  });

  if (!Number.isFinite(minStart) || !Number.isFinite(maxEnd) || maxEnd <= minStart) {
    return { start: floorToMadridHour(now), end: new Date(floorToMadridHour(now).getTime() + 6 * 60 * 60_000) };
  }

  const start = floorToMadridHour(new Date(minStart));
  let end = ceilToMadridHour(new Date(maxEnd));
  const spanMinutes = minutesBetween(start, end);
  if (spanMinutes > MAX_WINDOW_MINUTES) {
    end = new Date(start.getTime() + MAX_WINDOW_MINUTES * 60_000);
  }
  return { start, end };
}

function buildTicks(window: TimeWindow): EpgGridTick[] {
  const ticks: EpgGridTick[] = [];
  const totalMinutes = minutesBetween(window.start, window.end);
  for (let offset = 0; offset <= totalMinutes; offset += 60) {
    const tickDate = new Date(window.start.getTime() + offset * 60_000);
    ticks.push({ leftPx: offset * PX_PER_MINUTE, label: formatMadridHM(tickDate) });
  }
  return ticks;
}

function buildRows(items: TvReadItemDTO[], window: TimeWindow): EpgGridRow[] {
  const rowsById = new Map<string, EpgGridRow>();
  const sorted = [...items].sort((left, right) => {
    const orderLeft = Number(left.channel.sortOrder ?? 999);
    const orderRight = Number(right.channel.sortOrder ?? 999);
    if (orderLeft !== orderRight) {
      return orderLeft - orderRight;
    }
    return left.channel.name.localeCompare(right.channel.name, 'es');
  });

  sorted.forEach((item) => {
    const start = new Date(item.airing.start);
    const end = new Date(item.airing.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return;
    }
    const channelId = item.channel.id;
    const row = rowsById.get(channelId) || {
      channelId,
      channelName: item.channel.name,
      channelIcon: item.assets.channelLogo?.url || item.channel.icon || '',
      cells: [],
    };

    const clampedStart = start.getTime() < window.start.getTime() ? window.start : start;
    const clampedEnd = end.getTime() > window.end.getTime() ? window.end : end;
    if (clampedEnd.getTime() <= clampedStart.getTime()) {
      return;
    }

    const card = normalizeToCard(item);
    const leftPx = minutesBetween(window.start, clampedStart) * PX_PER_MINUTE;
    const widthPx = Math.max(minutesBetween(clampedStart, clampedEnd) * PX_PER_MINUTE, MIN_CELL_WIDTH_PX);
    const startLabel = formatMadridHM(start);
    const endLabel = formatMadridHM(end);

    row.cells.push({
      item,
      card,
      leftPx,
      widthPx,
      timeLabel: startLabel,
      ariaLabel: `${item.channel.name}: ${item.program.title}, ${startLabel} a ${endLabel}${item.airing.liveNow ? ', en directo' : ''}`,
    });

    rowsById.set(channelId, row);
  });

  rowsById.forEach((row) => row.cells.sort((left, right) => left.leftPx - right.leftPx));

  return Array.from(rowsById.values());
}
