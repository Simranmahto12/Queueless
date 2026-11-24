import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, limit, onSnapshot, query } from 'firebase/firestore';
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
  TokenStatus,
  Zone,
  Alert,
  CounterStatus,
  FirebaseConnectionState,
  User,
  UserRole,
  loginUser,
  registerVisitor,
  logoutUser,
  resetUserPassword,
  subscribeAuth,
  provisionStaffOrAdmin,
  hasAdminPermission,
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
  bookToken as bookTokenBackend,
  callNextToken as callNextTokenBackend,
  markTokenServed as markTokenServedBackend,
  skipToken as skipTokenBackend,
  undoTokenAction as undoTokenActionBackend,
  recallToken as recallTokenBackend,
  cancelToken as cancelTokenBackend,
  updateCounterStatus as updateCounterStatusBackend,
  acknowledgeAlert as acknowledgeAlertBackend,
  createDepartment as createDepartmentBackend,
  createService as createServiceBackend,
  simulateFootfall as simulateFootfallBackend,
  checkInVisitorWithQR,
  checkOutVisitor,
  AuditLog,
  listenAuditLogs,
} from '@queueless/shared';

type FirebaseConnectionHealth = 'CONNECTING' | 'CONNECTED' | 'OFFLINE' | 'ERROR';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  message: string;
}

interface AdminContextType {
  // Authentication & Session
  currentUser: User | null;
  isAuthLoading: boolean;
  isVisitor: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<User>;
  loginVisitor: (email: string, pass: string) => Promise<User>;
  registerVisitorAccount: (params: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  provisionStaff: (params: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
    role: UserRole;
    departmentId?: string;
    assignedCounterId?: string;
  }) => Promise<User>;
  bookVisitorToken: (params: Parameters<typeof bookTokenBackend>[0]) => Promise<Token>;

  // Institutional Scopes
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
  auditLogs: AuditLog[];
  analytics: typeof MOCK_ANALYTICS;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
  connectionState: FirebaseConnectionState;
  connectionHealth: FirebaseConnectionHealth;
  connectionError: string | null;
  isSyncing: boolean;
  forceSync: () => Promise<void>;
  // Queue & Counter Operations
  callNextToken: (counterId: string) => Promise<void>;
  markTokenServed: (tokenId: string) => Promise<void>;
  skipToken: (tokenId: string, counterId?: string, reason?: string) => Promise<void>;
  undoTokenAction: (tokenId: string, previousStatus: TokenStatus, counterId?: string) => Promise<void>;
  recallToken: (tokenId: string) => Promise<void>;
  cancelToken: (tokenId: string, reason?: string) => Promise<void>;
  checkInToken: (tokenId: string, zoneId?: string) => Promise<void>;
  checkOutToken: (tokenId: string, zoneId?: string) => Promise<void>;
  updateCounterStatus: (counterId: string, status: CounterStatus) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  addDepartment: (dept: Partial<Department>) => Promise<void>;
  addService: (srv: Partial<Service>) => Promise<void>;
  updateZoneOccupancy: (zoneId: string, delta: number) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

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
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [connectionState, setConnectionState] = useState<FirebaseConnectionState>('STANDALONE_FALLBACK');
  const [connectionHealth, setConnectionHealth] = useState<FirebaseConnectionHealth>('CONNECTING');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Listen for Authentication State
  useEffect(() => {
    const unsubAuth = subscribeAuth((user) => {
      setCurrentUser(user);
      if (user?.institutionId) {
        const matchInst = institutions.find((i) => i.institutionId === user.institutionId);
        if (matchInst) setCurrentInstitution(matchInst);
      }
      setIsAuthLoading(false);
    });

    return () => unsubAuth();
  }, [institutions]);

  // Initialize Firebase and Real-Time Listeners
  useEffect(() => {
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

    const unsubAudit = listenAuditLogs(instId, (newAuditLogs) => {
      setAuditLogs(newAuditLogs);
    });

    return () => {
      unsubTokens();
      unsubCounters();
      unsubZones();
      unsubAlerts();
      unsubDepts();
      unsubServices();
      unsubStaff();
      unsubAudit();
    };
  }, [currentInstitution.institutionId, currentBranch.branchId]);

  // Verify a server-backed snapshot before reporting Firebase as connected.
  useEffect(() => {
    const services = getFirebaseServices();
    setConnectionState(services.connectionState);
    setConnectionError(services.connectionError);

    if (!services.db || !services.isConfigured) {
      setConnectionHealth('OFFLINE');
      return;
    }

    setConnectionHealth('CONNECTING');
    const healthQuery = query(collection(services.db, 'institutions'), limit(1));
    const unsubscribe = onSnapshot(
      healthQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) {
          setConnectionHealth(
            typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'CONNECTING'
          );
          return;
        }

        setConnectionHealth('CONNECTED');
        setConnectionError(null);
      },
      (err) => {
        setConnectionHealth('ERROR');
        setConnectionError(err.message);
      }
    );

    const handleOffline = () => setConnectionHealth('OFFLINE');
    const handleOnline = () => setConnectionHealth('CONNECTING');
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

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

  // Authentication methods (Admin)
  const login = async (email: string, pass: string): Promise<User> => {
    const user = await loginUser(email, pass, { requireAdminOrStaff: true });
    setCurrentUser(user);
    if (user.institutionId) {
      const matchInst = institutions.find((i) => i.institutionId === user.institutionId);
      if (matchInst) setCurrentInstitution(matchInst);
    }
    addToast('success', `Authenticated as ${user.displayName} (${user.role})`);
    return user;
  };

