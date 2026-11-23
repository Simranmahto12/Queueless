# QueueLess API Contract Specification

**Document Version:** 1.0.0  
**Transport:** Firebase Callable Cloud Functions (`httpsCallable`) & Firestore Real-Time Listeners  
**TypeScript Reference:** `shared/types/api.ts`  

---

## 1. Authentication & Common Error Codes

All callable backend endpoints require an authenticated Firebase user context (`request.auth`). If `request.auth` is null, the function immediately terminates with `UNAUTHENTICATED`.

### Standard API Response Wrapper
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
  timestamp: string; // ISO 8601
}
```

### Universal Error Codes
- `UNAUTHENTICATED`: Missing or expired auth token.
- `UNAUTHORIZED`: Caller does not hold the required role for the target institution.
- `NOT_FOUND`: Target document does not exist.
- `INVALID_ARGUMENT`: Payload failed validation.
- `ALREADY_EXISTS`: Duplicate resource detected.
- `SLOT_UNAVAILABLE`: Selected booking slot is full.
- `COUNTER_CLOSED`: Attempted to call a token to a paused or closed counter.
- `INVALID_QR_CODE`: QR verification failed or expired.
- `OVER_CAPACITY`: Zone or queue capacity breached.
- `INTERNAL_ERROR`: Unexpected backend exception.

---

## 2. Endpoint Specifications

### 2.1 `createToken`
Issues a new digital queue token for a visitor.
- **Callable Name:** `createToken`
- **Authorization:** `VISITOR`, `INSTITUTION_ADMIN`, `BRANCH_ADMIN`, `COUNTER_STAFF`
- **Request Parameters:**
  ```typescript
  interface CreateTokenRequest {
    institutionId: string;
    branchId: string;
    departmentId: string;
    serviceId: string;
    visitorId?: string;
    visitorName: string;
    visitorPhone?: string;
    visitorEmail?: string;
    priority?: TokenPriority;
    targetDate: string; // 'YYYY-MM-DD'
    targetSlotTime?: string; // 'HH:mm'
    notes?: string;
  }
  ```
- **Response:**
  ```typescript
  interface CreateTokenResponse {
    token: Token;
    estimatedWaitMinutes: number;
    qrPayload: string;
  }
  ```

---

### 2.2 `getToken`
Fetches current status, position ahead, and real-time waiting estimate for a token.
- **Callable Name:** `getToken`
- **Authorization:** Any authenticated user owning the token or institution staff.
- **Request Parameters:** `{ tokenId: string, institutionId?: string }`
- **Response:**
  ```typescript
  interface GetTokenResponse {
    token: Token;
    currentPositionInQueue: number;
    totalWaitingAhead: number;
    estimatedCallTime: string; // ISO 8601
  }
  ```

---

### 2.3 `getAvailableSlots`
Retrieves time slots with available capacity and smart recommendations for a specific service and date.
- **Callable Name:** `getAvailableSlots`
- **Authorization:** Public / Authenticated.
- **Request Parameters:** `{ institutionId: string, branchId: string, departmentId: string, serviceId: string, date: string }`
- **Response:**
  ```typescript
  interface GetAvailableSlotsResponse {
    date: string;
    serviceId: string;
    slots: TimeSlot[];
    operatingHours: { openTime: string; closeTime: string };
  }
  ```

---

### 2.4 `callNextToken`
Summons the next highest priority waiting token to a service counter.
- **Callable Name:** `callNextToken`
- **Authorization:** `COUNTER_STAFF`, `DEPARTMENT_MANAGER`, `BRANCH_ADMIN`, `INSTITUTION_ADMIN`
- **Request Parameters:**
  ```typescript
  interface CallNextTokenRequest {
    institutionId: string;
    branchId: string;
    departmentId: string;
    counterId: string;
    staffId: string;
    serviceIdsFilter?: string[];
  }
  ```
- **Response:**
  ```typescript
  interface CallNextTokenResponse {
    token: Token | null;
    counter: Counter;
    queueRemainingCount: number;
  }
  ```

---

### 2.5 `updateTokenStatus`
Transitions token lifecycle (e.g. `IN_PROGRESS`, `COMPLETED`, `NO_SHOW`, `TRANSFERRED`).
- **Callable Name:** `updateTokenStatus`
- **Authorization:** `COUNTER_STAFF`, `DEPARTMENT_MANAGER`, `BRANCH_ADMIN`
- **Request Parameters:**
  ```typescript
  interface UpdateTokenStatusRequest {
    tokenId: string;
    institutionId: string;
    newStatus: TokenStatus;
    staffId?: string;
    counterId?: string;
    cancellationReason?: string;
    transferDepartmentId?: string;
    transferServiceId?: string;
  }
  ```
- **Response:** `{ token: Token, previousStatus: TokenStatus }`

---

### 2.6 `cancelToken`
Allows a visitor or staff to cancel an unserved token.
- **Callable Name:** `cancelToken`
- **Authorization:** Token Owner or Institution Staff.
- **Request Parameters:** `{ tokenId: string, institutionId: string, visitorId?: string, reason?: string }`
- **Response:** `{ tokenId: string, status: TokenStatus, cancelledAt: string }`

---

### 2.7 `rescheduleToken`
Allows moving an appointment token to an alternate slot or date.
- **Callable Name:** `rescheduleToken`
- **Authorization:** Token Owner or Institution Staff.
- **Request Parameters:** `{ tokenId: string, institutionId: string, visitorId?: string, newDate: string, newSlotTime: string }`
- **Response:** `{ token: Token }`

---

### 2.8 `assignCounter`
Allocates staff to an active counter and opens/closes the counter.
- **Callable Name:** `assignCounter`
- **Authorization:** `COUNTER_STAFF`, `DEPARTMENT_MANAGER`, `BRANCH_ADMIN`
- **Request Parameters:** `{ counterId: string, institutionId: string, branchId: string, staffId: string, status: CounterStatus }`
- **Response:** `{ counter: Counter }`

---

### 2.9 `validateQRCode`
Validates a scanned QR payload against the institution and token database.
- **Callable Name:** `validateQRCode`
- **Authorization:** `COUNTER_STAFF`, `SECURITY_STAFF`, `BRANCH_ADMIN`
- **Request Parameters:** `{ qrPayload: string, institutionId: string, branchId: string, zoneId?: string }`
- **Response:** `{ isValid: boolean, token?: Token, message: string }`

---

### 2.10 `checkInVisitor`
Records visitor on-site arrival, transitions token to `CHECKED_IN`, and updates zone count.
- **Callable Name:** `checkInVisitor`
- **Authorization:** Token Owner (if self-check-in allowed) or Staff.
- **Request Parameters:** `{ tokenId: string, institutionId: string, branchId: string, zoneId?: string, method: CheckInMethod, qrPayload?: string }`
- **Response:** `{ checkIn: CheckIn, token: Token, zoneOccupancyStatus?: ZoneOccupancyStatus }`

---

### 2.11 `checkOutVisitor`
Marks visitor departure from zone or branch.
- **Callable Name:** `checkOutVisitor`
- **Authorization:** Staff or Automated Exit Sensor.
- **Request Parameters:** `{ tokenId: string, institutionId: string, branchId: string, zoneId?: string }`
- **Response:** `{ tokenId: string, checkedOutAt: string, zoneOccupancyStatus?: ZoneOccupancyStatus }`

---

### 2.12 `getZoneOccupancy`
Fetches live occupancy metrics for one or all zones in a branch.
- **Callable Name:** `getZoneOccupancy`
- **Authorization:** Staff / Admin.
- **Request Parameters:** `{ institutionId: string, branchId: string, zoneId?: string }`
- **Response:** `{ branchId: string, zones: ZoneOccupancyDetails[], timestamp: string }`

---

### 2.13 `generateCrowdAlert`
Creates an operational warning (e.g. Overcrowding, Bottleneck) and notifies dashboard.
- **Callable Name:** `generateCrowdAlert`
- **Authorization:** System (automated) or `BRANCH_ADMIN`, `SECURITY_STAFF`.
- **Request Parameters:** `{ institutionId: string, branchId: string, zoneId?: string, departmentId?: string, type: AlertType, severity: AlertSeverity, title: string, message: string }`
- **Response:** `{ alert: Alert }`
