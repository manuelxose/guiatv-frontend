// src/v2/domain/entities/Channel.ts

export type ChannelType = 'TDT' | 'Cable' | 'Movistar' | 'Autonomico';

export interface ChannelProps {
  id: string;
  name: string;
  icon: string | null;
  type: ChannelType;
  region?: string;
  isActive: boolean;
}

export class Channel {
  private constructor(private readonly props: ChannelProps) {
    this.validate();
  }

  static create(props: ChannelProps): Channel {
    return new Channel(props);
  }

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

  get isActive(): boolean {
    return this.props.isActive;
  }

  toJSON() {
    return {
      ...this.props,
      normalizedName: this.normalizedName,
    };
  }
}
