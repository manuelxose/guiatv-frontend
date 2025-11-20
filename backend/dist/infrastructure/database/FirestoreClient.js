"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirestore = void 0;
const logger_1 = require("../../shared/utils/logger");
// Project migrated to MongoDB. Keep a runtime stub so any accidental
// calls fail with a clear message instead of causing compile-time errors.
const getFirestore = () => {
    logger_1.logger.info('getFirestore called but Firestore support was removed (use MongoDB).');
    throw new Error('Firestore is not available. Configure DB_ADAPTER=mongo to use MongoDB.');
};
exports.getFirestore = getFirestore;
//# sourceMappingURL=FirestoreClient.js.map