// src/v2/shared/utils/dateUtils.ts

/**
 * Utility helpers to parse, format and manipulate dates used by the EPG domain.
 */
export class DateUtils {
  static parseYYYYMMDD(dateStr: string): Date {
    if (!/^\d{8}$/.test(dateStr)) {
      throw new Error(`Invalid date format: ${dateStr}. Expected YYYYMMDD`);
    }

    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1;
    const day = parseInt(dateStr.slice(6, 8), 10);

    const date = new Date(year, month, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      throw new Error(`Invalid date: ${dateStr}`);
    }

    return date;
  }

  static formatYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  static getTodayYYYYMMDD(): string {
    return this.formatYYYYMMDD(new Date());
  }

  static getTomorrowYYYYMMDD(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.formatYYYYMMDD(tomorrow);
  }

  static getYesterdayYYYYMMDD(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.formatYYYYMMDD(yesterday);
  }

  static getAfterTomorrowYYYYMMDD(): string {
    const afterTomorrow = new Date();
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);
    return this.formatYYYYMMDD(afterTomorrow);
  }

  static parseDateAlias(alias: string): string {
    const normalizedInput = String(alias || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedInput)) {
      const compactDate = normalizedInput.replace(/-/g, '');
      this.parseYYYYMMDD(compactDate);
      return compactDate;
    }

    switch (normalizedInput.toLowerCase()) {
      case 'yesterday':
        return this.getYesterdayYYYYMMDD();
      case 'today':
        return this.getTodayYYYYMMDD();
      case 'tomorrow':
        return this.getTomorrowYYYYMMDD();
      case 'after_tomorrow':
        return this.getAfterTomorrowYYYYMMDD();
      default:
        // Si no es un alias, validar formato YYYYMMDD
        if (/^\d{8}$/.test(normalizedInput)) {
          this.parseYYYYMMDD(normalizedInput); // Validar fecha
          return normalizedInput;
        }
        throw new Error(`Invalid date alias or format: ${normalizedInput}`);
    }
  }

  static isValidYYYYMMDD(dateStr: string): boolean {
    try {
      this.parseYYYYMMDD(dateStr);
      return true;
    } catch {
      return false;
    }
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Returns a local half-open day range [start, end) for a YYYYMMDD date.
   * The effective timezone is controlled by process TZ (set to Europe/Madrid in runtime).
   */
  static getDayRangeYYYYMMDD(dateStr: string): { start: Date; end: Date } {
    const parsed = this.parseYYYYMMDD(dateStr);
    const year = parsed.getFullYear();
    const month = parsed.getMonth();
    const day = parsed.getDate();

    const start = new Date(year, month, day, 0, 0, 0, 0);
    const end = new Date(year, month, day + 1, 0, 0, 0, 0);

    return { start, end };
  }

  /**
   * Resolves alias/YYYMMDD and returns its local half-open day range [start, end).
   */
  static getDayRangeFromAlias(aliasOrDate: string): { start: Date; end: Date } {
    const yyyymmdd = this.parseDateAlias(aliasOrDate);
    return this.getDayRangeYYYYMMDD(yyyymmdd);
  }
}
