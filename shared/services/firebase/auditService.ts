/**
 * QueueLess System Audit & History Service
 * Provides immutable audit logging for security compliance, administrative oversight,
 * token lifecycle transitions, single-use QR verification, and mobile notification tracking.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import { AuditLog } from '../../types/models';
import { AuditAction, UserRole } from '../../types/enums';

// Initial pre-seeded audit history for demo and offline fallback
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-seed-001',
    logId: 'log-seed-001',
    institutionId: 'inst-metro-health',
    branchId: 'branch-metro-main',
    action: AuditAction.SYSTEM_CONFIG_UPDATED,
    performedByUserId: 'usr-admin-metro',
    performedByRole: UserRole.INSTITUTION_ADMIN,
    targetEntity: 'SYSTEM',
    targetEntityId: 'config-metro-main',
    details: 'System initialized. Floor capacity thresholds set to 85% safe occupancy limit.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'log-seed-002',
    logId: 'log-seed-002',
    institutionId: 'inst-metro-health',
    branchId: 'branch-metro-main',
    action: AuditAction.COUNTER_STATUS_CHANGE,
    performedByUserId: 'usr-staff-dr-sarah',
    performedByRole: UserRole.COUNTER_STAFF,
    targetEntity: 'COUNTER',
    targetEntityId: 'ctr-cardio-01',
    details: 'Counter 01 opened by Dr. Sarah Jenkins for Cardiology consultation triage.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'log-seed-003',
    logId: 'log-seed-003',
    institutionId: 'inst-metro-health',
    branchId: 'branch-metro-main',
    action: AuditAction.TOKEN_CREATED,
    performedByUserId: 'usr-visitor-david',
    performedByRole: UserRole.VISITOR,
    targetEntity: 'TOKEN',
    targetEntityId: 'tok-cardio-001',
    details: 'Token T-CARD-101 reserved by David Miller. SMS notification dispatched to +1 (555) 019-2834.',
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
];

let inMemoryAuditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
const auditSubscribers: Set<(logs: AuditLog[]) => void> = new Set();

function notifyAuditSubscribers(): void {
  const currentLogs = [...inMemoryAuditLogs];
  auditSubscribers.forEach((cb) => cb(currentLogs));
}

export interface RecordAuditParams {
  institutionId: string;
  branchId?: string;
  action: AuditAction;
  performedByUserId: string;
  performedByRole: UserRole;
  targetEntity: string;
  targetEntityId: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Records an immutable audit log record in system history.
 * Persists to Firestore when available and updates local in-memory fallback.
 */
export async function recordAuditLog(params: RecordAuditParams): Promise<AuditLog> {
  const now = new Date().toISOString();
  const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newLog: AuditLog = {
    id: logId,
    logId,
    institutionId: params.institutionId,
    branchId: params.branchId,
    action: params.action,
    performedByUserId: params.performedByUserId,
    performedByRole: params.performedByRole,
    targetEntity: params.targetEntity,
    targetEntityId: params.targetEntityId,
    changes: params.changes,
    details: params.details,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    createdAt: now,
    updatedAt: now,
  };

  // Always update in-memory log list (prepended so newest appears first)
  inMemoryAuditLogs = [newLog, ...inMemoryAuditLogs];
  notifyAuditSubscribers();

  const { db, isConfigured } = getFirebaseServices();
  if (db && isConfigured) {
    try {
      await setDoc(doc(db, 'auditLogs', logId), newLog);
    } catch (err) {
      console.warn('Could not persist audit log to Firestore:', err);
    }
  }

  return newLog;
}

/**
 * Retrieves audit logs for an institution, ordered with the most recent events first.
 */
export async function getAuditLogs(institutionId?: string): Promise<AuditLog[]> {
  const { db, isConfigured } = getFirebaseServices();

  if (db && isConfigured && institutionId) {
    try {
      const q = query(
        collection(db, 'auditLogs'),
        where('institutionId', '==', institutionId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as AuditLog);
      }
    } catch {
      // Fall through to in-memory store if query index is building or permissions fail
    }
  }

  if (institutionId) {
    return inMemoryAuditLogs.filter(
      (l) => l.institutionId === institutionId || l.institutionId === 'all'
    );
  }
  return [...inMemoryAuditLogs];
}

/**
 * Real-time listener for system audit history changes.
 */
export function listenAuditLogs(
  institutionId: string,
  callback: (logs: AuditLog[]) => void
): () => void {
  const { db, isConfigured } = getFirebaseServices();

  if (db && isConfigured) {
    try {
      const q = query(
        collection(db, 'auditLogs'),
        where('institutionId', '==', institutionId),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((d) => d.data() as AuditLog);
          callback(list.length > 0 ? list : inMemoryAuditLogs);
        },
        () => {
          // If firestore index missing or error, deliver in-memory logs
          callback(inMemoryAuditLogs.filter((l) => l.institutionId === institutionId));
        }
      );
      return unsubscribe;
    } catch {
      // Fall through to inMemory subscription
    }
  }

  // Fallback in-memory subscription
  const sub = (logs: AuditLog[]) => {
    callback(logs.filter((l) => !institutionId || l.institutionId === institutionId));
  };
  auditSubscribers.add(sub);
  callback(inMemoryAuditLogs.filter((l) => !institutionId || l.institutionId === institutionId));

  return () => {
    auditSubscribers.delete(sub);
  };
}
