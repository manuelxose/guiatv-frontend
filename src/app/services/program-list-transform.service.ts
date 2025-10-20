import { Injectable } from '@angular/core';
import { IProgramListData, IProgramItem } from 'src/app/interfaces';

/*
  Service that centralizes all program-list transformation logic.
  The methods are pure and accept the small set of inputs they need so
  the component can delegate heavy processing here. This keeps the
  component focused on UI and signals.
*/

const UI_CONFIG = {
  PIXELS_PER_HOUR: 240,
  LOGO_COLUMN_WIDTH: 160,
  BASE_CHANNEL_HEIGHT: 75,
  LAYER_HEIGHT: 75,
  EXPANDED_BANNER_HEIGHT: 320,
  MINUTES_PER_SLOT: 30,
  MINUTES_PER_COLUMN: 5,
  MAX_GRID_COLUMNS: 7,
  NIGHT_SLOT_END_MINUTES: 30,
  MAX_LAYERS: 5,
} as const;

interface ProgramWithPosition extends IProgramItem {
  gridColumnStart: number;
  gridColumnEnd: number;
  layerIndex: number;
  visibleStartTime: string;
  visibleEndTime: string;
  isCutAtStart: boolean;
  isCutAtEnd: boolean;
  _normStartMinutes?: number;
  _normEndMinutes?: number;
}

@Injectable({ providedIn: 'root' })
export class ProgramListTransformService {
  constructor() {}

