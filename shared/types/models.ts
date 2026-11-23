/**
 * QueueLess Shared Domain Models
 * Canonical TypeScript interfaces for Firestore documents and state management.
 */

import {
  UserRole,
  InstitutionSector,
  TokenStatus,
  TokenPriority,
  CounterStatus,
  ZoneOccupancyStatus,
  AlertSeverity,
  AlertType,
  CheckInMethod,
  AuditAction,
} from './enums';

/**
 * Base document metadata with ISO 8601 string timestamps for cross-platform portability.
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User account representation across visitor and institution roles.
 */
export interface User extends BaseEntity {
  userId: string;
  email: string;
  phone?: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  isAnonymous?: boolean;
  institutionId?: string; // Nullable for VISITOR role
  branchId?: string;      // Applicable for staff bound to specific branch
  assignedCounterId?: string; // If counter staff is logged in at a counter
  isActive: boolean;
  preferences?: {
    notificationsEnabled: boolean;
    smsAlertsEnabled: boolean;
    preferredLanguage: string;
  };
}

/**
 * Top-level institution entity (multi-tenant root).
 * Multi-sector: Sector defines presets while allowing dynamic customization.
 */
export interface Institution extends BaseEntity {
  institutionId: string;
  name: string;
  slug: string;
  sector: InstitutionSector;
  logoUrl?: string;
  description?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  operatingHours: OperatingHours;
  settings: InstitutionSettings;
  isActive: boolean;
}

export interface OperatingHours {
  timezone: string;
  weeklySchedule: {
    [dayOfWeek: string]: { // 'monday', 'tuesday', etc.
      isOpen: boolean;
      openTime: string;  // HH:mm (24-hour)
      closeTime: string; // HH:mm (24-hour)
    };
  };
}

export interface InstitutionSettings {
  maxAdvanceBookingDays: number;
  allowWalkIns: boolean;
  requireQRCheckIn: boolean;
  autoCallNextToken: boolean;
  defaultSlotDurationMinutes: number;
  gracePeriodMinutes: number;
  overcrowdingAlertThresholdPercent: number; // e.g., 85
}

/**
 * Branch/Location belonging to an institution.
 */
export interface Branch extends BaseEntity {
  branchId: string;
  institutionId: string;
  name: string;
  code: string; // Unique within institution, e.g. "MAIN", "NORTH-01"
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  contactPhone?: string;
  operatingHours?: OperatingHours;
  isActive: boolean;
}

/**
 * Department within a branch (e.g., Cardiology, Cashier, Registrar, Accounts).
 */
export interface Department extends BaseEntity {
  departmentId: string;
  institutionId: string;
  branchId: string;
  name: string;
  code: string; // e.g., "DEP-CARDIO", "DEP-TELLER"
  description?: string;
  floor?: string;
  isActive: boolean;
}

/**
 * Service offered by a department (e.g., Blood Test, Account Opening, Fee Payment).
 */
export interface Service extends BaseEntity {
  serviceId: string;
  institutionId: string;
  branchId: string;
  departmentId: string;
  name: string;
  code: string; // e.g., "SRV-ACC-OPEN"
  description?: string;
  estimatedDurationMinutes: number;
  bufferMinutes: number;
  requiredDocuments?: string[];
  requiresAppointment: boolean;
  allowWalkIn: boolean;
  maxDailyCapacity?: number;
  isActive: boolean;
}

/**
 * Physical or virtual service counter/window.
 */
export interface Counter extends BaseEntity {
  counterId: string;
  institutionId: string;
  branchId: string;
  departmentId: string;
  counterNumber: string; // e.g. "Counter 04", "Window B"
  currentStaffId?: string;
  supportedServiceIds: string[]; // Services this counter is capable of serving
  status: CounterStatus;
  currentServedTokenId?: string;
  lastCalledAt?: string;
  isActive: boolean;
}

/**
 * Staff profile and assigned duties.
 */
export interface Staff extends BaseEntity {
  staffId: string;
  userId: string;
  institutionId: string;
  branchId: string;
  departmentId: string;
  employeeCode: string;
  role: UserRole;
  assignedCounterId?: string;
  skills: string[]; // List of serviceIds staff can handle
  isAvailable: boolean;
}

/**
 * Digital Queue Token representing a visitor's request for service.
 */
export interface Token extends BaseEntity {
  tokenId: string;
  tokenNumber: string; // Human-readable, e.g. "A-104", "REG-023"
  institutionId: string;
  branchId: string;
  departmentId: string;
  serviceId: string;
  visitorId: string;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  priority: TokenPriority;
  status: TokenStatus;

  // Scheduling & Timing
  scheduledSlot: {
    date: string;          // YYYY-MM-DD
    startTime: string;     // HH:mm
    endTime: string;       // HH:mm
  };
  smartArrivalSlot: {
    recommendedArrivalStart: string; // ISO 8601
    recommendedArrivalEnd: string;   // ISO 8601
  };
  estimatedWaitMinutes: number;
  estimatedCallTime?: string; // ISO 8601

  // Lifecycle Timestamps
  issuedAt: string;
  checkedInAt?: string;
  calledAt?: string;
  serviceStartedAt?: string;
  serviceCompletedAt?: string;
  cancelledAt?: string;

  // Counter & Staff details
  assignedCounterId?: string;
  assignedCounterNumber?: string;
  servedByStaffId?: string;

  // Verification & Geofence
  qrCodeValue: string; // Cryptographic or unique payload for scan
  checkInMethod?: CheckInMethod;
  notes?: string;
}

/**
 * Physical zone/waiting area within a branch for crowd & occupancy monitoring.
 */
export interface Zone extends BaseEntity {
  zoneId: string;
  institutionId: string;
  branchId: string;
  name: string; // e.g., "Main Waiting Hall", "Ground Floor Teller Area"
  maxCapacity: number;
  safeCapacity: number; // e.g. 80% of max
  currentOccupancy: number;
  occupancyStatus: ZoneOccupancyStatus;
  floor?: string;
  monitoredBySensorOrCamera: boolean;
  associatedDepartmentIds: string[];
}

/**
 * Check-in record created when a visitor arrives physically at the institution/zone.
 */
export interface CheckIn extends BaseEntity {
  checkInId: string;
  tokenId: string;
  institutionId: string;
  branchId: string;
  zoneId?: string;
  visitorId: string;
  checkedInAt: string;
  checkedOutAt?: string;
  method: CheckInMethod;
  verifiedByStaffId?: string;
  qrPayloadScanned?: string;
  isValid: boolean;
}

/**
 * Real-time operational or crowd density alert.
 */
export interface Alert extends BaseEntity {
  alertId: string;
  institutionId: string;
  branchId: string;
  zoneId?: string;
  departmentId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  isAcknowledged: boolean;
  acknowledgedByStaffId?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

/**
 * Immutable audit log record for security, compliance, and dispute resolution.
 */
export interface AuditLog extends BaseEntity {
  logId: string;
  institutionId: string;
  branchId?: string;
  action: AuditAction;
  performedByUserId: string;
  performedByRole: UserRole;
  targetEntity: string; // e.g., "TOKEN", "COUNTER", "ZONE"
  targetEntityId: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  details?: string;
}
