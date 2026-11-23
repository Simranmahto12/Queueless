/**
 * QueueLess Shared Enums
 * Universal definitions across Mobile, Admin Dashboard, and Cloud Functions.
 */

/**
 * System-wide user roles for access control and authorization.
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  BRANCH_ADMIN = 'BRANCH_ADMIN',
  DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER',
  COUNTER_STAFF = 'COUNTER_STAFF',
  SECURITY_STAFF = 'SECURITY_STAFF',
  VISITOR = 'VISITOR',
}

/**
 * Supported multi-sector institution categories.
 */
export enum InstitutionSector {
  HEALTHCARE = 'HEALTHCARE',           // Hospitals, clinics, diagnostic centers
  BANKING = 'BANKING',                 // Retail banks, credit unions, financial services
  EDUCATION = 'EDUCATION',             // Universities, colleges, exam registration centers
  GOVERNMENT = 'GOVERNMENT',           // RTO, passport offices, municipal corporations
  PUBLIC_SERVICES = 'PUBLIC_SERVICES', // Post offices, electricity boards, utilities
  RETAIL_SERVICE = 'RETAIL_SERVICE',   // Customer support centers, repair hubs
  OTHER = 'OTHER',
}

/**
 * Lifecycle status of a queue token.
 */
export enum TokenStatus {
  ISSUED = 'ISSUED',               // Token created, slot assigned, awaiting arrival
  CHECKED_IN = 'CHECKED_IN',       // Visitor arrived and checked in via QR / kiosk
  WAITING = 'WAITING',             // In physical / virtual waiting zone
  CALLED = 'CALLED',               // Summoned to specific counter
  IN_PROGRESS = 'IN_PROGRESS',     // Actively being served at counter
  COMPLETED = 'COMPLETED',         // Service finished successfully
  TRANSFERRED = 'TRANSFERRED',     // Transferred to another department / counter
  NO_SHOW = 'NO_SHOW',             // Failed to show within grace period
  CANCELLED = 'CANCELLED',         // Cancelled by visitor or institution
  EXPIRED = 'EXPIRED',             // Expired without check-in
}

/**
 * Priority tier for queue processing.
 */
export enum TokenPriority {
  STANDARD = 'STANDARD',
  SENIOR_CITIZEN = 'SENIOR_CITIZEN',
  PERSON_WITH_DISABILITY = 'PERSON_WITH_DISABILITY',
  PREGNANT = 'PREGNANT',
  EMERGENCY = 'EMERGENCY',
  VIP = 'VIP',
}

/**
 * Physical counter operational state.
 */
export enum CounterStatus {
  OPEN = 'OPEN',         // Ready to take next token
  BUSY = 'BUSY',         // Currently serving a token
  PAUSED = 'PAUSED',     // Temporarily paused (break / lunch)
  CLOSED = 'CLOSED',     // Closed for the day
  MAINTENANCE = 'MAINTENANCE',
}

/**
 * Real-time crowd density and occupancy status for physical zones.
 */
export enum ZoneOccupancyStatus {
  NORMAL = 'NORMAL',           // < 60% capacity
  MODERATE = 'MODERATE',       // 60% - 79% capacity
  ELEVATED = 'ELEVATED',       // 80% - 94% capacity
  CRITICAL = 'CRITICAL',       // 95% - 100% capacity
  OVERCROWDED = 'OVERCROWDED', // > 100% capacity
}

/**
 * Severity level of automated or manual crowd/operational alerts.
 */
export enum AlertSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Categories of alerts generated across the platform.
 */
export enum AlertType {
  OVERCROWDING = 'OVERCROWDING',
  COUNTER_BOTTLENECK = 'COUNTER_BOTTLENECK',
  LONG_WAIT_TIME = 'LONG_WAIT_TIME',
  STAFF_DEFICIT = 'STAFF_DEFICIT',
  UNAUTHORIZED_ZONE = 'UNAUTHORIZED_ZONE',
  EMERGENCY_EVACUATION = 'EMERGENCY_EVACUATION',
  SYSTEM_ANOMALY = 'SYSTEM_ANOMALY',
}

/**
 * Visitor check-in method.
 */
export enum CheckInMethod {
  QR_SCAN_MOBILE = 'QR_SCAN_MOBILE',
  QR_SCAN_KIOSK = 'QR_SCAN_KIOSK',
  MANUAL_STAFF = 'MANUAL_STAFF',
  GEOFENCE = 'GEOFENCE',
}

/**
 * Status of appointment / scheduled booking.
 */
export enum BookingStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
  FULFILLED = 'FULFILLED',
}

/**
 * Audit log event categories.
 */
export enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  TOKEN_CREATED = 'TOKEN_CREATED',
  TOKEN_STATUS_CHANGE = 'TOKEN_STATUS_CHANGE',
  COUNTER_ASSIGNED = 'COUNTER_ASSIGNED',
  COUNTER_STATUS_CHANGE = 'COUNTER_STATUS_CHANGE',
  ZONE_THRESHOLD_BREACH = 'ZONE_THRESHOLD_BREACH',
  STAFF_OVERRIDE = 'STAFF_OVERRIDE',
  SYSTEM_CONFIG_UPDATED = 'SYSTEM_CONFIG_UPDATED',
}
