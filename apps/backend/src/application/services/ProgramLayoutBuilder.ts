import { Program } from '../../domain/entities/Program';
import { DateUtils } from '../../shared/utils/dateUtils';

const UI_UNITS = {
  MINUTES_PER_SLOT: 30,
  MINUTES_PER_COLUMN: 5,
  MAX_GRID_COLUMNS: 6,
  PIXELS_PER_HOUR: 240,
  LOGO_COLUMN_WIDTH: 160,
  MAX_LAYERS: 5,
} as const;

export interface TimeSlotDTO {
  index: number;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
}

export interface SlotLayoutDTO {
  timeSlotIndex: number;
  gridColumnStart: number;
  gridColumnEnd: number;
  layerIndex: number;
  isCutAtStart: boolean;
  isCutAtEnd: boolean;
  visibleStartTime: string;
  visibleEndTime: string;
  crossesMidnight: boolean;
  pxStart: number;
  pxWidth: number;
}

export interface ProgramLayoutDTO {
  id: string;
  channelId: string;
  title: string;
  start: string;
  end: string;
  durationMinutes: number;
  category?: string;
  image?: string;
  rating?: any;
  tmdbId?: number;
  description?: string;
  timeSlotIndex: number | null;
  gridColumnStart?: number;
  gridColumnEnd?: number;
  layerIndex?: number;
  isCutAtStart?: boolean;
  isCutAtEnd?: boolean;
  visibleStartTime?: string;
  visibleEndTime?: string;
  crossesMidnight: boolean;
  fieldsProvided: 'minimal' | 'full';
  pxStart?: number;
  pxWidth?: number;
  layoutsBySlot?: SlotLayoutDTO[];
}

const TIME_SLOTS: readonly string[][] = [
  ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00'],
  ['03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00'],
  ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00'],
  ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'],
  ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'],
  ['15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'],
  ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
  ['21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00'],
] as const;

/**
 * Builds time-slot aware layouts used by the discovery grid and TV guide.
 */
export class ProgramLayoutBuilder {
  /**
   * Generates the canonical set of 30-minute time slots for the grid.
   */
  buildTimeSlots(): TimeSlotDTO[] {
    return TIME_SLOTS.map((slot, index) => {
      const startMinutes = this.parseTimeToMinutes(slot[0]);
      const endMinutes = this.getSlotEndMinutes(slot);
      return {
        index,
        start: slot[0],
        end: this.minutesToHHMM(endMinutes),
        startMinutes,
        endMinutes,
      };
    });
  }

