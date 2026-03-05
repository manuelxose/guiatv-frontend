import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IScheduleChannel {
  channelId: string;
  channel?: Record<string, any> | null;
  programs: Array<Record<string, any>>;
}

export interface IScheduleDocument {
  date: string; // YYYYMMDD
  layoutVersion?: string;
  generatedAt: Date;
  timeSlots: Array<Record<string, any>>;
  channelMeta: Array<Record<string, any>>;
  channels: IScheduleChannel[];
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleChannelSchema = new Schema<IScheduleChannel>(
  {
    channelId: { type: String, required: true },
    channel: { type: Schema.Types.Mixed as any, default: null },
    programs: { type: [Schema.Types.Mixed] as any, default: [] },
  },
  { _id: false }
);

const ScheduleSchema = new Schema<IScheduleDocument>(
  {
    date: { type: String, required: true, unique: true, index: true },
    layoutVersion: { type: String },
    generatedAt: { type: Date, default: () => new Date(), index: true },
    timeSlots: { type: [Schema.Types.Mixed] as any, default: [] },
    channelMeta: { type: [Schema.Types.Mixed] as any, default: [] },
    channels: { type: [ScheduleChannelSchema], default: [] },
    meta: { type: Schema.Types.Mixed as any },
  },
  {
    timestamps: true,
    collection: 'schedules',
  }
);

ScheduleSchema.index({ date: 1, 'channels.channelId': 1 });

export const ScheduleModel = mongoose.model<IScheduleDocument>('Schedule', ScheduleSchema);