  parseTimeToMinutes(timeString: string): number {
    const [hours, minutes] = String(timeString || '00:00')
      .split(':')
      .map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  formatMinutesToHHMM(totalMinutes: number): string {
    const norm = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
    const hh = Math.floor(norm / 60)
      .toString()
      .padStart(2, '0');
    const mm = (norm % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  minutesToGridColumn(
    minutes: number,
    slotStartMinutes: number,
    totalColumns: number,
    isNightSlot: boolean
  ): number {
    const unit = UI_CONFIG.MINUTES_PER_COLUMN;
    let delta = minutes - slotStartMinutes;

    if (delta < 0 && isNightSlot) {
      delta += 1440;
    }

    if (delta < 0) delta = 0;
    const colIndex = Math.floor(delta / unit);
    return Math.max(1, Math.min(totalColumns, colIndex + 1));
  }

  isNightTimeSlot(currentHours: string[]): boolean {
    return currentHours?.includes('00:00') ?? false;
  }

  getSlotEndMinutes(currentHours: string[]): number {
    if (!currentHours?.length) return 1440;

    const lastHour = currentHours[currentHours.length - 1];
    const [hours, minutes] = lastHour.split(':').map(Number);
    let lastHourMinutes = hours * 60 + (minutes || 0);

    let slotEndMinutes = lastHourMinutes + UI_CONFIG.MINUTES_PER_SLOT;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    if (slotEndMinutes <= slotStartMinutes) {
      slotEndMinutes += 1440;
    }

    return slotEndMinutes;
  }

  getSlotStartTimestamp(dayOffset: number, slotStartMinutes: number): number {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const date = now.getUTCDate() + dayOffset;
    const hours = Math.floor(slotStartMinutes / 60);
    const minutes = slotStartMinutes % 60;
    return Date.UTC(year, month, date, hours, minutes, 0, 0);
  }

  getProgramStartTimestamp(programa: IProgramItem): number {
    try {
      return Date.parse(String(programa.start));
    } catch {
      return 0;
    }
  }

  getProgramEndTimestamp(programa: IProgramItem): number {
    try {
      const startTs = Date.parse(String(programa.start));
      let endTs = Date.parse(String(programa.stop));
      if (isNaN(endTs) || isNaN(startTs)) return endTs || startTs || 0;
      if (endTs <= startTs) {
        endTs += 24 * 60 * 60 * 1000;
      }
      return endTs;
    } catch {
      return 0;
    }
  }

  normalizeProgramRange(
    programStartMinutes: number,
    programEndMinutes: number,
    slotStartMinutes: number
  ): { start: number; end: number } {
    let start = programStartMinutes;
    let end = programEndMinutes;
    if (end <= start) {
      end += 1440;
    }

    while (end <= slotStartMinutes) {
      start += 1440;
      end += 1440;
    }

    if (start < slotStartMinutes && end > slotStartMinutes) {
      start = slotStartMinutes;
    }

    if (end <= start) {
      end = start + 1;
    }

    return { start, end };
  }

  getProgramStartMinutes(programa: IProgramItem): number {
    if (!programa?.start) return 0;
    try {
      const date = new Date(String(programa.start));
      return date.getUTCHours() * 60 + date.getUTCMinutes();
    } catch {
      return 0;
    }
  }

  getProgramEndMinutes(programa: IProgramItem): number {
    if (!programa?.stop || !programa?.start) return 0;
    try {
      const startDate = new Date(String(programa.start));
      const endDate = new Date(String(programa.stop));

      const startMinutes =
        startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
      let endMinutes = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();

      if (
        endDate.getTime() <= startDate.getTime() ||
        endMinutes <= startMinutes
      ) {
        endMinutes += 1440;
      }

      return endMinutes;
    } catch {
      return 0;
    }
  }

  programCrossesMidnight(programa: IProgramItem): boolean {
    if (!programa?.start || !programa?.stop) return false;
    try {
      const startMinutes = this.getProgramStartMinutes(programa);
      const endMinutes = this.getProgramEndMinutes(programa);
      return endMinutes > 1440 || endMinutes > startMinutes;
    } catch {
      return false;
    }
  }

  minutesOverlap(
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number
  ): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  programsOverlapInGrid(
    p1: ProgramWithPosition,
    p2: ProgramWithPosition
  ): boolean {
    if (
      typeof p1._normStartMinutes === 'number' &&
      typeof p1._normEndMinutes === 'number' &&
      typeof p2._normStartMinutes === 'number' &&
      typeof p2._normEndMinutes === 'number'
    ) {
      return this.minutesOverlap(
        p1._normStartMinutes!,
        p1._normEndMinutes!,
        p2._normStartMinutes!,
        p2._normEndMinutes!
      );
    }

    const noOverlap =
      p1.gridColumnEnd <= p2.gridColumnStart ||
      p2.gridColumnEnd <= p1.gridColumnStart;
    return !noOverlap;
  }

  removeOverlappingPrograms(
    programs: IProgramItem[],
    currentHours: string[]
  ): IProgramItem[] {
    if (!programs || programs.length < 2) return programs;

    const slotStartMinutes = currentHours.length
      ? this.parseTimeToMinutes(currentHours[0])
      : 0;

    const mapped = programs.map((p) => {
      const startMin = this.getProgramStartMinutes(p);
      const endMin = this.getProgramEndMinutes(p);
      const { start, end } = this.normalizeProgramRange(
        startMin,
        endMin,
        slotStartMinutes
      );
      return { program: p, start, end };
    });

    mapped.sort((a, b) =>
      a.start !== b.start ? a.start - b.start : a.end - b.end
    );

    const kept: { program: IProgramItem; start: number; end: number }[] = [];
    kept.push(mapped[0]);

    for (let i = 1; i < mapped.length; i++) {
      const current = mapped[i];
      const last = kept[kept.length - 1];

      if (current.start >= last.end) {
        kept.push(current);
        continue;
      }

      kept[kept.length - 1] = current;
    }

    return kept.map((k) => k.program);
  }

  isProgramInVisibleSlot(
    programa: IProgramItem,
    slotStartMinutes: number,
    slotEndMinutes: number,
    isNightSlot: boolean
  ): boolean {
    const programStartMinutes = this.getProgramStartMinutes(programa);
    const programEndMinutes = this.getProgramEndMinutes(programa);

    if (isNightSlot) {
      return (
        programStartMinutes >= slotStartMinutes ||
        programEndMinutes <= slotEndMinutes ||
        (programStartMinutes < slotStartMinutes &&
          programEndMinutes > slotStartMinutes)
      );
    } else {
      return (
        programStartMinutes < slotEndMinutes &&
        programEndMinutes > slotStartMinutes
      );
    }
  }

  calculateNightCrossingEndMinutes(
    programEndMinutes: number,
    slotEndMinutes: number
  ): number {
    return programEndMinutes <= slotEndMinutes
      ? programEndMinutes
      : slotEndMinutes;
  }

  calculateGridColumnEnd(
    programa: IProgramItem,
    programStartMinutes: number,
    effectiveEndMinutes: number,
    slotStartMinutes: number,
    isNightSlot: boolean,
    crossesMidnight: boolean
  ): number {
    const columnsPerSlot =
      UI_CONFIG.MINUTES_PER_SLOT / UI_CONFIG.MINUTES_PER_COLUMN;
    const totalColumns = UI_CONFIG.MAX_GRID_COLUMNS * columnsPerSlot;

    // compute startColumn: approximate by mapping normalized start
    const unit = UI_CONFIG.MINUTES_PER_COLUMN;

    let endMinutesFromSlotStart = effectiveEndMinutes - slotStartMinutes;
    if (endMinutesFromSlotStart < 0 && isNightSlot) {
      endMinutesFromSlotStart += 1440;
    }
    if (endMinutesFromSlotStart < 1) endMinutesFromSlotStart = 1;

    const endColIndex = Math.ceil(endMinutesFromSlotStart / unit);
    const finalEndColumn = Math.max(
      2,
      Math.min(totalColumns + 1, endColIndex + 1)
    );

    return finalEndColumn;
  }

  getProgramGridColumn(programa: IProgramItem, currentHours: string[]): number {
    if (!currentHours.length) return 1;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const programStartMinutes = this.getProgramStartMinutes(programa);
    const programEndMinutes = this.getProgramEndMinutes(programa);
    const isNightSlot = this.isNightTimeSlot(currentHours);

    const columnsPerSlot =
      UI_CONFIG.MINUTES_PER_SLOT / UI_CONFIG.MINUTES_PER_COLUMN;
    const totalColumns = UI_CONFIG.MAX_GRID_COLUMNS * columnsPerSlot;

    const { start: normalizedStart } = this.normalizeProgramRange(
      programStartMinutes,
      programEndMinutes,
      slotStartMinutes
    );

    return this.minutesToGridColumn(
      normalizedStart,
      slotStartMinutes,
      totalColumns,
      isNightSlot
    );
  }

  getProgramGridColumnEnd(
    programa: IProgramItem,
    currentHours: string[]
  ): number {
    if (!currentHours.length) return 2;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);
    const isNightSlot = this.isNightTimeSlot(currentHours);

    const programStartMinutes = this.getProgramStartMinutes(programa);
    const programEndMinutes = this.getProgramEndMinutes(programa);
    const crossesMidnight = this.programCrossesMidnight(programa);

    const { start: normalizedStart, end: normalizedEnd } =
      this.normalizeProgramRange(
        programStartMinutes,
        programEndMinutes,
        slotStartMinutes
      );

    let effectiveProgramEndMinutes: number;

    const programInVisibleSlot = this.isProgramInVisibleSlot(
      programa,
      slotStartMinutes,
      slotEndMinutes,
      isNightSlot
    );

    if (!programInVisibleSlot) {
      effectiveProgramEndMinutes = normalizedEnd;
    } else if (isNightSlot && crossesMidnight) {
      effectiveProgramEndMinutes = normalizedEnd;
    } else if (isNightSlot) {
      effectiveProgramEndMinutes = Math.min(normalizedEnd, slotEndMinutes);
    } else {
      effectiveProgramEndMinutes = Math.min(normalizedEnd, slotEndMinutes);
    }

    return this.calculateGridColumnEnd(
      programa,
      normalizedStart,
      effectiveProgramEndMinutes,
      slotStartMinutes,
      isNightSlot,
      crossesMidnight
    );
  }

  getVisiblePrograms(
    programs: IProgramItem[],
    currentHours: string[],
    activeDay: number
  ): IProgramItem[] {
    if (!programs?.length) return [];
    if (!currentHours.length) return programs;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);

    const slotStartTs = this.getSlotStartTimestamp(activeDay, slotStartMinutes);
    const slotEndTs =
      slotStartTs + (slotEndMinutes - slotStartMinutes) * 60_000;

    const DAY_MS = 24 * 60 * 60 * 1000;

    const visible = programs.filter((programa) => {
      const hasDate = /\d{4}-\d{2}-\d{2}T/.test(String(programa.start));

      if (hasDate) {
        const startTs = Date.parse(String(programa.start));
        let endTs = Date.parse(String(programa.stop));

        if (isNaN(startTs) || isNaN(endTs)) return false;
        if (endTs <= startTs) endTs += DAY_MS;

        const programIntersectsSlot =
          startTs < slotEndTs && endTs > slotStartTs;
        if (programIntersectsSlot) return true;

        const approxShiftDays = Math.round((slotStartTs - startTs) / DAY_MS);
        for (let k = approxShiftDays - 1; k <= approxShiftDays + 1; k++) {
          const adjStart = startTs + k * DAY_MS;
          const adjEnd = endTs + k * DAY_MS;
          if (adjStart < slotEndTs && adjEnd > slotStartTs) return true;
        }

        return false;
      }

      const programStartMinutes = this.getProgramStartMinutes(programa);
      const programEndMinutes = this.getProgramEndMinutes(programa);

      const { start: normStart, end: normEnd } = this.normalizeProgramRange(
        programStartMinutes,
        programEndMinutes,
        slotStartMinutes
      );

      return normEnd > slotStartMinutes && normStart < slotEndMinutes;
    });

    return visible;
  }

  calculateVisibleDuration(
    programa: IProgramItem,
    currentHours: string[]
  ): number {
    if (!currentHours.length) return 30;

    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    const isNightSlot = this.isNightTimeSlot(currentHours);
    const slotEndMinutes = this.getSlotEndMinutes(currentHours);

    const programStartMinutes = this.getProgramStartMinutes(programa);
    const programEndMinutes = this.getProgramEndMinutes(programa);
    const crossesMidnight = this.programCrossesMidnight(programa);

    if (isNightSlot && crossesMidnight) {
      return this.calculateNightCrossingDuration(
        programStartMinutes,
        programEndMinutes,
        slotStartMinutes,
        slotEndMinutes
      );
    }

    const visibleStartMinutes = Math.max(programStartMinutes, slotStartMinutes);
    const visibleEndMinutes = isNightSlot
      ? Math.min(programEndMinutes, 1440)
      : Math.min(programEndMinutes, slotEndMinutes);

    return Math.max(1, visibleEndMinutes - visibleStartMinutes);
  }

  calculateNightCrossingDuration(
    programStartMinutes: number,
    programEndMinutes: number,
    slotStartMinutes: number,
    slotEndMinutes: number
  ): number {
    const visibleStartMinutes = Math.max(programStartMinutes, slotStartMinutes);
    const durationUntilMidnight = 1440 - visibleStartMinutes;
    const durationAfterMidnight = Math.min(programEndMinutes, slotEndMinutes);

    return Math.max(1, durationUntilMidnight + durationAfterMidnight);
  }

  calculateRealDuration(programa: IProgramItem): number {
    const startMinutes = this.getProgramStartMinutes(programa);
    const endMinutes = this.getProgramEndMinutes(programa);

    if (this.programCrossesMidnight(programa)) {
      return 1440 - startMinutes + endMinutes;
    }

    return endMinutes - startMinutes;
  }

  filterProgramsByActiveDay(
    programs: IProgramItem[],
    dayIndex: number
  ): IProgramItem[] {
    // Robust implementation notes:
    // - Accepts ISO datetimes (with or without timezone) and time-only strings 'HH:MM'
    // - Normalizes all comparisons to UTC epoch milliseconds
    // - Handles programs that cross midnight by adding 24h when necessary
    // - Tries small day shifts (±1) for ISO datetimes when necessary to match the target day
    if (!Array.isArray(programs) || programs.length === 0) return [];

    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const date = now.getUTCDate() + dayIndex;
    const dayStartTs = Date.UTC(year, month, date, 0, 0, 0, 0);
    const dayEndTs = dayStartTs + DAY_MS;

    // Helper: try parse a value as an absolute timestamp (ISO) or as a time-only string
    const parsePossibleTimestamp = (
      value: unknown,
      preferDateForTimeOnly = true
    ): number | null => {
      if (value == null) return null;
      const s = String(value).trim();

      // If it looks like an ISO datetime with a date part, rely on Date.parse
      if (/\d{4}-\d{2}-\d{2}T/.test(s)) {
        const ts = Date.parse(s);
        return isNaN(ts) ? null : ts;
      }

      // Fallback: accept 'YYYY-MM-DD HH:MM' (space instead of T)
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
        const ts = Date.parse(s.replace(' ', 'T'));
        return isNaN(ts) ? null : ts;
      }

      // Accept time-only strings 'HH:MM' -> construct UTC date for the target day
      if (/^\d{1,2}:\d{2}$/.test(s)) {
        const [hStr, mStr] = s.split(':');
        const h = Number(hStr || 0);
        const m = Number(mStr || 0);
        if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
        return Date.UTC(year, month, date, h, m, 0, 0);
      }

      // Last resort: try Date.parse and return null if invalid
      const ts = Date.parse(s);
      return isNaN(ts) ? null : ts;
    };

    return programs.filter((p) => {
      // Try to parse start and end in multiple ways
      let startTs = parsePossibleTimestamp(p.start);
      let endTs = parsePossibleTimestamp(p.stop);

      // If both parsed as absolute timestamps (ISO-like), we compare with day window
      if (startTs != null && endTs != null) {
        // Ensure end > start (handle cross-midnight schedules)
        if (endTs <= startTs) endTs += DAY_MS;

        // Quick check: intersects directly
        if (startTs < dayEndTs && endTs > dayStartTs) return true;

        // Try shifting the program by ±1 day in case feed uses local dates or different day base
        const approxShift = Math.round((dayStartTs - startTs) / DAY_MS);
        for (let k = approxShift - 1; k <= approxShift + 1; k++) {
          const adjStart = startTs + k * DAY_MS;
          const adjEnd = endTs + k * DAY_MS;
          if (adjStart < dayEndTs && adjEnd > dayStartTs) return true;
        }

        return false;
      }

      // If start or end couldn't be parsed as absolute timestamp, try to interpret as time-only
      if (
        startTs == null &&
        typeof p.start === 'string' &&
        /^\d{1,2}:\d{2}$/.test(p.start)
      ) {
        startTs = parsePossibleTimestamp(p.start);
      }

      if (
        endTs == null &&
        typeof p.stop === 'string' &&
        /^\d{1,2}:\d{2}$/.test(p.stop)
      ) {
        endTs = parsePossibleTimestamp(p.stop);
      }

      // If we still don't have an end timestamp but have a start, try to estimate end from start+duration 30m
      if (startTs != null && endTs == null) {
        endTs = startTs + 30 * 60 * 1000; // default 30 minutes
      }

      if (startTs == null || endTs == null) return false;

      if (endTs <= startTs) endTs += DAY_MS;

      return startTs < dayEndTs && endTs > dayStartTs;
    });
  }

