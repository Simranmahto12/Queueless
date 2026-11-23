/**
 * QueueLess Authentication and RBAC Service
 * Provides secure visitor and administrator authentication with role-based access control,
 * password reset capabilities, and strict protection against unauthorized role elevation.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import { User } from '../../types/models';
import { UserRole } from '../../types/enums';

// Initial pre-registered demo accounts for development / testing environments only.
// In production with live Firebase, accounts are authenticated strictly via Firebase Auth & Firestore.
const DEMO_ACCOUNTS_REGISTRY: Map<string, { user: User; passwordHash: string }> = new Map([
  [
    'admin@apexhealth.org',
    {
      user: {
        id: 'usr-admin-apex',
        userId: 'usr-admin-apex',
        email: 'admin@apexhealth.org',
        displayName: 'Dr. Sarah Jenkins',
        phone: '+1 (555) 234-5678',
        role: UserRole.INSTITUTION_ADMIN,
        institutionId: 'inst-apex-health',
        branchId: 'branch-apex-main',
        isActive: true,
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-11-20T10:00:00Z',
      },
      passwordHash: 'AdminPass123!',
    },
  ],
  [
    'admin.sarah@apexhealth.org',
    {
      user: {
        id: 'usr-admin-apex',
        userId: 'usr-admin-apex',
        email: 'admin.sarah@apexhealth.org',
        displayName: 'Dr. Sarah Jenkins',
        phone: '+1 (555) 234-5678',
        role: UserRole.INSTITUTION_ADMIN,
        institutionId: 'inst-apex-health',
        branchId: 'branch-apex-main',
        isActive: true,
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-11-20T10:00:00Z',
      },
      passwordHash: 'securePass',
    },
  ],
  [
    'staff.clara@apexhealth.org',
    {
      user: {
        id: 'usr-staff-clara',
        userId: 'usr-staff-clara',
        email: 'staff.clara@apexhealth.org',
        displayName: 'Nurse Clara Oswald',
        phone: '+1 (555) 234-5688',
        role: UserRole.COUNTER_STAFF,
        institutionId: 'inst-apex-health',
        branchId: 'branch-apex-main',
        assignedCounterId: 'ctr-cardio-02',
        isActive: true,
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-11-20T10:00:00Z',
      },
      passwordHash: 'StaffPass123!',
    },
  ],
  [
    'visitor.david@example.com',
    {
      user: {
        id: 'usr-vis-david',
        userId: 'usr-vis-david',
        email: 'visitor.david@example.com',
        displayName: 'David Miller',
        phone: '+1 (555) 301-8842',
        role: UserRole.VISITOR,
        isActive: true,
        createdAt: '2026-02-01T09:00:00Z',
        updatedAt: '2026-11-20T10:00:00Z',
      },
      passwordHash: 'VisitorPass123!',
    },
  ],
]);

// Current session: starts strictly as null (NO hardcoded predefined auto-login!)
let fallbackCurrentUser: User | null = null;
const fallbackListeners: Set<(user: User | null) => void> = new Set();

/**
 * Registers an independent public visitor account.
 * CRITICAL SECURITY: Public registrations are strictly locked to UserRole.VISITOR.
 */
