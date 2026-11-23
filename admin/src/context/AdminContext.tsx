import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  MOCK_INSTITUTIONS,
  MOCK_BRANCHES,
  MOCK_DEPARTMENTS,
  MOCK_SERVICES,
  MOCK_COUNTERS,
  MOCK_ZONES,
  MOCK_TOKENS,
  MOCK_STAFF,
  MOCK_ALERTS,
  MOCK_ANALYTICS,
} from '@queueless/shared';
import {
  Institution,
  Branch,
  Department,
  Service,
  Counter,
  Staff,
  Token,
  Zone,
  Alert,
} from '@queueless/shared';
import { CounterStatus, TokenStatus, AlertSeverity } from '@queueless/shared';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  message: string;
}

interface AdminContextType {
  institutions: Institution[];
  currentInstitution: Institution;
  setCurrentInstitution: (inst: Institution) => void;
  branches: Branch[];
  currentBranch: Branch;
  setCurrentBranch: (branch: Branch) => void;
  departments: Department[];
  services: Service[];
  counters: Counter[];
  zones: Zone[];
  tokens: Token[];
  staff: Staff[];
  alerts: Alert[];
  analytics: typeof MOCK_ANALYTICS;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
  // Queue & Counter Operations
  callNextToken: (counterId: string) => void;
  markTokenServed: (tokenId: string) => void;
  skipToken: (tokenId: string) => void;
  recallToken: (tokenId: string) => void;
  cancelToken: (tokenId: string, reason?: string) => void;
  updateCounterStatus: (counterId: string, status: CounterStatus) => void;
  acknowledgeAlert: (alertId: string) => void;
  addDepartment: (dept: Partial<Department>) => void;
  addService: (srv: Partial<Service>) => void;
  updateZoneOccupancy: (zoneId: string, delta: number) => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [institutions] = useState<Institution[]>(MOCK_INSTITUTIONS);
  const [currentInstitution, setCurrentInstitution] = useState<Institution>(MOCK_INSTITUTIONS[0]);
  const [branches] = useState<Branch[]>(MOCK_BRANCHES);
  const [currentBranch, setCurrentBranch] = useState<Branch>(MOCK_BRANCHES[0]);

  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [counters, setCounters] = useState<Counter[]>(MOCK_COUNTERS);
  const [zones, setZones] = useState<Zone[]>(MOCK_ZONES);
  const [tokens, setTokens] = useState<Token[]>(MOCK_TOKENS);
  const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Call Next Token to specific counter
  const callNextToken = (counterId: string) => {
    const counter = counters.find((c) => c.counterId === counterId);
    if (!counter) return;

    // Find next eligible waiting or checked-in token
    const eligibleToken = tokens.find(
      (t) =>
        (t.status === TokenStatus.WAITING || t.status === TokenStatus.CHECKED_IN) &&
        counter.supportedServiceIds.includes(t.serviceId)
    );

    if (!eligibleToken) {
      addToast('info', 'No more waiting tokens for this counter.');
      return;
    }

    const now = new Date().toISOString();

    setTokens((prev) =>
      prev.map((t) =>
        t.tokenId === eligibleToken.tokenId
          ? {
              ...t,
              status: TokenStatus.CALLED,
              assignedCounterId: counter.counterId,
              assignedCounterNumber: counter.counterNumber,
              calledAt: now,
              updatedAt: now,
            }
          : t
      )
    );

    setCounters((prev) =>
      prev.map((c) =>
        c.counterId === counterId
          ? {
              ...c,
              status: CounterStatus.BUSY,
              currentServedTokenId: eligibleToken.tokenId,
              lastCalledAt: now,
              updatedAt: now,
            }
          : c
      )
    );

    addToast('success', `Token ${eligibleToken.tokenNumber} summoned to ${counter.counterNumber}`);
  };

  // Mark token completed
  const markTokenServed = (tokenId: string) => {
    const now = new Date().toISOString();
    const token = tokens.find((t) => t.tokenId === tokenId);
    if (!token) return;

    setTokens((prev) =>
      prev.map((t) =>
        t.tokenId === tokenId
          ? {
              ...t,
              status: TokenStatus.COMPLETED,
              serviceCompletedAt: now,
              updatedAt: now,
            }
          : t
      )
    );

    if (token.assignedCounterId) {
      setCounters((prev) =>
        prev.map((c) =>
          c.counterId === token.assignedCounterId
            ? {
                ...c,
                status: CounterStatus.OPEN,
                currentServedTokenId: undefined,
                updatedAt: now,
              }
            : c
        )
      );
    }

    addToast('success', `Token ${token.tokenNumber} marked as completed.`);
  };