  /**
   * Computes grid-friendly layout information for every program of a day.
   *
   * @param programs - Domain programs for a single date.
   * @param date - Target date in YYYYMMDD.
   * @param timeSlots - Slots produced by {@link buildTimeSlots}.
   * @param requestedSlot - Optional slot id to prioritize when exposing top-level layout fields.
   * @param fields - Determines whether to populate `image` and `description`.
   */
  buildProgramLayouts(
    programs: Program[],
    date: string,
    timeSlots: TimeSlotDTO[],
    requestedSlot?: string,
    fields: 'minimal' | 'full' = 'full'
  ): ProgramLayoutDTO[] {
    const baseDayStart = this.getDayStartLocal(date);

    // Precompute slot layouts per channel to assign layers
    const perChannelPerSlot: Record<
      string,
      Record<number, Array<{ layout: SlotLayoutDTO; programId: string }>>
    > = {};

    const programLayouts = programs.map((program) => {
      const { startMinutes, endMinutes, crossesMidnight } = this.getProgramMinutes(
        program,
        baseDayStart
      );

      const slotLayouts: SlotLayoutDTO[] = [];

      timeSlots.forEach((slot) => {
        const overlap = this.getOverlapForSlot(
          startMinutes,
          endMinutes,
          slot.startMinutes,
          slot.endMinutes
        );

        if (!overlap) return;

        const layout = this.computeSlotLayout(overlap, slot);
        slotLayouts.push({ ...layout, crossesMidnight });

        // bucket for layer assignment
        if (!perChannelPerSlot[program.channelId]) {
          perChannelPerSlot[program.channelId] = {};
        }
        if (!perChannelPerSlot[program.channelId][slot.index]) {
          perChannelPerSlot[program.channelId][slot.index] = [];
        }
        perChannelPerSlot[program.channelId][slot.index].push({
          layout,
          programId: program.id,
        });
      });

      const slotIndexForTopFields = this.pickSlotIndex(slotLayouts, requestedSlot);
      const layoutForTopFields =
        slotLayouts.find((l) => l.timeSlotIndex === slotIndexForTopFields) ||
        slotLayouts[0];

      return {
        id: program.id,
        channelId: program.channelId,
        title: program.title,
        start: this.toLocalISO(program.startTime),
        end: this.toLocalISO(program.endTime),
        durationMinutes: program.duration,
        category: program.genre,
        image: fields === 'full' ? this.normalizeImageValue(program.image) : undefined,
        rating: program.rating,
        tmdbId: program.tmdbId,
        description: fields === 'full' ? program.description : undefined,
        timeSlotIndex: layoutForTopFields?.timeSlotIndex ?? null,
        gridColumnStart: layoutForTopFields?.gridColumnStart,
        gridColumnEnd: layoutForTopFields?.gridColumnEnd,
        layerIndex: undefined, // filled after layer assignment
        isCutAtStart: layoutForTopFields?.isCutAtStart,
        isCutAtEnd: layoutForTopFields?.isCutAtEnd,
        visibleStartTime: layoutForTopFields?.visibleStartTime,
        visibleEndTime: layoutForTopFields?.visibleEndTime,
        crossesMidnight,
        fieldsProvided: fields,
        pxStart: layoutForTopFields?.pxStart,
        pxWidth: layoutForTopFields?.pxWidth,
        layoutsBySlot: slotLayouts.length ? slotLayouts : undefined,
      } as ProgramLayoutDTO;
    });

    // Assign layers per channel per slot and propagate to layouts
    Object.entries(perChannelPerSlot).forEach(([, slots]) => {
      Object.entries(slots).forEach(([slotIndexStr, entries]) => {
        const slotIndex = Number(slotIndexStr);
        const sorted = entries.sort((a, b) =>
          a.layout.gridColumnStart !== b.layout.gridColumnStart
            ? a.layout.gridColumnStart - b.layout.gridColumnStart
            : a.layout.gridColumnEnd - b.layout.gridColumnEnd
        );

        const layers: SlotLayoutDTO[][] = [];

        sorted.forEach(({ layout, programId }) => {
          let assignedLayer = 0;
          while (assignedLayer < UI_UNITS.MAX_LAYERS) {
            if (!layers[assignedLayer]) layers[assignedLayer] = [];

            const overlaps = layers[assignedLayer].some((existing) =>
              this.layoutsOverlap(existing, layout)
            );

            if (!overlaps) {
              layout.layerIndex = assignedLayer;
              layers[assignedLayer].push(layout);
              break;
            }
            assignedLayer++;
          }
          if (layout.layerIndex === undefined) {
            layout.layerIndex = assignedLayer;
            if (!layers[assignedLayer]) layers[assignedLayer] = [];
            layers[assignedLayer].push(layout);
          }

          // propagate to programLayouts
          const program = programLayouts.find((p) => p.id === programId);
          if (!program) return;
          if (program.layoutsBySlot) {
            const target = program.layoutsBySlot.find(
              (l) =>
                l.timeSlotIndex === slotIndex &&
                l.gridColumnStart === layout.gridColumnStart &&
                l.gridColumnEnd === layout.gridColumnEnd
            );
            if (target) {
              target.layerIndex = layout.layerIndex;
            }
          }
        });
      });
    });

    // Fill top-level layer index from selected slot layout
    programLayouts.forEach((p) => {
      if (p.layoutsBySlot && p.timeSlotIndex != null) {
        const selected = p.layoutsBySlot.find(
          (l) => l.timeSlotIndex === p.timeSlotIndex
        );
        if (selected) {
          p.layerIndex = selected.layerIndex;
        }
      }
    });

    return programLayouts;
  }

  private pickSlotIndex(slotLayouts: SlotLayoutDTO[], requestedSlot?: string): number | undefined {
    if (!slotLayouts || slotLayouts.length === 0) return undefined;

    // If no requested slot specified, return the first available slot index
    if (!requestedSlot) return slotLayouts[0].timeSlotIndex;

    // If requested slot is a numeric index (stringified), prefer that if present
    const asNumber = Number(requestedSlot);
    if (!isNaN(asNumber)) {
      const found = slotLayouts.find((l) => l.timeSlotIndex === asNumber);
      if (found) return asNumber;
    }

    // If requested slot looks like a time (HH:MM), try to match visible start/end times
    const foundByTime = slotLayouts.find(
      (l) => l.visibleStartTime === requestedSlot || l.visibleEndTime === requestedSlot
    );
    if (foundByTime) return foundByTime.timeSlotIndex;

    // Fallback to the first slot
    return slotLayouts[0].timeSlotIndex;
  }

