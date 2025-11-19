"use strict";
// Stubbed firebase helpers
// The project has migrated away from firebase-admin. This module provides
// no-op functions so legacy imports don't break the TypeScript build.
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFirebase = initializeFirebase;
exports.getFirestore = getFirestore;
exports.getStorage = getStorage;
exports.getAuth = getAuth;
exports.getFirebaseApp = getFirebaseApp;
async function initializeFirebase() {
    // intentionally no-op
    return;
}
function getFirestore() {
    throw new Error('Firestore is not available in this build. Configure DB_ADAPTER=mongo to use MongoDB.');
}
function getStorage() {
    throw new Error('Storage is not available. Use local or s3 storage adapters instead.');
}
function getAuth() {
    throw new Error('Auth is not available.');
}
function getFirebaseApp() {
    throw new Error('Firebase app is not available.');
}
//# sourceMappingURL=firebase.js.map