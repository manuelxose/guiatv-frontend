// src/v2/domain/entities/Channel.ts

/**
 * Allowed distribution types for a channel.
 */
export type ChannelType =
  | 'TDT'
  | 'Cable'
  | 'Movistar'
  | 'Autonomico'
  | 'OTT';

/**
 * Properties required to build a {@link Channel} aggregate.
 */
export interface ChannelProps {
  id: string;
  name: string;
  icon: string | null;
  type: ChannelType;
  country?: string;
  countryCode?: string;
  region?: string;
  description?: string;
  isActive: boolean;
}

/**
 * Domain aggregate that represents a TV channel with lightweight validation helpers.
 */
export class Channel {
  private constructor(private readonly props: ChannelProps) {
    this.validate();
  }

  /**
   * Factory helper that validates and instantiates a channel.
   *
   * @param props - Channel attributes coming from the repository or DTO.
   * @returns A fully validated {@link Channel} instance.
   */
  static create(props: ChannelProps): Channel {
    return new Channel(props);
  }

  /**
   * Ensures required fields are present and coherent before exposing the entity.
   */
  private validate(): void {
    if (!this.props.id || this.props.id.trim() === '') {
      throw new Error('Channel ID cannot be empty');
    }
    if (!this.props.name || this.props.name.trim() === '') {
      throw new Error('Channel name cannot be empty');
    }
    if (this.props.type === 'Autonomico' && !this.props.region) {
      throw new Error('Autonomico channels must have a region');
    }
    if (this.props.country && this.props.country.trim() === '') {
      throw new Error('Country, if provided, cannot be empty');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get normalizedName(): string {
    return this.props.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  get icon(): string | null {
    return this.props.icon;
  }

  get type(): ChannelType {
    return this.props.type;
  }

  get region(): string | undefined {
    return this.props.region;
  }

  get country(): string | undefined {
    return this.props.country;
  }

  get countryCode(): string | undefined {
    return this.props.countryCode;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  /**
   * Serializes the entity to be safely exposed to the presentation layer.
   */
  toJSON() {
    return {
      ...this.props,
      normalizedName: this.normalizedName,
    };
  }
}
