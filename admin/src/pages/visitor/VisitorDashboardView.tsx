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
    addToast,
  } = useAdmin();

  // Active bookings & history state
  const [activeTokens, setActiveTokens] = useState<Token[]>([]);
  const [historyTokens, setHistoryTokens] = useState<Token[]>([]);
  const [isListenerLoading, setIsListenerLoading] = useState(true);
  const [detailsToken, setDetailsToken] = useState<Token | null>(null);
  const [detailsMode, setDetailsMode] = useState<'details' | 'queue' | null>(null);

  // Discovery & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  // Booking Flow state
  const [bookingInstitution, setBookingInstitution] = useState<Institution | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Subscribe to visitor's tokens in real time
  useEffect(() => {
    if (!currentUser?.id) return;

    setIsListenerLoading(true);
    const unsubscribe = listenVisitorTokens(currentUser.id, ({ activeTokens: visitorActiveTokens, history }) => {
      const activeTokenIds = new Set(visitorActiveTokens.map((token) => token.tokenId));
      setActiveTokens(visitorActiveTokens);
      setHistoryTokens(history.filter((token) => !activeTokenIds.has(token.tokenId)));
      setIsListenerLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id]);

  // Filtered branches for booking modal
  const availableBranches = useMemo(() => {
    if (!bookingInstitution) return [];
    return MOCK_BRANCHES.filter(
      (branch) => branch.institutionId === bookingInstitution.institutionId && branch.isActive
    );
  }, [bookingInstitution]);

  // Filtered departments for booking modal
  const availableDepartments = useMemo(() => {
    if (!bookingInstitution) return [];
    return MOCK_DEPARTMENTS.filter(
      (d) =>
        d.institutionId === bookingInstitution.institutionId &&
        d.branchId === selectedBranchId &&
        d.isActive
    );
  }, [bookingInstitution, selectedBranchId]);

  // Filtered services for booking modal
  const availableServices = useMemo(() => {
    if (!bookingInstitution || !selectedBranchId || !selectedDeptId) return [];
    return MOCK_SERVICES.filter(
      (service) =>
        service.institutionId === bookingInstitution.institutionId &&
        service.branchId === selectedBranchId &&
        service.departmentId === selectedDeptId &&
        service.isActive
    );
  }, [bookingInstitution, selectedBranchId, selectedDeptId]);

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
    setSelectedBranchId('');
    setSelectedDeptId('');
    setSelectedServiceId('');
    setSelectedSlotTime('');
    setBookingError(null);
    setBookingInstitution(inst);
  };

  const handleExecuteBooking = async () => {
    if (!bookingInstitution || !currentUser) return;
    if (!selectedBranchId || !selectedDeptId || !selectedServiceId || !selectedSlotTime) {
      setBookingError('Please select a branch, department, service, and arrival window.');
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

  const handleCancelToken = async (token: Token) => {
    if (window.confirm(`Cancel booking ${token.tokenNumber}?`)) {
      try {
        await cancelToken(token.tokenId, 'Cancelled by visitor');
      } catch (err: unknown) {
        addToast('danger', err instanceof Error ? err.message : 'Unable to cancel booking.');
      }
    }
  };

  const handleSimulateCheckIn = async (token: Token) => {
    try {
      await checkInToken(token.tokenId);
    } catch (err: unknown) {
      addToast('danger', err instanceof Error ? err.message : 'Check-in validation failed.');
    }
  };

  const openTokenDetails = (token: Token, mode: 'details' | 'queue') => {
    setDetailsToken(token);
    setDetailsMode(mode);
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

  const getStatusLabel = (status: TokenStatus) => {
    switch (status) {
      case TokenStatus.ISSUED: return 'Upcoming';
      case TokenStatus.CALLED:
      case TokenStatus.IN_PROGRESS: return 'In Progress';
      case TokenStatus.WAITING:
      case TokenStatus.CHECKED_IN:
        return 'Waiting';
      case TokenStatus.COMPLETED: return 'Completed';
      case TokenStatus.CANCELLED: return 'Cancelled';
      case TokenStatus.NO_SHOW: return 'No Show';
      case TokenStatus.EXPIRED: return 'Expired';
      case TokenStatus.TRANSFERRED: return 'Transferred';
      default: return status;
    }
  };

  const getStatusBadge = (status: TokenStatus) => {
    const statusStyles: Partial<Record<TokenStatus, string>> = {
      [TokenStatus.ISSUED]: 'bg-primary/10 text-primary border-primary/20',
      [TokenStatus.WAITING]: 'bg-blue-50 text-blue-700 border-blue-200',
      [TokenStatus.CHECKED_IN]: 'bg-blue-50 text-blue-700 border-blue-200',
      [TokenStatus.CALLED]: 'bg-amber-100 text-amber-800 border-amber-300',
      [TokenStatus.IN_PROGRESS]: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      [TokenStatus.COMPLETED]: 'bg-slate-100 text-slate-700 border-slate-200',
      [TokenStatus.CANCELLED]: 'bg-rose-50 text-rose-700 border-rose-200',
      [TokenStatus.NO_SHOW]: 'bg-rose-50 text-rose-700 border-rose-200',
      [TokenStatus.EXPIRED]: 'bg-slate-100 text-slate-700 border-slate-200',
      [TokenStatus.TRANSFERRED]: 'bg-violet-50 text-violet-700 border-violet-200',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
        {getStatusLabel(status)}
      </span>
    );
  };

  const getEstimatedQueuePosition = (token: Token) => {
    if (token.status === TokenStatus.CALLED || token.status === TokenStatus.IN_PROGRESS) {
      return 'At the counter';
    }
    return `~${Math.max(1, Math.ceil((token.estimatedWaitMinutes || 10) / 6))} ahead`;
  };

  const displayedDetailsToken = detailsToken
    ? activeTokens.find((token) => token.tokenId === detailsToken.tokenId) ||
      historyTokens.find((token) => token.tokenId === detailsToken.tokenId) ||
      detailsToken
    : null;
  const detailsInstitution = displayedDetailsToken
    ? institutions.find((item) => item.institutionId === displayedDetailsToken.institutionId)
    : undefined;
  const detailsBranch = displayedDetailsToken
    ? MOCK_BRANCHES.find((item) => item.branchId === displayedDetailsToken.branchId)
    : undefined;
  const detailsDepartment = displayedDetailsToken
    ? MOCK_DEPARTMENTS.find((item) => item.departmentId === displayedDetailsToken.departmentId)
    : undefined;
  const detailsService = displayedDetailsToken
    ? MOCK_SERVICES.find((item) => item.serviceId === displayedDetailsToken.serviceId)
    : undefined;

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
        {/* Active Booking Cards */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
                Your Current Visit Passes
              </h2>
            </div>
            {activeTokens.length > 0 && (
              <span className="text-xs text-textMuted">
                {activeTokens.length} active booking{activeTokens.length === 1 ? '' : 's'} · Live updates
              </span>
            )}
          </div>

          {isListenerLoading ? (
            <div className="bg-white rounded-2xl border border-borderSoft p-8 text-center text-xs text-textMuted">
              <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto mb-2" />
              Loading your bookings...
            </div>
          ) : activeTokens.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeTokens.map((token) => {
                const institution = institutions.find(
                  (item) => item.institutionId === token.institutionId
                );
                const branch = MOCK_BRANCHES.find((item) => item.branchId === token.branchId);
                const department = MOCK_DEPARTMENTS.find(
                  (item) => item.departmentId === token.departmentId
                );
                const service = MOCK_SERVICES.find((item) => item.serviceId === token.serviceId);

                return (
                  <article
                    key={token.tokenId}
                    className="bg-white border border-borderSoft border-t-4 border-t-primary rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getSectorIcon(institution?.sector || InstitutionSector.OTHER)}
                          <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">
                            {institution?.sector || 'Institution'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-navy leading-snug">
                          {institution?.name || 'Institutional Facility'}
                        </h3>
                      </div>
                      {getStatusBadge(token.status)}
                    </div>

                    <div className="mb-4 px-3 py-2 bg-navy text-white rounded-xl font-mono text-lg font-extrabold tracking-wide text-center break-all">
                      {token.tokenNumber}
                    </div>

                    <div className="space-y-2 text-xs text-textMuted flex-1">
                      <p className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{branch?.name || token.branchId}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-textMain">Department:</span>{' '}
                        {department?.name || token.departmentId}
                      </p>
                      <p>
                        <span className="font-semibold text-textMain">Service:</span>{' '}
                        {service?.name || token.serviceId}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="p-2.5 bg-slate-50 border border-borderSoft rounded-xl">
                        <div className="flex items-center gap-1 text-[10px] text-textMuted mb-1">
                          <Calendar className="w-3 h-3 text-primary" />
                          Booking Date
                        </div>
                        <div className="text-xs font-semibold text-navy">{token.scheduledSlot.date}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-borderSoft rounded-xl">
                        <div className="flex items-center gap-1 text-[10px] text-textMuted mb-1">
                          <Clock className="w-3 h-3 text-primary" />
                          Arrival Time
                        </div>
                        <div className="text-xs font-semibold text-navy">
                          {token.scheduledSlot.startTime} - {token.scheduledSlot.endTime}
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-borderSoft rounded-xl">
                        <div className="flex items-center gap-1 text-[10px] text-textMuted mb-1">
                          <Users className="w-3 h-3 text-primary" />
                          Queue Position (est.)
                        </div>
                        <div className="text-xs font-semibold text-navy">
                          {getEstimatedQueuePosition(token)}
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-borderSoft rounded-xl">
                        <div className="flex items-center gap-1 text-[10px] text-textMuted mb-1">
                          <Clock className="w-3 h-3 text-primary" />
                          Estimated Wait
                        </div>
                        <div className="text-xs font-semibold text-navy">
                          {token.status === TokenStatus.CALLED || token.status === TokenStatus.IN_PROGRESS
                            ? 'Now'
                            : `${token.estimatedWaitMinutes || 12} mins`}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-borderSoft">
                      <button
                        type="button"
                        onClick={() => openTokenDetails(token, 'details')}
                        className="flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-[11px] font-semibold text-navy bg-slate-50 border border-borderSoft hover:bg-slate-100 transition"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => openTokenDetails(token, 'queue')}
                        className="flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-[11px] font-semibold text-white bg-primary hover:bg-blue-700 transition"
                      >
                        View Queue Status
                      </button>
                      {!token.checkedInAt && token.status === TokenStatus.ISSUED && (
                        <button
                          type="button"
                          onClick={() => handleSimulateCheckIn(token)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold text-primary border border-primary/20 hover:bg-primary/5 transition"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Simulate QR Check-In
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCancelToken(token)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel Booking
                      </button>
                    </div>
                  </article>
                );
              })}
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
              <a
                href="#discover-book-services"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-blue-700 transition"
              >
                Explore and book services
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </section>

        {/* Institution Discovery & Booking */}
        <section id="discover-book-services" className="space-y-4">
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
            <span className="text-xs text-textMuted">{historyTokens.length} past bookings</span>
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

      {displayedDetailsToken && detailsMode && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="token-details-title"
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-xl border border-borderSoft relative animate-in fade-in duration-150"
          >
            <button
              type="button"
              onClick={() => {
                setDetailsToken(null);
                setDetailsMode(null);
              }}
              aria-label="Close booking details"
              className="absolute top-5 right-5 p-1 rounded-lg text-textMuted hover:text-textMain hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Ticket className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {detailsMode === 'queue' ? 'Live Queue Status' : 'Booking Details'}
              </span>
            </div>
            <h3 id="token-details-title" className="text-xl font-bold text-navy mb-4 pr-8">
              {detailsInstitution?.name || 'Institutional Facility'}
            </h3>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="px-3 py-2 bg-navy text-white rounded-xl font-mono text-lg font-extrabold tracking-wide break-all">
                {displayedDetailsToken.tokenNumber}
              </div>
              {getStatusBadge(displayedDetailsToken.status)}
            </div>

            {detailsMode === 'queue' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-borderSoft rounded-xl">
                    <div className="text-xs text-textMuted mb-1">Queue Position (est.)</div>
                    <div className="text-sm font-bold text-navy">
                      {getEstimatedQueuePosition(displayedDetailsToken)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-borderSoft rounded-xl">
                    <div className="text-xs text-textMuted mb-1">Estimated Wait</div>
                    <div className="text-sm font-bold text-navy">
                      {displayedDetailsToken.status === TokenStatus.CALLED ||
                      displayedDetailsToken.status === TokenStatus.IN_PROGRESS
                        ? 'Now'
                        : `${displayedDetailsToken.estimatedWaitMinutes || 12} mins`}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-borderSoft rounded-xl">
                    <div className="text-xs text-textMuted mb-1">Arrival Window</div>
                    <div className="text-sm font-bold text-navy">
                      {displayedDetailsToken.scheduledSlot.startTime} - {displayedDetailsToken.scheduledSlot.endTime}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-textMuted">
                  Queue position is estimated from the current wait-time estimate. Token status updates
                  automatically when the queue changes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-borderSoft rounded-xl">
                    <div className="text-xs text-textMuted mb-1">Institution Category</div>
                    <div className="text-sm font-semibold text-navy">
                      {detailsInstitution?.sector || 'Institution'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-borderSoft rounded-xl">
                    <div className="text-xs text-textMuted mb-1">Branch</div>
                    <div className="text-sm font-semibold text-navy">
                      {detailsBranch?.name || displayedDetailsToken.branchId}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-borderSoft rounded-xl">
                    <div className="text-xs text-textMuted mb-1">Department</div>
                    <div className="text-sm font-semibold text-navy">
                      {detailsDepartment?.name || displayedDetailsToken.departmentId}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-borderSoft rounded-xl">
                    <div className="text-xs text-textMuted mb-1">Service</div>
                    <div className="text-sm font-semibold text-navy">
                      {detailsService?.name || displayedDetailsToken.serviceId}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-borderSoft rounded-xl">
                    <div className="text-xs text-textMuted mb-1">Booking Date</div>
                    <div className="text-sm font-semibold text-navy">
                      {displayedDetailsToken.scheduledSlot.date}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-borderSoft rounded-xl">
                    <div className="text-xs text-textMuted mb-1">Arrival Window</div>
                    <div className="text-sm font-semibold text-navy">
                      {displayedDetailsToken.scheduledSlot.startTime} - {displayedDetailsToken.scheduledSlot.endTime}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-borderSoft rounded-2xl p-4 flex flex-col items-center text-center">
                  <div className="bg-white p-2 rounded-xl border border-borderSoft shadow-xs mb-2">
                    <svg className="w-28 h-28 text-navy" viewBox="0 0 100 100" fill="currentColor">
                      <rect x="5" y="5" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="12" y="12" width="14" height="14" rx="2" />
                      <rect x="67" y="5" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="74" y="12" width="14" height="14" rx="2" />
                      <rect x="5" y="67" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="12" y="74" width="14" height="14" rx="2" />
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
                  <span className="text-[10px] font-mono font-semibold text-navy break-all">
                    {displayedDetailsToken.tokenId}
                  </span>
                  <span className="text-[10px] text-textMuted mt-0.5">
                    Present at building entrance or counter scanner
                  </span>
                </div>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-borderSoft">
              <button
                type="button"
                onClick={() => {
                  setDetailsToken(null);
                  setDetailsMode(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-textMuted bg-slate-50 border border-borderSoft hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal / Dialog */}
      {bookingInstitution && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-xl border border-borderSoft relative animate-in fade-in duration-150">
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
                  aria-label="Choose a branch"
                  value={selectedBranchId}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                    setSelectedDeptId('');
                    setSelectedServiceId('');
                    setBookingError(null);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-borderSoft rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-textMain transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    Choose a branch
                  </option>
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
                  aria-label="Choose a department"
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setSelectedServiceId('');
                    setBookingError(null);
                  }}
                  disabled={!selectedBranchId}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-borderSoft rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-textMain transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    {selectedBranchId ? 'Choose a department' : 'Select a branch first'}
                  </option>
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
                  aria-label="Choose a service"
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    setBookingError(null);
                  }}
                  disabled={!selectedDeptId}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-borderSoft rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-textMain transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    {selectedDeptId ? 'Choose a service' : 'Select a department first'}
                  </option>
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
                      aria-pressed={selectedSlotTime === slot}
                      onClick={() => {
                        setSelectedSlotTime(slot);
                        setBookingError(null);
                      }}
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
