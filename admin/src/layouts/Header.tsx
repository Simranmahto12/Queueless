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
    connectionHealth,
    connectionError,
    isSyncing,
    forceSync,
    currentUser,
    logout,
  } = useAdmin();

  const unreadAlerts = alerts.filter((a) => !a.isAcknowledged);

  return (
    <header className="h-[52px] min-h-[52px] border-b border-borderSoft bg-white px-5 flex items-center justify-between z-10 select-none">
      {/* Institution & Branch Selector */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-borderSoft px-2.5 py-1 rounded-md min-w-0">
          <span className="text-[10px] text-textMuted whitespace-nowrap">Institution:</span>
          <select
            value={currentInstitution.institutionId}
            onChange={(e) => {
              const selected = institutions.find((i) => i.institutionId === e.target.value);
              if (selected) setCurrentInstitution(selected);
            }}
            className="bg-transparent text-[10px] font-semibold text-textMain focus:outline-none cursor-pointer max-w-[190px]"
          >
            {institutions.map((inst) => (
              <option key={inst.institutionId} value={inst.institutionId}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-borderSoft px-2.5 py-1 rounded-md min-w-0">
          <span className="text-[10px] text-textMuted whitespace-nowrap">Branch:</span>
          <select
            value={currentBranch.branchId}
            onChange={(e) => {
              const selected = branches.find((b) => b.branchId === e.target.value);
              if (selected) setCurrentBranch(selected);
            }}
            className="bg-transparent text-[10px] font-semibold text-textMain focus:outline-none cursor-pointer max-w-[165px]"
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
      <div className="flex items-center gap-2">
        <ConnectionStatusBadge
          connectionState={connectionState}
          connectionHealth={connectionHealth}
          connectionError={connectionError}
          onForceSync={forceSync}
          isSyncing={isSyncing}
        />

        {/* Notifications Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
          title="Active Operational Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlerts.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>

        {/* Current User Pill & Sign Out */}
        {currentUser && (
          <div className="hidden md:flex items-center pl-2 border-l border-borderSoft gap-2 shrink-0">
            <div className="w-7 h-7 rounded-full bg-navy/10 text-navy flex items-center justify-center text-[10px] font-bold">
              {currentUser.displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="leading-tight">
              <span className="block text-[10px] font-semibold text-textMain truncate max-w-[120px]">
                {currentUser.displayName}
              </span>
              <span className="block text-[8px] uppercase text-textMuted">Institution Admin</span>
            </div>
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
