import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Flame,
  Building2,
  Inbox,
  UserCheck,
  Users,
  BarChart3,
  AlertTriangle,
  Settings,
  LogOut,
  PhoneCall,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { UserRole } from '@queueless/shared';

export type AdminTab =
  | 'overview'
  | 'counter-station'
  | 'queue'
  | 'crowd'
  | 'departments'
  | 'counters'
  | 'staff'
  | 'visitors'
  | 'analytics'
  | 'alerts'
  | 'settings';

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { alerts, tokens, currentInstitution, currentUser, logout } = useAdmin();

  const unreadAlertsCount = alerts.filter((a) => !a.isAcknowledged).length;
  const waitingTokensCount = tokens.filter(
    (t) => t.status === 'WAITING' || t.status === 'CHECKED_IN'
  ).length;

  const allNavItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'counter-station',
      label: 'Counter Station',
      icon: <PhoneCall className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'queue',
      label: 'Live Queue',
      icon: <Layers className="w-4 h-4" />,
      badge: waitingTokensCount > 0 ? waitingTokensCount : undefined,
    },
    { id: 'crowd', label: 'Crowd & Heatmap', icon: <Flame className="w-4 h-4" /> },
    { id: 'departments', label: 'Departments', icon: <Building2 className="w-4 h-4" /> },
    { id: 'counters', label: 'Counters', icon: <Inbox className="w-4 h-4" /> },
    { id: 'staff', label: 'Staff Management', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'visitors', label: 'Visitors', icon: <Users className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    {
      id: 'alerts',
      label: 'Alerts & Safety',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
    },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  // Role-based navigation filtering:
  // COUNTER_STAFF only see Counter Station and Live Queue; no analytics, no staff provisioning, no settings
  const navItems =
    currentUser?.role === UserRole.COUNTER_STAFF
      ? allNavItems.filter((item) => ['counter-station', 'queue'].includes(item.id))
      : allNavItems;

  // User initials
  const initials = currentUser?.displayName
    ? currentUser.displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AD';

  const roleDisplay = currentUser?.role ? currentUser.role.replace(/_/g, ' ') : 'Administrator';

  return (
    <aside className="w-64 border-r border-borderSoft bg-white flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-borderSoft flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white font-bold text-base shadow-subtle">
            Q
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-textMain text-sm tracking-tight leading-none">QueueLess</h1>
            <p className="text-[11px] text-textMuted font-medium truncate mt-1">
              {currentInstitution.name}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-navy text-white shadow-subtle'
                    : 'text-textMuted hover:text-textMain hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.id === 'alerts'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Authenticated Profile Footer with Sign Out */}
      <div className="p-3.5 border-t border-borderSoft bg-slate-50/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-navy/10 text-navy font-bold text-xs flex items-center justify-center border border-navy/20 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 truncate">
            <p className="text-xs font-semibold text-textMain truncate">
              {currentUser?.displayName || 'Administrator'}
            </p>
            <p className="text-[10px] text-textMuted uppercase font-medium tracking-tight truncate">
              {roleDisplay}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out of Admin Console"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
