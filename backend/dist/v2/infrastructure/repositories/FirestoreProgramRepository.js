"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreProgramRepository = void 0;
// Firestore-backed program repository removed during migration. Provide a
// runtime stub that implements the interface but throws, to avoid compile
// time dependency on Firebase types.
class FirestoreProgramRepository {
    constructor() {
        // noop
    }
    async findById(_) {
        throw new Error('FirestoreProgramRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
    }
    async findByChannel(_, __) {
        throw new Error('FirestoreProgramRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
    }
    async findByDateRange(_, __) {
        throw new Error('FirestoreProgramRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
    }
    async save(_) {
        throw new Error('FirestoreProgramRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
    }
    async saveBatch(_) {
        throw new Error('FirestoreProgramRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
    }
    async deleteByDateRange(_) {
        throw new Error('FirestoreProgramRepository removed: use Mongo-based repositories (DB_ADAPTER=mongo).');
    }
}
exports.FirestoreProgramRepository = FirestoreProgramRepository;
//# sourceMappingURL=FirestoreProgramRepository.js.map