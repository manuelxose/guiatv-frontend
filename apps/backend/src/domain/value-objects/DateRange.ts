// src/v2/domain/value-objects/DateRange.ts

/**
 * Value object that represents an inclusive time window.
 */
export class DateRange {
  private constructor(
    private readonly _start: Date,
    private readonly _end: Date
  ) {
    if (_start >= _end) {
      throw new Error('Start date must be before end date');
    }
  }

  /**
   * Builds a new range from two Date instances.
   *
   * @param start - Range inclusive lower bound.
   * @param end - Range inclusive upper bound.
   */
  static create(start: Date, end: Date): DateRange {
    return new DateRange(start, end);
  }

  /**
   * Builds a range for a single day using a YYYYMMDD string.
   *
   * @param dateStr - Date in YYYYMMDD format.
   */
  static fromString(dateStr: string): DateRange {
    // Format: YYYYMMDD
    if (!/^\d{8}$/.test(dateStr)) {
      throw new Error('Invalid date format. Expected YYYYMMDD');
    }

    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));

    const start = new Date(year, month, day, 0, 0, 0);
    const end = new Date(year, month, day, 23, 59, 59);

    return new DateRange(start, end);
  }

  get start(): Date {
    return this._start;
  }

  get end(): Date {
    return this._end;
  }

  /**
   * Checks if a given date falls within the range.
   *
   * @param date - Date to evaluate.
   */
  contains(date: Date): boolean {
    return date >= this._start && date <= this._end;
  }

  toString(): string {
    const d = this._start;
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}${String(d.getDate()).padStart(2, '0')}`;
  }
}