  normalizeCategoryName(category: string): string {
    const normalizedCategory = category.toLowerCase().trim();

    const categoryMappings: Record<string, string> = {
      pelicula: 'Películas',
      peliculas: 'Películas',
      cine: 'Películas',
      serie: 'Series',
      series: 'Series',
      drama: 'Series',
      documental: 'Documentales',
      documentales: 'Documentales',
      noticia: 'Noticias',
      noticias: 'Noticias',
      informativo: 'Noticias',
      deporte: 'Deportes',
      deportes: 'Deportes',
      futbol: 'Deportes',
      entretenimiento: 'Entretenimiento',
      show: 'Entretenimiento',
      musica: 'Música',
      música: 'Música',
      infantil: 'Infantil',
      niños: 'Infantil',
    };

    return (
      categoryMappings[normalizedCategory] ||
      this.capitalizeFirstLetter(normalizedCategory)
    );
  }

  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  sortCategories(categories: string[]): string[] {
    const categoryOrder = [
      'Películas',
      'Series',
      'Documentales',
      'Noticias',
      'Deportes',
      'Entretenimiento',
      'Música',
      'Infantil',
    ];

    return categories.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  }

  programMatchesCategory(
    programa: IProgramItem,
    categories: string[]
  ): boolean {
    if (!programa?.category?.value) return false;

    const programCategories = String(programa.category.value)
      .split(',')
      .map((cat) => this.normalizeCategoryName(cat.trim()))
      .filter((cat) => cat);

    return categories.some((category) =>
      programCategories.some(
        (programCategory) =>
          programCategory.toLowerCase() === category.toLowerCase()
      )
    );
  }

