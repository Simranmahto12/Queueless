import React, { useState } from 'react';
import { AdminProvider } from './context/AdminContext';
import { Sidebar, AdminTab } from './layouts/Sidebar';
import { Header } from './layouts/Header';
import { ToastContainer } from './components/ToastContainer';

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
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
