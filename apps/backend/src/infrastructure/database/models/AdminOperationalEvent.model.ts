import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IAdminOperationalEventDocument {
  timestamp: Date; severity: 'info' | 'warning' | 'critical'; subsystem: string;
  provider?: string; jobId?: string; correlationId?: string; errorCode?: string;
  message: string; context?: Record<string, string>;
}
const schema = new Schema<IAdminOperationalEventDocument>({
  timestamp: { type: Date, required: true, index: true }, severity: { type: String, enum: ['info', 'warning', 'critical'], required: true, index: true },
  subsystem: { type: String, required: true, index: true }, provider: String, jobId: String, correlationId: { type: String, index: true }, errorCode: String,
  message: { type: String, required: true }, context: { type: Schema.Types.Mixed as any },
}, { collection: 'admin_operational_events' });
schema.index({ severity: 1, timestamp: -1 }); schema.index({ correlationId: 1, timestamp: -1 });
export const AdminOperationalEventModel = mongoose.model<IAdminOperationalEventDocument>('AdminOperationalEvent', schema);
