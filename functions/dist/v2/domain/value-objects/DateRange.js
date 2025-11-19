"use strict";
// src/v2/domain/value-objects/DateRange.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRange = void 0;
class DateRange {
    constructor(_start, _end) {
        this._start = _start;
        this._end = _end;
        if (_start >= _end) {
            throw new Error('Start date must be before end date');
        }
    }
    static create(start, end) {
        return new DateRange(start, end);
    }
    static fromString(dateStr) {
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
    get start() {
        return this._start;
    }
    get end() {
        return this._end;
    }
    contains(date) {
        return date >= this._start && date <= this._end;
    }
    toString() {
        const d = this._start;
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    }
}
exports.DateRange = DateRange;
//# sourceMappingURL=DateRange.js.map