"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreChannelRepository = void 0;
// Firestore-backed repository removed during migration. This stub implements
// the same interface but throws an informative error at runtime. It exists
// only to avoid compile-time references to Firebase types.
class FirestoreChannelRepository {
    constructor() {
        // no-op constructor; actual implementation removed
    }
    async findById(_) {
        throw new Error('FirestoreChannelRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
    }
    async findAll(_) {
        throw new Error('FirestoreChannelRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
    }
    async findByNormalizedName(_) {
        throw new Error('FirestoreChannelRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
    }
    async save(_) {
        throw new Error('FirestoreChannelRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
    }
    async delete(_) {
        throw new Error('FirestoreChannelRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
    }
}
exports.FirestoreChannelRepository = FirestoreChannelRepository;
//# sourceMappingURL=FirestoreChannelRepository.js.map