// src/v2/domain/entities/Channel.ts

import {
  CanonicalChannelAccess,
  CanonicalChannelCapabilities,
  CanonicalChannelContentFacet,
  CanonicalChannelDistribution,
  CanonicalChannelMarket,
  CanonicalChannelProvenance,
  CanonicalChannelQuality,
  normalizeTvToken,
} from '@/shared/utils/tvMetadata';

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
  aliases?: string[];
  sourceIds?: string[];
  country?: string;
  countryCode?: string;
  region?: string;
  description?: string;
  distribution?: CanonicalChannelDistribution;
  access?: CanonicalChannelAccess;
  operator?: string;
  providers?: string[];
  contentFacets?: CanonicalChannelContentFacet[];
  market?: CanonicalChannelMarket;
  quality?: CanonicalChannelQuality;
  capabilities?: CanonicalChannelCapabilities;
  provenance?: CanonicalChannelProvenance;
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
    return normalizeTvToken(this.props.name);
  }

  get aliases(): string[] {
    return Array.isArray(this.props.aliases) ? [...this.props.aliases] : [];
  }

  get sourceIds(): string[] {
    return Array.isArray(this.props.sourceIds) ? [...this.props.sourceIds] : [];
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

  get distribution(): CanonicalChannelDistribution {
    return this.props.distribution || 'unknown';
  }

  get access(): CanonicalChannelAccess {
    return this.props.access || 'unknown';
  }

  get operator(): string {
    return this.props.operator || 'unknown';
  }

  get providers(): string[] {
    return Array.isArray(this.props.providers) ? [...this.props.providers] : [];
  }

  get contentFacets(): CanonicalChannelContentFacet[] {
    return Array.isArray(this.props.contentFacets) && this.props.contentFacets.length
      ? [...this.props.contentFacets]
      : ['unknown'];
  }

  get market(): CanonicalChannelMarket {
    return this.props.market || {
      country: 'unknown',
      countryCode: 'unknown',
      region: 'unknown',
      scope: 'unknown',
    };
  }

  get quality(): CanonicalChannelQuality {
    return this.props.quality || { resolution: 'unknown', timeshift: 'unknown' };
  }

  get capabilities(): CanonicalChannelCapabilities {
    return this.props.capabilities || {
      linear: 'unknown',
      catchup: 'unknown',
      streaming: 'unknown',
    };
  }

  get provenance(): CanonicalChannelProvenance {
    return this.props.provenance || { classification: 'unknown', sourceIds: [] };
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
