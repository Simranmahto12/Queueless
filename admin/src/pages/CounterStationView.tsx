import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PhoneCall,
  CheckCircle2,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Keyboard,
  Clock,
  Sparkles,
  AlertTriangle,
  User,
  ShieldAlert,
  ArrowRight,
  Inbox,
  Check,
  X,
  Info,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import {
  Token,
  TokenStatus,
  TokenPriority,
  CounterStatus,
  Counter,
} from '@queueless/shared';
import { audioChimes } from '../utils/audioChimes';

export const CounterStationView: React.FC = () => {
  const {
    currentUser,
    counters,
    tokens,
    departments,
    services,
    callNextToken,
    markTokenServed,
    skipToken,
    recallToken,
    updateCounterStatus,
    undoTokenAction,
    addToast,
  } = useAdmin();

  // Active Counter Selection
  const defaultCounter = useMemo(() => {
    if (currentUser?.assignedCounterId) {
      const match = counters.find((c) => c.counterId === currentUser.assignedCounterId);
      if (match) return match;
    }
    const openCounter = counters.find((c) => c.status === CounterStatus.OPEN);
    return openCounter || counters[0] || null;
  }, [counters, currentUser]);

  const [selectedCounterId, setSelectedCounterId] = useState<string>(
    defaultCounter?.counterId || ''
  );

  useEffect(() => {
    if (defaultCounter && !selectedCounterId) {
      setSelectedCounterId(defaultCounter.counterId);
    }
  }, [defaultCounter, selectedCounterId]);

  const activeCounter = useMemo(() => {
    return counters.find((c) => c.counterId === selectedCounterId) || counters[0] || null;
  }, [counters, selectedCounterId]);

  // Audio Mute State
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Skip Reason Modal State
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
    counterId: string;
    expiresAt: number;
  } | null>(null);

  // Derive Current Token at Active Counter
  const currentToken = useMemo(() => {
    if (!activeCounter) return null;

    // First check counter.currentServedTokenId
    if (activeCounter.currentServedTokenId) {
      const match = tokens.find((t) => t.tokenId === activeCounter.currentServedTokenId);
      if (match && [TokenStatus.CALLED, TokenStatus.IN_PROGRESS].includes(match.status)) {
        return match;
      }
    }

    // Otherwise find token assigned to this counter with CALLED or IN_PROGRESS
    const assigned = tokens.find(
      (t) =>
        t.assignedCounterId === activeCounter.counterId &&
        [TokenStatus.CALLED, TokenStatus.IN_PROGRESS].includes(t.status)
    );
    return assigned || null;
  }, [tokens, activeCounter]);

  // Derive Next Eligible Tokens for This Department / Counter
  const nextTokens = useMemo(() => {
    if (!activeCounter) return [];
    return tokens
      .filter((t) => {
        if (![TokenStatus.ISSUED, TokenStatus.WAITING, TokenStatus.CHECKED_IN].includes(t.status)) {
          return false;
        }
        if (activeCounter.departmentId && t.departmentId !== activeCounter.departmentId) {
          return false;
        }
        return true;
      })
      .slice(0, 5);
  }, [tokens, activeCounter]);

  // Helper Resolution
  const getDepartmentName = (deptId: string): string => {
    const d = departments.find((dept) => dept.departmentId === deptId);
    return d ? d.name : 'General Department';
  };

  const getServiceName = (serviceId: string): string => {
    const s = services.find((srv) => srv.serviceId === serviceId);
    return s ? s.name : 'Standard Service';
  };

  // Primary Operations
  const handleCallNext = useCallback(async () => {
    if (!activeCounter) return;
    try {
      await callNextToken(activeCounter.counterId);
      audioChimes.playCallChime();
    } catch (err: unknown) {
      addToast('warning', err instanceof Error ? err.message : 'No eligible token waiting in queue.');
    }
  }, [activeCounter, callNextToken, addToast]);

  const handleCompleteCurrent = useCallback(async () => {
    if (!currentToken) return;
    try {
      await markTokenServed(currentToken.tokenId);
      audioChimes.playCompleteChime();
      addToast('success', `Token ${currentToken.tokenNumber} marked as completed.`);
    } catch (err: unknown) {
      addToast('danger', err instanceof Error ? err.message : 'Unable to complete token.');
    }
  }, [currentToken, markTokenServed, addToast]);

  const handleOpenSkipModal = useCallback(() => {
    if (!currentToken) return;
    setSkipModalOpen(true);
  }, [currentToken]);

  const handleExecuteSkip = async () => {
    if (!currentToken || !activeCounter) return;
    const previousStatus = currentToken.status;
    const finalReason =
      selectedSkipReason === 'Other' && customSkipNote.trim()
        ? `Other: ${customSkipNote.trim()}`
        : selectedSkipReason;

    try {
      await skipToken(currentToken.tokenId, activeCounter.counterId, finalReason);
      audioChimes.playSkipChime();
      setSkipModalOpen(false);

      // Register 5-second undoable state
      const undoPayload = {
        tokenId: currentToken.tokenId,
        tokenNumber: currentToken.tokenNumber,
        previousStatus,
        counterId: activeCounter.counterId,
        expiresAt: Date.now() + 5000,
      };
      setLastActionUndo(undoPayload);

      addToast(
        'warning',
        `Token ${currentToken.tokenNumber} skipped (${finalReason}). Undo available for 5 seconds.`
      );

      // Auto-clear undo state after 5 seconds
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
        `Undo successful! Token ${lastActionUndo.tokenNumber} restored to ${lastActionUndo.previousStatus}.`
      );
      setLastActionUndo(null);
    } catch (err: unknown) {
      addToast('danger', err instanceof Error ? err.message : 'Undo could not be completed.');
    }
  };

  const handleRecallCurrent = useCallback(async () => {
    if (!currentToken) return;
    try {
      await recallToken(currentToken.tokenId);
      audioChimes.playRecallChime();
    } catch (err: unknown) {
      addToast('danger', err instanceof Error ? err.message : 'Unable to recall token.');
    }
  }, [currentToken, recallToken, addToast]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts while typing in inputs, textareas, or selects
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement;

      if (isInput) return;
      if (e.repeat) return; // Prevent key-holding repeats

      if (e.code === 'Space') {
        e.preventDefault();
        handleCallNext();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        handleCompleteCurrent();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleOpenSkipModal();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRecallCurrent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCallNext, handleCompleteCurrent, handleOpenSkipModal, handleRecallCurrent]);

  const getPriorityBadge = (priority: TokenPriority) => {
    switch (priority) {
      case TokenPriority.EMERGENCY:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border-2 border-rose-300 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>EMERGENCY PRIORITY</span>
          </span>
        );
      case TokenPriority.VIP:
      case TokenPriority.SENIOR_CITIZEN:
      case TokenPriority.PERSON_WITH_DISABILITY:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>SENIOR CITIZEN / PRIORITY</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>NORMAL PRIORITY</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Top Counter Bar */}
      <div className="bg-white rounded-2xl border border-borderSoft p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-navy text-white flex items-center justify-center font-bold shadow-sm">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-navy">Counter Station</h2>
              {activeCounter && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    activeCounter.status === CounterStatus.OPEN
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : activeCounter.status === CounterStatus.PAUSED
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {activeCounter.status}
                </span>
              )}
            </div>
            <p className="text-xs text-textMuted mt-0.5">
              Distraction-free front-desk triage and queue control
            </p>
          </div>
        </div>

        {/* Counter Selection & Controls */}
        <div className="flex items-center gap-3">
          {/* Audio Chime Mute Button */}
          <button
            onClick={() => {
              const newMuted = !isAudioMuted;
              setIsAudioMuted(newMuted);
              audioChimes.setMuted(newMuted);
            }}
            className={`p-2.5 rounded-xl border transition ${
              isAudioMuted
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 text-slate-700 border-borderSoft hover:bg-slate-100'
            }`}
            title={isAudioMuted ? 'Chimes Muted' : 'Chimes Enabled'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>

          {/* Counter Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-borderSoft px-3 py-2 rounded-xl text-xs">
            <span className="text-textMuted font-medium">Operating:</span>
            <select
              value={selectedCounterId}
              onChange={(e) => setSelectedCounterId(e.target.value)}
              className="bg-transparent font-bold text-navy focus:outline-none cursor-pointer"
            >
              {counters.map((c) => (
                <option key={c.counterId} value={c.counterId}>
                  {c.counterNumber} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Counter Status Toggle */}
          {activeCounter && (
            <button
              onClick={() => {
                const nextStatus =
                  activeCounter.status === CounterStatus.OPEN
                    ? CounterStatus.PAUSED
                    : CounterStatus.OPEN;
                updateCounterStatus(activeCounter.counterId, nextStatus);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-borderSoft bg-white hover:bg-slate-50 transition"
            >
              Set {activeCounter.status === CounterStatus.OPEN ? 'Pause' : 'Open'}
            </button>
          )}
        </div>
      </div>

      {/* 5-Second Undo Banner */}
      {lastActionUndo && (
        <div className="bg-amber-500 text-slate-950 font-bold px-6 py-3 rounded-2xl flex items-center justify-between gap-4 text-sm shadow-md animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-slate-950" />
            <span>
              Token {lastActionUndo.tokenNumber} was skipped. Revert accidental skip?
            </span>
          </div>
          <button
            onClick={handleExecuteUndo}
            className="px-4 py-1.5 rounded-xl bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold transition shadow-sm"
          >
            Undo (Restore Token)
          </button>
        </div>
      )}

      {/* Main Grid: Station Focus & Next in Line */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Huge Current Token Display & Actions (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-borderSoft p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-borderSoft">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-textMuted">
                  Current Token At Desk
                </span>
              </div>
              <div className="px-3 py-1 rounded-xl bg-slate-100 text-navy font-bold text-xs">
                {activeCounter?.counterNumber || 'Counter Desk'}
              </div>
            </div>

            {/* Current Token Display */}
            {currentToken ? (
              <div className="py-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {getPriorityBadge(currentToken.priority)}
                  <span className="text-xs text-textMuted font-mono">
                    Booked slot: {currentToken.scheduledSlot?.startTime} - {currentToken.scheduledSlot?.endTime}
                  </span>
                </div>

                <div className="text-center py-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-textMuted">
                    Serving Token
                  </div>
                  {/* Huge 64px Token Number */}
                  <div className="text-6xl sm:text-7xl lg:text-8xl font-black font-mono tracking-tight text-navy">
                    {currentToken.tokenNumber}
                  </div>
                  <div className="text-sm font-semibold text-textMain pt-2">
                    {getDepartmentName(currentToken.departmentId)} &bull; {getServiceName(currentToken.serviceId)}
                  </div>
                </div>

                {/* Visitor Details Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-textMuted block">Visitor</span>
                    <span className="font-bold text-navy text-sm">
                      {currentToken.visitorName || 'Walk-in Visitor'}
                    </span>
                  </div>
                  <div>
                    <span className="text-textMuted block">Status</span>
                    <span className="font-bold text-emerald-700 capitalize">
                      {currentToken.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-textMuted block">Arrival Info</span>
                    <span className="font-semibold text-textMain">
                      {currentToken.checkedInAt ? 'Checked in on-site' : 'Pending physical scan'}
                    </span>
                  </div>
                </div>

                {/* Primary Action Controls */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                  {/* COMPLETE (Enter) */}
                  <button
                    onClick={handleCompleteCurrent}
                    className="h-14 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition flex flex-col items-center justify-center active:scale-98"
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>COMPLETE</span>
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">[Enter]</span>
                  </button>

                  {/* CALL NEXT (Space) */}
                  <button
                    onClick={handleCallNext}
                    className="h-14 px-4 rounded-2xl bg-primary hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition flex flex-col items-center justify-center active:scale-98"
                  >
                    <span className="flex items-center gap-1.5">
                      <PhoneCall className="w-4 h-4" />
                      <span>CALL NEXT</span>
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">[Space]</span>
                  </button>

                  {/* SKIP (S) */}
                  <button
                    onClick={handleOpenSkipModal}
                    className="h-14 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition flex flex-col items-center justify-center active:scale-98"
                  >
                    <span className="flex items-center gap-1.5">
                      <SkipForward className="w-4 h-4" />
                      <span>SKIP</span>
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">[S]</span>
                  </button>

                  {/* RECALL (R) */}
                  <button
                    onClick={handleRecallCurrent}
                    className="h-14 px-4 rounded-2xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition flex flex-col items-center justify-center active:scale-98"
                  >
                    <span className="flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4" />
                      <span>RECALL</span>
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">[R]</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-textMuted mx-auto">
                  <PhoneCall className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-navy">
                    {activeCounter?.counterNumber || 'Counter'} is Ready
                  </h3>
                  <p className="text-xs text-textMuted max-w-sm mx-auto mt-1">
                    No visitor is currently summoned at this desk. Press Space or tap Call Next to summon the next queued visitor.
                  </p>
                </div>
                <button
                  onClick={handleCallNext}
                  className="h-14 px-8 rounded-2xl bg-primary hover:bg-blue-700 text-white font-bold text-base shadow-md transition inline-flex items-center justify-center gap-3 active:scale-98"
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>Call Next Token</span>
                  <span className="text-xs bg-blue-500/40 px-2 py-0.5 rounded font-mono">[Space]</span>
                </button>
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts Helper Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-borderSoft flex items-center justify-between text-xs text-textMuted">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-primary" />
              <span className="font-semibold text-textMain">Active Desk Shortcuts:</span>
            </div>
            <div className="flex flex-wrap gap-3 font-mono text-[11px]">
              <span><strong className="text-navy">Space:</strong> Call Next</span>
              <span><strong className="text-navy">Enter:</strong> Complete</span>
              <span><strong className="text-navy">S:</strong> Skip</span>
              <span><strong className="text-navy">R:</strong> Recall</span>
            </div>
          </div>
        </div>

        {/* Right Column: Next in Line Queue List (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-borderSoft p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-borderSoft">
              <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
                Next in Queue
              </h3>
              <span className="text-xs text-textMuted font-mono">
                {nextTokens.length} waiting
              </span>
            </div>

            {nextTokens.length > 0 ? (
              <div className="space-y-3">
                {nextTokens.map((t, idx) => (
                  <div
                    key={t.tokenId}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary/40 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg font-black text-navy">
                        {t.tokenNumber}
                      </span>
                      {getPriorityBadge(t.priority)}
                    </div>
                    <div className="text-xs text-textMuted">
                      {getServiceName(t.serviceId)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>{t.visitorName || 'Walk-in'}</span>
                      <span>~{t.estimatedWaitMinutes || 10}m wait</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-textMuted space-y-2">
                <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                <p>Queue for this desk is currently cleared.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skip Reason Selection Modal */}
      {skipModalOpen && currentToken && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-borderSoft relative">
            <button
              onClick={() => setSkipModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-textMuted hover:text-textMain"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-navy mb-1">
              Skip Token {currentToken.tokenNumber}
            </h3>
            <p className="text-xs text-textMuted mb-4">
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
                  className={`w-full p-3 rounded-xl text-xs font-semibold text-left border-2 transition ${
                    selectedSkipReason === reason
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-borderSoft bg-slate-50 text-textMain hover:bg-slate-100'
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
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-textMuted bg-slate-50 hover:bg-slate-100 border border-borderSoft"
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
    </div>
  );
};
