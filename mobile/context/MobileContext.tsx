import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  MOCK_INSTITUTIONS,
  MOCK_DEPARTMENTS,
  MOCK_SERVICES,
  Institution,
  Department,
  Service,
  Token,
  TokenStatus,
  TokenPriority,
} from '@queueless/shared';
import {
  bookToken as bookTokenBackend,
  cancelToken as cancelTokenBackend,
  listenSingleToken,
  listenInstitutions,
  loginUser,
  registerVisitor,
  resetUserPassword,
  loginGuest,
  logoutUser,
  subscribeAuth,
} from '@queueless/shared';

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'CALLED' | 'REMINDER' | 'CONFIRMATION' | 'QUEUE_UPDATE';
  isRead: boolean;
}

export type MobileScreen =
  | 'onboarding'
  | 'auth'
  | 'home'
  | 'discovery'
  | 'service_selection'
  | 'booking_confirmation'
  | 'live_queue'
  | 'notifications'
  | 'history'
  | 'profile';

interface MobileContextType {
  // Navigation
  currentScreen: MobileScreen;
  setCurrentScreen: (screen: MobileScreen) => void;
  // User Session
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: { name: string; phone?: string; email: string; userId: string } | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (params: { email: string; password: string; displayName: string; phone?: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  // Booking Selection Flow State
  institutions: Institution[];
  selectedInstitution: Institution;
  setSelectedInstitution: (inst: Institution) => void;
  selectedDepartment: Department | null;
  setSelectedDepartment: (dept: Department | null) => void;
  selectedService: Service | null;
  setSelectedService: (srv: Service | null) => void;
  // Active Token & History
  activeToken: Token | null;
  tokensHistory: Token[];
  bookNewToken: (slotTime: string, priority?: TokenPriority) => Promise<Token>;
  cancelActiveToken: () => Promise<void>;
  // Notifications
  notifications: MobileNotification[];
  markNotificationAsRead: (id: string) => void;
}

const MobileContext = createContext<MobileContextType | null>(null);

export const MobileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<MobileScreen>('onboarding');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [user, setUser] = useState<{ name: string; phone?: string; email: string; userId: string } | null>(null);

  const [institutions, setInstitutions] = useState<Institution[]>(MOCK_INSTITUTIONS);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution>(MOCK_INSTITUTIONS[0]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(MOCK_DEPARTMENTS[0]);
  const [selectedService, setSelectedService] = useState<Service | null>(MOCK_SERVICES[0]);

  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [tokensHistory, setTokensHistory] = useState<Token[]>([]);

  const [notifications, setNotifications] = useState<MobileNotification[]>([
    {
      id: 'notif-1',
      title: 'Arrival Reminder: 15 Mins',
      message: 'Your recommended arrival window for CARD-102 at Downtown Campus starts at 09:35 AM.',
      time: '10 mins ago',
      type: 'REMINDER',
      isRead: false,
    },
    {
      id: 'notif-2',
      title: 'Booking Confirmed',
      message: 'Digital token CARD-102 confirmed for 12-Lead ECG & Vitals.',
      time: '1 hour ago',
      type: 'CONFIRMATION',
      isRead: true,
    },
  ]);

  // Sync Auth State & Catalog Listeners
  useEffect(() => {
    const unsubAuth = subscribeAuth((userProfile) => {
      if (userProfile) {
        setIsAuthenticated(true);
        setUser({
          name: userProfile.displayName,
          phone: userProfile.phone,
          email: userProfile.email,
          userId: userProfile.userId,
        });
        setCurrentScreen((prev) => (prev === 'onboarding' || prev === 'auth' ? 'home' : prev));
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    const unsubInst = listenInstitutions((insts) => {
      if (insts && insts.length > 0) {
        setInstitutions(insts);
      }
    });

    return () => {
      unsubAuth();
      unsubInst();
    };
  }, []);

  // Real-Time Single Token Listener for Active Token
  useEffect(() => {
    if (!activeToken?.tokenId) return;

    const unsubToken = listenSingleToken(activeToken.tokenId, (updatedToken) => {
      if (!updatedToken) return;

      setActiveToken((prev) => {
        // Detect if status changed to CALLED
        if (prev && prev.status !== 'CALLED' && updatedToken.status === 'CALLED') {
          setNotifications((n) => [
            {
              id: `notif-${Date.now()}`,
              title: 'Your Token Is Called!',
              message: `Token ${updatedToken.tokenNumber} summoned to ${updatedToken.assignedCounterNumber || 'Counter'}. Please proceed immediately.`,
              time: 'Just now',
              type: 'CALLED',
              isRead: false,
            },
            ...n,
          ]);
        }
        return updatedToken;
      });

      // Update in history as well
      setTokensHistory((history) =>
        history.map((t) => (t.tokenId === updatedToken.tokenId ? updatedToken : t))
      );
    });

    return () => {
      unsubToken();
    };
  }, [activeToken?.tokenId]);

  const login = async (email: string, pass: string) => {
    const profile = await loginUser(email, pass);
    setIsAuthenticated(true);
    setUser({
      name: profile.displayName,
      phone: profile.phone,
      email: profile.email,
      userId: profile.userId,
    });
    setCurrentScreen('home');
  };

  const register = async (params: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
  }) => {
    const profile = await registerVisitor(params);
    setIsAuthenticated(true);
    setUser({
      name: profile.displayName,
      phone: profile.phone,
      email: profile.email,
      userId: profile.userId,
    });
    setCurrentScreen('home');
  };

  const resetPassword = async (email: string) => {
    return await resetUserPassword(email);
  };

  const loginAsGuest = async () => {
    const guest = await loginGuest('Guest Visitor');
    setIsAuthenticated(true);
    setUser({
      name: guest.displayName,
      email: guest.email,
      userId: guest.userId,
    });
    setCurrentScreen('home');
  };

  const logout = async () => {
    await logoutUser();
    setIsAuthenticated(false);
    setUser(null);
    setActiveToken(null);
    setCurrentScreen('onboarding');
  };

  const bookNewToken = async (
    slotTime: string,
    priority: TokenPriority = TokenPriority.STANDARD
  ): Promise<Token> => {
    const now = new Date();
    const targetDate = now.toISOString().split('T')[0];

    const newToken = await bookTokenBackend({
      institutionId: selectedInstitution.institutionId,
      branchId: selectedDepartment?.branchId || 'branch-apex-main',
      departmentId: selectedDepartment?.departmentId || 'dep-cardio',
      serviceId: selectedService?.serviceId || 'srv-ecg',
      visitorId: user?.userId || 'guest-user',
      visitorName: user?.name || 'Visitor',
      visitorPhone: user?.phone,
      visitorEmail: user?.email,
      priority,
      targetDate,
      targetSlotTime: slotTime,
    });

    setActiveToken(newToken);
    setTokensHistory((prev) => [newToken, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'New Token Issued',
        message: `Token ${newToken.tokenNumber} generated. Arrive at ${newToken.scheduledSlot.startTime} AM.`,
        time: 'Just now',
        type: 'CONFIRMATION',
        isRead: false,
      },
      ...prev,
    ]);

    return newToken;
  };

  const cancelActiveToken = async () => {
    if (!activeToken) return;
    await cancelTokenBackend(activeToken.tokenId, 'Cancelled by visitor via mobile app');
    setActiveToken(null);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <MobileContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        isAuthenticated,
        isAuthLoading,
        user,
        login,
        register,
        resetPassword,
        loginAsGuest,
        logout,
        institutions,
        selectedInstitution,
        setSelectedInstitution,
        selectedDepartment,
        setSelectedDepartment,
        selectedService,
        setSelectedService,
        activeToken,
        tokensHistory,
        bookNewToken,
        cancelActiveToken,
        notifications,
        markNotificationAsRead,
      }}
    >
      {children}
    </MobileContext.Provider>
  );
};

export const useMobile = () => {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  return context;
};