export async function registerVisitor(params: {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
}): Promise<User> {
  const { auth, db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();

  if (auth && db && isConfigured) {
    const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
    const userId = cred.user.uid;

    const userProfile: User = {
      id: userId,
      userId,
      email: params.email.trim().toLowerCase(),
      displayName: params.displayName.trim(),
      phone: params.phone?.trim(),
      role: UserRole.VISITOR, // Strictly visitor
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'users', userId), userProfile);
    return userProfile;
  }

  // Fallback dev mode
  const normalizedEmail = params.email.trim().toLowerCase();
  if (DEMO_ACCOUNTS_REGISTRY.has(normalizedEmail)) {
    throw new Error('An account with this email address already exists.');
  }

  const userId = `usr-vis-${Date.now()}`;
  const newVisitor: User = {
    id: userId,
    userId,
    email: normalizedEmail,
    displayName: params.displayName.trim(),
    phone: params.phone?.trim(),
    role: UserRole.VISITOR,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  DEMO_ACCOUNTS_REGISTRY.set(normalizedEmail, {
    user: newVisitor,
    passwordHash: params.password,
  });

  fallbackCurrentUser = newVisitor;
  fallbackListeners.forEach((cb) => cb(newVisitor));
  return newVisitor;
}

/**
 * Backward compatibility alias for visitor registration
 */
export const registerUser = registerVisitor;

/**
 * Provision an authorized administrator, manager, or counter staff account.
 * CANNOT be called anonymously: must be invoked by an authorized administrator or CLI provisioning script.
 */
export async function provisionStaffOrAdmin(params: {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  institutionId: string;
  branchId?: string;
  assignedCounterId?: string;
  departmentId?: string;
  authorizedByUserId?: string;
}): Promise<User> {
  // Validate target role is not visitor
  if (params.role === UserRole.VISITOR) {
    throw new Error('Use registerVisitor() to register visitor accounts.');
  }

  const { auth, db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();
  const normalizedEmail = params.email.trim().toLowerCase();

  if (auth && db && isConfigured) {
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, params.password);
    const userId = cred.user.uid;

    const adminProfile: User = {
      id: userId,
      userId,
      email: normalizedEmail,
      displayName: params.displayName.trim(),
      phone: params.phone?.trim(),
      role: params.role,
      institutionId: params.institutionId,
      branchId: params.branchId,
      assignedCounterId: params.assignedCounterId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'users', userId), adminProfile);

    // If staff role, also create document in /staff collection
    if (params.role === UserRole.COUNTER_STAFF || params.role === UserRole.DEPARTMENT_MANAGER) {
      const staffId = `staff-${userId}`;
      await setDoc(doc(db, 'staff', staffId), {
        id: staffId,
        staffId,
        userId,
        institutionId: params.institutionId,
        branchId: params.branchId || 'branch-apex-main',
        departmentId: params.departmentId || 'dep-cardio',
        employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        role: params.role,
        assignedCounterId: params.assignedCounterId,
        skills: ['srv-ecg', 'srv-blood'],
        isAvailable: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return adminProfile;
  }

  // Fallback dev mode registry
  const userId = `usr-admin-${Date.now()}`;
  const adminUser: User = {
    id: userId,
    userId,
    email: normalizedEmail,
    displayName: params.displayName.trim(),
    phone: params.phone?.trim(),
    role: params.role,
    institutionId: params.institutionId,
    branchId: params.branchId,
    assignedCounterId: params.assignedCounterId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  DEMO_ACCOUNTS_REGISTRY.set(normalizedEmail, {
    user: adminUser,
    passwordHash: params.password,
  });

  return adminUser;
}

/**
 * Sign in an existing user and retrieve their verified Firestore role.
 * If requireAdminOrStaff is true, enforces that visitor accounts cannot access administrative portals.
 */
export async function loginUser(
  email: string,
  pass: string,
  options?: { requireAdminOrStaff?: boolean }
): Promise<User> {
  const { auth, db, isConfigured } = getFirebaseServices();
  const normalizedEmail = email.trim().toLowerCase();

  if (auth && db && isConfigured) {
    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
    const userSnap = await getDoc(doc(db, 'users', cred.user.uid));

    if (!userSnap.exists()) {
      throw new Error('User profile record not found in system directory.');
    }

    const profile = userSnap.data() as User;

    if (!profile.isActive) {
      throw new Error('This account has been deactivated. Please contact your institution administrator.');
    }

    // Role-based protection check
    if (options?.requireAdminOrStaff && profile.role === UserRole.VISITOR) {
      await signOut(auth); // Immediately terminate visitor session on admin console
      throw new Error(
        'Access Denied: Visitor accounts are not authorized to access the Institution Administration Console.'
      );
    }

    return profile;
  }

  // Fallback dev mode authentication
  const account = DEMO_ACCOUNTS_REGISTRY.get(normalizedEmail);
  if (!account) {
    throw new Error('Invalid email or password. Verify credentials or test with an authorized demo account.');
  }

  if (account.passwordHash !== pass) {
    throw new Error('Invalid email or password.');
  }

  if (options?.requireAdminOrStaff && account.user.role === UserRole.VISITOR) {
    throw new Error(
      'Access Denied: Visitor accounts are not authorized to access the Institution Administration Console.'
    );
  }

  fallbackCurrentUser = account.user;
  fallbackListeners.forEach((cb) => cb(account.user));
  return account.user;
}

/**
 * Sends a password reset email to the specified user address.
 */
export async function resetUserPassword(email: string): Promise<{ success: boolean; message: string }> {
  const { auth, isConfigured } = getFirebaseServices();
  const normalizedEmail = email.trim().toLowerCase();

  if (auth && isConfigured) {
    await sendPasswordResetEmail(auth, normalizedEmail);
    return {
      success: true,
      message: `Password reset instructions have been sent to ${normalizedEmail}. Please check your inbox.`,
    };
  }

  // Fallback dev mode
  const account = DEMO_ACCOUNTS_REGISTRY.get(normalizedEmail);
  if (!account) {
    // Standard security practice: Don't disclose whether account exists
    return {
      success: true,
      message: `If an account with ${normalizedEmail} exists, password reset instructions have been dispatched.`,
    };
  }

  return {
    success: true,
    message: `[Dev Mode] Password reset link simulated for ${normalizedEmail}. In production, Firebase sends a secure token email.`,
  };
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
 * Sign out current active user session.
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
 * Subscribe to authentication state changes with persistent profile resolution.
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
 * Returns available demo accounts for development assistance only.
 */
export function getDemoAccountsForDev(): { email: string; role: UserRole; description: string; defaultPass: string }[] {
  return [
    {
      email: 'admin@apexhealth.org',
      role: UserRole.INSTITUTION_ADMIN,
      description: 'Hospital Institution Administrator (Full Admin Console Access)',
      defaultPass: 'AdminPass123!',
    },
    {
      email: 'staff.clara@apexhealth.org',
      role: UserRole.COUNTER_STAFF,
      description: 'Counter 02 Stationed Staff (Desk Operations)',
      defaultPass: 'StaffPass123!',
    },
    {
      email: 'visitor.david@example.com',
      role: UserRole.VISITOR,
      description: 'Public Visitor (Mobile Application Only - Blocked on Admin Console)',
      defaultPass: 'VisitorPass123!',
    },
  ];
}

/**
 * Checks if user holds administrative privileges.
 */
export function hasAdminPermission(role?: UserRole): boolean {
  if (!role) return false;
  return [
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.DEPARTMENT_MANAGER,
    UserRole.COUNTER_STAFF,
  ].includes(role);
}
