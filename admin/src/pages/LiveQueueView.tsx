import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Token } from '@queueless/shared';
import { TokenStatus } from '@queueless/shared';
import { Search, PhoneCall, Check, SkipForward, XCircle, RotateCcw, Filter } from 'lucide-react';

export const LiveQueueView: React.FC = () => {
  const {
    tokens,
    departments,
    services,
    counters,
    callNextToken,
    markTokenServed,
    skipToken,
    recallToken,
    cancelToken,
  } = useAdmin();

  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Token for Action Modal
  const [actionToken, setActionToken] = useState<Token | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Filter Tokens
  const filteredTokens = tokens.filter((t) => {
    if (selectedDept !== 'ALL' && t.departmentId !== selectedDept) return false;
    if (selectedStatus === 'ACTIVE') {
      if (t.status === TokenStatus.COMPLETED || t.status === TokenStatus.CANCELLED) return false;
    } else if (selectedStatus !== 'ALL' && t.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.tokenNumber.toLowerCase().includes(q) ||
        t.visitorName.toLowerCase().includes(q) ||
        (t.visitorPhone && t.visitorPhone.includes(q))
      );
    }
    return true;
  });

  const openCounters = counters.filter((c) => c.status === 'OPEN');

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-textMain tracking-tight">Live Queue Management</h2>
          <p className="text-xs text-textMuted mt-0.5">
            Monitor and dispatch visitor tokens across physical and virtual desks
          </p>
        </div>

        {/* Quick Call Next Button for first available counter */}
        {openCounters.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              id="quick-counter-select"
              className="text-xs bg-white border border-borderSoft rounded-lg px-2.5 py-2 font-medium text-textMain"
              defaultValue={openCounters[0].counterId}
            >
              {openCounters.map((c) => (
                <option key={c.counterId} value={c.counterId}>
                  {c.counterNumber}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
              icon={<PhoneCall className="w-3.5 h-3.5" />}
              onClick={() => {
                const el = document.getElementById('quick-counter-select') as HTMLSelectElement;
                if (el) callNextToken(el.value);
              }}
            >
              Call Next Token
            </Button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-borderSoft shadow-subtle">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by token #, visitor name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-textMain bg-transparent focus:outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs text-textMuted">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-borderSoft rounded-md px-2 py-1 text-xs text-textMain font-medium focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-textMuted">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-borderSoft rounded-md px-2 py-1 text-xs text-textMain font-medium focus:outline-none"
            >
              <option value="ACTIVE">Active Queued</option>
              <option value="ALL">All Statuses</option>
              <option value="WAITING">Waiting</option>
              <option value="CALLED">Called</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="NO_SHOW">No Show / Skipped</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="bg-white rounded-xl border border-borderSoft shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-borderSoft text-textMuted font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-4">Visitor</th>
                <th className="py-3 px-4">Department & Service</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Scheduled Slot</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Counter</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSoft">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-textMuted">
                    No tokens found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((token) => {
                  const dept = departments.find((d) => d.departmentId === token.departmentId);
                  const srv = services.find((s) => s.serviceId === token.serviceId);

                  return (
                    <tr key={token.tokenId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-textMain text-sm">
                        {token.tokenNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-textMain">{token.visitorName}</div>
                        <div className="text-[11px] text-textMuted">{token.visitorPhone || 'No phone'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-textMain font-medium">{dept?.name || token.departmentId}</div>
                        <div className="text-[11px] text-textMuted">{srv?.name || token.serviceId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            token.priority === 'EMERGENCY'
                              ? 'bg-red-100 text-red-800'
                              : token.priority === 'SENIOR_CITIZEN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {token.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-textMuted font-mono">
                        {token.scheduledSlot.date} {token.scheduledSlot.startTime}
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={token.status} />
                      </td>
                      <td className="py-3 px-4 text-textMain font-medium">
                        {token.assignedCounterNumber || (
                          <span className="text-slate-400 text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {token.status === TokenStatus.CALLED && (
                            <>
                              <button
                                onClick={() => recallToken(token.tokenId)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                title="Recall Notification / Chime"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => markTokenServed(token.tokenId)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Mark Completed"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => skipToken(token.tokenId)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                                title="Skip / No Show"
                              >
                                <SkipForward className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {token.status === TokenStatus.IN_PROGRESS && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markTokenServed(token.tokenId)}
                              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            >
                              Complete
                            </Button>
                          )}

                          {(token.status === TokenStatus.WAITING || token.status === TokenStatus.CHECKED_IN) && (
                            <button
                              onClick={() => {
                                setActionToken(token);
                                setCancelModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                              title="Cancel Token"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Token"
        description={`Are you sure you want to cancel token ${actionToken?.tokenNumber}?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelModalOpen(false)}>
              Keep Token
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (actionToken) {
                  cancelToken(actionToken.tokenId, cancelReason);
                  setCancelModalOpen(false);
                  setCancelReason('');
                }
              }}
            >
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-xs font-medium text-textMain">Reason for Cancellation</label>
          <input
            type="text"
            placeholder="e.g. Visitor requested departure, documentation unavailable..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full text-xs p-2.5 border border-borderSoft rounded-lg focus:outline-none focus:ring-1 focus:ring-navy"
          />
        </div>
      </Modal>
    </div>
  );
};
