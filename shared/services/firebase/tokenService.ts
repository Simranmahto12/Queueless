/**
 * QueueLess Real-Time Token and Queue Dispatcher Service
 * Operates with Cloud Firestore real-time listeners and atomic transactions,
 * with a high-performance in-memory live engine fallback.
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
  orderBy,
  onSnapshot,
  runTransaction,
  limit,
} from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import { Token, Counter, AuditLog } from '../../types/models';
import { TokenStatus, TokenPriority, CounterStatus, AuditAction, UserRole } from '../../types/enums';
import { CreateTokenRequest } from '../../types/api';
import { calculateSmartArrivalSlot } from '../../algorithms/slotAllocation';
import { estimateWaitTime, sortQueueTokens } from '../../algorithms/queueEstimator';
import { encodeQRPayload } from '../qrService';
import { MOCK_TOKENS, MOCK_COUNTERS } from '../mockData';

// In-Memory Live Fallback Store
let inMemoryTokens: Token[] = [...MOCK_TOKENS];
let inMemoryCounters: Counter[] = [...MOCK_COUNTERS];

const tokenSubscribers: Set<(tokens: Token[]) => void> = new Set();
const counterSubscribers: Set<(counters: Counter[]) => void> = new Set();
const singleTokenSubscribers: Map<string, Set<(token: Token | null) => void>> = new Map();

function notifyTokenChange() {
  tokenSubscribers.forEach((cb) => cb([...inMemoryTokens]));
  singleTokenSubscribers.forEach((listeners, tokenId) => {
    const found = inMemoryTokens.find((t) => t.tokenId === tokenId) || null;
    listeners.forEach((cb) => cb(found));
  });
}

function notifyCounterChange() {
  counterSubscribers.forEach((cb) => cb([...inMemoryCounters]));
}

/**
 * Books a new digital token with smart arrival slot calculation and cryptographic QR reference.
 */
