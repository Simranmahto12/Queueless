import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  MOCK_INSTITUTIONS,
  MOCK_BRANCHES,
  MOCK_ANALYTICS,
  Institution,
  Branch,
  Department,
  Service,
  Counter,
  Staff,
  Token,
  Zone,
  Alert,
  CounterStatus,
  FirebaseConnectionState,
} from '@queueless/shared';
import {
  getFirebaseServices,
  listenBranchTokens,
  listenCounters,
  listenZones,
  listenAlerts,
  listenDepartments,
  listenServices,
  listenStaff,
  callNextToken as callNextTokenBackend,
  markTokenServed as markTokenServedBackend,
  skipToken as skipTokenBackend,
  recallToken as recallTokenBackend,
  cancelToken as cancelTokenBackend,
  updateCounterStatus as updateCounterStatusBackend,
  acknowledgeAlert as acknowledgeAlertBackend,
  createDepartment as createDepartmentBackend,
  createService as createServiceBackend,
  simulateFootfall as simulateFootfallBackend,
  seedFirestoreDatabase,
} from '@queueless/shared';

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
  connectionState: FirebaseConnectionState;
  seedDatabase: () => Promise<void>;
  // Queue & Counter Operations
  callNextToken: (counterId: string) => Promise<void>;
  markTokenServed: (tokenId: string) => Promise<void>;
  skipToken: (tokenId: string) => Promise<void>;
  recallToken: (tokenId: string) => Promise<void>;
  cancelToken: (tokenId: string, reason?: string) => Promise<void>;
  updateCounterStatus: (counterId: string, status: CounterStatus) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  addDepartment: (dept: Partial<Department>) => Promise<void>;
  addService: (srv: Partial<Service>) => Promise<void>;
  updateZoneOccupancy: (zoneId: string, delta: number) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [institutions] = useState<Institution[]>(MOCK_INSTITUTIONS);
  const [currentInstitution, setCurrentInstitution] = useState<Institution>(MOCK_INSTITUTIONS[0]);
  const [branches] = useState<Branch[]>(MOCK_BRANCHES);
  const [currentBranch, setCurrentBranch] = useState<Branch>(MOCK_BRANCHES[0]);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [connectionState, setConnectionState] = useState<FirebaseConnectionState>('STANDALONE_FALLBACK');

  // Initialize Firebase and Real-Time Listeners
  useEffect(() => {
    const servicesObj = getFirebaseServices();
    setConnectionState(servicesObj.connectionState);

    const instId = currentInstitution.institutionId;
    const branchId = currentBranch.branchId;

    // Real-Time Listeners
    const unsubTokens = listenBranchTokens(instId, branchId, (newTokens) => {
      setTokens(newTokens);
    });

    const unsubCounters = listenCounters(instId, branchId, (newCounters) => {
      setCounters(newCounters);
    });

    const unsubZones = listenZones(instId, branchId, (newZones) => {
      setZones(newZones);
    });

    const unsubAlerts = listenAlerts(instId, branchId, (newAlerts) => {
      setAlerts(newAlerts);
    });

    const unsubDepts = listenDepartments(instId, branchId, (newDepts) => {
      setDepartments(newDepts);
    });

    const unsubServices = listenServices(instId, branchId, (newServices) => {
      setServices(newServices);
    });

    const unsubStaff = listenStaff(instId, branchId, (newStaff) => {
      setStaff(newStaff);
    });

    return () => {
      unsubTokens();
      unsubCounters();
      unsubZones();
      unsubAlerts();
      unsubDepts();
      unsubServices();
      unsubStaff();
    };
  }, [currentInstitution.institutionId, currentBranch.branchId]);

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

  // Seed Firestore
  const seedDatabase = async () => {
    addToast('info', 'Executing Firestore database seed...');
    const result = await seedFirestoreDatabase();
    if (result.success) {
      addToast('success', result.message);
    } else {
      addToast('warning', result.message);
    }
  };

  // Call Next Token (Atomic Transaction)
  const callNextToken = async (counterId: string) => {
    try {
      const counter = counters.find((c) => c.counterId === counterId);
      const staffMember = staff.find((s) => s.assignedCounterId === counterId) || staff[0];

      const token = await callNextTokenBackend({
        institutionId: currentInstitution.institutionId,
        branchId: currentBranch.branchId,
        counterId,
        staffId: staffMember?.staffId || 'staff-default',
      });

      if (!token) {
        addToast('info', 'No more waiting tokens for this counter.');
      } else {
        addToast(
          'success',
          `Token ${token.tokenNumber} summoned to ${counter?.counterNumber || 'Counter'}`
        );
      }
    } catch (err) {
      addToast('danger', `Failed to call next token: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Mark token completed (Atomic Transaction)
  const markTokenServed = async (tokenId: string) => {
    try {
      const token = tokens.find((t) => t.tokenId === tokenId);
      await markTokenServedBackend(tokenId, token?.assignedCounterId);
      addToast('success', `Token ${token?.tokenNumber || tokenId} marked as completed.`);
    } catch (err) {
      addToast('danger', `Error completing token: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Skip token (Atomic Transaction)
  const skipToken = async (tokenId: string) => {
    try {
      const token = tokens.find((t) => t.tokenId === tokenId);
      await skipTokenBackend(tokenId, token?.assignedCounterId);
      addToast('warning', `Token ${token?.tokenNumber || tokenId} skipped (No Show recorded).`);
    } catch (err) {
      addToast('danger', `Error skipping token: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Recall token
  const recallToken = async (tokenId: string) => {
    const token = tokens.find((t) => t.tokenId === tokenId);
    await recallTokenBackend(tokenId);
    addToast('info', `Notification & audio chime re-broadcasted for ${token?.tokenNumber || tokenId}`);
  };

  // Cancel token
  const cancelToken = async (tokenId: string, reason?: string) => {
    await cancelTokenBackend(tokenId, reason);
    addToast('info', `Token marked as cancelled.`);
  };

  // Update counter status
  const updateCounterStatus = async (counterId: string, status: CounterStatus) => {
    await updateCounterStatusBackend(counterId, status);
    addToast('info', `Counter status updated to ${status}`);
  };

  // Acknowledge Alert
  const acknowledgeAlert = async (alertId: string) => {
    await acknowledgeAlertBackend(alertId);
    addToast('success', 'Alert acknowledged.');
  };

  // Add Department
  const addDepartment = async (dept: Partial<Department>) => {
    const created = await createDepartmentBackend({
      ...dept,
      institutionId: currentInstitution.institutionId,
      branchId: currentBranch.branchId,
    });
    addToast('success', `Department "${created.name}" created.`);
  };

  // Add Service
  const addService = async (srv: Partial<Service>) => {
    const created = await createServiceBackend({
      ...srv,
      institutionId: currentInstitution.institutionId,
      branchId: currentBranch.branchId,
    });
    addToast('success', `Service "${created.name}" created.`);
  };

  // Simulate Footfall
  const updateZoneOccupancy = async (zoneId: string, delta: number) => {
    await simulateFootfallBackend(zoneId, delta);
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
      connectionState,
      seedDatabase,
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
      connectionState,
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
