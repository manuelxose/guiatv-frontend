import { Program } from './Program';

/**
 * Data required to hydrate a {@link Schedule}.
 */
export type ScheduleProps = {
  channelId: string;
  date: string; // yyyy-mm-dd
  programs: Program[];
};

/**
 * Domain entity that groups a day's schedule for a channel.
 */
export class Schedule {
  channelId: string;
  date: string;
  programs: Program[];

  constructor(props: ScheduleProps) {
    this.channelId = props.channelId;
    this.date = props.date;
    this.programs = props.programs || [];
  }
}
