import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import { calculateSmartArrivalSlot, generateOperatingSlots } from '../../shared/algorithms/slotAllocation';

describe('Smart Slot Allocation Algorithms', () => {
  it('should generate arrival window earlier than scheduled slot for normal queues', () => {
    const input = {
      targetDate: '2026-11-25',
      targetSlotTime: '10:00',
      serviceDurationMinutes: 15,
      currentQueueDepth: 3,
      activeCountersCount: 2,
    };

    const result = calculateSmartArrivalSlot(input);
    assert.strictEqual(result.leadTimeMinutes, 15);
    assert.ok(result.recommendedArrivalStart.includes('09:45:00'));
  });

  it('should adjust lead time when queue is heavily backlogged to avoid lobby overcrowding', () => {
    const input = {
      targetDate: '2026-11-25',
      targetSlotTime: '10:00',
      serviceDurationMinutes: 20,
      currentQueueDepth: 12, // 12 * 20 / 1 = 240 mins backlog
      activeCountersCount: 1,
    };

    const result = calculateSmartArrivalSlot(input);
    assert.strictEqual(result.leadTimeMinutes, 5);
    assert.ok(result.recommendedArrivalStart.includes('09:55:00'));
  });

  it('should generate discrete time slots covering operating hours', () => {
    const slots = generateOperatingSlots('09:00', '11:00', 30, 4, { '09:00': 4 });
    
    assert.strictEqual(slots.length, 4); // 09:00, 09:30, 10:00, 10:30
    assert.strictEqual(slots[0].startTime, '09:00');
    assert.strictEqual(slots[0].isAvailable, false); // 4 out of 4 booked
    assert.strictEqual(slots[1].startTime, '09:30');
    assert.strictEqual(slots[1].isAvailable, true); // 0 booked
  });
});
