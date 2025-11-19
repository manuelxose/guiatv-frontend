// Stubbed firebase helpers
// The project has migrated away from firebase-admin. This module provides
// no-op functions so legacy imports don't break the TypeScript build.

export async function initializeFirebase(): Promise<void> {
  // intentionally no-op
  return;
}

export function getFirestore(): any {
  throw new Error('Firestore is not available in this build. Configure DB_ADAPTER=mongo to use MongoDB.');
}

export function getStorage(): any {
  throw new Error('Storage is not available. Use local or s3 storage adapters instead.');
}

export function getAuth(): any {
  throw new Error('Auth is not available.');
}

export function getFirebaseApp(): any {
  throw new Error('Firebase app is not available.');
}
