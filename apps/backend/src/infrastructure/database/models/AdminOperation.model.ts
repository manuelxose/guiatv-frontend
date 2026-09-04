import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export type AdminJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface IAdminOperationDocument {
  type: string; status: AdminJobStatus; queuedAt: Date; startedAt?: Date; completedAt?: Date;
  progress?: number; currentStep?: string; errorCode?: string; errorSummary?: string;
  attempts: number; triggeredBy: string; correlationId: string; target?: string;
}

const AdminOperationSchema = new Schema<IAdminOperationDocument>({
  type: { type: String, required: true, index: true },
  status: { type: String, enum: ['queued', 'running', 'completed', 'failed'], required: true, index: true },
  queuedAt: { type: Date, required: true, index: true }, startedAt: Date, completedAt: Date,
  progress: Number, currentStep: String, errorCode: String, errorSummary: String,
  attempts: { type: Number, default: 1 }, triggeredBy: { type: String, required: true },
  correlationId: { type: String, required: true, index: true }, target: String,
}, { timestamps: true, collection: 'admin_operations' });
AdminOperationSchema.index({ status: 1, queuedAt: -1 });

export const AdminOperationModel = mongoose.model<IAdminOperationDocument>('AdminOperation', AdminOperationSchema);
