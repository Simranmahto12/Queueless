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
    // 1. Seed Institutions
    for (const inst of MOCK_INSTITUTIONS) {
      await setDoc(doc(db, 'institutions', inst.institutionId), inst);
      count++;
    }

    // 2. Seed Branches
    for (const branch of MOCK_BRANCHES) {
      await setDoc(doc(db, 'branches', branch.branchId), branch);
      count++;
    }

    // 3. Seed Departments
    for (const dept of MOCK_DEPARTMENTS) {
      await setDoc(doc(db, 'departments', dept.departmentId), dept);
      count++;
    }

    // 4. Seed Services
    for (const srv of MOCK_SERVICES) {
      await setDoc(doc(db, 'services', srv.serviceId), srv);
      count++;
    }

    // 5. Seed Counters
    for (const counter of MOCK_COUNTERS) {
      await setDoc(doc(db, 'counters', counter.counterId), counter);
      count++;
    }

    // 6. Seed Staff
    for (const staffMember of MOCK_STAFF) {
      await setDoc(doc(db, 'staff', staffMember.staffId), staffMember);
      count++;
    }

    // 7. Seed Zones
    for (const zone of MOCK_ZONES) {
      await setDoc(doc(db, 'zones', zone.zoneId), zone);
      count++;
    }

    // 8. Seed Tokens
    for (const token of MOCK_TOKENS) {
      await setDoc(doc(db, 'tokens', token.tokenId), token);
      count++;
    }

    // 9. Seed Alerts
    for (const alert of MOCK_ALERTS) {
      await setDoc(doc(db, 'alerts', alert.alertId), alert);
      count++;
    }

    return {
      success: true,
      message: `Successfully seeded ${count} documents across 9 collections into Firestore (${connectionState}).`,
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
