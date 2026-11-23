/**
 * Smart Slot Allocation Algorithm
 * Responsible for computing optimal arrival windows to prevent lobby congestion
 * and distributing visitor traffic smoothly across service operating hours.
 */

import { QUEUE_DEFAULTS } from '../constants/defaults';
import { TimeSlot } from '../types/api';

export interface SmartSlotInput {
  targetDate: string;           // YYYY-MM-DD
  targetSlotTime: string;       // HH:mm
  serviceDurationMinutes: number;
  currentQueueDepth: number;    // Number of tokens already waiting or scheduled for that window
  activeCountersCount: number;  // Number of counters operating
  bufferMinutes?: number;
}

export interface SmartArrivalWindow {
  recommendedArrivalStart: string; // ISO 8601
  recommendedArrivalEnd: string;   // ISO 8601
  leadTimeMinutes: number;          // How many minutes before scheduled slot visitor should arrive
}

/**
 * Calculates a personalized recommended arrival window.
 * Instead of having 50 people show up at 09:00, visitors are given staggered arrival
 * recommendations based on real-time counter throughput.
 */
export function calculateSmartArrivalSlot(input: SmartSlotInput): SmartArrivalWindow {
  const {
    targetDate,
    targetSlotTime,
    serviceDurationMinutes,
    currentQueueDepth,
    activeCountersCount,
    bufferMinutes = QUEUE_DEFAULTS.SLOT_BUFFER_MINUTES,
  } = input;

  // Base scheduled time in UTC to ensure timezone consistency across environments
  const [hours, minutes] = targetSlotTime.split(':').map(Number);
  const [year, month, day] = targetDate.split('-').map(Number);
  const scheduledDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

  // Dynamic throughput: effective serving rate per minute across all active counters
  const counters = Math.max(1, activeCountersCount);
  const throughputPerMinute = counters / Math.max(1, serviceDurationMinutes);

  // Projected queue backlog delay in minutes
  const backlogMinutes = currentQueueDepth / throughputPerMinute;

  // Dynamic lead time:
  // If queue is moving fast or empty, arrive 10-15 mins early.
  // If heavily backlogged, recommend staggered arrival to avoid physical lobby crowding.
  let leadTimeMinutes = 15;
  if (backlogMinutes > 30) {
    // When backlogged, don't invite visitor 15 mins before theoretical slot if they will wait 45 mins.
    // Shift recommendation closer to realistic service call.
    leadTimeMinutes = 5;
  } else if (backlogMinutes < 5) {
    leadTimeMinutes = 10;
  }

  // Recommended arrival window: [Scheduled - leadTime, Scheduled - leadTime + arrivalWindowSpan]
  const arrivalStart = new Date(scheduledDate.getTime() - leadTimeMinutes * 60 * 1000);
  const arrivalEnd = new Date(arrivalStart.getTime() + (bufferMinutes + 5) * 60 * 1000);

  return {
    recommendedArrivalStart: arrivalStart.toISOString(),
    recommendedArrivalEnd: arrivalEnd.toISOString(),
    leadTimeMinutes,
  };
}

/**
 * Generates discrete time slots for a service over operating hours.
 */
export function generateOperatingSlots(
  openTime: string, // "09:00"
  closeTime: string, // "17:00"
  slotDurationMinutes: number,
  maxCapacityPerSlot: number,
  existingBookingsCountBySlot: Record<string, number> = {}
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  let currentMinutes = openH * 60 + openM;
  const endMinutes = closeH * 60 + closeM;

  while (currentMinutes + slotDurationMinutes <= endMinutes) {
    const slotStartH = Math.floor(currentMinutes / 60);
    const slotStartM = currentMinutes % 60;
    const slotEndMin = currentMinutes + slotDurationMinutes;
    const slotEndH = Math.floor(slotEndMin / 60);
    const slotEndM = slotEndMin % 60;

    const startTimeStr = `${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}`;
    const endTimeStr = `${String(slotEndH).padStart(2, '0')}:${String(slotEndM).padStart(2, '0')}`;

    const booked = existingBookingsCountBySlot[startTimeStr] || 0;
    const available = Math.max(0, maxCapacityPerSlot - booked);

    slots.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
      availableCapacity: available,
      isAvailable: available > 0,
      recommended: available > (maxCapacityPerSlot * 0.4), // Recommend less busy slots
    });

    currentMinutes += slotDurationMinutes;
  }

  return slots;
}
