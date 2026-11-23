import React from 'react';
import { Bell, Database, LogOut } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

interface HeaderProps {
  onOpenAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAlerts }) => {
  const {
    institutions,
    currentInstitution,
    setCurrentInstitution,
    branches,
    currentBranch,
    setCurrentBranch,
    alerts,
    connectionState,
    seedDatabase,
    currentUser,
    logout,
  } = useAdmin();

  const unreadAlerts = alerts.filter((a) => !a.isAcknowledged);

  const getConnectionBadge = () => {
    switch (connectionState) {
      case 'LIVE_PROJECT':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Firestore Live</span>
          </div>
        );
      case 'LOCAL_EMULATOR':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Firebase Emulator</span>
          </div>
        );
      default:
        return (
          <div
            title="Running on real-time synchronized local engine. Provide Firebase credentials in .env to bind to a cloud Firestore instance."
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 cursor-help"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Local Sync Engine</span>
          </div>
        );
    }
  };

  return (
    <header className="h-16 border-b border-borderSoft bg-white px-6 flex items-center justify-between z-10 select-none">
      {/* Institution & Branch Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-borderSoft px-3 py-1.5 rounded-lg">
          <span className="text-xs text-textMuted">Institution:</span>
          <select
            value={currentInstitution.institutionId}
            onChange={(e) => {
              const selected = institutions.find((i) => i.institutionId === e.target.value);
              if (selected) setCurrentInstitution(selected);
            }}
            className="bg-transparent text-xs font-semibold text-textMain focus:outline-none cursor-pointer"
          >
            {institutions.map((inst) => (
              <option key={inst.institutionId} value={inst.institutionId}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-borderSoft px-3 py-1.5 rounded-lg">
          <span className="text-xs text-textMuted">Branch:</span>
          <select
            value={currentBranch.branchId}
            onChange={(e) => {
              const selected = branches.find((b) => b.branchId === e.target.value);
              if (selected) setCurrentBranch(selected);
            }}
            className="bg-transparent text-xs font-semibold text-textMain focus:outline-none cursor-pointer"
          >
            {branches.map((b) => (
              <option key={b.branchId} value={b.branchId}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Operational Indicators & Actions */}
      <div className="flex items-center gap-3">
        {getConnectionBadge()}

        {/* Database Seeder Button */}
        <button
          onClick={seedDatabase}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors"
          title="Seed initial multi-sector documents into Firestore"
        >
          <Database className="w-3.5 h-3.5 text-navy" />
          <span>Seed Firestore</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Active Operational Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlerts.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>

        {/* Current User Pill & Sign Out */}
        {currentUser && (
          <div className="hidden md:flex items-center pl-2 border-l border-borderSoft gap-2">
            <span className="text-xs font-medium text-slate-600 truncate max-w-[120px]">
              {currentUser.displayName}
            </span>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
