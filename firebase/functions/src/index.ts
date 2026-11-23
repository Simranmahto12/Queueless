/**
 * QueueLess Cloud Functions Entrypoint
 * Implements the shared callable API contracts defined in @queueless/shared.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Admin SDK once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 1. createToken
 */
export const createToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to create a token.');
  }

  const {
    institutionId,
    branchId,
    departmentId,
    serviceId,
    visitorName,
    visitorPhone,
    targetDate,
    targetSlotTime,
    priority = 'STANDARD',
    notes,
  } = data;

  if (!institutionId || !branchId || !departmentId || !serviceId || !visitorName || !targetDate) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters for token creation.');
  }

  const tokenRef = db.collection('tokens').doc();
  const tokenId = tokenRef.id;

  // Simple token number generator (e.g. T-XXXX)
  const tokenNumber = `T-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();

  const newToken = {
    tokenId,
    tokenNumber,
    institutionId,
    branchId,
    departmentId,
    serviceId,
    visitorId: context.auth.uid,
    visitorName,
    visitorPhone: visitorPhone || null,
    priority,
    status: 'ISSUED',
    scheduledSlot: {
      date: targetDate,
      startTime: targetSlotTime || '09:00',
      endTime: targetSlotTime ? `${parseInt(targetSlotTime.split(':')[0])}:${parseInt(targetSlotTime.split(':')[1]) + 15}` : '09:15',
    },
    smartArrivalSlot: {
      recommendedArrivalStart: now,
      recommendedArrivalEnd: now,
    },
    estimatedWaitMinutes: 15,
    issuedAt: now,
    qrCodeValue: Buffer.from(`${tokenId}:${institutionId}:${branchId}:${Date.now()}`).toString('base64'),
    notes: notes || null,
    createdAt: now,
    updatedAt: now,
  };

  await tokenRef.set(newToken);

  return {
    success: true,
    data: {
      token: newToken,
      estimatedWaitMinutes: 15,
      qrPayload: newToken.qrCodeValue,
    },
    timestamp: now,
  };
});

/**
 * 2. getToken
 */
export const getToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { tokenId } = data;
  if (!tokenId) {
    throw new functions.https.HttpsError('invalid-argument', 'tokenId is required.');
  }

  const doc = await db.collection('tokens').doc(tokenId).get();
  if (!doc.exists) {
    throw new functions.https.HttpsError('not-found', 'Token not found.');
  }

  const tokenData = doc.data();

  // Query waiting tokens ahead in the same service
  const waitingAheadSnap = await db
    .collection('tokens')
    .where('institutionId', '==', tokenData?.institutionId)
    .where('serviceId', '==', tokenData?.serviceId)
    .where('status', 'in', ['ISSUED', 'WAITING', 'CHECKED_IN'])
    .where('issuedAt', '<', tokenData?.issuedAt)
    .get();

  const totalWaitingAhead = waitingAheadSnap.size;

  return {
    success: true,
    data: {
      token: tokenData,
      currentPositionInQueue: totalWaitingAhead + 1,
      totalWaitingAhead,
      estimatedCallTime: new Date(Date.now() + totalWaitingAhead * 10 * 60000).toISOString(),
    },
    timestamp: new Date().toISOString(),
  };
});

/**
 * 3. getAvailableSlots
 */
export const getAvailableSlots = functions.https.onCall(async (data) => {
  const { date, serviceId } = data;
  if (!date || !serviceId) {
    throw new functions.https.HttpsError('invalid-argument', 'date and serviceId are required.');
  }

  // Basic slot generation mockup conforming to shared contract
  const slots = [
    { startTime: '09:00', endTime: '09:30', availableCapacity: 5, isAvailable: true, recommended: true },
    { startTime: '09:30', endTime: '10:00', availableCapacity: 3, isAvailable: true, recommended: false },
    { startTime: '10:00', endTime: '10:30', availableCapacity: 0, isAvailable: false, recommended: false },
    { startTime: '10:30', endTime: '11:00', availableCapacity: 8, isAvailable: true, recommended: true },
  ];

  return {
    success: true,
    data: {
      date,
      serviceId,
      slots,
      operatingHours: { openTime: '09:00', closeTime: '17:00' },
    },
    timestamp: new Date().toISOString(),
  };
});

/**
 * 4. callNextToken
 */
export const callNextToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Staff authentication required.');
  }

  const { institutionId, branchId, departmentId, counterId, staffId } = data;
  if (!institutionId || !counterId || !staffId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing counter or staff identifiers.');
  }

  // Find next waiting token
  const querySnap = await db
    .collection('tokens')
    .where('institutionId', '==', institutionId)
    .where('departmentId', '==', departmentId)
    .where('status', 'in', ['CHECKED_IN', 'WAITING'])
    .orderBy('issuedAt', 'asc')
    .limit(1)
    .get();

  if (querySnap.empty) {
    return {
      success: true,
      data: {
        token: null,
        counter: { counterId, status: 'OPEN' },
        queueRemainingCount: 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  const nextTokenDoc = querySnap.docs[0];
  const now = new Date().toISOString();

  await nextTokenDoc.ref.update({
    status: 'CALLED',
    assignedCounterId: counterId,
    servedByStaffId: staffId,
    calledAt: now,
    updatedAt: now,
  });

  await db.collection('counters').doc(counterId).update({
    status: 'BUSY',
    currentServedTokenId: nextTokenDoc.id,
    currentStaffId: staffId,
    lastCalledAt: now,
    updatedAt: now,
  });

  return {
    success: true,
    data: {
      token: { ...nextTokenDoc.data(), status: 'CALLED' },
      counter: { counterId, status: 'BUSY' },
      queueRemainingCount: 0,
    },
    timestamp: now,
  };
});

/**
 * 5. updateTokenStatus
 */
export const updateTokenStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { tokenId, newStatus } = data;
  if (!tokenId || !newStatus) {
    throw new functions.https.HttpsError('invalid-argument', 'tokenId and newStatus are required.');
  }

  const tokenRef = db.collection('tokens').doc(tokenId);
  const snap = await tokenRef.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Token not found.');
  }

  const prevStatus = snap.data()?.status;
  const now = new Date().toISOString();

  await tokenRef.update({
    status: newStatus,
    updatedAt: now,
  });

  return {
    success: true,
    data: {
      token: { ...snap.data(), status: newStatus },
      previousStatus: prevStatus,
    },
    timestamp: now,
  };
});

/**
 * 6. cancelToken
 */
export const cancelToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { tokenId, reason } = data;
  const now = new Date().toISOString();

  await db.collection('tokens').doc(tokenId).update({
    status: 'CANCELLED',
    cancelledAt: now,
    cancellationReason: reason || null,
    updatedAt: now,
  });

  return {
    success: true,
    data: { tokenId, status: 'CANCELLED', cancelledAt: now },
    timestamp: now,
  };
});

/**
 * 7. rescheduleToken
 */
export const rescheduleToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { tokenId, newDate, newSlotTime } = data;
  const now = new Date().toISOString();

  await db.collection('tokens').doc(tokenId).update({
    'scheduledSlot.date': newDate,
    'scheduledSlot.startTime': newSlotTime,
    status: 'ISSUED',
    updatedAt: now,
  });

  const updatedDoc = await db.collection('tokens').doc(tokenId).get();

  return {
    success: true,
    data: { token: updatedDoc.data() },
    timestamp: now,
  };
});

/**
 * 8. assignCounter
 */
export const assignCounter = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { counterId, staffId, status } = data;
  const now = new Date().toISOString();

  await db.collection('counters').doc(counterId).update({
    currentStaffId: staffId,
    status,
    updatedAt: now,
  });

  const snap = await db.collection('counters').doc(counterId).get();

  return {
    success: true,
    data: { counter: snap.data() },
    timestamp: now,
  };
});

/**
 * 9. validateQRCode
 */
export const validateQRCode = functions.https.onCall(async (data) => {
  const { qrPayload, institutionId } = data;
  if (!qrPayload) {
    throw new functions.https.HttpsError('invalid-argument', 'qrPayload is required.');
  }

  try {
    const decoded = Buffer.from(qrPayload, 'base64').toString('utf8');
    const [tokenId, payloadInstitutionId] = decoded.split(':');

    if (institutionId && payloadInstitutionId !== institutionId) {
      return {
        success: false,
        data: { isValid: false, message: 'QR belongs to another institution.' },
        timestamp: new Date().toISOString(),
      };
    }

    const doc = await db.collection('tokens').doc(tokenId).get();
    if (!doc.exists) {
      return {
        success: false,
        data: { isValid: false, message: 'Token not found.' },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: { isValid: true, token: doc.data(), message: 'Valid token.' },
      timestamp: new Date().toISOString(),
    };
  } catch (e) {
    return {
      success: false,
      data: { isValid: false, message: 'Invalid QR format.' },
      timestamp: new Date().toISOString(),
    };
  }
});

/**
 * 10. checkInVisitor
 */
export const checkInVisitor = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { tokenId, institutionId, branchId, zoneId, method } = data;
  const now = new Date().toISOString();

  const checkInRef = db.collection('checkIns').doc();
  const checkInData = {
    checkInId: checkInRef.id,
    tokenId,
    institutionId,
    branchId,
    zoneId: zoneId || null,
    visitorId: context.auth.uid,
    checkedInAt: now,
    method: method || 'QR_SCAN_MOBILE',
    isValid: true,
    createdAt: now,
    updatedAt: now,
  };

  await checkInRef.set(checkInData);

  await db.collection('tokens').doc(tokenId).update({
    status: 'CHECKED_IN',
    checkedInAt: now,
    updatedAt: now,
  });

  const tokenDoc = await db.collection('tokens').doc(tokenId).get();

  return {
    success: true,
    data: {
      checkIn: checkInData,
      token: tokenDoc.data(),
    },
    timestamp: now,
  };
});

/**
 * 11. checkOutVisitor
 */
export const checkOutVisitor = functions.https.onCall(async (data) => {
  const { tokenId } = data;
  const now = new Date().toISOString();

  return {
    success: true,
    data: { tokenId, checkedOutAt: now },
    timestamp: now,
  };
});

/**
 * 12. getZoneOccupancy
 */
export const getZoneOccupancy = functions.https.onCall(async (data) => {
  const { institutionId, branchId } = data;
  const snapshot = await db
    .collection('zones')
    .where('institutionId', '==', institutionId)
    .where('branchId', '==', branchId)
    .get();

  const zones = snapshot.docs.map((doc) => {
    const z = doc.data();
    const pct = Math.round((z.currentOccupancy / z.maxCapacity) * 100);
    return {
      zone: z,
      occupancyPercentage: pct,
      status: z.occupancyStatus,
      activeVisitorsCount: z.currentOccupancy,
      availableCapacity: Math.max(0, z.maxCapacity - z.currentOccupancy),
    };
  });

  return {
    success: true,
    data: { branchId, zones, timestamp: new Date().toISOString() },
    timestamp: new Date().toISOString(),
  };
});

/**
 * 13. generateCrowdAlert
 */
export const generateCrowdAlert = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { institutionId, branchId, zoneId, departmentId, type, severity, title, message } = data;
  const now = new Date().toISOString();

  const alertRef = db.collection('alerts').doc();
  const alertData = {
    alertId: alertRef.id,
    institutionId,
    branchId,
    zoneId: zoneId || null,
    departmentId: departmentId || null,
    type,
    severity,
    title,
    message,
    isAcknowledged: false,
    createdAt: now,
    updatedAt: now,
  };

  await alertRef.set(alertData);

  return {
    success: true,
    data: { alert: alertData },
    timestamp: now,
  };
});