export async function bookToken(request: CreateTokenRequest): Promise<Token> {
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date();
  const nowISO = now.toISOString();

  // Smart Arrival Slot & Wait Time Calculation
  const arrivalSlot = calculateSmartArrivalSlot({
    targetDate: request.targetDate,
    targetSlotTime: request.targetSlotTime || '09:30',
    serviceDurationMinutes: 15,
    currentQueueDepth: 3,
    activeCountersCount: 2,
  });

  const waitEst = estimateWaitTime({
    tokensAheadCount: 3,
    averageServiceDurationMinutes: 15,
    activeCountersCount: 2,
    priority: request.priority || TokenPriority.STANDARD,
  });

  const tokenId = `tok-${Date.now()}`;
  const tokenNum = Math.floor(100 + Math.random() * 900);
  const tokenNumber = `T-${tokenNum}`;

  const qrPayload = encodeQRPayload({
    tokenId,
    tokenNumber,
    institutionId: request.institutionId,
    branchId: request.branchId,
    validHours: 24,
  });

  const newToken: Token = {
    id: tokenId,
    tokenId,
    tokenNumber,
    institutionId: request.institutionId,
    branchId: request.branchId,
    departmentId: request.departmentId,
    serviceId: request.serviceId,
    visitorId: request.visitorId || 'guest-visitor',
    visitorName: request.visitorName,
    visitorPhone: request.visitorPhone,
    visitorEmail: request.visitorEmail,
    priority: request.priority || TokenPriority.STANDARD,
    status: TokenStatus.ISSUED,
    scheduledSlot: {
      date: request.targetDate,
      startTime: request.targetSlotTime || '09:30',
      endTime: request.targetSlotTime
        ? `${parseInt(request.targetSlotTime.split(':')[0])}:${parseInt(request.targetSlotTime.split(':')[1]) + 15}`
        : '09:45',
    },
    smartArrivalSlot: arrivalSlot,
    estimatedWaitMinutes: waitEst.estimatedWaitMinutes,
    issuedAt: nowISO,
    qrCodeValue: qrPayload,
    notes: request.notes,
    createdAt: nowISO,
    updatedAt: nowISO,
  };

  if (db && isConfigured) {
    await setDoc(doc(db, 'tokens', tokenId), newToken);
    // Write audit log
    const logId = `log-${Date.now()}`;
    const audit: AuditLog = {
      id: logId,
      logId,
      institutionId: request.institutionId,
      branchId: request.branchId,
      action: AuditAction.TOKEN_CREATED,
      performedByUserId: request.visitorId || 'guest-visitor',
      performedByRole: UserRole.VISITOR,
      targetEntity: 'TOKEN',
      targetEntityId: tokenId,
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    await setDoc(doc(db, 'auditLogs', logId), audit);
    return newToken;
  }

  // Fallback
  inMemoryTokens = [newToken, ...inMemoryTokens];
  notifyTokenChange();
  return newToken;
}

/**
 * Listens to all tokens in a branch in real time.
 */
export function listenBranchTokens(
  institutionId: string,
  branchId: string,
  callback: (tokens: Token[]) => void
): () => void {
  const { db, isConfigured } = getFirebaseServices();

  if (db && isConfigured) {
    const q = query(
      collection(db, 'tokens'),
      where('institutionId', '==', institutionId),
      where('branchId', '==', branchId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const tokens = snapshot.docs.map((docSnap) => docSnap.data() as Token);
        callback(tokens);
      },
      (err) => {
        console.warn('[QueueLess TokenService] Firestore listener error, falling back:', err);
        callback(inMemoryTokens.filter((t) => t.institutionId === institutionId));
      }
    );
  }

  // In-Memory Real-Time Subscription
  tokenSubscribers.add(callback);
  callback(inMemoryTokens.filter((t) => t.institutionId === institutionId));
  return () => {
    tokenSubscribers.delete(callback);
  };
}

/**
 * Listens to a single active token in real time (for Visitor Live Queue screen).
 */
export function listenSingleToken(
  tokenId: string,
  callback: (token: Token | null) => void
): () => void {
  const { db, isConfigured } = getFirebaseServices();

  if (db && isConfigured) {
    const tokenRef = doc(db, 'tokens', tokenId);
    return onSnapshot(
      tokenRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as Token);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('[QueueLess TokenService] Error listening to single token:', err);
        const found = inMemoryTokens.find((t) => t.tokenId === tokenId) || null;
        callback(found);
      }
    );
  }

  if (!singleTokenSubscribers.has(tokenId)) {
    singleTokenSubscribers.set(tokenId, new Set());
  }
  singleTokenSubscribers.get(tokenId)!.add(callback);
  const initial = inMemoryTokens.find((t) => t.tokenId === tokenId) || null;
  callback(initial);

  return () => {
    const set = singleTokenSubscribers.get(tokenId);
    if (set) {
      set.delete(callback);
      if (set.size === 0) singleTokenSubscribers.delete(tokenId);
    }
  };
}

/**
 * Atomic Queue Dispatching: Summons the next highest priority waiting token to a service counter.
 */
