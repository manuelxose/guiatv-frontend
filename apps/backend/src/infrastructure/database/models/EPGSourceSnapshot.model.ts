import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IEPGSourceSnapshotDocument {
  sourceUrl: string;
  sourceKey: string;
  date: string;
  payloadHash: string;
  channels: Array<Record<string, any>>;
  programmes: Array<Record<string, any>>;
  stats: {
    channelsCount: number;
    programmesCount: number;
    programmeIconsCount?: number;
    genericMovieTitleCount?: number;
    tdtSpecificTitleCount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EPGSourceSnapshotSchema = new Schema<IEPGSourceSnapshotDocument>(
  {
    sourceUrl: { type: String, required: true, trim: true },
    sourceKey: { type: String, required: true, trim: true, index: true },
    date: { type: String, required: true, index: true },
    payloadHash: { type: String, required: true, trim: true },
    channels: { type: [Schema.Types.Mixed] as any, default: [] },
    programmes: { type: [Schema.Types.Mixed] as any, default: [] },
    stats: {
      channelsCount: { type: Number, default: 0 },
      programmesCount: { type: Number, default: 0 },
      programmeIconsCount: { type: Number, default: 0 },
      genericMovieTitleCount: { type: Number, default: 0 },
      tdtSpecificTitleCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    collection: 'epg_source_snapshots',
  }
);

EPGSourceSnapshotSchema.index(
  { sourceKey: 1, date: 1 },
  { unique: true, name: 'idx_epg_source_date_unique' }
);

export const EPGSourceSnapshotModel = mongoose.model<IEPGSourceSnapshotDocument>(
  'EPGSourceSnapshot',
  EPGSourceSnapshotSchema
);
