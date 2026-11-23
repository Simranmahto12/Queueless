/**
 * QueueLess Shared API Contracts
 * Explicit request/response types and authorization specifications for all core backend operations.
 */

import {
  TokenPriority,
  TokenStatus,
  CounterStatus,
  ZoneOccupancyStatus,
  AlertSeverity,
  AlertType,
  CheckInMethod,
} from './enums';
import {
  Token,
  Counter,
  Zone,
  CheckIn,
  Alert,
} from './models';

/**
 * Standard API Result wrapper for uniform error handling across all clients.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export enum ApiErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  SLOT_UNAVAILABLE = 'SLOT_UNAVAILABLE',
  COUNTER_CLOSED = 'COUNTER_CLOSED',
  INVALID_QR_CODE = 'INVALID_QR_CODE',
  TOKEN_ALREADY_SERVED = 'TOKEN_ALREADY_SERVED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  OVER_CAPACITY = 'OVER_CAPACITY',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// -------------------------------------------------------------
// 1. createToken
// -------------------------------------------------------------
export interface CreateTokenRequest {
  institutionId: string;
  branchId: string;
  departmentId: string;
  serviceId: string;
  visitorId?: string; // If authenticated; or created anonymously
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  priority?: TokenPriority;
  targetDate: string; // YYYY-MM-DD
  targetSlotTime?: string; // HH:mm (optional, for advance booking vs walk-in)
  notes?: string;
}

export interface CreateTokenResponse {
  token: Token;
  estimatedWaitMinutes: number;
  qrPayload: string;
}

// -------------------------------------------------------------
// 2. getToken
// -------------------------------------------------------------
export interface GetTokenRequest {
  tokenId: string;
  institutionId?: string;
}

export interface GetTokenResponse {
  token: Token;
  currentPositionInQueue: number;
  totalWaitingAhead: number;
  estimatedCallTime: string;
}

// -------------------------------------------------------------
// 3. getAvailableSlots
// -------------------------------------------------------------
export interface GetAvailableSlotsRequest {
  institutionId: string;
  branchId: string;
  departmentId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
}

export interface TimeSlot {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  availableCapacity: number;
  isAvailable: boolean;
  recommended: boolean; // Flagged by smart slot algorithm to balance crowd
}

export interface GetAvailableSlotsResponse {
  date: string;
  serviceId: string;
  slots: TimeSlot[];
  operatingHours: {
    openTime: string;
    closeTime: string;
  };
}

// -------------------------------------------------------------
// 4. callNextToken
// -------------------------------------------------------------
export interface CallNextTokenRequest {
  institutionId: string;
  branchId: string;
  departmentId: string;
  counterId: string;
  staffId: string;
  serviceIdsFilter?: string[];
}

export interface CallNextTokenResponse {
  token: Token | null; // Null if no tokens waiting
  counter: Counter;
  queueRemainingCount: number;
}

// -------------------------------------------------------------
// 5. updateTokenStatus
// -------------------------------------------------------------
export interface UpdateTokenStatusRequest {
  tokenId: string;
  institutionId: string;
  newStatus: TokenStatus;
  staffId?: string;
  counterId?: string;
  cancellationReason?: string;
  transferDepartmentId?: string;
  transferServiceId?: string;
}

export interface UpdateTokenStatusResponse {
  token: Token;
  previousStatus: TokenStatus;
}

// -------------------------------------------------------------
// 6. cancelToken
// -------------------------------------------------------------
export interface CancelTokenRequest {
  tokenId: string;
  institutionId: string;
  visitorId?: string;
  reason?: string;
}

export interface CancelTokenResponse {
  tokenId: string;
  status: TokenStatus;
  cancelledAt: string;
}

// -------------------------------------------------------------
// 7. rescheduleToken
// -------------------------------------------------------------
export interface RescheduleTokenRequest {
  tokenId: string;
  institutionId: string;
  visitorId?: string;
  newDate: string; // YYYY-MM-DD
  newSlotTime: string; // HH:mm
}

export interface RescheduleTokenResponse {
  token: Token;
}

// -------------------------------------------------------------
// 8. assignCounter
// -------------------------------------------------------------
export interface AssignCounterRequest {
  counterId: string;
  institutionId: string;
  branchId: string;
  staffId: string;
  status: CounterStatus;
}

export interface AssignCounterResponse {
  counter: Counter;
}

// -------------------------------------------------------------
// 9. validateQRCode
// -------------------------------------------------------------
export interface ValidateQRCodeRequest {
  qrPayload: string;
  institutionId: string;
  branchId: string;
  zoneId?: string;
}

export interface ValidateQRCodeResponse {
  isValid: boolean;
  token?: Token;
  message: string;
}

// -------------------------------------------------------------
// 10. checkInVisitor
// -------------------------------------------------------------
export interface CheckInVisitorRequest {
  tokenId: string;
  institutionId: string;
  branchId: string;
  zoneId?: string;
  method: CheckInMethod;
  qrPayload?: string;
  verifiedByStaffId?: string;
}

export interface CheckInVisitorResponse {
  checkIn: CheckIn;
  token: Token;
  zoneOccupancyStatus?: ZoneOccupancyStatus;
}

// -------------------------------------------------------------
// 11. checkOutVisitor
// -------------------------------------------------------------
export interface CheckOutVisitorRequest {
  tokenId: string;
  institutionId: string;
  branchId: string;
  zoneId?: string;
}

export interface CheckOutVisitorResponse {
  tokenId: string;
  checkedOutAt: string;
  zoneOccupancyStatus?: ZoneOccupancyStatus;
}

// -------------------------------------------------------------
// 12. getZoneOccupancy
// -------------------------------------------------------------
export interface GetZoneOccupancyRequest {
  institutionId: string;
  branchId: string;
  zoneId?: string; // Optional: if omitted, retrieves all zones for branch
}

export interface ZoneOccupancyDetails {
  zone: Zone;
  occupancyPercentage: number;
  status: ZoneOccupancyStatus;
  activeVisitorsCount: number;
  availableCapacity: number;
}

export interface GetZoneOccupancyResponse {
  branchId: string;
  zones: ZoneOccupancyDetails[];
  timestamp: string;
}

// -------------------------------------------------------------
// 13. generateCrowdAlert
// -------------------------------------------------------------
export interface GenerateCrowdAlertRequest {
  institutionId: string;
  branchId: string;
  zoneId?: string;
  departmentId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateCrowdAlertResponse {
  alert: Alert;
}
