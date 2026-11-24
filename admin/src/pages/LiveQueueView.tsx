import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Token, TokenStatus, TokenPriority } from '@queueless/shared';
import {
  Search,
  PhoneCall,
  Check,
  SkipForward,
  XCircle,
  RotateCcw,
  Filter,
  QrCode,
  AlertTriangle,
  Sparkles,
  Clock,
  User,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

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
    checkInToken,
    undoTokenAction,
    addToast,
  } = useAdmin();

  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Token for Modals
  const [actionToken, setActionToken] = useState<Token | null>(null);

  // Cancellation Modal & Reason Chips
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>(
    'Visitor Requested Cancellation'
  );
  const [customCancelNote, setCustomCancelNote] = useState<string>('');

  // Skip Modal & Reason Chips
  const [skipModalOpen, setSkipModalOpen] = useState<boolean>(false);
  const [selectedSkipReason, setSelectedSkipReason] = useState<string>(
    'No Show — configured call attempts completed'
  );
  const [customSkipNote, setCustomSkipNote] = useState<string>('');

  // 5-Second Undo Tracking
  const [lastActionUndo, setLastActionUndo] = useState<{
    tokenId: string;
    tokenNumber: string;
    previousStatus: TokenStatus;
    counterId?: string;
  } | null>(null);

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

  const handleOpenSkipModal = (token: Token) => {
    setActionToken(token);
    setSelectedSkipReason('No Show — configured call attempts completed');
    setCustomSkipNote('');
    setSkipModalOpen(true);
  };

  const handleExecuteSkip = async () => {
    if (!actionToken) return;
    const previousStatus = actionToken.status;
    const finalReason =
      selectedSkipReason === 'Other' && customSkipNote.trim()
        ? `Other: ${customSkipNote.trim()}`
        : selectedSkipReason;

    try {
      await skipToken(actionToken.tokenId, actionToken.assignedCounterId, finalReason);
      setSkipModalOpen(false);

      // Register 5-second undoable state
      const undoPayload = {
        tokenId: actionToken.tokenId,
        tokenNumber: actionToken.tokenNumber,
        previousStatus,
        counterId: actionToken.assignedCounterId,
      };
      setLastActionUndo(undoPayload);

      addToast(
        'warning',
        `Token ${actionToken.tokenNumber} skipped (${finalReason}). Undo available for 5s.`
      );

      setTimeout(() => {
        setLastActionUndo((prev) => (prev?.tokenId === undoPayload.tokenId ? null : prev));
      }, 5000);
    } catch (err: unknown) {
      addToast('danger', err instanceof Error ? err.message : 'Failed to skip token.');
    }
  };

  const handleExecuteUndo = async () => {
    if (!lastActionUndo) return;
    try {
      await undoTokenAction(
        lastActionUndo.tokenId,
        lastActionUndo.previousStatus,
        lastActionUndo.counterId
      );
      addToast(
        'success',
        `Action reversed. Token ${lastActionUndo.tokenNumber} restored to ${lastActionUndo.previousStatus}.`
      );
      setLastActionUndo(null);
    } catch (err: unknown) {
      addToast('danger', err instanceof Error ? err.message : 'Undo failed.');
    }
  };

  const handleOpenCancelModal = (token: Token) => {
    setActionToken(token);
    setSelectedCancelReason('Visitor Requested Cancellation');
    setCustomCancelNote('');
    setCancelModalOpen(true);
  };

  const handleExecuteCancel = async () => {
    if (!actionToken) return;
    const finalReason =
      selectedCancelReason === 'Other' && customCancelNote.trim()
        ? `Other: ${customCancelNote.trim()}`
        : selectedCancelReason;

    try {
      await cancelToken(actionToken.tokenId, finalReason);
      setCancelModalOpen(false);
      addToast('info', `Token ${actionToken.tokenNumber} cancelled.`);
    } catch (err: unknown) {
      addToast('danger', err instanceof Error ? err.message : 'Cancellation failed.');
    }
  };

  const renderPriorityBadge = (priority: TokenPriority) => {
    switch (priority) {
      case TokenPriority.EMERGENCY:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black bg-red-100 text-red-900 border border-red-300">
            <AlertTriangle className="w-3.5 h-3.5 text-red-700 shrink-0" />
            <span>EMERGENCY</span>
          </span>
        );
      case TokenPriority.VIP:
      case TokenPriority.SENIOR_CITIZEN:
      case TokenPriority.PERSON_WITH_DISABILITY:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>SENIOR CITIZEN</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            <span>NORMAL</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy tracking-tight">Live Queue Management</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Monitor, triage, and summon visitor tokens across physical and virtual desks
          </p>
        </div>

        {/* Quick Call Next Button for first available counter */}
        {openCounters.length > 0 && (
          <div className="flex items-center gap-3">
            <select
              id="quick-counter-select"
              className="text-sm bg-white border border-borderSoft rounded-xl px-3 py-2.5 font-bold text-navy focus:outline-none"
              defaultValue={openCounters[0].counterId}
            >
              {openCounters.map((c) => (
                <option key={c.counterId} value={c.counterId}>
                  {c.counterNumber} (Desk)
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const el = document.getElementById('quick-counter-select') as HTMLSelectElement;
                if (el) callNextToken(el.value);
              }}
              className="h-11 px-5 rounded-xl bg-navy hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition inline-flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Next Token</span>
            </button>
          </div>
        )}
      </div>

      {/* 5-Second Undo Banner */}
      {lastActionUndo && (
        <div className="bg-amber-500 text-slate-950 font-bold px-6 py-3.5 rounded-2xl flex items-center justify-between gap-4 text-sm shadow-md animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-slate-950" />
            <span>
              Token {lastActionUndo.tokenNumber} was marked as skipped. Accidental action?
            </span>
          </div>
          <button
            onClick={handleExecuteUndo}
            className="px-4 py-1.5 rounded-xl bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold transition shadow-sm"
          >
            Undo (5s)
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-borderSoft shadow-subtle">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by token #, visitor name, or mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm text-textMain bg-transparent focus:outline-none placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-borderSoft rounded-xl px-3 py-2 text-xs text-textMain font-semibold focus:outline-none cursor-pointer"
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
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-borderSoft rounded-xl px-3 py-2 text-xs text-textMain font-semibold focus:outline-none cursor-pointer"
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
      <div className="bg-white rounded-2xl border border-borderSoft shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-borderSoft bg-slate-50/75 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Token #</th>
                <th className="py-3.5 px-4">Visitor Details</th>
                <th className="py-3.5 px-4">Department & Procedure</th>
                <th className="py-3.5 px-4">Priority Tier</th>
                <th className="py-3.5 px-4">Arrival Slot</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Counter</th>
                <th className="py-3.5 px-4 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSoft text-sm">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                    No matching queue tokens found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((token) => {
                  const dept = departments.find((d) => d.departmentId === token.departmentId);
                  const srv = services.find((s) => s.serviceId === token.serviceId);

                  return (
                    <tr key={token.tokenId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Token # */}
                      <td className="py-4 px-4 font-mono font-bold text-navy text-base">
                        {token.tokenNumber}
                      </td>

                      {/* Visitor Details */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 text-sm">
                          {token.visitorName || 'Walk-in Visitor'}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {token.visitorPhone || 'No contact phone'}
                        </div>
                      </td>

                      {/* Department & Procedure */}
                      <td className="py-4 px-4">
                        <div className="text-slate-800 font-semibold text-sm">
                          {dept?.name || token.departmentId}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {srv?.name || token.serviceId}
                        </div>
                      </td>

                      {/* Priority Tier */}
                      <td className="py-4 px-4">
                        {renderPriorityBadge(token.priority)}
                      </td>

                      {/* Arrival Slot */}
                      <td className="py-4 px-4 text-slate-600 font-mono text-xs">
                        {token.scheduledSlot?.date} &bull; {token.scheduledSlot?.startTime}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <Badge status={token.status} />
                      </td>

                      {/* Counter */}
                      <td className="py-4 px-4 text-slate-700 font-bold text-xs">
                        {token.assignedCounterNumber || (
                          <span className="text-slate-400 font-normal">Unassigned</span>
                        )}
                      </td>

                      {/* Redesigned Prominent Operational Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* When CALLED: Prominent [COMPLETE], [SKIP], [RECALL] buttons */}
                          {token.status === TokenStatus.CALLED && (
                            <>
                              <button
                                onClick={() => markTokenServed(token.tokenId)}
                                className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                                title="Complete visit"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Complete</span>
                              </button>

                              <button
                                onClick={() => handleOpenSkipModal(token)}
                                className="h-10 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                                title="Skip / No-Show"
                              >
                                <SkipForward className="w-3.5 h-3.5" />
                                <span>Skip</span>
                              </button>

                              <button
                                onClick={() => recallToken(token.tokenId)}
                                className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-borderSoft transition flex items-center gap-1.5"
                                title="Re-broadcast chime and announcement"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Recall</span>
                              </button>
                            </>
                          )}

                          {/* When IN_PROGRESS */}
                          {token.status === TokenStatus.IN_PROGRESS && (
                            <button
                              onClick={() => markTokenServed(token.tokenId)}
                              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete Service</span>
                            </button>
                          )}

                          {/* When ISSUED or WAITING: Check-In or Cancel */}
                          {(token.status === TokenStatus.ISSUED || token.status === TokenStatus.WAITING) && (
                            <button
                              onClick={() => checkInToken(token.tokenId)}
                              className="h-10 px-3.5 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                              title="Verify QR Check-In"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Check-In</span>
                            </button>
                          )}

                          {(token.status === TokenStatus.WAITING || token.status === TokenStatus.CHECKED_IN) && (
                            <button
                              onClick={() => handleOpenCancelModal(token)}
                              className="h-10 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition flex items-center gap-1.5"
                              title="Cancel Token"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
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

      {/* Preset Reason Chips Skip Modal */}
      {skipModalOpen && actionToken && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-borderSoft relative">
            <h3 className="text-lg font-bold text-navy mb-1">
              Skip Token {actionToken.tokenNumber}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Select an operational preset reason for skipping this visitor.
            </p>

            <div className="space-y-2.5">
              {[
                'No Show — configured call attempts completed',
                'Missing Documents',
                'Visitor Left',
                'Other',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedSkipReason(reason)}
                  className={`w-full p-3 rounded-xl text-xs font-bold text-left border-2 transition ${
                    selectedSkipReason === reason
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-borderSoft bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {reason}
                </button>
              ))}

              {selectedSkipReason === 'Other' && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={customSkipNote}
                    onChange={(e) => setCustomSkipNote(e.target.value)}
                    placeholder="Enter specific note..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-borderSoft rounded-xl focus:bg-white focus:outline-none focus:border-primary text-textMain"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-borderSoft flex gap-3">
              <button
                type="button"
                onClick={() => setSkipModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-borderSoft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSkip}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition shadow-sm"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preset Reason Chips Cancellation Modal */}
      {cancelModalOpen && actionToken && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-borderSoft relative">
            <h3 className="text-lg font-bold text-navy mb-1">
              Cancel Token {actionToken.tokenNumber}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Select an authorized reason for cancelling this booking.
            </p>

            <div className="space-y-2.5">
              {[
                'Visitor Requested Cancellation',
                'Service Unavailable',
                'Duplicate Booking',
                'Other',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedCancelReason(reason)}
                  className={`w-full p-3 rounded-xl text-xs font-bold text-left border-2 transition ${
                    selectedCancelReason === reason
                      ? 'border-rose-500 bg-rose-50 text-rose-800'
                      : 'border-borderSoft bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {reason}
                </button>
              ))}

              {selectedCancelReason === 'Other' && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={customCancelNote}
                    onChange={(e) => setCustomCancelNote(e.target.value)}
                    placeholder="Enter specific note..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-borderSoft rounded-xl focus:bg-white focus:outline-none focus:border-rose-500 text-textMain"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-borderSoft flex gap-3">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-borderSoft"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
