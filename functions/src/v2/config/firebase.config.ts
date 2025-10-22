// src/v2/config/firebase.config.ts

export const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'guia-tv-8fe3c',
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET || 'guia-tv-8fe3c.appspot.com',
};
