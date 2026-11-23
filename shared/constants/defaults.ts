/**
 * QueueLess Global Operational Defaults
 */

export const QUEUE_DEFAULTS = {
  // Grace period before a CALLED token is marked NO_SHOW (minutes)
  CALLED_GRACE_PERIOD_MINUTES: 10,

  // Default duration for slots when not specified by service
  DEFAULT_SLOT_DURATION_MINUTES: 15,

  // Buffer between consecutive slots to absorb delays (minutes)
  SLOT_BUFFER_MINUTES: 5,

  // Maximum advance booking window in days
  MAX_ADVANCE_BOOKING_DAYS: 14,

  // QR token validity window (minutes before and after arrival slot)
  QR_EARLY_ARRIVAL_WINDOW_MINUTES: 30,
  QR_LATE_ARRIVAL_WINDOW_MINUTES: 45,

  // Priority weights for queue sorting: higher weight = prioritized call
  PRIORITY_WEIGHTS: {
    EMERGENCY: 100,
    PERSON_WITH_DISABILITY: 50,
    PREGNANT: 40,
    SENIOR_CITIZEN: 30,
    VIP: 20,
    STANDARD: 10,
  },

  // Occupancy Threshold Percentages
  OCCUPANCY_THRESHOLDS: {
    NORMAL_MAX: 59,
    MODERATE_MAX: 79,
    ELEVATED_MAX: 94,
    CRITICAL_MAX: 100,
    // Greater than 100 is OVERCROWDED
  },

  // Staffing recommendation sensitivity
  STAFFING_HEURISTICS: {
    MAX_ACCEPTABLE_WAIT_TIME_MINUTES: 25,
    HIGH_QUEUE_DEPTH_PER_COUNTER: 6,
    SURGE_FACTOR_THRESHOLD: 1.3,
  },
} as const;
