import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import { recommendStaffing } from '../../shared/algorithms/staffingRecommender';

describe('Staffing Recommendation Algorithm', () => {
  it('should recommend opening counters when wait time exceeds SLA', () => {
    const result = recommendStaffing({
      waitingTokensCount: 20,
      activeCountersCount: 2,
      averageServiceDurationMinutes: 10,
      targetMaxWaitTimeMinutes: 25,
    });

    // Current wait = 20 * 10 / 2 = 100 mins.
    // Target wait = 25 mins => needed = 20 * 10 / 25 = 8 counters.
    assert.strictEqual(result.actionNeeded, 'OPEN_COUNTERS');
    assert.strictEqual(result.recommendedActiveCounters, 8);
    assert.strictEqual(result.countersDelta, 6);
  });

  it('should maintain staffing when queue is within tolerance', () => {
    const result = recommendStaffing({
      waitingTokensCount: 4,
      activeCountersCount: 2,
      averageServiceDurationMinutes: 10,
      targetMaxWaitTimeMinutes: 25,
    });

    // Current wait = 4 * 10 / 2 = 20 mins (< 25 min SLA)
    assert.strictEqual(result.actionNeeded, 'MAINTAIN');
  });
});
