import React, { createContext, useContext, useState } from 'react';
import {
  MOCK_INSTITUTIONS,
  MOCK_DEPARTMENTS,
  MOCK_SERVICES,
  MOCK_TOKENS,
  Institution,
  Department,
  Service,
  Token,
} from '@queueless/shared';
import { TokenStatus, TokenPriority } from '@queueless/shared';
import { calculateSmartArrivalSlot, estimateWaitTime } from '@queueless/shared';

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
  user: { name: string; phone: string; email: string } | null;
  login: (email: string, pass: string) => void;
  logout: () => void;
  // Booking Selection Flow State
  selectedInstitution: Institution;
  setSelectedInstitution: (inst: Institution) => void;
  selectedDepartment: Department | null;
  setSelectedDepartment: (dept: Department | null) => void;
  selectedService: Service | null;
  setSelectedService: (srv: Service | null) => void;
  // Active Token & History
  activeToken: Token | null;
  tokensHistory: Token[];
  bookNewToken: (slotTime: string, priority?: TokenPriority) => Token;
  cancelActiveToken: () => void;
  // Notifications
  notifications: MobileNotification[];
  markNotificationAsRead: (id: string) => void;
}

const MobileContext = createContext<MobileContextType | null>(null);

export const MobileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<MobileScreen>('home');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [user, setUser] = useState<{ name: string; phone: string; email: string } | null>({
    name: 'David Miller',
    phone: '+1 (555) 301-8842',
    email: 'david.miller@example.com',
  });

  const [selectedInstitution, setSelectedInstitution] = useState<Institution>(MOCK_INSTITUTIONS[0]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(MOCK_DEPARTMENTS[0]);
  const [selectedService, setSelectedService] = useState<Service | null>(MOCK_SERVICES[0]);

  const [activeToken, setActiveToken] = useState<Token | null>(MOCK_TOKENS[1]); // CARD-102 (Waiting)
  const [tokensHistory, setTokensHistory] = useState<Token[]>(MOCK_TOKENS);

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
    {
      id: 'notif-3',
      title: 'Queue Moving Fast',
      message: 'Desk 01 has called token CARD-101. You are 1 person away.',
      time: 'Just now',
      type: 'QUEUE_UPDATE',
      isRead: false,
    },
  ]);

  const login = (email: string, pass: string) => {
    setIsAuthenticated(true);
    setUser({
      name: email.split('@')[0] || 'David Miller',
      phone: '+1 (555) 301-8842',
      email,
    });
    setCurrentScreen('home');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentScreen('onboarding');
  };

  const bookNewToken = (slotTime: string, priority: TokenPriority = TokenPriority.STANDARD): Token => {
    const now = new Date();
    const targetDate = now.toISOString().split('T')[0];

    const arrivalSlot = calculateSmartArrivalSlot({
      targetDate,
      targetSlotTime: slotTime,
      serviceDurationMinutes: selectedService?.estimatedDurationMinutes || 15,
      currentQueueDepth: 3,
      activeCountersCount: 2,
    });

    const waitEst = estimateWaitTime({
      tokensAheadCount: 3,
      averageServiceDurationMinutes: selectedService?.estimatedDurationMinutes || 15,
      activeCountersCount: 2,
      priority,
    });

    const num = Math.floor(100 + Math.random() * 900);
    const prefix = selectedDepartment?.code.split('-')[1] || 'T';
    const tokenNumber = `${prefix}-${num}`;

    const newToken: Token = {
      id: `tok-${Date.now()}`,
      tokenId: `tok-${Date.now()}`,
      tokenNumber,
      institutionId: selectedInstitution.institutionId,
      branchId: selectedDepartment?.branchId || 'branch-apex-main',
      departmentId: selectedDepartment?.departmentId || 'dep-cardio',
      serviceId: selectedService?.serviceId || 'srv-ecg',
      visitorId: user?.email || 'guest-user',
      visitorName: user?.name || 'David Miller',
      visitorPhone: user?.phone,
      priority,
      status: TokenStatus.ISSUED,
      scheduledSlot: {
        date: targetDate,
        startTime: slotTime,
        endTime: `${parseInt(slotTime.split(':')[0])}:${parseInt(slotTime.split(':')[1]) + 15}`,
      },
      smartArrivalSlot: arrivalSlot,
      estimatedWaitMinutes: waitEst.estimatedWaitMinutes,
      issuedAt: now.toISOString(),
      qrCodeValue: `tok-${Date.now()}:${selectedInstitution.institutionId}:${Date.now()}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setActiveToken(newToken);
    setTokensHistory((prev) => [newToken, ...prev]);

    // Push notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'New Token Issued',
        message: `Token ${tokenNumber} generated. Arrive at ${arrivalSlot.recommendedArrivalStart.substring(11, 16)} AM.`,
        time: 'Just now',
        type: 'CONFIRMATION',
        isRead: false,
      },
      ...prev,
    ]);

    return newToken;
  };

  const cancelActiveToken = () => {
    if (!activeToken) return;
    const updated = { ...activeToken, status: TokenStatus.CANCELLED };
    setActiveToken(null);
    setTokensHistory((prev) => prev.map((t) => (t.tokenId === activeToken.tokenId ? updated : t)));
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
        user,
        login,
        logout,
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
