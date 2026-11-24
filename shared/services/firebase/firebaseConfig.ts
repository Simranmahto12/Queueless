/**
 * Centralized Firebase Client Configuration & State Manager
 * Universal across Vite Admin Dashboard and React Native Expo Mobile App.
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

export type FirebaseConnectionState = 'LIVE_PROJECT' | 'LOCAL_EMULATOR' | 'STANDALONE_FALLBACK';

/**
 * Validates that all required client environment variables exist and are not placeholder values.
 */
export function validateFirebaseConfig(config: Partial<FirebaseClientConfig>): config is FirebaseClientConfig {
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    return false;
  }
  if (
    config.apiKey.includes('your_firebase') ||
    config.projectId === 'your-project-id' ||
    config.appId.includes('abcdef')
  ) {
    return false;
  }
  return true;
}

/**
 * Safe runtime lookup for Vite's import.meta.env without breaking CommonJS / Node TypeScript compilation.
 */
function getMetaEnv(): Record<string, string | undefined> | null {
  try {
    const fn = new Function('return typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : null');
    return fn();
  } catch {
    return null;
  }
}

/**
 * Reads Firebase configuration from Vite (import.meta.env) or Expo / Node (process.env).
 */
export function getFirebaseEnvConfig(): Partial<FirebaseClientConfig> {
  if (configuredEnv) {
    return configuredEnv;
  }

  const metaEnv = getMetaEnv();
  if (metaEnv) {
    return {
      apiKey: metaEnv.VITE_FIREBASE_API_KEY,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: metaEnv.VITE_FIREBASE_APP_ID,
    };
  }

  // Node / React Native Expo
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

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;
let connectionState: FirebaseConnectionState = 'STANDALONE_FALLBACK';
let connectionError: string | null = null;
let emulatorConnected = false;
let configuredEnv: Partial<FirebaseClientConfig> | null = null;
let configuredEmulator: boolean | null = null;

export function configureFirebaseClient(
  config: Partial<FirebaseClientConfig>,
  useEmulator: boolean
): void {
  if (firebaseApp) {
    throw new Error('Firebase client configuration must be set before Firebase is initialized.');
  }

  configuredEnv = config;
  configuredEmulator = useEmulator;
}

export function getFirebaseServices(): {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  connectionState: FirebaseConnectionState;
  connectionError: string | null;
  isConfigured: boolean;
} {
  if (firebaseApp && firestoreDb && firebaseAuth) {
    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: firestoreDb,
      connectionState,
      connectionError,
      isConfigured: connectionState !== 'STANDALONE_FALLBACK',
    };
  }

  const config = getFirebaseEnvConfig();
  const isValid = validateFirebaseConfig(config);

  const metaEnv = getMetaEnv();
  const useEmulator =
    configuredEmulator ??
    (metaEnv?.VITE_USE_FIREBASE_EMULATOR === 'true' ||
      (typeof process !== 'undefined' &&
        (process.env?.EXPO_PUBLIC_USE_EMULATOR === 'true' || process.env?.USE_FIREBASE_EMULATOR === 'true')));

  if (!isValid && !useEmulator) {
    connectionState = 'STANDALONE_FALLBACK';
    connectionError = 'Firebase credentials are missing or invalid.';
    return {
      app: null,
      auth: null,
      db: null,
      connectionState,
      connectionError,
      isConfigured: false,
    };
  }

  // Initialize Firebase App
  const activeConfig: FirebaseClientConfig = isValid
    ? (config as FirebaseClientConfig)
    : {
        apiKey: 'AIzaSyDemoEmulatorApiKey0000000000000000',
        authDomain: 'queueless-emulator.firebaseapp.com',
        projectId: 'queueless-dev',
        appId: '1:1234567890:web:demoemulatorapp0000',
      };

  if (!getApps().length) {
    firebaseApp = initializeApp(activeConfig);
  } else {
    firebaseApp = getApp();
  }

  firebaseAuth = getAuth(firebaseApp);
  firestoreDb = getFirestore(firebaseApp);

  if (useEmulator && !emulatorConnected) {
    try {
      const emulatorHost =
        typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_EMULATOR_HOST
          ? process.env.EXPO_PUBLIC_EMULATOR_HOST
          : '127.0.0.1';

      connectAuthEmulator(firebaseAuth, `http://${emulatorHost}:9099`, { disableWarnings: true });
      connectFirestoreEmulator(firestoreDb, emulatorHost, 8080);
      emulatorConnected = true;
      connectionState = 'LOCAL_EMULATOR';
      connectionError = null;
      console.info(`[QueueLess] Connected to Firebase Emulators at ${emulatorHost}`);
    } catch (err) {
      connectionState = 'STANDALONE_FALLBACK';
      connectionError = err instanceof Error ? err.message : String(err);
      console.error('[QueueLess] Could not bind to Firebase emulators:', err);
    }
  } else if (isValid) {
    connectionState = 'LIVE_PROJECT';
    connectionError = null;
  }

  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firestoreDb,
    connectionState,
    connectionError,
    isConfigured: connectionState !== 'STANDALONE_FALLBACK',
  };
}
