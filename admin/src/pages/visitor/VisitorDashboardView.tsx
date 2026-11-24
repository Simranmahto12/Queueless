import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Search,
  Building2,
  Calendar,
  Clock,
  QrCode,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  LogOut,
  MapPin,
  ChevronRight,
  Sparkles,
  HeartPulse,
  Landmark,
  GraduationCap,
  Briefcase,
  HelpCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import {
  Token,
  TokenStatus,
  TokenPriority,
  InstitutionSector,
  Institution,
  Branch,
  Department,
  Service,
  MOCK_BRANCHES,
  MOCK_DEPARTMENTS,
  MOCK_SERVICES,
  listenVisitorTokens,
} from '@queueless/shared';

export const VisitorDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    logout,
    institutions,
    bookVisitorToken,
    cancelToken,
    checkInToken,
    connectionState,
    addToast,
  } = useAdmin();

  // Active token & history state
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [historyTokens, setHistoryTokens] = useState<Token[]>([]);
  const [isListenerLoading, setIsListenerLoading] = useState(true);

  // Discovery & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  // Booking Flow state
  const [bookingInstitution, setBookingInstitution] = useState<Institution | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('10:30');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Subscribe to visitor's tokens in real time
  useEffect(() => {
    if (!currentUser?.id) return;

    setIsListenerLoading(true);
    const unsubscribe = listenVisitorTokens(currentUser.id, ({ active, history }) => {
      setActiveToken(active);
      setHistoryTokens(history.filter((t) => t.tokenId !== active?.tokenId));
      setIsListenerLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id]);

  // Filtered branches for booking modal
  const availableBranches = useMemo(() => {
    if (!bookingInstitution) return [];
    return MOCK_BRANCHES.filter((b) => b.institutionId === bookingInstitution.institutionId);
  }, [bookingInstitution]);

  // Filtered departments for booking modal
  const availableDepartments = useMemo(() => {
    if (!bookingInstitution) return [];
    return MOCK_DEPARTMENTS.filter(
      (d) =>
        d.institutionId === bookingInstitution.institutionId &&
        (!selectedBranchId || d.branchId === selectedBranchId)
    );
  }, [bookingInstitution, selectedBranchId]);

  // Filtered services for booking modal
  const availableServices = useMemo(() => {
    if (!selectedDeptId) return [];
    return MOCK_SERVICES.filter((s) => s.departmentId === selectedDeptId);
  }, [selectedDeptId]);

  // Initialize branch and dept when booking modal opens
  useEffect(() => {
    if (bookingInstitution) {
      const branches = MOCK_BRANCHES.filter((b) => b.institutionId === bookingInstitution.institutionId);
      const defaultBranchId = branches[0]?.branchId || '';
      setSelectedBranchId(defaultBranchId);

      const depts = MOCK_DEPARTMENTS.filter(
        (d) => d.institutionId === bookingInstitution.institutionId && d.branchId === defaultBranchId
      );
      const defaultDeptId = depts[0]?.departmentId || '';
      setSelectedDeptId(defaultDeptId);

      const srvs = MOCK_SERVICES.filter((s) => s.departmentId === defaultDeptId);
      setSelectedServiceId(srvs[0]?.serviceId || '');
      setBookingError(null);
    }
  }, [bookingInstitution]);

  // Filtered institutions for discovery list
  const filteredInstitutions = useMemo(() => {
    return institutions.filter((inst) => {
      const matchesSearch =
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inst.description && inst.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSector =
        selectedSector === 'ALL' || inst.sector.toUpperCase() === selectedSector.toUpperCase();
      return matchesSearch && matchesSector;
    });
  }, [institutions, searchQuery, selectedSector]);

  const handleOpenBooking = (inst: Institution) => {
    if (activeToken) {
      addToast(
        'warning',
        'You already have an active queue token. Please complete or cancel it before booking a new one.'
      );
      return;
    }
    setBookingInstitution(inst);
  };

  const handleExecuteBooking = async () => {
    if (!bookingInstitution || !currentUser) return;
    if (!selectedBranchId || !selectedDeptId || !selectedServiceId) {
      setBookingError('Please select branch, department, and service.');
      return;
    }

    setIsBookingSubmitting(true);
    setBookingError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      await bookVisitorToken({
        institutionId: bookingInstitution.institutionId,
        branchId: selectedBranchId,
        departmentId: selectedDeptId,
        serviceId: selectedServiceId,
        visitorId: currentUser.id,
        visitorName: currentUser.displayName || 'Visitor',
        visitorPhone: currentUser.phone,
        visitorEmail: currentUser.email,
        targetDate: today,
        targetSlotTime: selectedSlotTime,
        priority: TokenPriority.STANDARD,
      });

      setBookingInstitution(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to book token. Please try again.';
      setBookingError(msg);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleCancelActiveToken = async () => {
    if (!activeToken) return;
    if (window.confirm('Are you sure you want to cancel your active queue token?')) {
      try {
        await cancelToken(activeToken.tokenId, 'Cancelled by visitor');
      } catch (err: unknown) {
        addToast('danger', 'Unable to cancel token.');
      }
    }
  };

  const handleSimulateCheckIn = async () => {
    if (!activeToken) return;
    try {
      await checkInToken(activeToken.tokenId);
    } catch (err: unknown) {
      addToast('danger', 'Check-in validation failed.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/visitor/login');
  };

  const getSectorIcon = (sector: InstitutionSector) => {
    switch (sector) {
      case InstitutionSector.HEALTHCARE:
        return <HeartPulse className="w-4 h-4 text-rose-500" />;
      case InstitutionSector.BANKING:
        return <Landmark className="w-4 h-4 text-emerald-500" />;
      case InstitutionSector.EDUCATION:
        return <GraduationCap className="w-4 h-4 text-indigo-500" />;
      case InstitutionSector.GOVERNMENT:
        return <Briefcase className="w-4 h-4 text-amber-500" />;
      default:
        return <Building2 className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: TokenStatus) => {
    switch (status) {
      case TokenStatus.CALLED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Called to Counter — Proceed Now</span>
          </span>
        );
      case TokenStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Currently Being Served</span>
          </span>
        );
      case TokenStatus.CHECKED_IN:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Checked In On-Site (Waiting)</span>
          </span>
        );
      case TokenStatus.COMPLETED:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
            Completed
          </span>
        );
      case TokenStatus.CANCELLED:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Confirmed &bull; Slot Allocated</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-appBg text-textMain flex flex-col font-sans selection:bg-primary/20">
      {/* Top Header */}
      <header className="bg-white border-b border-borderSoft sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm border border-primary">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-navy">QueueLess</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-textMuted font-medium border-l border-borderSoft pl-2">
                Visitor Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-borderSoft rounded-lg text-xs text-textMuted">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Real-Time Sync Active</span>
            </div>

            {/* Profile Pill */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-borderSoft">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'V'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-navy leading-none">
                  {currentUser?.displayName || 'Visitor'}
                </span>
                <span className="text-[10px] text-textMuted mt-0.5">{currentUser?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-textMuted hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Active Token Hero Pass */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
                Your Current Visit Pass
              </h2>
            </div>
            {activeToken && (
              <span className="text-xs text-textMuted">
                Live position auto-updates every few seconds
              </span>
            )}
          </div>

          {activeToken ? (
            <div className="bg-white rounded-2xl border border-primary/30 shadow-md p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-center">
                {/* Left: Token Number & Facility Info */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-4 py-2 bg-navy text-white rounded-xl font-mono text-2xl font-extrabold tracking-wider shadow-sm border border-navy">
                      {activeToken.tokenNumber}
                    </div>
                    {getStatusBadge(activeToken.status)}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-navy">
                      {institutions.find((i) => i.institutionId === activeToken.institutionId)?.name ||
                        'Institutional Facility'}
                    </h3>
                    <p className="text-xs text-textMuted mt-1">
                      {MOCK_DEPARTMENTS.find((d) => d.departmentId === activeToken.departmentId)?.name ||
                        'Service Department'}{' '}
                      &bull;{' '}
                      {MOCK_SERVICES.find((s) => s.serviceId === activeToken.serviceId)?.name ||
                        'General Consultation'}
                    </p>
                  </div>

                  {/* Arrival Slot & ETA Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 border border-borderSoft rounded-xl">
                      <div className="flex items-center gap-1.5 text-textMuted text-xs mb-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Arrival Window</span>
                      </div>
                      <div className="text-sm font-bold text-navy">
                        {activeToken.scheduledSlot.startTime} - {activeToken.scheduledSlot.endTime}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-borderSoft rounded-xl">
                      <div className="flex items-center gap-1.5 text-textMuted text-xs mb-1">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>Ahead of You</span>
                      </div>
                      <div className="text-sm font-bold text-navy">
                        {Math.max(0, Math.ceil((activeToken.estimatedWaitMinutes || 10) / 6))} visitor(s)
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-borderSoft rounded-xl">
                      <div className="flex items-center gap-1.5 text-textMuted text-xs mb-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>Estimated Wait</span>
                      </div>
                      <div className="text-sm font-bold text-navy">
                        {activeToken.estimatedWaitMinutes || 12} mins
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-3">
                    {!activeToken.checkedInAt && activeToken.status === TokenStatus.ISSUED && (
                      <button
                        onClick={handleSimulateCheckIn}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Simulate QR Check-In</span>
                      </button>
                    )}
                    <button
                      onClick={handleCancelActiveToken}
                      className="inline-flex items-center gap-2 px-3.5 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium rounded-xl transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel Token</span>
                    </button>
                  </div>
                </div>

                {/* Right: Visual Digital QR Pass Box */}
                <div className="bg-slate-50 border border-borderSoft rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                  <div className="bg-white p-3 rounded-xl border border-borderSoft shadow-xs mb-3">
                    {/* SVG Stylized QR Code */}
                    <svg className="w-32 h-32 text-navy" viewBox="0 0 100 100" fill="currentColor">
                      {/* Corner Position Boxes */}
                      <rect x="5" y="5" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="12" y="12" width="14" height="14" rx="2" />
                      <rect x="67" y="5" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="74" y="12" width="14" height="14" rx="2" />
                      <rect x="5" y="67" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="12" y="74" width="14" height="14" rx="2" />
                      {/* Stylized QR Data Matrix */}
                      <rect x="42" y="10" width="7" height="7" rx="1" />
                      <rect x="52" y="10" width="7" height="7" rx="1" />
                      <rect x="42" y="24" width="7" height="7" rx="1" />
                      <rect x="10" y="42" width="7" height="7" rx="1" />
                      <rect x="24" y="42" width="7" height="7" rx="1" />
                      <rect x="42" y="42" width="16" height="16" rx="2" />
                      <rect x="67" y="42" width="7" height="7" rx="1" />
                      <rect x="83" y="42" width="7" height="7" rx="1" />
                      <rect x="42" y="67" width="7" height="7" rx="1" />
                      <rect x="52" y="77" width="7" height="7" rx="1" />
                      <rect x="67" y="67" width="12" height="7" rx="1" />
                      <rect x="82" y="77" width="8" height="12" rx="1" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-navy">
                    {activeToken.tokenId}
                  </span>
                  <span className="text-[10px] text-textMuted mt-0.5">
                    Present at building entrance or counter scanner
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-borderSoft p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-borderSoft flex items-center justify-center text-textMuted mx-auto mb-3">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-navy">No active booking</h3>
              <p className="text-xs text-textMuted max-w-md mx-auto mt-1 mb-4">
                You do not currently have an active waiting queue token. Browse participating facilities
                below to reserve an arrival slot.
              </p>
            </div>
          )}
        </section>

        {/* Institution Discovery & Booking */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-navy">Discover & Book Services</h2>
            <p className="text-xs text-textMuted mt-0.5">
              Select an institution to inspect available departments, wait times, and reserve your token.
            </p>
          </div>

          {/* Search & Sector Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by facility name or description..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-borderSoft rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-textMain shadow-xs"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'HEALTHCARE', 'BANKING', 'GOVERNMENT', 'EDUCATION'].map((sector) => (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    selectedSector === sector
                      ? 'bg-navy text-white shadow-xs'
                      : 'bg-white text-textMuted hover:text-textMain border border-borderSoft'
                  }`}
                >
                  {sector === 'ALL' ? 'All Sectors' : sector}
                </button>
              ))}
            </div>
          </div>

          {/* Institutions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredInstitutions.map((inst) => {
              const branchesCount = MOCK_BRANCHES.filter((b) => b.institutionId === inst.institutionId).length;
              const deptsCount = MOCK_DEPARTMENTS.filter((d) => d.institutionId === inst.institutionId).length;

              return (
                <div
                  key={inst.institutionId}
                  className="bg-white border border-borderSoft rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          {getSectorIcon(inst.sector)}
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-textMuted">
                          {inst.sector}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Open Today
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-navy mb-1.5">{inst.name}</h3>
                    <p className="text-xs text-textMuted line-clamp-2 leading-relaxed mb-4">
                      {inst.description || 'Service facility with digital queue management enabled.'}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-textMuted pt-2 border-t border-borderSoft mb-4">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-textMuted" />
                        <span>{branchesCount} Branch(es)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-textMuted" />
                        <span>{deptsCount} Dept(s)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBooking(inst)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-50 text-navy border border-borderSoft hover:bg-primary hover:text-white hover:border-primary transition shadow-xs"
                  >
                    <span>Book Arrival Slot</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Booking History Table */}
        <section className="bg-white border border-borderSoft rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
              Your Booking History
            </h2>
            <span className="text-xs text-textMuted">{historyTokens.length} completed visits</span>
          </div>

          {historyTokens.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-borderSoft text-textMuted font-semibold">
                    <th className="pb-3 pl-2">Token #</th>
                    <th className="pb-3">Institution</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Date & Slot</th>
                    <th className="pb-3 pr-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSoft">
                  {historyTokens.map((t) => (
                    <tr key={t.tokenId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pl-2 font-mono font-bold text-navy">{t.tokenNumber}</td>
                      <td className="py-3 font-medium text-textMain">
                        {institutions.find((i) => i.institutionId === t.institutionId)?.name || 'Facility'}
                      </td>
                      <td className="py-3 text-textMuted">
                        {MOCK_DEPARTMENTS.find((d) => d.departmentId === t.departmentId)?.name || 'General'}
                      </td>
                      <td className="py-3 text-textMuted">
                        {t.scheduledSlot.date} &bull; {t.scheduledSlot.startTime}
                      </td>
                      <td className="py-3 pr-2 text-right">{getStatusBadge(t.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-textMuted">
              No historical bookings recorded yet.
            </div>
          )}
        </section>
      </main>

      {/* Booking Modal / Dialog */}
      {bookingInstitution && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-borderSoft relative animate-in fade-in duration-150">
            <button
              onClick={() => setBookingInstitution(null)}
              className="absolute top-5 right-5 p-1 rounded-lg text-textMuted hover:text-textMain hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Ticket className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Book Queue Token
              </span>
            </div>
            <h3 className="text-xl font-bold text-navy mb-4">{bookingInstitution.name}</h3>

            {bookingError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Branch Selection */}
              <div>
                <label className="block text-xs font-semibold text-textMain mb-1">
                  Select Branch
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                    const depts = MOCK_DEPARTMENTS.filter(
                      (d) =>
                        d.institutionId === bookingInstitution.institutionId &&
                        d.branchId === e.target.value
                    );
                    setSelectedDeptId(depts[0]?.departmentId || '');
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-borderSoft rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-textMain"
                >
                  {availableBranches.map((b) => (
                    <option key={b.branchId} value={b.branchId}>
                      {b.name} ({b.address.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Selection */}
              <div>
                <label className="block text-xs font-semibold text-textMain mb-1">
                  Select Department
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    const srvs = MOCK_SERVICES.filter((s) => s.departmentId === e.target.value);
                    setSelectedServiceId(srvs[0]?.serviceId || '');
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-borderSoft rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-textMain"
                >
                  {availableDepartments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-textMain mb-1">
                  Select Service
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-borderSoft rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-textMain"
                >
                  {availableServices.map((s) => (
                    <option key={s.serviceId} value={s.serviceId}>
                      {s.name} (~{s.estimatedDurationMinutes} mins)
                    </option>
                  ))}
                </select>
              </div>

              {/* Arrival Slot Pick */}
              <div>
                <label className="block text-xs font-semibold text-textMain mb-1">
                  Target Arrival Window (Today)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['10:00', '10:30', '11:00', '11:30', '14:00', '14:30'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlotTime(slot)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition ${
                        selectedSlotTime === slot
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-slate-50 border-borderSoft text-textMain hover:bg-slate-100'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-borderSoft flex gap-3">
              <button
                type="button"
                onClick={() => setBookingInstitution(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-textMuted bg-slate-50 border border-borderSoft hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBooking}
                disabled={isBookingSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-blue-700 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isBookingSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <span>Confirm & Issue Token</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
