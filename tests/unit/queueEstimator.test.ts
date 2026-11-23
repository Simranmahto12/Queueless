import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import { estimateWaitTime, sortQueueTokens } from '../../shared/algorithms/queueEstimator';
import { TokenPriority, TokenStatus } from '../../shared/types/enums';
import { Token } from '../../shared/types/models';

describe('Queue Estimator & Priority Sorter', () => {
  it('should calculate expected wait time based on tokens ahead and active counters', () => {
    const refDate = new Date('2026-11-25T10:00:00.000Z');
    const result = estimateWaitTime({
      tokensAheadCount: 6,
      averageServiceDurationMinutes: 10,
      activeCountersCount: 2,
      priority: TokenPriority.STANDARD,
    }, refDate);

    // 6 * 10 / 2 = 30 minutes
    assert.strictEqual(result.estimatedWaitMinutes, 30);
    assert.strictEqual(result.estimatedCallTime, '2026-11-25T10:30:00.000Z');
  });

  it('should reduce wait time estimate for higher priority categories', () => {
    const refDate = new Date('2026-11-25T10:00:00.000Z');
    const standardResult = estimateWaitTime({
      tokensAheadCount: 10,
      averageServiceDurationMinutes: 10,
      activeCountersCount: 1,
      priority: TokenPriority.STANDARD,
    }, refDate);

    const emergencyResult = estimateWaitTime({
      tokensAheadCount: 10,
      averageServiceDurationMinutes: 10,
      activeCountersCount: 1,
      priority: TokenPriority.EMERGENCY,
    }, refDate);

    assert.ok(emergencyResult.estimatedWaitMinutes < standardResult.estimatedWaitMinutes);
  });

  it('should prioritize emergency tokens before standard tokens while maintaining FIFO for equal priorities', () => {
    const mockTokens: Token[] = [
      {
        id: '1',
        tokenId: '1',
        tokenNumber: 'STD-1',
        institutionId: 'inst-1',
        branchId: 'b-1',
        departmentId: 'd-1',
        serviceId: 's-1',
        visitorId: 'u-1',
        visitorName: 'Alice',
        priority: TokenPriority.STANDARD,
        status: TokenStatus.WAITING,
        scheduledSlot: { date: '2026-11-25', startTime: '10:00', endTime: '10:15' },
        smartArrivalSlot: { recommendedArrivalStart: '', recommendedArrivalEnd: '' },
        estimatedWaitMinutes: 10,
        issuedAt: '2026-11-25T10:00:00Z',
        qrCodeValue: '',
        createdAt: '2026-11-25T10:00:00Z',
        updatedAt: '2026-11-25T10:00:00Z',
      },
      {
        id: '2',
        tokenId: '2',
        tokenNumber: 'EMG-1',
        institutionId: 'inst-1',
        branchId: 'b-1',
        departmentId: 'd-1',
        serviceId: 's-1',
        visitorId: 'u-2',
        visitorName: 'Bob',
        priority: TokenPriority.EMERGENCY,
        status: TokenStatus.WAITING,
        scheduledSlot: { date: '2026-11-25', startTime: '10:05', endTime: '10:20' },
        smartArrivalSlot: { recommendedArrivalStart: '', recommendedArrivalEnd: '' },
        estimatedWaitMinutes: 5,
        issuedAt: '2026-11-25T10:05:00Z',
        qrCodeValue: '',
        createdAt: '2026-11-25T10:05:00Z',
        updatedAt: '2026-11-25T10:05:00Z',
      },
      {
        id: '3',
        tokenId: '3',
        tokenNumber: 'STD-2',
        institutionId: 'inst-1',
        branchId: 'b-1',
        departmentId: 'd-1',
        serviceId: 's-1',
        visitorId: 'u-3',
        visitorName: 'Charlie',
        priority: TokenPriority.STANDARD,
        status: TokenStatus.WAITING,
        scheduledSlot: { date: '2026-11-25', startTime: '10:02', endTime: '10:17' },
        smartArrivalSlot: { recommendedArrivalStart: '', recommendedArrivalEnd: '' },
        estimatedWaitMinutes: 15,
        issuedAt: '2026-11-25T10:02:00Z',
        qrCodeValue: '',
        createdAt: '2026-11-25T10:02:00Z',
        updatedAt: '2026-11-25T10:02:00Z',
      },
    ];

    const sorted = sortQueueTokens(mockTokens);
    assert.strictEqual(sorted[0].tokenNumber, 'EMG-1'); // Priority first
    assert.strictEqual(sorted[1].tokenNumber, 'STD-1'); // Earlier issued
    assert.strictEqual(sorted[2].tokenNumber, 'STD-2'); // Later issued
  });
});
