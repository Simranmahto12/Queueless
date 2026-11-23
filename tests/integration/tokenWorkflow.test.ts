import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import { calculateSmartArrivalSlot } from '../../shared/algorithms/slotAllocation';
import { estimateWaitTime, sortQueueTokens } from '../../shared/algorithms/queueEstimator';
import { calculateZoneOccupancy } from '../../shared/algorithms/occupancyCalculator';
import { encodeQRPayload, decodeAndValidateQRPayload } from '../../shared/services/qrService';
import { TokenStatus, TokenPriority, ZoneOccupancyStatus } from '../../shared/types/enums';
import { Token } from '../../shared/types/models';

describe('End-to-End Token Lifecycle Simulation', () => {
  it('should execute end-to-end booking -> smart slot -> qr generation -> check-in -> occupancy calculation', () => {
    // 1. Visitor requests token for Banking Cash Withdrawal
    const targetDate = '2026-11-25';
    const targetSlotTime = '11:00';
    const currentQueueDepth = 4;
    const activeCounters = 2;
    const avgDuration = 8; // 8 minutes

    // Calculate smart arrival window
    const arrivalSlot = calculateSmartArrivalSlot({
      targetDate,
      targetSlotTime,
      serviceDurationMinutes: avgDuration,
      currentQueueDepth,
      activeCountersCount: activeCounters,
    });
    assert.ok(arrivalSlot.recommendedArrivalStart);

    // Estimate initial wait time
    const waitEstimation = estimateWaitTime({
      tokensAheadCount: currentQueueDepth,
      averageServiceDurationMinutes: avgDuration,
      activeCountersCount: activeCounters,
      priority: TokenPriority.STANDARD,
    });
    assert.strictEqual(waitEstimation.estimatedWaitMinutes, 16); // (4 * 8) / 2 = 16 mins

    // 2. Token issued with cryptographic QR code
    const tokenId = 'TID-SIM-888';
    const qrPayload = encodeQRPayload({
      tokenId,
      tokenNumber: 'TEL-042',
      institutionId: 'BANK-METRO',
      branchId: 'BRANCH-DOWNTOWN',
    });
    assert.ok(qrPayload.length > 0);

    // 3. Visitor arrives at bank and scans QR at entrance kiosk
    const scanResult = decodeAndValidateQRPayload(qrPayload, 'BANK-METRO', 'BRANCH-DOWNTOWN');
    assert.strictEqual(scanResult.isValid, true);
    assert.strictEqual(scanResult.payload?.tokenId, tokenId);

    // 4. Check-in event increments zone occupancy
    const zoneMaxCapacity = 50;
    const previousOccupancy = 29;
    const newOccupancy = previousOccupancy + 1; // 30 visitors

    const occupancyResult = calculateZoneOccupancy(newOccupancy, zoneMaxCapacity);
    assert.strictEqual(occupancyResult.occupancyPercentage, 60); // 30 / 50 = 60%
    assert.strictEqual(occupancyResult.status, ZoneOccupancyStatus.MODERATE);

    // 5. Counter 1 finishes serving and calls next token
    const token: Token = {
      id: tokenId,
      tokenId,
      tokenNumber: 'TEL-042',
      institutionId: 'BANK-METRO',
      branchId: 'BRANCH-DOWNTOWN',
      departmentId: 'DEP-TELLER',
      serviceId: 'SRV-CASH',
      visitorId: 'VISITOR-USER-1',
      visitorName: 'David Miller',
      priority: TokenPriority.STANDARD,
      status: TokenStatus.CHECKED_IN,
      scheduledSlot: { date: targetDate, startTime: targetSlotTime, endTime: '11:15' },
      smartArrivalSlot: arrivalSlot,
      estimatedWaitMinutes: waitEstimation.estimatedWaitMinutes,
      issuedAt: new Date().toISOString(),
      checkedInAt: new Date().toISOString(),
      qrCodeValue: qrPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assert.strictEqual(token.status, TokenStatus.CHECKED_IN);
    // Token is eligible for calling
    token.status = TokenStatus.CALLED;
    token.assignedCounterId = 'CTR-01';
    assert.strictEqual(token.status, TokenStatus.CALLED);
  });
});
