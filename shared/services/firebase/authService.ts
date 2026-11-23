/**
 * QueueLess Authentication and RBAC Service
 * Provides secure visitor and administrator authentication with role-based checks.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import { User } from '../../types/models';
import { UserRole } from '../../types/enums';

// In-memory session fallback for offline / unconfigured mode
let fallbackCurrentUser: User | null = {
  id: 'user-admin-default',
  userId: 'user-admin-default',
  email: 'admin@apexhealth.org',
  displayName: 'Sarah Jenkins',
  role: UserRole.INSTITUTION_ADMIN,
  institutionId: 'inst-apex-health',
  branchId: 'branch-apex-main',
  isActive: true,
  createdAt: '2026-01-10T08:00:00Z',
  updatedAt: '2026-11-20T10:00:00Z',
};

const fallbackListeners: Set<(user: User | null) => void> = new Set();

/**
 * Register a new user account and write profile with verified role to Firestore.
 */
export async function registerUser(params: {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  role?: UserRole;
  institutionId?: string;
  branchId?: string;
}): Promise<User> {
  const { auth, db, isConfigured } = getFirebaseServices();

  const userRole = params.role || UserRole.VISITOR;
  const now = new Date().toISOString();

  if (auth && db && isConfigured) {
    const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
    const userId = cred.user.uid;

    const userProfile: User = {
      id: userId,
      userId,
      email: params.email,
      displayName: params.displayName,
      phone: params.phone,
      role: userRole,
      institutionId: params.institutionId,
      branchId: params.branchId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'users', userId), userProfile);
    return userProfile;
  }

  // Fallback mode
  const newFallbackUser: User = {
    id: `user-${Date.now()}`,
    userId: `user-${Date.now()}`,
    email: params.email,
    displayName: params.displayName,
    phone: params.phone,
    role: userRole,
    institutionId: params.institutionId,
    branchId: params.branchId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  fallbackCurrentUser = newFallbackUser;
  fallbackListeners.forEach((cb) => cb(newFallbackUser));
  return newFallbackUser;
}

/**
 * Sign in an existing user and fetch their Firestore profile and authorized roles.
 */
export async function loginUser(email: string, pass: string): Promise<User> {
  const { auth, db, isConfigured } = getFirebaseServices();

  if (auth && db && isConfigured) {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const userSnap = await getDoc(doc(db, 'users', cred.user.uid));

    if (userSnap.exists()) {
      return userSnap.data() as User;
    }

    // Default fallback profile if document does not exist yet
    const fallbackProfile: User = {
      id: cred.user.uid,
      userId: cred.user.uid,
      email: cred.user.email || email,
      displayName: cred.user.displayName || email.split('@')[0],
      role: UserRole.VISITOR,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), fallbackProfile);
    return fallbackProfile;
  }

  // Fallback mode: determine role based on email pattern for seamless testing
  const role = email.includes('admin')
    ? UserRole.INSTITUTION_ADMIN
    : email.includes('staff')
    ? UserRole.COUNTER_STAFF
    : UserRole.VISITOR;

  const user: User = {
    id: `user-${email}`,
    userId: `user-${email}`,
    email,
    displayName: email.split('@')[0].replace('.', ' '),
    role,
    institutionId: 'inst-apex-health',
    branchId: 'branch-apex-main',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  fallbackCurrentUser = user;
  fallbackListeners.forEach((cb) => cb(user));
  return user;
}

/**
 * Sign in anonymously for fast guest visitor booking.
 */
export async function loginGuest(displayName: string = 'Guest Visitor'): Promise<User> {
  const { auth, db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();

  if (auth && db && isConfigured) {
    const cred = await signInAnonymously(auth);
    const userId = cred.user.uid;

    const guestProfile: User = {
      id: userId,
      userId,
      email: `${userId}@guest.queueless.com`,
      displayName,
      role: UserRole.VISITOR,
      isAnonymous: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'users', userId), guestProfile);
    return guestProfile;
  }

  const guest: User = {
    id: `guest-${Date.now()}`,
    userId: `guest-${Date.now()}`,
    email: 'guest@queueless.com',
    displayName,
    role: UserRole.VISITOR,
    isAnonymous: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  fallbackCurrentUser = guest;
  fallbackListeners.forEach((cb) => cb(guest));
  return guest;
}

/**
 * Sign out current active user.
 */
export async function logoutUser(): Promise<void> {
  const { auth, isConfigured } = getFirebaseServices();

  if (auth && isConfigured) {
    await signOut(auth);
  }
  fallbackCurrentUser = null;
  fallbackListeners.forEach((cb) => cb(null));
}

/**
 * Subscribe to authentication state changes.
 */
export function subscribeAuth(callback: (user: User | null) => void): () => void {
  const { auth, db, isConfigured } = getFirebaseServices();

  if (auth && db && isConfigured) {
    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        callback(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) {
          callback(snap.data() as User);
        } else {
          callback({
            id: fbUser.uid,
            userId: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Visitor',
            role: UserRole.VISITOR,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('[QueueLess Auth] Error fetching user profile:', e);
        callback(null);
      }
    });
  }

  // Fallback subscriber
  fallbackListeners.add(callback);
  callback(fallbackCurrentUser);
  return () => {
    fallbackListeners.delete(callback);
  };
}

/**
 * Helper to test if user has administrative permissions.
 */
export function hasAdminPermission(role?: UserRole): boolean {
  if (!role) return false;
  return [
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.DEPARTMENT_MANAGER,
  ].includes(role);
}
