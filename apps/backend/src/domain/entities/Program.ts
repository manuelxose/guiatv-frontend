// src/v2/domain/entities/Program.ts

/**
 * Shape of a program persisted in the database and exposed in the API.
 */
export interface ProgramProps {
  id: string;
  channelId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  image?: string;
  genre?: string;
  subgenre?: string;
  year?: string;
  rating?: string;
  details?: Record<string, string>;
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

  get title(): string {
    return this.props.title;
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
