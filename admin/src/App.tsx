import React, { useState } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Sidebar, AdminTab } from './layouts/Sidebar';
import { Header } from './layouts/Header';
import { ToastContainer } from './components/ToastContainer';
import { LoginView } from './pages/LoginView';
import { Loader2 } from 'lucide-react';

// 10 Views
import { OverviewView } from './pages/OverviewView';
import { LiveQueueView } from './pages/LiveQueueView';
import { CrowdManagementView } from './pages/CrowdManagementView';
import { DepartmentsView } from './pages/DepartmentsView';
import { CountersView } from './pages/CountersView';
import { StaffView } from './pages/StaffView';
import { VisitorsView } from './pages/VisitorsView';
import { AnalyticsView } from './pages/AnalyticsView';
import { AlertsView } from './pages/AlertsView';
import { SettingsView } from './pages/SettingsView';

const DashboardContent: React.FC = () => {
  const { currentUser, isAuthLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Authenticating session check
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-appBg select-none">
        <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-white font-bold text-2xl shadow-md mb-4 border border-navy">
          Q
        </div>
        <div className="flex items-center gap-2.5 text-textMuted text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Verifying security credentials & session...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated user -> Guard protected dashboard routes
  if (!currentUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView onNavigate={setActiveTab} />;
      case 'queue':
        return <LiveQueueView />;
      case 'crowd':
        return <CrowdManagementView />;
      case 'departments':
        return <DepartmentsView />;
      case 'counters':
        return <CountersView />;
      case 'staff':
        return <StaffView />;
      case 'visitors':
        return <VisitorsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'alerts':
        return <AlertsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-appBg text-textMain antialiased overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex-col min-w-0 overflow-hidden flex flex-1">
        <Header onOpenAlerts={() => setActiveTab('alerts')} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AdminProvider>
      <DashboardContent />
    </AdminProvider>
  );
};
