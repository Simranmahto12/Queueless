import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from 'react-router-dom';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Sidebar, AdminTab } from './layouts/Sidebar';
import { Header } from './layouts/Header';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';
import { Loader2, ShieldAlert, ArrowRight } from 'lucide-react';
import { UserRole } from '@queueless/shared';

// Pages
import { WelcomeView } from './pages/WelcomeView';
import { LoginView } from './pages/LoginView';
import { VisitorLoginView } from './pages/visitor/VisitorLoginView';
import { VisitorRegisterView } from './pages/visitor/VisitorRegisterView';
import { VisitorForgotPasswordView } from './pages/visitor/VisitorForgotPasswordView';
import { VisitorDashboardView } from './pages/visitor/VisitorDashboardView';
import { PublicDisplayView } from './pages/PublicDisplayView';
import { WalkInKioskView } from './pages/WalkInKioskView';
import { CounterStationView } from './pages/CounterStationView';
import { NotFoundView } from './pages/NotFoundView';

// 10 Admin Views
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

/**
 * Full-screen loading indicator for session verification
 */
const AuthLoadingScreen: React.FC = () => (
  <div className="flex flex-1 flex-col items-center justify-center bg-appBg select-none">
    <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-white font-bold text-2xl shadow-md mb-4 border border-navy">
      Q
    </div>
    <div className="flex items-center gap-2.5 text-textMuted text-xs font-medium">
      <Loader2 className="w-4 h-4 animate-spin text-primary" />
      <span>Verifying security credentials & session...</span>
    </div>
  </div>
);

/**
 * Route Guard for Visitor Portal (/visitor/dashboard)
 */
const RequireVisitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthLoading, isVisitor, isAdmin } = useAdmin();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/visitor/login" replace />;
  }

  // If user is institution admin, redirect to admin dashboard
  if (isAdmin && !isVisitor) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Route Guard for Institution Admin Portal (/admin/dashboard)
 */
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthLoading, isAdmin, isVisitor } = useAdmin();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // If a visitor attempts to access administrative screens, block politely
  if (isVisitor && !isAdmin) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-appBg p-6 text-center select-none font-sans">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-4 shadow-sm">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-navy mb-2">Restricted Institution Portal</h2>
        <p className="text-xs text-textMuted max-w-md mx-auto mb-6 leading-relaxed">
          The Institution Admin Portal is reserved for facility staff, queue triage operators, and
          administrators. You are signed in as a visitor.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/visitor/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-blue-700 transition shadow-sm"
          >
            <span>Return to Visitor Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border border-borderSoft bg-white hover:bg-slate-50 transition"
          >
            <span>Sign in with Admin Credentials</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Wrapper for visitor login: auto-redirect if already logged in
 */
const VisitorLoginRoute: React.FC = () => {
  const { currentUser, isVisitor, isAuthLoading } = useAdmin();
  if (isAuthLoading) return <AuthLoadingScreen />;
  if (currentUser && isVisitor) {
    return <Navigate to="/visitor/dashboard" replace />;
  }
  return <VisitorLoginView />;
};

/**
 * Wrapper for admin login: auto-redirect if already logged in as admin
 */
const AdminLoginRoute: React.FC = () => {
  const { currentUser, isAdmin, isAuthLoading } = useAdmin();
  if (isAuthLoading) return <AuthLoadingScreen />;
  if (currentUser && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <LoginView />;
};

/**
 * Institution Admin Workspace (Preserves all views + Counter Station)
 */
const AdminDashboardWorkspace: React.FC = () => {
  const { currentUser } = useAdmin();
  const initialTab: AdminTab =
    currentUser?.role === UserRole.COUNTER_STAFF ? 'counter-station' : 'overview';
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView onNavigate={setActiveTab} />;
      case 'counter-station':
        return <CounterStationView />;
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
    <div className="admin-shell flex bg-appBg text-textMain antialiased overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex-col min-w-0 overflow-hidden flex flex-1">
        <Header onOpenAlerts={() => setActiveTab('alerts')} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {renderCurrentView()}
          </div>
        </main>
      </div>
    </div>
  );
};

const RouteAwareApp: React.FC = () => {
  const { pathname } = useLocation();
  const isDedicatedFullscreenMode =
    pathname === '/display' ||
    pathname === '/tv' ||
    pathname === '/kiosk' ||
    pathname.startsWith('/kiosk/');

  return (
    <div className={isDedicatedFullscreenMode ? undefined : 'app-layout flex min-h-screen flex-col'}>
      <div className={isDedicatedFullscreenMode ? undefined : 'flex flex-1 flex-col'}>
        <Routes>
          {/* Public Root: Welcome Page */}
          <Route path="/" element={<WelcomeView />} />

          {/* Public TV Lobby Display Modes */}
          <Route path="/display" element={<PublicDisplayView />} />
          <Route path="/tv" element={<PublicDisplayView />} />

          {/* Public Walk-In Ticket Kiosks */}
          <Route path="/kiosk" element={<WalkInKioskView />} />
          <Route path="/kiosk/:institutionId" element={<WalkInKioskView />} />
          <Route path="/kiosk/:institutionId/:branchId" element={<WalkInKioskView />} />

          {/* Visitor Routes */}
          <Route path="/visitor/login" element={<VisitorLoginRoute />} />
          <Route path="/visitor/register" element={<VisitorRegisterView />} />
          <Route path="/visitor/forgot-password" element={<VisitorForgotPasswordView />} />
          <Route
            path="/visitor/dashboard"
            element={
              <RequireVisitor>
                <VisitorDashboardView />
              </RequireVisitor>
            }
          />
          <Route path="/visitor" element={<Navigate to="/visitor/dashboard" replace />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginRoute />} />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAdmin>
                <AdminDashboardWorkspace />
              </RequireAdmin>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/counter-station"
            element={
              <RequireAdmin>
                <AdminDashboardWorkspace />
              </RequireAdmin>
            }
          />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </div>
      {!isDedicatedFullscreenMode && <Footer />}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => (
  <AdminProvider>
    <BrowserRouter>
      <RouteAwareApp />
    </BrowserRouter>
  </AdminProvider>
);
