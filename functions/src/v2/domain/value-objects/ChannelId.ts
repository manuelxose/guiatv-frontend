// src/v2/domain/value-objects/ChannelId.ts

export class ChannelId {
  private constructor(private readonly _value: string) {
    if (!_value || _value.trim() === '') {
      throw new Error('ChannelId cannot be empty');
    }
  }

  static create(value: string): ChannelId {
    return new ChannelId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: ChannelId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