  /**
   * Extrae y normaliza la lista de categorías disponibles a partir de los canales
   */
  getAvailableCategories(channels: IProgramListData[] | undefined): string[] {
    if (!Array.isArray(channels) || channels.length === 0) return [];

    const categoriesSet = new Set<string>();
    channels.forEach((canal) => {
      const progs = Array.isArray(canal.channels) ? canal.channels : [];
      progs.forEach((p) => {
        if (p?.category?.value) {
          String(p.category.value)
            .split(',')
            .map((c) => this.normalizeCategoryName(c.trim()))
            .filter((c) => c)
            .forEach((c) => categoriesSet.add(c));
        }
      });
    });

    return this.sortCategories(Array.from(categoriesSet));
  }

  /**
   * Filtra canales por las categorías seleccionadas (Set<string>), devolviendo solo
   * canales que tengan al menos un programa que coincida.
   */
  getFilteredChannels(
    channels: IProgramListData[] | undefined,
    selectedCategories: Set<string> | undefined
  ): IProgramListData[] {
    if (!Array.isArray(channels) || channels.length === 0) return [];
    if (!selectedCategories || selectedCategories.size === 0) return channels;

    const categoriesArray = Array.from(selectedCategories);

    return channels
      .map((canal) => ({
        ...canal,
        channels: (canal.channels || []).filter((programa) =>
          this.programMatchesCategory(programa, categoriesArray)
        ),
      }))
      .filter(
        (canal) => Array.isArray(canal.channels) && canal.channels.length > 0
      );
  }

