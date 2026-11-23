/**
 * Crowd Occupancy & Heatmap Calculator
 */

import { QUEUE_DEFAULTS } from '../constants/defaults';
import { ZoneOccupancyStatus, AlertSeverity } from '../types/enums';

export interface OccupancyResult {
  occupancyPercentage: number;
  status: ZoneOccupancyStatus;
  isOvercrowded: boolean;
  severity: AlertSeverity;
}

/**
 * Computes occupancy percentage and corresponding status for a physical zone.
 */
export function calculateZoneOccupancy(
  currentOccupancy: number,
  maxCapacity: number
): OccupancyResult {
  const safeCapacity = Math.max(1, maxCapacity);
  const occupancyPercentage = Math.round((Math.max(0, currentOccupancy) / safeCapacity) * 100);

  let status: ZoneOccupancyStatus = ZoneOccupancyStatus.NORMAL;
  let severity: AlertSeverity = AlertSeverity.INFO;
  let isOvercrowded = false;

  if (occupancyPercentage > 100) {
    status = ZoneOccupancyStatus.OVERCROWDED;
    severity = AlertSeverity.CRITICAL;
    isOvercrowded = true;
  } else if (occupancyPercentage >= 95) {
    status = ZoneOccupancyStatus.CRITICAL;
    severity = AlertSeverity.HIGH;
    isOvercrowded = true;
  } else if (occupancyPercentage >= 80) {
    status = ZoneOccupancyStatus.ELEVATED;
    severity = AlertSeverity.MEDIUM;
  } else if (occupancyPercentage >= 60) {
    status = ZoneOccupancyStatus.MODERATE;
    severity = AlertSeverity.LOW;
  } else {
    status = ZoneOccupancyStatus.NORMAL;
    severity = AlertSeverity.INFO;
  }

  return {
    occupancyPercentage,
    status,
    isOvercrowded,
    severity,
  };
}

/**
 * Checks whether an overcrowding alert should be triggered based on institution threshold.
 */
export function shouldTriggerOvercrowdingAlert(
  currentOccupancy: number,
  maxCapacity: number,
  customThresholdPercent: number = 85
): boolean {
  if (maxCapacity <= 0) return false;
  const percentage = (currentOccupancy / maxCapacity) * 100;
  return percentage >= customThresholdPercent;
}
