import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

const AssistantOperationalEventSchema = new Schema({
  requestId: { type: String, required: true, index: true },
  outcome: { type: String, enum: ['success', 'partial', 'fallback', 'failed'], required: true, index: true },
  grounding: { type: [String], default: [], index: true },
  failureReason: { type: String, index: true },
  /** Deterministic chat intent bucket ('tv_now', 'streaming', 'football_today', ...) — never raw chat text. */
  queryCategory: { type: String, index: true },
  latencyMs: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
}, { collection: 'assistant_operational_events', versionKey: false });
AssistantOperationalEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
export const AssistantOperationalEventModel = mongoose.model('AssistantOperationalEvent', AssistantOperationalEventSchema);
