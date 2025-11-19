import { logger } from '../../shared/utils/logger';

// Lazily require `firebase-admin` only when firestore is needed at runtime.
export const getFirestore = () => {
  const skip = process.env.SKIP_FIRESTORE_INIT === '1' || process.env.SKIP_FIRESTORE_INIT === 'true';
  if (skip) {
    logger.info('Skipping Firestore initialization due to SKIP_FIRESTORE_INIT');
    // Return a minimal stub object to avoid crashes; callers should handle this.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (null as any) as FirebaseFirestore.Firestore;
  }

  // require on-demand to avoid import-time cost
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const admin = require('firebase-admin') as typeof import('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp();
    logger.info('Firebase Admin initialized (getFirestore)');
  }
  return admin.firestore();
};