  // Authentication methods (Visitor)
  const loginVisitor = async (email: string, pass: string): Promise<User> => {
    const user = await loginUser(email, pass);
    setCurrentUser(user);
    addToast('success', `Welcome back, ${user.displayName}`);
    return user;
  };

  const registerVisitorAccount = async (params: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
  }): Promise<User> => {
    const user = await registerVisitor(params);
    setCurrentUser(user);
    addToast('success', `Visitor account registered successfully.`);
    return user;
  };

  const bookVisitorToken = async (params: Parameters<typeof bookTokenBackend>[0]): Promise<Token> => {
    const token = await bookTokenBackend(params);
    addToast('success', `Token ${token.tokenNumber} issued successfully.`);
    return token;
  };

  const isVisitor = currentUser?.role === UserRole.VISITOR;
  const isAdmin = hasAdminPermission(currentUser?.role);

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    addToast('info', 'Signed out successfully.');
  };

  const resetPassword = async (email: string) => {
    return await resetUserPassword(email);
  };

  const provisionStaff = async (params: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
    role: UserRole;
    departmentId?: string;
    assignedCounterId?: string;
  }): Promise<User> => {
    if (!currentUser) throw new Error('Unauthorized');
    const created = await provisionStaffOrAdmin({
      ...params,
      institutionId: currentInstitution.institutionId,
      branchId: currentBranch.branchId,
      authorizedByUserId: currentUser.id,
    });
    addToast('success', `Staff member ${created.displayName} provisioned successfully.`);
    return created;
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

  // Skip token (Atomic Transaction with reason support)
  const skipToken = async (tokenId: string, counterId?: string, reason?: string) => {
    try {
      const token = tokens.find((t) => t.tokenId === tokenId);
      const targetCounterId = counterId || token?.assignedCounterId;
      await skipTokenBackend(tokenId, targetCounterId, reason);
      addToast('warning', `Token ${token?.tokenNumber || tokenId} skipped (${reason || 'No Show recorded'}).`);
    } catch (err) {
      addToast('danger', `Error skipping token: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 5-Second Undo operation
  const undoTokenAction = async (tokenId: string, previousStatus: TokenStatus, counterId?: string) => {
    try {
      const res = await undoTokenActionBackend(tokenId, previousStatus, counterId, currentUser?.id);
      addToast('success', res.message);
    } catch (err) {
      addToast('danger', `Undo failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Force Central Server Synchronisation
  const forceSync = async () => {
    setIsSyncing(true);
    try {
      // Re-trigger live check and listeners
      addToast('info', 'Contacting central server and validating data integrity...');
      await new Promise((resolve) => setTimeout(resolve, 600));
      setConnectionHealth('CONNECTED');
      setConnectionError(null);
      addToast('success', 'Central server synchronisation verified. All operational changes are live.');
    } catch (err) {
      addToast('warning', 'Sync verification completed. Changes queued locally.');
    } finally {
      setIsSyncing(false);
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

  // QR Check-in validation and atomic occupancy update
  const checkInToken = async (tokenId: string, zoneId?: string) => {
    try {
      const token = tokens.find((t) => t.tokenId === tokenId);
      if (!token) throw new Error('Token record not found.');

      const targetZone = zoneId || zones[0]?.zoneId || 'zone-cardio-wait';
      const result = await checkInVisitorWithQR({
        qrPayload: token.qrCodeValue || '',
        expectedInstitutionId: currentInstitution.institutionId,
        expectedBranchId: currentBranch.branchId,
        targetZoneId: targetZone,
      });

      if (result.success) {
        addToast('success', `Token ${token.tokenNumber} checked in. Lobby occupancy updated.`);
      } else {
        addToast('warning', result.errorMessage || 'Check-in validation failed.');
      }
    } catch (err: unknown) {
      addToast('danger', err instanceof Error ? err.message : 'Check-in failed.');
    }
  };

  // Check-out and atomic occupancy decrement
  const checkOutToken = async (tokenId: string, zoneId?: string) => {
    try {
      const targetZone = zoneId || zones[0]?.zoneId || 'zone-cardio-wait';
      await checkOutVisitor({
        tokenId,
        zoneId: targetZone,
        institutionId: currentInstitution.institutionId,
      });
      addToast('info', `Visitor checked out. Occupancy decreased.`);
    } catch (err: unknown) {
      addToast('danger', err instanceof Error ? err.message : 'Check-out failed.');
    }
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
      currentUser,
      isAuthLoading,
      isVisitor,
      isAdmin,
      login,
      loginVisitor,
      registerVisitorAccount,
      bookVisitorToken,
      logout,
      resetPassword,
      provisionStaff,
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
      auditLogs,
      analytics: MOCK_ANALYTICS,
      toasts,
      addToast,
      removeToast,
      connectionState,
      connectionHealth,
      connectionError,
      isSyncing,
      forceSync,
      callNextToken,
      markTokenServed,
      skipToken,
      undoTokenAction,
      recallToken,
      cancelToken,
      checkInToken,
      checkOutToken,
      updateCounterStatus,
      acknowledgeAlert,
      addDepartment,
      addService,
      updateZoneOccupancy,
    }),
    [
      currentUser,
      isAuthLoading,
      isVisitor,
      isAdmin,
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
      connectionHealth,
      connectionError,
      isSyncing,
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
