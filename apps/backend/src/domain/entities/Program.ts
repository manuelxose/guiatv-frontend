// src/v2/domain/entities/Program.ts

/**
 * Shape of a program persisted in the database and exposed in the API.
 */
export interface ProgramProps {
  id: string;
  channelId: string;
  canonicalChannelId?: string;
  title: string;
  subtitle?: string;
  normalizedTitle?: string;
  titleAliases?: string[];
  brandKey?: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  image?: string;
  genre?: string;
  subgenre?: string;
  year?: string;
  rating?: string;
  tmdbId?: number;
  sourceFeed?: string;
  sourceProgrammeId?: string;
  sourceAssetCandidates?: Array<Record<string, unknown>>;
  sourceProvenance?: Record<string, unknown>;
  trustFlags?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

/**
 * Immutable domain aggregate for a TV program with consistency checks.
 */
export class Program {
  private constructor(private readonly props: ProgramProps) {
    this.validate();
  }

  /**
   * Factory helper that validates fields and returns a new program entity.
   *
   * @param props - Raw program properties coming from repositories.
   * @returns A validated {@link Program} instance.
   */
  static create(props: ProgramProps): Program {
    return new Program(props);
  }

  /**
   * Guard clauses to keep invariants such as time ranges and required fields.
   */
  private validate(): void {
    if (!this.props.id?.trim()) {
      throw new Error('Program ID cannot be empty');
    }
    if (!this.props.channelId?.trim()) {
      throw new Error('Program channelId cannot be empty');
    }
    if (!this.props.title?.trim()) {
      throw new Error('Program title cannot be empty');
    }
    if (this.props.startTime >= this.props.endTime) {
      throw new Error('Start time must be before end time');
    }
    if (this.props.description && this.props.description.length > 500) {
      throw new Error('Description cannot exceed 500 characters');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get channelId(): string {
    return this.props.channelId;
  }

  get canonicalChannelId(): string {
    return this.props.canonicalChannelId || this.props.channelId;
  }

  get title(): string {
    return this.props.title;
  }

  get subtitle(): string | undefined {
    return this.props.subtitle;
  }

  get normalizedTitle(): string | undefined {
    return this.props.normalizedTitle;
  }

  get titleAliases(): string[] {
    return Array.isArray(this.props.titleAliases) ? [...this.props.titleAliases] : [];
  }

  get brandKey(): string | undefined {
    return this.props.brandKey;
  }

  get startTime(): Date {
    return this.props.startTime;
  }

  get endTime(): Date {
    return this.props.endTime;
  }

  get duration(): number {
    return Math.round(
      (this.props.endTime.getTime() - this.props.startTime.getTime()) /
        (1000 * 60)
    );
  }

  get date(): string {
    const d = this.props.startTime;
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}${String(d.getDate()).padStart(2, '0')}`;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get image(): string | undefined {
    return this.props.image;
  }

  get genre(): string | undefined {
    return this.props.genre;
  }

  get subgenre(): string | undefined {
    return this.props.subgenre;
  }

  get year(): string | undefined {
    return this.props.year;
  }

  get rating(): string | undefined {
    return this.props.rating;
  }

  get tmdbId(): number | undefined {
    return this.props.tmdbId;
  }

  get sourceFeed(): string | undefined {
    return this.props.sourceFeed;
  }

  get sourceProgrammeId(): string | undefined {
    return this.props.sourceProgrammeId;
  }

  get sourceAssetCandidates(): Array<Record<string, unknown>> {
    return Array.isArray(this.props.sourceAssetCandidates)
      ? [...this.props.sourceAssetCandidates]
      : [];
  }

  get sourceProvenance(): Record<string, unknown> | undefined {
    return this.props.sourceProvenance;
  }

  get trustFlags(): Record<string, unknown> | undefined {
    return this.props.trustFlags;
  }

  get details(): Record<string, unknown> | undefined {
    return this.props.details;
  }

  /**
   * Serializes the program with derived fields ready for transport.
   */
  toJSON() {
    return {
      ...this.props,
      startTime: this.props.startTime.toISOString(),
      endTime: this.props.endTime.toISOString(),
      duration: this.duration,
      date: this.date,
    };
  }
}