export async function callNextToken(params: {
  institutionId: string;
  branchId: string;
  departmentId?: string;
  counterId: string;
  staffId: string;
}): Promise<Token | null> {
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();

  if (db && isConfigured) {
    return await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, 'counters', params.counterId);
      const counterSnap = await transaction.get(counterRef);

      if (!counterSnap.exists()) {
        throw new Error('Counter does not exist.');
      }
      const counterData = counterSnap.data() as Counter;

      // Find eligible waiting tokens
      const tokenQuery = query(
        collection(db, 'tokens'),
        where('institutionId', '==', params.institutionId),
        where('status', 'in', [TokenStatus.CHECKED_IN, TokenStatus.WAITING])
      );
      const tokenSnaps = await getDocs(tokenQuery);
      let waitingTokens = tokenSnaps.docs.map((d) => d.data() as Token);

      // Filter by counter's supported services
      waitingTokens = waitingTokens.filter((t) =>
        counterData.supportedServiceIds.includes(t.serviceId)
      );

      if (waitingTokens.length === 0) {
        return null;
      }

      // Sort by priority and timestamp using mathematical sorter
      const sorted = sortQueueTokens(waitingTokens);
      const nextToken = sorted[0];

      const tokenRef = doc(db, 'tokens', nextToken.tokenId);
      transaction.update(tokenRef, {
        status: TokenStatus.CALLED,
        assignedCounterId: params.counterId,
        assignedCounterNumber: counterData.counterNumber,
        calledAt: now,
        servedByStaffId: params.staffId,
        updatedAt: now,
      });

      transaction.update(counterRef, {
        status: CounterStatus.BUSY,
        currentServedTokenId: nextToken.tokenId,
        currentStaffId: params.staffId,
        lastCalledAt: now,
        updatedAt: now,
      });

      return {
        ...nextToken,
        status: TokenStatus.CALLED,
        assignedCounterId: params.counterId,
        assignedCounterNumber: counterData.counterNumber,
        calledAt: now,
        servedByStaffId: params.staffId,
      };
    });
  }

  // Fallback transaction
  const counter = inMemoryCounters.find((c) => c.counterId === params.counterId);
  if (!counter) return null;

  const eligible = inMemoryTokens.filter(
    (t) =>
      (t.status === TokenStatus.CHECKED_IN || t.status === TokenStatus.WAITING) &&
      counter.supportedServiceIds.includes(t.serviceId)
  );

  if (eligible.length === 0) return null;

  const sorted = sortQueueTokens(eligible);
  const nextToken = sorted[0];

  inMemoryTokens = inMemoryTokens.map((t) =>
    t.tokenId === nextToken.tokenId
      ? {
          ...t,
          status: TokenStatus.CALLED,
          assignedCounterId: counter.counterId,
          assignedCounterNumber: counter.counterNumber,
          calledAt: now,
          servedByStaffId: params.staffId,
          updatedAt: now,
        }
      : t
  );

  inMemoryCounters = inMemoryCounters.map((c) =>
    c.counterId === params.counterId
      ? {
          ...c,
          status: CounterStatus.BUSY,
          currentServedTokenId: nextToken.tokenId,
          lastCalledAt: now,
          updatedAt: now,
        }
      : c
  );

  notifyTokenChange();
  notifyCounterChange();

  return inMemoryTokens.find((t) => t.tokenId === nextToken.tokenId) || null;
}

/**
 * Completes a token and frees the assigned counter.
 */
export async function markTokenServed(tokenId: string, counterId?: string): Promise<void> {
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();

  if (db && isConfigured) {
    await runTransaction(db, async (transaction) => {
      const tokenRef = doc(db, 'tokens', tokenId);
      transaction.update(tokenRef, {
        status: TokenStatus.COMPLETED,
        serviceCompletedAt: now,
        updatedAt: now,
      });

      if (counterId) {
        const counterRef = doc(db, 'counters', counterId);
        transaction.update(counterRef, {
          status: CounterStatus.OPEN,
          currentServedTokenId: null,
          updatedAt: now,
        });
      }
    });
    return;
  }

  inMemoryTokens = inMemoryTokens.map((t) =>
    t.tokenId === tokenId
      ? {
          ...t,
          status: TokenStatus.COMPLETED,
          serviceCompletedAt: now,
          updatedAt: now,
        }
      : t
  );

  if (counterId) {
    inMemoryCounters = inMemoryCounters.map((c) =>
      c.counterId === counterId
        ? {
            ...c,
            status: CounterStatus.OPEN,
            currentServedTokenId: undefined,
            updatedAt: now,
          }
        : c
    );
    notifyCounterChange();
  }

  notifyTokenChange();
}

