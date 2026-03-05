// src/v2/domain/value-objects/ChannelId.ts

/**
 * Value object that encapsulates channel identifiers and centralizes validation.
 */
export class ChannelId {
  private constructor(private readonly _value: string) {
    if (!_value || _value.trim() === '') {
      throw new Error('ChannelId cannot be empty');
    }
  }

  /**
   * Factory that enforces validation before instantiating the value object.
   *
   * @param value - Raw channel identifier.
   */
  static create(value: string): ChannelId {
    return new ChannelId(value);
  }

  get value(): string {
    return this._value;
  }

  /**
   * Compares two value objects without exposing the raw string.
   *
   * @param other - Another channel identifier to compare against.
   */
  equals(other: ChannelId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
