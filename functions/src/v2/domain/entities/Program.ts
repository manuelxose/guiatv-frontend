// src/v2/domain/entities/Program.ts

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

export class Program {
  private constructor(private readonly props: ProgramProps) {
    this.validate();
  }

  static create(props: ProgramProps): Program {
    return new Program(props);
  }

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
