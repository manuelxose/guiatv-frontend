import { logger } from '../../shared/utils/logger';

// Project migrated to MongoDB. Keep a runtime stub so any accidental
// calls fail with a clear message instead of causing compile-time errors.
export const getFirestore = () => {
  logger.info('getFirestore called but Firestore support was removed (use MongoDB).');
  throw new Error('Firestore is not available. Configure DB_ADAPTER=mongo to use MongoDB.');
};
