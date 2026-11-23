/**
 * QueueLess Firestore Database Seeding Service
 * Populates clean Firestore instances / emulators with realistic multi-sector data.
 */

import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import {
  MOCK_INSTITUTIONS,
  MOCK_BRANCHES,
  MOCK_DEPARTMENTS,
  MOCK_SERVICES,
  MOCK_COUNTERS,
  MOCK_ZONES,
  MOCK_STAFF,
  MOCK_TOKENS,
  MOCK_ALERTS,
} from '../mockData';
import { UserRole } from '../../types/enums';
import { User } from '../../types/models';

export async function seedFirestoreDatabase(): Promise<{
  success: boolean;
  message: string;
  count: number;
}> {
  const { db, isConfigured, connectionState } = getFirebaseServices();

  if (!db || !isConfigured) {
    return {
      success: false,
      message: `Firebase is not configured or emulator is unreachable (State: ${connectionState}). Provide valid credentials in .env or run 'npm run emulators'.`,
      count: 0,
    };
  }

  let count = 0;

  try {
    // 1. Seed Authorized Default Users
    const defaultUsers: User[] = [
      {
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
      {
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
      {
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
    ];

    for (const u of defaultUsers) {
      await setDoc(doc(db, 'users', u.userId), u);
      count++;
    }

    // 2. Seed Institutions
    for (const inst of MOCK_INSTITUTIONS) {
      await setDoc(doc(db, 'institutions', inst.institutionId), inst);
      count++;
    }

    // 3. Seed Branches
    for (const branch of MOCK_BRANCHES) {
      await setDoc(doc(db, 'branches', branch.branchId), branch);
      count++;
    }

    // 4. Seed Departments
    for (const dept of MOCK_DEPARTMENTS) {
      await setDoc(doc(db, 'departments', dept.departmentId), dept);
      count++;
    }

    // 5. Seed Services
    for (const srv of MOCK_SERVICES) {
      await setDoc(doc(db, 'services', srv.serviceId), srv);
      count++;
    }

    // 6. Seed Counters
    for (const counter of MOCK_COUNTERS) {
      await setDoc(doc(db, 'counters', counter.counterId), counter);
      count++;
    }

    // 7. Seed Staff
    for (const staffMember of MOCK_STAFF) {
      await setDoc(doc(db, 'staff', staffMember.staffId), staffMember);
      count++;
    }

    // 8. Seed Zones
    for (const zone of MOCK_ZONES) {
      await setDoc(doc(db, 'zones', zone.zoneId), zone);
      count++;
    }

    // 9. Seed Tokens
    for (const token of MOCK_TOKENS) {
      await setDoc(doc(db, 'tokens', token.tokenId), token);
      count++;
    }

    // 10. Seed Alerts
    for (const alert of MOCK_ALERTS) {
      await setDoc(doc(db, 'alerts', alert.alertId), alert);
      count++;
    }

    return {
      success: true,
      message: `Successfully seeded ${count} documents across 10 collections into Firestore (${connectionState}).`,
      count,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Firestore seeding error: ${msg}`,
      count,
    };
  }
}
