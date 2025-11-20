"use strict";
// src/v2/domain/value-objects/ChannelId.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelId = void 0;
class ChannelId {
    constructor(_value) {
        this._value = _value;
        if (!_value || _value.trim() === '') {
            throw new Error('ChannelId cannot be empty');
        }
    }
    static create(value) {
        return new ChannelId(value);
    }
    get value() {
        return this._value;
    }
    equals(other) {
        return this._value === other._value;
    }
    toString() {
        return this._value;
    }
}
exports.ChannelId = ChannelId;
//# sourceMappingURL=ChannelId.js.map