  // Ensure we return a single string for image to avoid saving arrays/objects into string fields
  private normalizeImageValue(value: any): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      // prefer first string element
      for (const v of value) {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object') {
          if (typeof v.url === 'string') return v.url;
          if (typeof v.src === 'string') return v.src;
        }
      }
      return undefined;
    }
    if (typeof value === 'object') {
      if (typeof value.url === 'string') return value.url;
      if (typeof value.src === 'string') return value.src;
      // try to stringify a simple object fallback (avoid long JSON)
      try {
        const keys = Object.keys(value);
        if (keys.length === 1 && typeof value[keys[0]] === 'string') return value[keys[0]];
      } catch (e) {
        // ignore
      }
    }
    return undefined;
  }

  /**
   * Formats a Date as an ISO 8601 string with the local timezone offset
   * (e.g. "2026-03-05T22:00:00+01:00") instead of UTC "Z" suffix.
   * This ensures the frontend always receives explicit timezone information.
   */
  private toLocalISO(date: Date): string {
    const offsetMin = date.getTimezoneOffset(); // negative for east of UTC
    const sign = offsetMin <= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMin);
    const oh = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const om = String(absOffset % 60).padStart(2, '0');

    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');

    return `${y}-${mo}-${d}T${h}:${mi}:${s}${sign}${oh}:${om}`;
  }

  private getProgramMinutes(program: Program, baseDayStart: number) {
    const startMinutes = Math.floor(
      (program.startTime.getTime() - baseDayStart) / 60000
    );
    let endMinutes = Math.floor(
      (program.endTime.getTime() - baseDayStart) / 60000
    );

    if (endMinutes <= startMinutes) {
      endMinutes += 1440;
    }

    return {
      startMinutes,
      endMinutes,
      crossesMidnight: endMinutes >= 1440,
    };
  }

  /**
   * Returns local midnight timestamp for the given YYYYMMDD date.
   * Uses local time (controlled by process.env.TZ) so that minute offsets
   * align with the local-time slot definitions (00:00-03:00, etc.).
   */
  private getDayStartLocal(date: string): number {
    const d = DateUtils.parseYYYYMMDD(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
  }

  private parseTimeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  private minutesToHHMM(totalMinutes: number): string {
    const norm = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
    const hh = Math.floor(norm / 60)
      .toString()
      .padStart(2, '0');
    const mm = (norm % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private getSlotEndMinutes(currentHours: string[]): number {
    if (!currentHours.length) return 1440;
    const lastHour = currentHours[currentHours.length - 1];
    const [hours, minutes] = lastHour.split(':').map(Number);
    let lastHourMinutes = hours * 60 + (minutes || 0);
    let slotEndMinutes = lastHourMinutes + UI_UNITS.MINUTES_PER_SLOT;
    const slotStartMinutes = this.parseTimeToMinutes(currentHours[0]);
    if (slotEndMinutes <= slotStartMinutes) {
      slotEndMinutes += 1440;
    }
    return slotEndMinutes;
  }

  private getOverlapForSlot(
    programStart: number,
    programEnd: number,
    slotStart: number,
    slotEnd: number
  ): { start: number; end: number } | null {
    let normalizedSlotStart = slotStart;
    let normalizedSlotEnd = slotEnd;
    if (normalizedSlotEnd <= normalizedSlotStart) {
      normalizedSlotEnd += 1440;
    }

    const visibleStart = Math.max(programStart, normalizedSlotStart);
    const visibleEnd = Math.min(programEnd, normalizedSlotEnd);

    if (visibleEnd <= visibleStart) return null;

    return { start: visibleStart, end: visibleEnd };
  }

  private computeSlotLayout(
    overlap: { start: number; end: number },
    slot: TimeSlotDTO
  ): SlotLayoutDTO {
    const unit = UI_UNITS.MINUTES_PER_COLUMN;
    const columnsPerSlot = UI_UNITS.MINUTES_PER_SLOT / UI_UNITS.MINUTES_PER_COLUMN;
    const totalColumns = UI_UNITS.MAX_GRID_COLUMNS * columnsPerSlot;

    const minutesFromSlotStart = overlap.start - slot.startMinutes;
    const startCol = Math.max(
      1,
      Math.min(
        totalColumns,
        Math.floor(minutesFromSlotStart / unit) + 1
      )
    );

    const endMinutesFromSlotStart = overlap.end - slot.startMinutes;
    const endColIndex = Math.ceil(endMinutesFromSlotStart / unit);
    const endCol = Math.max(2, Math.min(totalColumns + 1, endColIndex + 1));

    const isCutAtStart = overlap.start > slot.startMinutes;
    const isCutAtEnd = overlap.end < slot.endMinutes;

    const pxStart =
      UI_UNITS.LOGO_COLUMN_WIDTH +
      ((overlap.start - slot.startMinutes) / 60) * UI_UNITS.PIXELS_PER_HOUR;
    const pxWidth =
      ((overlap.end - overlap.start) / 60) * UI_UNITS.PIXELS_PER_HOUR;

    return {
      timeSlotIndex: slot.index,
      gridColumnStart: startCol,
      gridColumnEnd: endCol,
      layerIndex: 0,
      isCutAtStart,
      isCutAtEnd,
      visibleStartTime: this.minutesToHHMM(overlap.start),
      visibleEndTime: this.minutesToHHMM(overlap.end),
      crossesMidnight: overlap.end >= 1440,
      pxStart,
      pxWidth,
    };
  }

  private layoutsOverlap(a: SlotLayoutDTO, b: SlotLayoutDTO): boolean {
    return !(a.gridColumnEnd <= b.gridColumnStart || b.gridColumnEnd <= a.gridColumnStart);
  }
}