  // Main helper used by the component: compute layers for a channel
  getProgramLayers(
    canal: IProgramListData,
    activeDay: number,
    currentHours: string[]
  ): ProgramWithPosition[][] {
    if (!canal || !Array.isArray(canal.channels) || canal.channels.length === 0)
      return [];
    let programsForActiveDay = this.filterProgramsByActiveDay(
      canal.channels || [],
      activeDay
    );

    // Fallback: si el filtrado por día devuelve vacío (posible problema de fechas/UTC),
    // usar la lista completa de programas como fallback para mantener consistencia
    // entre la versión móvil (que llama a getVisiblePrograms directamente) y
    // la versión desktop.
    if (!programsForActiveDay || programsForActiveDay.length === 0) {
      // Log para facilitar debugging en entorno de desarrollo
      try {
        // eslint-disable-next-line no-console
        console.warn(
          '[ProgramListTransform] filterProgramsByActiveDay devolvió vacío, aplicando fallback con canal.channels for',
          canal?.channel?.name || canal?.id || '<unknown>'
        );
      } catch (e) {
        /* ignore */
      }
      programsForActiveDay = canal.channels || [];
    }

    const combinedPrograms = programsForActiveDay; // keep simple

    const cleanedPrograms = this.removeOverlappingPrograms(
      combinedPrograms,
      currentHours
    );

    const visiblePrograms = this.getVisiblePrograms(
      cleanedPrograms,
      currentHours,
      activeDay
    );
    if (!visiblePrograms.length) return [];

    const programsWithPositions: ProgramWithPosition[] = visiblePrograms.map(
      (programa) => {
        const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
        const { start: normStart, end: normEnd } = this.normalizeProgramRange(
          this.getProgramStartMinutes(programa),
          this.getProgramEndMinutes(programa),
          slotStartMinutes
        );

        return {
          ...programa,
          gridColumnStart: this.getProgramGridColumn(programa, currentHours),
          gridColumnEnd: this.getProgramGridColumnEnd(programa, currentHours),
          layerIndex: 0,
          visibleStartTime: this.formatMinutesToHHMM(normStart),
          visibleEndTime: this.formatMinutesToHHMM(normEnd),
          isCutAtStart: normStart > this.getProgramStartMinutes(programa),
          isCutAtEnd: normEnd < this.getProgramEndMinutes(programa),
          _normStartMinutes: normStart,
          _normEndMinutes: normEnd,
        } as ProgramWithPosition;
      }
    );

    programsWithPositions.sort((a, b) => {
      if (a.gridColumnStart !== b.gridColumnStart)
        return a.gridColumnStart - b.gridColumnStart;
      return (
        b.gridColumnEnd -
        b.gridColumnStart -
        (a.gridColumnEnd - a.gridColumnStart)
      );
    });

    const layers: ProgramWithPosition[][] = [];

    programsWithPositions.forEach((program) => {
      let layerIndex = 0;
      let placed = false;

      while (!placed && layerIndex < UI_CONFIG.MAX_LAYERS) {
        if (!layers[layerIndex]) layers[layerIndex] = [];

        const hasOverlap = layers[layerIndex].some((existingProgram) =>
          this.programsOverlapInGrid(program, existingProgram)
        );

        if (!hasOverlap) {
          program.layerIndex = layerIndex;
          layers[layerIndex].push(program);
          placed = true;
        } else {
          layerIndex++;
        }
      }

      if (!placed && layerIndex < UI_CONFIG.MAX_LAYERS) {
        program.layerIndex = layerIndex;
        layers[layerIndex] = [program];
      }
    });

    return layers;
  }
}
