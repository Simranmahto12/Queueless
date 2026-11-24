import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  Building2,
  ArrowRight,
  Bell,
  Settings,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import {
  Token,
  TokenStatus,
  Counter,
  MOCK_INSTITUTIONS,
  MOCK_BRANCHES,
  MOCK_DEPARTMENTS,
  MOCK_SERVICES,
  listenBranchTokens,
  listenCounters,
} from '@queueless/shared';

export const PublicDisplayView: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Institution & Branch Resolution from URL or default
  const instParam = searchParams.get('institution') || searchParams.get('inst');
  const branchParam = searchParams.get('branch');

  const selectedInstitution = useMemo(() => {
    if (instParam) {
      return (
        MOCK_INSTITUTIONS.find(
          (i) => i.institutionId === instParam || i.slug === instParam
        ) || MOCK_INSTITUTIONS[0]
      );
    }
    return MOCK_INSTITUTIONS[0];
  }, [instParam]);

  const selectedBranch = useMemo(() => {
    const branches = MOCK_BRANCHES.filter(
      (b) => b.institutionId === selectedInstitution.institutionId
    );
    if (branchParam) {
      return branches.find((b) => b.branchId === branchParam) || branches[0] || MOCK_BRANCHES[0];
    }
    return branches[0] || MOCK_BRANCHES[0];
  }, [selectedInstitution, branchParam]);

  // Real-Time Queue & Counters State
  const [tokens, setTokens] = useState<Token[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);

  // Clock
  const [currentTime, setCurrentTime] = useState<string>('');

  // Audio / TTS State
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speechVolume, setSpeechVolume] = useState<number>(1.0);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Visual Call Toast / Fallback Banner
  const [activeCallNotification, setActiveCallNotification] = useState<{
    tokenNumber: string;
    counterName: string;
    timestamp: number;
  } | null>(null);

  // Announcement Deduping Reference (Tracks announced call event IDs)
  const announcedCallIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef<boolean>(true);

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen Listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Listen to Firestore real-time queue tokens and counters
  useEffect(() => {
    const instId = selectedInstitution.institutionId;
    const branchId = selectedBranch.branchId;

    const unsubTokens = listenBranchTokens(instId, branchId, (newTokens) => {
      setTokens(newTokens);
    });

    const unsubCounters = listenCounters(instId, branchId, (newCounters) => {
      setCounters(newCounters);
    });

    return () => {
      unsubTokens();
      unsubCounters();
    };
  }, [selectedInstitution.institutionId, selectedBranch.branchId]);

  // Resolve Helper Functions
  const getCounterName = (counterId?: string, counterNumber?: string): string => {
    if (counterNumber) return counterNumber;
    if (!counterId) return 'Counter Desk';
    const found = counters.find((c) => c.counterId === counterId);
    return found ? found.counterNumber : 'Counter Desk';
  };

  const getDepartmentName = (deptId: string): string => {
    const d = MOCK_DEPARTMENTS.find((dept) => dept.departmentId === deptId);
    return d ? d.name : 'General Services';
  };

  const getServiceName = (serviceId: string): string => {
    const s = MOCK_SERVICES.find((srv) => srv.serviceId === serviceId);
    return s ? s.name : 'Standard Consultation';
  };

  // Derive Current Called Token
  const currentlyCalledToken = useMemo(() => {
    // 1. First prioritize CALLED tokens
    const called = tokens
      .filter((t) => t.status === TokenStatus.CALLED)
      .sort((a, b) => (b.calledAt || '').localeCompare(a.calledAt || ''));

    if (called.length > 0) return called[0];

    // 2. Otherwise prioritize IN_PROGRESS
    const inProgress = tokens
      .filter((t) => t.status === TokenStatus.IN_PROGRESS)
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

    return inProgress.length > 0 ? inProgress[0] : null;
  }, [tokens]);

  // Derive Next 5 Eligible Tokens
  const nextTokens = useMemo(() => {
    return tokens
      .filter((t) =>
        [TokenStatus.ISSUED, TokenStatus.WAITING, TokenStatus.CHECKED_IN].includes(t.status)
      )
      .slice(0, 5);
  }, [tokens]);

  // Derive Recently Called Tokens (Past 5)
  const recentlyCalledTokens = useMemo(() => {
    return tokens
      .filter(
        (t) =>
          t.calledAt &&
          (t.tokenId !== currentlyCalledToken?.tokenId) &&
          [TokenStatus.IN_PROGRESS, TokenStatus.COMPLETED, TokenStatus.NO_SHOW].includes(t.status)
      )
      .sort((a, b) => (b.calledAt || '').localeCompare(a.calledAt || ''))
      .slice(0, 5);
  }, [tokens, currentlyCalledToken]);

  // Voice Announcement Execution Function
  const speakAnnouncement = (tokenNumber: string, counterName: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isMuted) return;

    try {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const phrase = `Attention please. Token ${tokenNumber}, please proceed to ${counterName}.`;
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.volume = speechVolume;
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      // Select natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[QueueLess Display TTS] Speech synthesis error:', err);
    }
  };

  // Trigger Announcement when a genuine new call event occurs
  useEffect(() => {
    if (!currentlyCalledToken) return;

    const callEventId = `${currentlyCalledToken.tokenId}_${currentlyCalledToken.calledAt || currentlyCalledToken.updatedAt}`;

    // Skip on first initial render so we don't speak stale data on mount
    if (initialLoadRef.current) {
      announcedCallIdsRef.current.add(callEventId);
      initialLoadRef.current = false;
      return;
    }

    if (currentlyCalledToken.status === TokenStatus.CALLED && !announcedCallIdsRef.current.has(callEventId)) {
      announcedCallIdsRef.current.add(callEventId);

      const targetCounter = getCounterName(
        currentlyCalledToken.assignedCounterId,
        currentlyCalledToken.assignedCounterNumber
      );

      // Trigger Visual Fallback Toast
      setActiveCallNotification({
        tokenNumber: currentlyCalledToken.tokenNumber,
        counterName: targetCounter,
        timestamp: Date.now(),
      });

      // Trigger Audio Speech if audio is enabled and not muted
      if (isAudioEnabled && !isMuted) {
        speakAnnouncement(currentlyCalledToken.tokenNumber, targetCounter);
      }

      // Auto-clear notification toast after 10s
      setTimeout(() => {
        setActiveCallNotification((prev) => (prev?.tokenNumber === currentlyCalledToken.tokenNumber ? null : prev));
      }, 10000);
    }
  }, [currentlyCalledToken, isAudioEnabled, isMuted, speechVolume, speechRate]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleEnableAudio = () => {
    setIsAudioEnabled(true);
    setIsMuted(false);
    // Play a brief introductory test to unlock browser speech synthesis context
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Audio announcements enabled.');
      u.volume = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between select-none overflow-x-hidden selection:bg-primary/20">
      {/* Top Header / Facility Identification */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 sm:px-10 py-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg border border-primary/40">
            Q
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>{selectedInstitution.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>{selectedBranch.name} &bull; Lobby Queue Display</span>
            </p>
          </div>
        </div>

        {/* Right Header Status, Clock & Audio Tools */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Audio Permission Alert Banner */}
          {!isAudioEnabled ? (
            <button
              onClick={handleEnableAudio}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition shadow-sm animate-pulse"
              title="Click once to allow speech synthesis announcements on this display"
            >
              <VolumeX className="w-4 h-4 text-amber-400" />
              <span>Enable Audio Announcements</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="hover:text-white transition flex items-center gap-1.5 font-medium"
                title={isMuted ? 'Unmute Announcements' : 'Mute Announcements'}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400">Audio Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Audio Active</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAudioSettings(!showAudioSettings)}
                className="p-1 hover:text-white text-slate-400 ml-1"
                title="Voice Announcement Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Clock Display */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-xl text-slate-200 font-mono text-sm sm:text-base font-bold shadow-inner">
            <Clock className="w-4 h-4 text-primary" />
            <span>{currentTime}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Voice Settings Popover */}
      {showAudioSettings && (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl mx-6 sm:mx-10 mt-3 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white">Voice Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={speechVolume}
              onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
              className="accent-primary cursor-pointer w-24"
            />
            <span className="font-mono text-slate-400">{Math.round(speechVolume * 100)}%</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-white">Speech Speed:</span>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="accent-primary cursor-pointer w-24"
            />
            <span className="font-mono text-slate-400">{speechRate}x</span>
          </div>

          <button
            onClick={() => speakAnnouncement('T-TEST', 'Counter 1')}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-600 transition"
          >
            Test Announcement Chime
          </button>
        </div>
      )}

      {/* Visual Call Toast / Fallback Banner */}
      {activeCallNotification && (
        <div className="bg-emerald-500 text-slate-950 font-bold px-6 py-3 flex items-center justify-center gap-3 text-base sm:text-lg animate-pulse shadow-lg">
          <Bell className="w-5 h-5 text-slate-950 animate-bounce" />
          <span>
            NOW CALLING: Token {activeCallNotification.tokenNumber} &rarr; Proceed to{' '}
            {activeCallNotification.counterName}
          </span>
        </div>
      )}

      {/* Main Grid Content */}
      <main className="flex-1 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Section A: NOW CALLING (Hero Section - 7 Cols on desktop) */}
        <section className="lg:col-span-7 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-900/90 border-2 border-primary/50 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Label */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs sm:text-sm font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Now Calling</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Please proceed immediately when called
            </div>
          </div>

          {/* Center: Token & Counter Number */}
          <div className="my-10 text-center space-y-6">
            {currentlyCalledToken ? (
              <>
                <div className="space-y-2">
                  <div className="text-xs sm:text-sm uppercase tracking-wider text-slate-400 font-semibold">
                    Token Number
                  </div>
                  <div className="text-6xl sm:text-8xl lg:text-9xl font-black font-mono tracking-tight text-white drop-shadow-[0_4px_24px_rgba(37,99,235,0.35)] animate-in zoom-in-95 duration-200">
                    {currentlyCalledToken.tokenNumber}
                  </div>
                </div>

                <div className="inline-block mt-4">
                  <div className="px-6 sm:px-10 py-3 sm:py-5 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/80 text-emerald-300 font-extrabold text-2xl sm:text-4xl uppercase tracking-wider shadow-lg flex items-center justify-center gap-3">
                    <ArrowRight className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-400 animate-pulse" />
                    <span>
                      Proceed to{' '}
                      {getCounterName(
                        currentlyCalledToken.assignedCounterId,
                        currentlyCalledToken.assignedCounterNumber
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-sm sm:text-base text-slate-400 font-medium pt-2">
                  <span>{getDepartmentName(currentlyCalledToken.departmentId)}</span>
                  <span className="mx-2 text-slate-600">&bull;</span>
                  <span>{getServiceName(currentlyCalledToken.serviceId)}</span>
                </div>
              </>
            ) : (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 mx-auto">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-300">
                  Ready for Next Visitor
                </div>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  No token is currently summoned. Next available visitor will be called shortly.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Security Note */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Contactless queue tracking active</span>
            <span>Check-in verification required at desk</span>
          </div>
        </section>

        {/* Right Column: Next in Line & Recently Called (5 Cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Section B: NEXT TOKENS */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    Next in Line
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {nextTokens.length} waiting
                </span>
              </div>

              {nextTokens.length > 0 ? (
                <div className="space-y-2.5">
                  {nextTokens.map((t, idx) => (
                    <div
                      key={t.tokenId}
                      className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between hover:border-primary/50 transition shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-mono text-xl sm:text-2xl font-black text-white tracking-wide">
                            {t.tokenNumber}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {getDepartmentName(t.departmentId)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/20 text-blue-300 border border-primary/30">
                          {t.status === TokenStatus.CHECKED_IN ? 'On-Site' : 'Slot Booked'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  No subsequent visitors waiting in the queue.
                </div>
              )}
            </div>

            <div className="pt-3 text-[11px] text-slate-500 text-center">
              Please watch the screen as your turn approaches
            </div>
          </section>

          {/* Section C: RECENTLY CALLED */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Recently Called
              </h3>
              <span className="text-[11px] text-slate-500">Past announcements</span>
            </div>

            {recentlyCalledTokens.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {recentlyCalledTokens.map((t) => (
                  <div
                    key={t.tokenId}
                    className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 text-center"
                  >
                    <div className="font-mono text-base font-bold text-slate-200">
                      {t.tokenNumber}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold mt-0.5 truncate">
                      {getCounterName(t.assignedCounterId, t.assignedCounterNumber)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-xs text-slate-600">
                No previous calls on record today.
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Section D: ANNOUNCEMENT TICKER (Bottom Banner) */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 px-6 sm:px-10 flex items-center gap-4 text-xs sm:text-sm text-slate-300 overflow-hidden sticky bottom-0 z-20">
        <div className="px-2.5 py-1 rounded-md bg-primary text-white font-bold uppercase tracking-wider text-[11px] shrink-0">
          Public Notice
        </div>
        <div className="truncate flex-1 font-medium text-slate-300 animate-pulse">
          Welcome to {selectedInstitution.name}. Please keep your booking QR pass ready.
          When your token appears, proceed to your designated counter. For assistance, contact the reception desk.
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-mono shrink-0">
          <span>POWERED BY QUEUELESS</span>
        </div>
      </footer>
    </div>
  );
};
