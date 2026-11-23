/**
 * Firebase Client SDK Initialization Wrapper
 * Used by React Admin Dashboard and compatible with React Native Expo.
 * Connects to local emulators when VITE_USE_FIREBASE_EMULATOR is 'true'.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

/**
 * Validates that all critical Firebase client environment variables are provided.
 */
export function validateFirebaseConfig(config: Partial<FirebaseClientConfig>): config is FirebaseClientConfig {
  return !!(config.apiKey && config.authDomain && config.projectId && config.appId);
}

export function getClientConfigFromEnv(): Partial<FirebaseClientConfig> {
  // Vite environment variables
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }
  // Node / React Native process.env fallback
  if (typeof process !== 'undefined' && process.env) {
    return {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
    };
  }
  return {};
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function initializeFirebaseServices() {
  const config = getClientConfigFromEnv();

  if (!validateFirebaseConfig(config)) {
    console.warn(
      '[QueueLess Firebase] Firebase credentials are not fully configured. Provide valid configuration in .env to connect to live backend.'
    );
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  if (!getApps().length) {
    app = initializeApp(config);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);

  // Check if emulators are requested
  const useEmulator =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_FIREBASE_EMULATOR === 'true') ||
    (typeof process !== 'undefined' && (process.env?.EXPO_PUBLIC_USE_EMULATOR === 'true' || process.env?.USE_FIREBASE_EMULATOR === 'true'));

  if (useEmulator) {
    const emulatorHost = '127.0.0.1';
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorHost, 8080);
    console.info('[QueueLess Firebase] Connected to local Firebase Emulators (Auth: 9099, Firestore: 8080)');
  }

  return { app, auth, db, isConfigured: true };
}
