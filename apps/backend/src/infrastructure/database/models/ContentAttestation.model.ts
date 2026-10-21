import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { ENTITY_ID_PATTERN } from '@/domain/services/contentIdentity';
import type { AttestationRecordBody } from '@/domain/services/contentCertification';

export interface IContentAttestationDocument {
  entityId: string;
  seq: number;
  type: 'attestation' | 'revocation';
  attestationId: string;
  prevHash: string;
  hash: string;
  body: AttestationRecordBody;
  createdAt: Date;
}

const hash = { type: String, required: true, match: /^[0-9a-f]{64}$/ };

const ContentAttestationSchema = new Schema<IContentAttestationDocument>(
  {
    entityId: { type: String, required: true, immutable: true, match: ENTITY_ID_PATTERN },
    seq: { type: Number, required: true, immutable: true, min: 0, validate: Number.isInteger },
    type: { type: String, required: true, immutable: true, enum: ['attestation', 'revocation'] },
    attestationId: { type: String, required: true, immutable: true, maxlength: 64 },
    prevHash: { ...hash, immutable: true },
    hash: { ...hash, immutable: true },
    // Validated by the pure rules (`chainProblem`, `evaluateCertification`); the record is read back whole.
    body: { type: Schema.Types.Mixed, required: true, immutable: true },
  },
  {
    // Insert-only audit trail: no updatedAt, nothing in the code base updates or deletes a row.
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'content_attestations',
    strict: 'throw',
    autoIndex: false,
    autoCreate: false,
  }
);

// One record per position in an entity's chain: a lost race is a duplicate key, never an overwrite.
ContentAttestationSchema.index({ entityId: 1, seq: 1 }, { name: 'uniq_attestation_chain', unique: true });
// At most one attestation and one revocation per attestation id: a replay is idempotent.
ContentAttestationSchema.index({ attestationId: 1, type: 1 }, { name: 'uniq_attestation_type', unique: true });

export const ContentAttestationModel = mongoose.model<IContentAttestationDocument>('ContentAttestation', ContentAttestationSchema);
