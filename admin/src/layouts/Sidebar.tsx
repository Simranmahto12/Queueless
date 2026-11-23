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
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export type AdminTab =
  | 'overview'
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
  const { alerts, tokens, currentInstitution } = useAdmin();

  const unreadAlertsCount = alerts.filter((a) => !a.isAcknowledged).length;
  const waitingTokensCount = tokens.filter(
    (t) => t.status === 'WAITING' || t.status === 'CHECKED_IN'
  ).length;

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
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

      {/* Admin Profile Footer */}
      <div className="p-3.5 border-t border-borderSoft bg-slate-50/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-navy/10 text-navy font-semibold text-xs flex items-center justify-center border border-navy/20">
          SA
        </div>
        <div className="flex-1 truncate">
          <p className="text-xs font-semibold text-textMain truncate">Sarah Jenkins</p>
          <p className="text-[11px] text-textMuted truncate">Lead Operations Admin</p>
        </div>
      </div>
    </aside>
  );
};
