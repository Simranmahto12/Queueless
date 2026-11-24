/**
 * QueueLess QR Check-In & Atomic Occupancy Management Service
 * Implements atomic transactional check-in/checkout with duplicate prevention,
 * strict non-negative capacity bounds, and automated overcrowding alerts.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import { Zone, CheckIn, Alert, Token } from '../../types/models';
import {
  ZoneOccupancyStatus,
  CheckInMethod,
  AlertSeverity,
  AlertType,
  TokenStatus,
  AuditAction,
  UserRole,
} from '../../types/enums';
import { decodeAndValidateQRPayload } from '../qrService';
import { calculateZoneOccupancy } from '../../algorithms/occupancyCalculator';
import { MOCK_ZONES, MOCK_ALERTS } from '../mockData';
import { updateInMemoryTokenCheckIn, getInMemoryTokenById } from './tokenService';
import { recordAuditLog } from './auditService';

// Fallback in-memory state
let inMemoryZones: Zone[] = [...MOCK_ZONES];
let inMemoryAlerts: Alert[] = [...MOCK_ALERTS];
let inMemoryCheckIns: CheckIn[] = [];

const zoneSubscribers: Set<(zones: Zone[]) => void> = new Set();
const alertSubscribers: Set<(alerts: Alert[]) => void> = new Set();

function notifyZoneChange() {
  zoneSubscribers.forEach((cb) => cb([...inMemoryZones]));
}

function notifyAlertChange() {
  alertSubscribers.forEach((cb) => cb([...inMemoryAlerts]));
}

export interface CheckInResult {
  success: boolean;
  checkIn?: CheckIn;
  token?: Token;
  zone?: Zone;
  errorMessage?: string;
}

/**
 * Executes atomic visitor check-in:
 * 1. Validates QR cryptographic signature and expiration.
 * 2. Prevents duplicate check-ins.
 * 3. Records check-in event.
 * 4. Atomically increments zone occupancy.
 * 5. Automatically generates overcrowding alert if safe capacity is breached.
 */