/**
 * Skips an absent token (No-Show) and frees the counter.
 */
export async function skipToken(tokenId: string, counterId?: string): Promise<void> {
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();

  if (db && isConfigured) {
    await runTransaction(db, async (transaction) => {
      const tokenRef = doc(db, 'tokens', tokenId);
      transaction.update(tokenRef, {
        status: TokenStatus.NO_SHOW,
        updatedAt: now,
      });

      if (counterId) {
        const counterRef = doc(db, 'counters', counterId);
        transaction.update(counterRef, {
          status: CounterStatus.OPEN,
          currentServedTokenId: null,
          updatedAt: now,
        });
      }
    });
    return;
  }

  inMemoryTokens = inMemoryTokens.map((t) =>
    t.tokenId === tokenId
      ? {
          ...t,
          status: TokenStatus.NO_SHOW,
          updatedAt: now,
        }
      : t
  );

  if (counterId) {
    inMemoryCounters = inMemoryCounters.map((c) =>
      c.counterId === counterId
        ? {
            ...c,
            status: CounterStatus.OPEN,
            currentServedTokenId: undefined,
            updatedAt: now,
          }
        : c
    );
    notifyCounterChange();
  }

  notifyTokenChange();
}

/**
 * Re-broadcasts call for an absent token.
 */
export async function recallToken(tokenId: string): Promise<void> {
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();

  if (db && isConfigured) {
    await updateDoc(doc(db, 'tokens', tokenId), {
      calledAt: now,
      updatedAt: now,
    });
    return;
  }

  inMemoryTokens = inMemoryTokens.map((t) =>
    t.tokenId === tokenId ? { ...t, calledAt: now, updatedAt: now } : t
  );
  notifyTokenChange();
}

/**
 * Cancels a token.
 */
export async function cancelToken(tokenId: string, reason?: string): Promise<void> {
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();

  if (db && isConfigured) {
    await updateDoc(doc(db, 'tokens', tokenId), {
      status: TokenStatus.CANCELLED,
      cancelledAt: now,
      notes: reason || null,
      updatedAt: now,
    });
    return;
  }

  inMemoryTokens = inMemoryTokens.map((t) =>
    t.tokenId === tokenId
      ? {
          ...t,
          status: TokenStatus.CANCELLED,
          cancelledAt: now,
          notes: reason || t.notes,
          updatedAt: now,
        }
      : t
  );
  notifyTokenChange();
}

/**
 * Listens to counters in real time.
 */
export function listenCounters(
  institutionId: string,
  branchId: string,
  callback: (counters: Counter[]) => void
): () => void {
  const { db, isConfigured } = getFirebaseServices();

  if (db && isConfigured) {
    const q = query(
      collection(db, 'counters'),
      where('institutionId', '==', institutionId),
      where('branchId', '==', branchId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const counters = snapshot.docs.map((docSnap) => docSnap.data() as Counter);
        callback(counters);
      },
      (err) => {
        console.warn('[QueueLess CounterService] Firestore listener error, falling back:', err);
        callback(inMemoryCounters.filter((c) => c.institutionId === institutionId));
      }
    );
  }

  counterSubscribers.add(callback);
  callback(inMemoryCounters.filter((c) => c.institutionId === institutionId));
  return () => {
    counterSubscribers.delete(callback);
  };
}

/**
 * Updates operational status of a counter (OPEN, PAUSED, CLOSED).
 */
export async function updateCounterStatus(counterId: string, status: CounterStatus): Promise<void> {
  const { db, isConfigured } = getFirebaseServices();
  const now = new Date().toISOString();

  if (db && isConfigured) {
    await updateDoc(doc(db, 'counters', counterId), {
      status,
      updatedAt: now,
    });
    return;
  }

  inMemoryCounters = inMemoryCounters.map((c) =>
    c.counterId === counterId ? { ...c, status, updatedAt: now } : c
  );
  notifyCounterChange();
}
