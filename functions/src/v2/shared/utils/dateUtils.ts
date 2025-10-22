// src/v2/shared/utils/dateUtils.ts

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

  static getAfterTomorrowYYYYMMDD(): string {
    const afterTomorrow = new Date();
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);
    return this.formatYYYYMMDD(afterTomorrow);
  }

  static parseDateAlias(alias: string): string {
    switch (alias.toLowerCase()) {
      case 'today':
        return this.getTodayYYYYMMDD();
      case 'tomorrow':
        return this.getTomorrowYYYYMMDD();
      case 'after_tomorrow':
        return this.getAfterTomorrowYYYYMMDD();
      default:
        // Si no es un alias, validar formato YYYYMMDD
        if (/^\d{8}$/.test(alias)) {
          this.parseYYYYMMDD(alias); // Validar fecha
          return alias;
        }
        throw new Error(`Invalid date alias or format: ${alias}`);
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
}
