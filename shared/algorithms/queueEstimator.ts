/**
 * Queue Waiting Time Estimator & Token Priority Sorter
 */

import { QUEUE_DEFAULTS } from '../constants/defaults';
import { TokenPriority, TokenStatus } from '../types/enums';
import { Token } from '../types/models';

export interface QueueEstimationInput {
  tokensAheadCount: number;
  averageServiceDurationMinutes: number;
  activeCountersCount: number;
  priority?: TokenPriority;
}

export interface QueueEstimationResult {
  estimatedWaitMinutes: number;
  estimatedCallTime: string; // ISO 8601
}

/**
 * Calculates estimated waiting time based on active service rate and priority.
 */
export function estimateWaitTime(
  input: QueueEstimationInput,
  referenceDate: Date = new Date()
): QueueEstimationResult {
  const {
    tokensAheadCount,
    averageServiceDurationMinutes,
    activeCountersCount,
    priority = TokenPriority.STANDARD,
  } = input;

  const validCounters = Math.max(1, activeCountersCount);
  const validDuration = Math.max(1, averageServiceDurationMinutes);

  // Baseline queue processing time: (Tokens ahead * duration) / parallel counters
  let baseWaitMinutes = (tokensAheadCount * validDuration) / validCounters;

  // Priority adjustment
  const priorityWeight = QUEUE_DEFAULTS.PRIORITY_WEIGHTS[priority] || QUEUE_DEFAULTS.PRIORITY_WEIGHTS.STANDARD;
  if (priorityWeight > QUEUE_DEFAULTS.PRIORITY_WEIGHTS.STANDARD) {
    // Priority tokens bypass or get serviced faster in scheduling calculations
    const reductionFactor = Math.min(0.6, (priorityWeight - 10) / 100);
    baseWaitMinutes = baseWaitMinutes * (1 - reductionFactor);
  }

  const roundedWaitMinutes = Math.max(0, Math.round(baseWaitMinutes));
  const estimatedCallDate = new Date(referenceDate.getTime() + roundedWaitMinutes * 60 * 1000);

  return {
    estimatedWaitMinutes: roundedWaitMinutes,
    estimatedCallTime: estimatedCallDate.toISOString(),
  };
}

/**
 * Sorts active waiting tokens by priority weight and arrival/issuance timestamp.
 * High priority tokens bubble up, while FIFO is preserved within identical priority tiers.
 */
export function sortQueueTokens(tokens: Token[]): Token[] {
  return [...tokens].sort((a, b) => {
    // 1. First compare priority weights (higher weight comes first)
    const weightA = QUEUE_DEFAULTS.PRIORITY_WEIGHTS[a.priority] || 10;
    const weightB = QUEUE_DEFAULTS.PRIORITY_WEIGHTS[b.priority] || 10;

    if (weightA !== weightB) {
      return weightB - weightA;
    }

    // 2. If priority is identical, sort by check-in time if available, otherwise issued time (FIFO)
    const timeA = new Date(a.checkedInAt || a.issuedAt).getTime();
    const timeB = new Date(b.checkedInAt || b.issuedAt).getTime();

    return timeA - timeB;
  });
}

/**
 * Filters only actively queued tokens (waiting or checked-in).
 */
export function filterWaitingTokens(tokens: Token[]): Token[] {
  return tokens.filter(
    (t) => t.status === TokenStatus.WAITING || t.status === TokenStatus.CHECKED_IN
  );
}
