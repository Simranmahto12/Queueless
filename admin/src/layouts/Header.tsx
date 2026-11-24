import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import { ConnectionStatusBadge } from '../components/ConnectionStatusBadge';
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
    currentUser,
    logout,
  } = useAdmin();

  const unreadAlerts = alerts.filter((a) => !a.isAcknowledged);

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
        <ConnectionStatusBadge connectionState={connectionState} />

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
