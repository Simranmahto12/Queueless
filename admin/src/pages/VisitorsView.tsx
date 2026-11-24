import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Badge } from '../components/Badge';
import { Search, History, Users, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { AuditAction } from '@queueless/shared';

export const VisitorsView: React.FC = () => {
  const { tokens, departments, auditLogs } = useAdmin();
  const [activeTab, setActiveTab] = useState<'directory' | 'audit'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredVisitors = tokens.filter(
    (t) =>
      t.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.visitorPhone && t.visitorPhone.includes(searchTerm)) ||
      t.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.targetEntityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedByUserId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case AuditAction.TOKEN_CREATED:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            TOKEN CREATED
          </span>
        );
      case AuditAction.TOKEN_STATUS_CHANGE:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            STATUS / QR CHECK-IN
          </span>
        );
      case AuditAction.COUNTER_STATUS_CHANGE:
      case AuditAction.COUNTER_ASSIGNED:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            COUNTER STATION
          </span>
        );
      case AuditAction.SYSTEM_CONFIG_UPDATED:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            SYSTEM CONFIG
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-textMain tracking-tight">
            Visitor Directory & System Audit History
          </h2>
          <p className="text-xs text-textMuted mt-0.5">
            Registered visitors, booking appointments, cryptographic check-in verification, and compliance audit trail
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-borderSoft self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('directory')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'directory'
                ? 'bg-white text-navy shadow-xs border border-borderSoft'
                : 'text-textMuted hover:text-textMain'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Visitor Directory ({tokens.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'audit'
                ? 'bg-white text-navy shadow-xs border border-borderSoft'
                : 'text-textMuted hover:text-textMain'
            }`}
          >
            <History className="w-3.5 h-3.5 text-primary" />
            <span>System History ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-borderSoft shadow-subtle max-w-md flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'directory'
                ? 'Filter by visitor name, phone, or token...'
                : 'Search audit history by event, actor, token, or details...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-textMain bg-transparent focus:outline-none placeholder:text-slate-400"
          />
        </div>

        {activeTab === 'audit' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-textMuted font-medium">Filter Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs bg-white border border-borderSoft rounded-xl px-3 py-2 text-textMain focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
            >
              <option value="ALL">All Event Types</option>
              <option value={AuditAction.TOKEN_CREATED}>Token Created</option>
              <option value={AuditAction.TOKEN_STATUS_CHANGE}>Status / QR Check-In</option>
              <option value={AuditAction.COUNTER_STATUS_CHANGE}>Counter Station</option>
              <option value={AuditAction.SYSTEM_CONFIG_UPDATED}>System Config</option>
            </select>
          </div>
        )}
      </div>

      {/* Active Tab Content */}
      {activeTab === 'directory' ? (
        <div className="bg-white rounded-xl border border-borderSoft shadow-subtle overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-borderSoft text-textMuted font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Visitor Name</th>
                <th className="py-3 px-4">Contact & SMS</th>
                <th className="py-3 px-4">Latest Token</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Booking Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSoft">
              {filteredVisitors.length > 0 ? (
                filteredVisitors.map((t) => {
                  const dept = departments.find((d) => d.departmentId === t.departmentId);
                  return (
                    <tr key={t.tokenId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-textMain">{t.visitorName}</td>
                      <td className="py-3 px-4 text-textMuted font-mono">
                        {t.visitorPhone || t.visitorEmail || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-navy">{t.tokenNumber}</td>
                      <td className="py-3 px-4 text-textMain">{dept?.name || t.departmentId}</td>
                      <td className="py-3 px-4 text-textMuted">
                        {t.scheduledSlot.date} {t.scheduledSlot.startTime}
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={t.status} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-textMuted">
                    No matching visitors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* System Audit History Table */
        <div className="bg-white rounded-xl border border-borderSoft shadow-subtle overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-borderSoft text-textMuted font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor / Role</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">System Narrative & Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSoft">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.logId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-textMuted whitespace-nowrap text-[11px]">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4 text-textMain whitespace-nowrap">
                      <span className="font-semibold">{log.performedByUserId}</span>
                      <span className="block text-[10px] text-textMuted uppercase font-mono">
                        {log.performedByRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-navy whitespace-nowrap">
                      {log.targetEntity}: {log.targetEntityId}
                    </td>
                    <td className="py-3 px-4 text-textMain text-xs leading-relaxed max-w-lg">
                      {log.details || 'Event logged in system history.'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-textMuted">
                    No system audit logs match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
