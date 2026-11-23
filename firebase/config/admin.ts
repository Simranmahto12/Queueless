/**
 * Firebase Admin SDK Initialization Wrapper
 * Used exclusively in Cloud Functions and trusted server-side environments.
 * NEVER import this file into frontend client code.
 */

import * as admin from 'firebase-admin';

let isInitialized = false;

export function getAdminApp(): admin.app.App {
  if (!isInitialized) {
    if (admin.apps.length === 0) {
      admin.initializeApp();
    }
    isInitialized = true;
  }
  return admin.app();
}

export function getAdminFirestore(): admin.firestore.Firestore {
  getAdminApp();
  return admin.firestore();
}

export function getAdminAuth(): admin.auth.Auth {
  getAdminApp();
  return admin.auth();
}
