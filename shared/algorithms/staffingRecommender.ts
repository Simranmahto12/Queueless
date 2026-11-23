/**
 * Smart Staffing Recommendations Algorithm
 * Analyzes real-time queue backlogs, average service durations, and active counters
 * to advise institution managers on counter opening/closing and staff reallocation.
 */

import { QUEUE_DEFAULTS } from '../constants/defaults';

export interface StaffingRecommendationInput {
  waitingTokensCount: number;
  activeCountersCount: number;
  averageServiceDurationMinutes: number;
  targetMaxWaitTimeMinutes?: number;
}

export interface StaffingRecommendation {
  currentEstimatedWaitMinutes: number;
  targetWaitMinutes: number;
  currentActiveCounters: number;
  recommendedActiveCounters: number;
  countersDelta: number; // positive = need more counters, negative = surplus capacity
  actionNeeded: 'OPEN_COUNTERS' | 'MAINTAIN' | 'SCALE_DOWN';
  reason: string;
}

export function recommendStaffing(
  input: StaffingRecommendationInput
): StaffingRecommendation {
  const {
    waitingTokensCount,
    activeCountersCount,
    averageServiceDurationMinutes,
    targetMaxWaitTimeMinutes = QUEUE_DEFAULTS.STAFFING_HEURISTICS.MAX_ACCEPTABLE_WAIT_TIME_MINUTES,
  } = input;

  const currentCounters = Math.max(1, activeCountersCount);
  const avgDuration = Math.max(1, averageServiceDurationMinutes);

  // Current wait time: (tokens * avgDuration) / counters
  const currentWaitMinutes = Math.round((waitingTokensCount * avgDuration) / currentCounters);

  // Counters needed to achieve targetMaxWaitTime:
  // targetWait = (tokens * avgDuration) / neededCounters
  // neededCounters = (tokens * avgDuration) / targetWait
  const exactCountersNeeded = (waitingTokensCount * avgDuration) / Math.max(1, targetMaxWaitTimeMinutes);
  const recommendedCounters = Math.max(1, Math.ceil(exactCountersNeeded));

  const delta = recommendedCounters - currentCounters;

  let actionNeeded: 'OPEN_COUNTERS' | 'MAINTAIN' | 'SCALE_DOWN' = 'MAINTAIN';
  let reason = 'Current staffing level is adequate to meet wait-time SLAs.';

  if (delta > 0) {
    actionNeeded = 'OPEN_COUNTERS';
    reason = `Queue wait time (${currentWaitMinutes} mins) exceeds target SLA (${targetMaxWaitTimeMinutes} mins). Recommend opening ${delta} additional counter(s).`;
  } else if (delta < -1 && waitingTokensCount === 0) {
    actionNeeded = 'SCALE_DOWN';
    reason = `Queue is clear with idle counters. Staff can be reassigned to other departments or breaks.`;
  }

  return {
    currentEstimatedWaitMinutes: currentWaitMinutes,
    targetWaitMinutes: targetMaxWaitTimeMinutes,
    currentActiveCounters: currentCounters,
    recommendedActiveCounters: recommendedCounters,
    countersDelta: delta,
    actionNeeded,
    reason,
  };
}
