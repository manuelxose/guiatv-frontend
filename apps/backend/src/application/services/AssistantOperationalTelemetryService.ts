import { AssistantOperationalEventModel } from '@/infrastructure/database/models/AssistantOperationalEvent.model';

export class AssistantOperationalTelemetryService {
  record(input: { requestId: string; outcome: 'success' | 'partial' | 'fallback' | 'failed'; grounding?: string[]; failureReason?: string; queryCategory?: string; latencyMs: number }): void {
    void AssistantOperationalEventModel.create({ ...input, grounding: input.grounding || [] }).catch(() => undefined);
  }
  async listFailures(limit = 50) {
    return AssistantOperationalEventModel.find({ outcome: { $in: ['partial', 'fallback', 'failed'] } }, { _id: 0, requestId: 1, outcome: 1, grounding: 1, failureReason: 1, latencyMs: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(Math.min(limit, 100)).lean();
  }
}