  // Skip token (e.g. absent when called)
  const skipToken = (tokenId: string) => {
    const now = new Date().toISOString();
    const token = tokens.find((t) => t.tokenId === tokenId);
    if (!token) return;

    setTokens((prev) =>
      prev.map((t) =>
        t.tokenId === tokenId
          ? {
              ...t,
              status: TokenStatus.NO_SHOW,
              updatedAt: now,
            }
          : t
      )
    );

    if (token.assignedCounterId) {
      setCounters((prev) =>
        prev.map((c) =>
          c.counterId === token.assignedCounterId
            ? {
                ...c,
                status: CounterStatus.OPEN,
                currentServedTokenId: undefined,
                updatedAt: now,
              }
            : c
        )
      );
    }

    addToast('warning', `Token ${token.tokenNumber} skipped (No Show recorded).`);
  };

  // Recall token to current counter
  const recallToken = (tokenId: string) => {
    const token = tokens.find((t) => t.tokenId === tokenId);
    if (!token) return;
    addToast('info', `Notification & audio chime re-broadcasted for ${token.tokenNumber}`);
  };

  // Cancel token
  const cancelToken = (tokenId: string, reason?: string) => {
    const now = new Date().toISOString();
    setTokens((prev) =>
      prev.map((t) =>
        t.tokenId === tokenId
          ? {
              ...t,
              status: TokenStatus.CANCELLED,
              cancelledAt: now,
              notes: reason || t.notes,
              updatedAt: now,
            }
          : t
      )
    );
    addToast('info', `Token marked as cancelled.`);
  };

  // Update counter operational status (OPEN / PAUSED / CLOSED)
  const updateCounterStatus = (counterId: string, status: CounterStatus) => {
    const now = new Date().toISOString();
    setCounters((prev) =>
      prev.map((c) =>
        c.counterId === counterId
          ? {
              ...c,
              status,
              updatedAt: now,
            }
          : c
      )
    );
    addToast('info', `Counter status updated to ${status}`);
  };

  // Acknowledge Alert
  const acknowledgeAlert = (alertId: string) => {
    const now = new Date().toISOString();
    setAlerts((prev) =>
      prev.map((a) =>
        a.alertId === alertId
          ? {
              ...a,
              isAcknowledged: true,
              acknowledgedAt: now,
              updatedAt: now,
            }
          : a
      )
    );
    addToast('success', 'Alert acknowledged.');
  };

  // Add Department
  const addDepartment = (dept: Partial<Department>) => {
    const now = new Date().toISOString();
    const newDept: Department = {
      id: `dep-${Date.now()}`,
      departmentId: `dep-${Date.now()}`,
      institutionId: currentInstitution.institutionId,
      branchId: currentBranch.branchId,
      name: dept.name || 'New Department',
      code: dept.code || 'DEP-NEW',
      description: dept.description,
      floor: dept.floor,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    setDepartments((prev) => [...prev, newDept]);
    addToast('success', `Department "${newDept.name}" created.`);
  };

  // Add Service
  const addService = (srv: Partial<Service>) => {
    const now = new Date().toISOString();
    const newSrv: Service = {
      id: `srv-${Date.now()}`,
      serviceId: `srv-${Date.now()}`,
      institutionId: currentInstitution.institutionId,
      branchId: currentBranch.branchId,
      departmentId: srv.departmentId || departments[0]?.departmentId || 'dep-cardio',
      name: srv.name || 'New Service',
      code: srv.code || 'SRV-NEW',
      estimatedDurationMinutes: srv.estimatedDurationMinutes || 15,
      bufferMinutes: srv.bufferMinutes || 5,
      requiresAppointment: srv.requiresAppointment ?? false,
      allowWalkIn: srv.allowWalkIn ?? true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    setServices((prev) => [...prev, newSrv]);
    addToast('success', `Service "${newSrv.name}" created.`);
  };

  // Adjust Zone Occupancy for interactive testing/demo
  const updateZoneOccupancy = (zoneId: string, delta: number) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.zoneId !== zoneId) return z;
        const newOcc = Math.max(0, Math.min(z.maxCapacity * 1.5, z.currentOccupancy + delta));
        const pct = (newOcc / z.maxCapacity) * 100;
        let status = z.occupancyStatus;
        if (pct > 100) status = 'OVERCROWDED' as any;
        else if (pct >= 95) status = 'CRITICAL' as any;
        else if (pct >= 80) status = 'ELEVATED' as any;
        else if (pct >= 60) status = 'MODERATE' as any;
        else status = 'NORMAL' as any;

        return {
          ...z,
          currentOccupancy: newOcc,
          occupancyStatus: status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const value = useMemo(
    () => ({
      institutions,
      currentInstitution,
      setCurrentInstitution,
      branches,
      currentBranch,
      setCurrentBranch,
      departments,
      services,
      counters,
      zones,
      tokens,
      staff,
      alerts,
      analytics: MOCK_ANALYTICS,
      toasts,
      addToast,
      removeToast,
      callNextToken,
      markTokenServed,
      skipToken,
      recallToken,
      cancelToken,
      updateCounterStatus,
      acknowledgeAlert,
      addDepartment,
      addService,
      updateZoneOccupancy,
    }),
    [
      institutions,
      currentInstitution,
      branches,
      currentBranch,
      departments,
      services,
      counters,
      zones,
      tokens,
      staff,
      alerts,
      toasts,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
