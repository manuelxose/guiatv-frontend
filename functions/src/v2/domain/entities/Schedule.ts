import { Program } from './Program';

export type ScheduleProps = {
  channelId: string;
  date: string; // yyyy-mm-dd
  programs: Program[];
};

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
