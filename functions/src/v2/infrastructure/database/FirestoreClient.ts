import admin from 'firebase-admin';

export const getFirestore = () => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
};
