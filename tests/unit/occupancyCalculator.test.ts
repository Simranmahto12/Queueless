import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import { calculateZoneOccupancy, shouldTriggerOvercrowdingAlert } from '../../shared/algorithms/occupancyCalculator';
import { ZoneOccupancyStatus } from '../../shared/types/enums';

describe('Occupancy & Heatmap Calculator', () => {
  it('should categorize NORMAL status when below 60%', () => {
    const res = calculateZoneOccupancy(50, 100);
    assert.strictEqual(res.occupancyPercentage, 50);
    assert.strictEqual(res.status, ZoneOccupancyStatus.NORMAL);
    assert.strictEqual(res.isOvercrowded, false);
  });

  it('should categorize MODERATE status between 60% and 79%', () => {
    const res = calculateZoneOccupancy(70, 100);
    assert.strictEqual(res.occupancyPercentage, 70);
    assert.strictEqual(res.status, ZoneOccupancyStatus.MODERATE);
  });

  it('should categorize ELEVATED status between 80% and 94%', () => {
    const res = calculateZoneOccupancy(85, 100);
    assert.strictEqual(res.occupancyPercentage, 85);
    assert.strictEqual(res.status, ZoneOccupancyStatus.ELEVATED);
  });

  it('should categorize OVERCROWDED when exceeding 100%', () => {
    const res = calculateZoneOccupancy(110, 100);
    assert.strictEqual(res.occupancyPercentage, 110);
    assert.strictEqual(res.status, ZoneOccupancyStatus.OVERCROWDED);
    assert.strictEqual(res.isOvercrowded, true);
  });

  it('should trigger alert at or above custom threshold', () => {
    assert.strictEqual(shouldTriggerOvercrowdingAlert(86, 100, 85), true);
    assert.strictEqual(shouldTriggerOvercrowdingAlert(84, 100, 85), false);
  });
});