export async function checkInVisitorWithQR(params: {
  qrPayload: string;
  expectedInstitutionId: string;
  expectedBranchId: string;
  targetZoneId: string;
  method?: CheckInMethod;
  verifiedByStaffId?: string;
  markAsCompleted?: boolean;
}): Promise<CheckInResult> {
  const {
    qrPayload,
    expectedInstitutionId,
    expectedBranchId,
    targetZoneId,
    method = CheckInMethod.QR_SCAN_MOBILE,
    verifiedByStaffId,
    markAsCompleted = true,
  } = params;

  // 1. Verify QR Integrity
  const qrValidation = decodeAndValidateQRPayload(
    qrPayload,
    expectedInstitutionId,
    expectedBranchId
  );

  if (!qrValidation.isValid || !qrValidation.payload) {
    return {
      success: false,
      errorMessage: qrValidation.errorMessage || 'Invalid or expired QR check-in code.',
    };
  }

  const { tokenId } = qrValidation.payload;
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();
  const finalStatus = markAsCompleted ? TokenStatus.COMPLETED : TokenStatus.CHECKED_IN;

  if (db && isConfigured) {
    const txRes = await runTransaction(db, async (transaction) => {
      const tokenRef = doc(db, 'tokens', tokenId);
      const tokenSnap = await transaction.get(tokenRef);

      if (!tokenSnap.exists()) {
        throw new Error('Token does not exist in registry.');
      }

      const tokenData = tokenSnap.data() as Token;

      // Prevent duplicate check-in
      if (tokenData.status === TokenStatus.CHECKED_IN || tokenData.checkedInAt) {
        throw new Error(`Token ${tokenData.tokenNumber} is already checked in.`);
      }
      if (tokenData.status === TokenStatus.COMPLETED || tokenData.status === TokenStatus.CANCELLED) {
        throw new Error(`Token ${tokenData.tokenNumber} is already closed (${tokenData.status}).`);
      }

      // Read Zone
      const zoneRef = doc(db, 'zones', targetZoneId);
      const zoneSnap = await transaction.get(zoneRef);
      if (!zoneSnap.exists()) {
        throw new Error('Target waiting zone does not exist.');
      }
      const zoneData = zoneSnap.data() as Zone;

      // Atomic occupancy increment
      const newOccupancy = zoneData.currentOccupancy + 1;
      const occCalc = calculateZoneOccupancy(newOccupancy, zoneData.maxCapacity);

      // Create Check-in record
      const checkInId = `chk-${Date.now()}`;
      const newCheckIn: CheckIn = {
        id: checkInId,
        checkInId,
        tokenId,
        institutionId: expectedInstitutionId,
        branchId: expectedBranchId,
        zoneId: targetZoneId,
        visitorId: tokenData.visitorId,
        checkedInAt: now,
        method,
        verifiedByStaffId,
        qrPayloadScanned: qrPayload,
        isValid: true,
        createdAt: now,
        updatedAt: now,
      };

      const checkInRef = doc(db, 'checkIns', checkInId);
      transaction.set(checkInRef, newCheckIn);

      // Update Token (mark completed if requested, freeing the user to book a new ticket)
      transaction.update(tokenRef, {
        status: finalStatus,
        checkedInAt: now,
        serviceCompletedAt: markAsCompleted ? now : null,
        checkInMethod: method,
        updatedAt: now,
      });

      // Update Zone
      transaction.update(zoneRef, {
        currentOccupancy: newOccupancy,
        occupancyStatus: occCalc.status,
        updatedAt: now,
      });

      // Auto-generate overcrowding alert if needed
      if (occCalc.isOvercrowded || newOccupancy >= zoneData.safeCapacity) {
        const alertId = `alt-crowd-${Date.now()}`;
        const alertRef = doc(db, 'alerts', alertId);
        const newAlert: Alert = {
          id: alertId,
          alertId,
          institutionId: expectedInstitutionId,
          branchId: expectedBranchId,
          zoneId: targetZoneId,
          type: AlertType.OVERCROWDING,
          severity: occCalc.severity,
          title: `${zoneData.name} Density ${occCalc.status} (${occCalc.occupancyPercentage}%)`,
          message: `Zone occupancy reached ${newOccupancy} / ${zoneData.maxCapacity}. Recommended to pause admissions or direct arrivals to overflow hall.`,
          isAcknowledged: false,
          createdAt: now,
          updatedAt: now,
        };
        transaction.set(alertRef, newAlert);
      }

      return {
        success: true,
        checkIn: newCheckIn,
        token: {
          ...tokenData,
          status: finalStatus,
          checkedInAt: now,
          serviceCompletedAt: markAsCompleted ? now : undefined,
        },
        zone: { ...zoneData, currentOccupancy: newOccupancy, occupancyStatus: occCalc.status },
      };
    });

    if (txRes.success) {
      await recordAuditLog({
        institutionId: expectedInstitutionId,
        branchId: expectedBranchId,
        action: AuditAction.TOKEN_STATUS_CHANGE,
        performedByUserId: verifiedByStaffId || txRes.token?.visitorId || 'visitor-on-site',
        performedByRole: verifiedByStaffId ? UserRole.COUNTER_STAFF : UserRole.VISITOR,
        targetEntity: 'TOKEN',
        targetEntityId: tokenId,
        changes: {
          before: { status: TokenStatus.ISSUED, checkedInAt: null },
          after: {
            status: finalStatus,
            checkedInAt: now,
            serviceCompletedAt: markAsCompleted ? now : undefined,
            zoneId: targetZoneId,
          },
        },
        details: markAsCompleted
          ? `QR Code check-in verified. Single-use QR pass expired. Ticket marked as COMPLETED. User is now eligible to book another ticket.`
          : `QR Code check-in verified. Single-use QR pass expired and retired. Visitor admitted to waiting zone ${targetZoneId}.`,
      });
    }

    return txRes;
  }

  // Fallback transaction
  const targetZone = inMemoryZones.find((z) => z.zoneId === targetZoneId);
  if (!targetZone) {
    return { success: false, errorMessage: 'Zone not found.' };
  }

  // Prevent duplicate check-in in fallback store
  const existingCheckIn = inMemoryCheckIns.find((c) => c.tokenId === tokenId && c.isValid);
  if (existingCheckIn) {
    return {
      success: false,
      errorMessage: `Token is already checked in at ${existingCheckIn.checkedInAt}.`,
    };
  }

  const existingToken = getInMemoryTokenById(tokenId);
  if (existingToken && (existingToken.status === TokenStatus.COMPLETED || existingToken.status === TokenStatus.CANCELLED)) {
    return {
      success: false,
      errorMessage: `Token ${existingToken.tokenNumber} is already closed (${existingToken.status}).`,
    };
  }

  const newOccupancy = targetZone.currentOccupancy + 1;
  const occCalc = calculateZoneOccupancy(newOccupancy, targetZone.maxCapacity);

  const checkInId = `chk-${Date.now()}`;
  const newCheckIn: CheckIn = {
    id: checkInId,
    checkInId,
    tokenId,
    institutionId: expectedInstitutionId,
    branchId: expectedBranchId,
    zoneId: targetZoneId,
    visitorId: existingToken?.visitorId || 'visitor-user',
    checkedInAt: now,
    method,
    isValid: true,
    createdAt: now,
    updatedAt: now,
  };
  inMemoryCheckIns.push(newCheckIn);
  updateInMemoryTokenCheckIn(tokenId, now, markAsCompleted);

  inMemoryZones = inMemoryZones.map((z) =>
    z.zoneId === targetZoneId
      ? {
          ...z,
          currentOccupancy: newOccupancy,
          occupancyStatus: occCalc.status,
          updatedAt: now,
        }
      : z
  );

  if (occCalc.isOvercrowded || newOccupancy >= targetZone.safeCapacity) {
    const newAlert: Alert = {
      id: `alt-${Date.now()}`,
      alertId: `alt-${Date.now()}`,
      institutionId: expectedInstitutionId,
      branchId: expectedBranchId,
      zoneId: targetZoneId,
      type: AlertType.OVERCROWDING,
      severity: occCalc.severity,
      title: `${targetZone.name} Density ${occCalc.status} (${occCalc.occupancyPercentage}%)`,
      message: `Zone reached ${newOccupancy} / ${targetZone.maxCapacity}. Staggering incoming arrivals.`,
      isAcknowledged: false,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryAlerts = [newAlert, ...inMemoryAlerts];
    notifyAlertChange();
  }

  notifyZoneChange();

  await recordAuditLog({
    institutionId: expectedInstitutionId,
    branchId: expectedBranchId,
    action: AuditAction.TOKEN_STATUS_CHANGE,
    performedByUserId: verifiedByStaffId || 'visitor-user',
    performedByRole: verifiedByStaffId ? UserRole.COUNTER_STAFF : UserRole.VISITOR,
    targetEntity: 'TOKEN',
    targetEntityId: tokenId,
    changes: {
      before: { status: TokenStatus.ISSUED, checkedInAt: null },
      after: {
        status: finalStatus,
        checkedInAt: now,
        serviceCompletedAt: markAsCompleted ? now : undefined,
        zoneId: targetZoneId,
      },
    },
    details: markAsCompleted
      ? `QR Code check-in verified. Single-use QR pass expired. Ticket marked as COMPLETED. User is now eligible to book another ticket.`
      : `QR Code check-in verified. Single-use QR pass expired and retired. Visitor admitted to waiting zone ${targetZone.name || targetZoneId}. Lobby occupancy updated (${newOccupancy}/${targetZone.maxCapacity}).`,
  });

  return {
    success: true,
    checkIn: newCheckIn,
    token: getInMemoryTokenById(tokenId),
    zone: inMemoryZones.find((z) => z.zoneId === targetZoneId),
  };
}

/**
 * Atomic Check-Out: Decrements zone occupancy ensuring count never drops below zero.
 */
export async function checkOutVisitor(params: {
  tokenId: string;
  zoneId: string;
  institutionId: string;
}): Promise<void> {
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();

  if (db && isConfigured) {
    await runTransaction(db, async (transaction) => {
      const zoneRef = doc(db, 'zones', params.zoneId);
      const zoneSnap = await transaction.get(zoneRef);

      if (zoneSnap.exists()) {
        const zoneData = zoneSnap.data() as Zone;
        const newOccupancy = Math.max(0, zoneData.currentOccupancy - 1);
        const occCalc = calculateZoneOccupancy(newOccupancy, zoneData.maxCapacity);

        transaction.update(zoneRef, {
          currentOccupancy: newOccupancy,
          occupancyStatus: occCalc.status,
          updatedAt: now,
        });
      }
    });
    return;
  }

  inMemoryZones = inMemoryZones.map((z) => {
    if (z.zoneId !== params.zoneId) return z;
    const newOcc = Math.max(0, z.currentOccupancy - 1);
    const occCalc = calculateZoneOccupancy(newOcc, z.maxCapacity);
    return {
      ...z,
      currentOccupancy: newOcc,
      occupancyStatus: occCalc.status,
      updatedAt: now,
    };
  });
  notifyZoneChange();
}

/**
 * Listens to physical zone occupancies in real time.
 */
export function listenZones(
  institutionId: string,
  branchId: string,
  callback: (zones: Zone[]) => void
): () => void {
  const { db, isConfigured } = getFirebaseServices();

  if (db && isConfigured) {
    const q = query(
      collection(db, 'zones'),
      where('institutionId', '==', institutionId),
      where('branchId', '==', branchId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const zones = snapshot.docs.map((d) => d.data() as Zone);
        callback(zones);
      },
      (err) => {
        console.warn('[QueueLess OccupancyService] Zone listener error, falling back:', err);
        callback(inMemoryZones.filter((z) => z.institutionId === institutionId));
      }
    );
  }

  zoneSubscribers.add(callback);
  callback(inMemoryZones.filter((z) => z.institutionId === institutionId));
  return () => {
    zoneSubscribers.delete(callback);
  };
}

/**
 * Listens to real-time crowd and operational alerts.
 */
export function listenAlerts(
  institutionId: string,
  branchId: string,
  callback: (alerts: Alert[]) => void
): () => void {
  const { db, isConfigured } = getFirebaseServices();

  if (db && isConfigured) {
    const q = query(
      collection(db, 'alerts'),
      where('institutionId', '==', institutionId),
      where('branchId', '==', branchId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const alerts = snapshot.docs.map((d) => d.data() as Alert);
        callback(alerts);
      },
      (err) => {
        console.warn('[QueueLess OccupancyService] Alert listener error, falling back:', err);
        callback(inMemoryAlerts.filter((a) => a.institutionId === institutionId));
      }
    );
  }

  alertSubscribers.add(callback);
  callback(inMemoryAlerts.filter((a) => a.institutionId === institutionId));
  return () => {
    alertSubscribers.delete(callback);
  };
}

/**
 * Acknowledges an operational alert.
 */
export async function acknowledgeAlert(alertId: string, staffId?: string): Promise<void> {
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();

  if (db && isConfigured) {
    await updateDoc(doc(db, 'alerts', alertId), {
      isAcknowledged: true,
      acknowledgedAt: now,
      acknowledgedByStaffId: staffId || null,
      updatedAt: now,
    });
    return;
  }

  inMemoryAlerts = inMemoryAlerts.map((a) =>
    a.alertId === alertId
      ? {
          ...a,
          isAcknowledged: true,
          acknowledgedAt: now,
          acknowledgedByStaffId: staffId,
          updatedAt: now,
        }
      : a
  );
  notifyAlertChange();
}

/**
 * Interactive Footfall Simulation: Allows testing threshold alerts directly from the dashboard.
 */
export async function simulateFootfall(zoneId: string, delta: number): Promise<void> {
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();

  if (db && isConfigured) {
    await runTransaction(db, async (transaction) => {
      const zoneRef = doc(db, 'zones', zoneId);
      const snap = await transaction.get(zoneRef);
      if (snap.exists()) {
        const z = snap.data() as Zone;
        const newOcc = Math.max(0, Math.min(z.maxCapacity * 1.5, z.currentOccupancy + delta));
        const occCalc = calculateZoneOccupancy(newOcc, z.maxCapacity);
        transaction.update(zoneRef, {
          currentOccupancy: newOcc,
          occupancyStatus: occCalc.status,
          updatedAt: now,
        });
      }
    });
    return;
  }

  inMemoryZones = inMemoryZones.map((z) => {
    if (z.zoneId !== zoneId) return z;
    const newOcc = Math.max(0, Math.min(z.maxCapacity * 1.5, z.currentOccupancy + delta));
    const occCalc = calculateZoneOccupancy(newOcc, z.maxCapacity);
    return {
      ...z,
      currentOccupancy: newOcc,
      occupancyStatus: occCalc.status,
      updatedAt: now,
    };
  });
  notifyZoneChange();
}
