import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Building2,
  Users,
  Clock,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Printer,
  Smartphone,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Loader2,
  Check,
} from 'lucide-react';
import {
  Token,
  TokenPriority,
  MOCK_INSTITUTIONS,
  MOCK_BRANCHES,
  MOCK_DEPARTMENTS,
  MOCK_SERVICES,
  bookToken,
  dispatchTicketNotification,
  validatePhoneNumber,
} from '@queueless/shared';

export const WalkInKioskView: React.FC = () => {
  const { institutionId, branchId } = useParams<{ institutionId?: string; branchId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Institution resolution
  const resolvedInstId = institutionId || searchParams.get('institution') || MOCK_INSTITUTIONS[0].institutionId;
  const currentInstitution = useMemo(() => {
    return (
      MOCK_INSTITUTIONS.find(
        (i) => i.institutionId === resolvedInstId || i.slug === resolvedInstId
      ) || MOCK_INSTITUTIONS[0]
    );
  }, [resolvedInstId]);

  // Branch resolution
  const availableBranches = useMemo(() => {
    return MOCK_BRANCHES.filter((b) => b.institutionId === currentInstitution.institutionId);
  }, [currentInstitution]);

  const resolvedBranchId = branchId || searchParams.get('branch') || availableBranches[0]?.branchId;
  const [selectedBranchId, setSelectedBranchId] = useState<string>(resolvedBranchId);

  useEffect(() => {
    if (resolvedBranchId) {
      setSelectedBranchId(resolvedBranchId);
    }
  }, [resolvedBranchId]);

  // Available departments & services
  const availableDepartments = useMemo(() => {
    return MOCK_DEPARTMENTS.filter(
      (d) =>
        d.institutionId === currentInstitution.institutionId &&
        (!selectedBranchId || d.branchId === selectedBranchId)
    );
  }, [currentInstitution, selectedBranchId]);

  // Kiosk Steps: 1: Branch/Dept, 2: Service, 3: Visitor Details, 4: Confirmed Ticket
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Selections
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  // Visitor info
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [visitorName, setVisitorName] = useState<string>('');
  const [visitorPhone, setVisitorPhone] = useState<string>('');
  const [wantsSMS, setWantsSMS] = useState<boolean>(false);
  const [wantsWhatsApp, setWantsWhatsApp] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generated Ticket Result
  const [generatedToken, setGeneratedToken] = useState<Token | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  // Auto-reset countdown for kiosk after ticket generation
  const [resetCountdown, setResetCountdown] = useState<number>(30);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Services for selected department
  const availableServices = useMemo(() => {
    if (!selectedDeptId) return [];
    return MOCK_SERVICES.filter((s) => s.departmentId === selectedDeptId);
  }, [selectedDeptId]);

  // Countdown timer when on confirmation step
  useEffect(() => {
    if (currentStep === 4 && generatedToken) {
      setResetCountdown(30);
      countdownIntervalRef.current = setInterval(() => {
        setResetCountdown((prev) => {
          if (prev <= 1) {
            handleResetKiosk();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [currentStep, generatedToken]);

  const handleResetKiosk = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCurrentStep(1);
    setSelectedDeptId('');
    setSelectedServiceId('');
    setIsAnonymous(true);
    setVisitorName('');
    setVisitorPhone('');
    setWantsSMS(false);
    setWantsWhatsApp(false);
    setGeneratedToken(null);
    setNotificationStatus(null);
    setErrorMessage(null);
  };

  const handleGenerateTicket = async () => {
    setErrorMessage(null);

    // Validation
    if (!selectedDeptId || !selectedServiceId) {
      setErrorMessage('Please select a department and service to proceed.');
      return;
    }

    if (!isAnonymous && !visitorName.trim()) {
      setErrorMessage('Please enter your name or select "Walk-in Visitor (Anonymous)".');
      return;
    }

    if ((wantsSMS || wantsWhatsApp) && !validatePhoneNumber(visitorPhone.trim())) {
      setErrorMessage('Please provide a valid mobile number with area code for notifications.');
      return;
    }

    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const finalVisitorName = isAnonymous ? 'Walk-in Visitor' : visitorName.trim();
      const finalPhone = visitorPhone.trim() || undefined;

      const token = await bookToken({
        institutionId: currentInstitution.institutionId,
        branchId: selectedBranchId,
        departmentId: selectedDeptId,
        serviceId: selectedServiceId,
        visitorName: finalVisitorName,
        visitorPhone: finalPhone,
        targetDate: today,
        priority: TokenPriority.STANDARD,
      });

      setGeneratedToken(token);

      // Handle SMS or WhatsApp Notification if requested
      if (finalPhone && (wantsSMS || wantsWhatsApp)) {
        const deptObj = availableDepartments.find((d) => d.departmentId === selectedDeptId);
        const channel = wantsWhatsApp ? 'WHATSAPP' : 'SMS';
        try {
          const res = await dispatchTicketNotification({
            channel,
            recipientPhone: finalPhone,
            hasUserConsent: true,
            institutionId: currentInstitution.institutionId,
            branchId: selectedBranchId,
            tokenNumber: token.tokenNumber,
            departmentName: deptObj?.name || 'General Services',
            estimatedWaitMinutes: token.estimatedWaitMinutes || 15,
            qrPayload: token.qrCodeValue,
          });
          setNotificationStatus(res.message);
        } catch {
          setNotificationStatus('Pass generated. Mobile notification gateway is offline.');
        }
      }

      setCurrentStep(4);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to generate ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-between select-none">
      {/* Top Kiosk Header */}
      <header className="bg-slate-950/90 border-b border-slate-800 px-6 sm:px-12 py-5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg border border-blue-400/40">
            Q
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{currentInstitution.name}</span>
            </div>
            <div className="text-xs sm:text-sm text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>
                {availableBranches.find((b) => b.branchId === selectedBranchId)?.name || 'Main Campus'} &bull; Walk-In Ticket Kiosk
              </span>
            </div>
          </div>
        </div>

        {currentStep > 1 && (
          <button
            onClick={handleResetKiosk}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-blue-300 hover:bg-slate-700 hover:border-blue-500/50 transition text-xs font-semibold border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Kiosk</span>
          </button>
        )}
      </header>

      {/* Main Kiosk Content Area */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full flex flex-col justify-center">
        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Select Department */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-500/20 px-3.5 py-1.5 rounded-full border border-blue-500/30">
                Step 1 of 3
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Select Your Department
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Touch a department below to view available service windows and queues.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {availableDepartments.map((dept) => (
                <button
                  key={dept.departmentId}
                  onClick={() => {
                    setSelectedDeptId(dept.departmentId);
                    setCurrentStep(2);
                  }}
                  className="p-6 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-blue-500/80 transition text-left flex items-center justify-between group shadow-lg active:scale-98"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-blue-400">
                      {dept.code}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Tap to inspect services</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Select Specific Service */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-500/20 px-3.5 py-1.5 rounded-full border border-blue-500/30">
                Step 2 of 3
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Select Your Service
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Choose the reason for your visit today.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {availableServices.map((srv) => (
                <button
                  key={srv.serviceId}
                  onClick={() => {
                    setSelectedServiceId(srv.serviceId);
                    setCurrentStep(3);
                  }}
                  className="p-6 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-blue-500/80 transition text-left flex flex-col justify-between group shadow-lg active:scale-98"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition mb-1">
                      {srv.name}
                    </h3>
                    <p className="text-xs text-slate-400 group-hover:text-slate-200 line-clamp-2 leading-relaxed transition-colors">
                      {srv.description || 'Standard institutional service desk.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 group-hover:text-slate-300 pt-4 mt-4 border-t border-slate-700/60 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>~{srv.estimatedDurationMinutes} mins duration</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-300 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Choose a different department</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Visitor Details & Notification Preferences */}
        {currentStep === 3 && (
          <div className="max-w-xl mx-auto w-full space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-500/20 px-3.5 py-1.5 rounded-full border border-blue-500/30">
                Step 3 of 3
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Ticket Information
              </h2>
              <p className="text-sm text-slate-400">
                Choose how you'd like your token issued.
              </p>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              {/* Identity Mode Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Visitor Identity
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(true)}
                    className={`py-3.5 px-4 rounded-xl text-xs font-bold border-2 transition ${
                      isAnonymous
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-blue-300 hover:border-blue-500/60'
                    }`}
                  >
                    Quick Walk-In (No Name)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(false)}
                    className={`py-3.5 px-4 rounded-xl text-xs font-bold border-2 transition ${
                      !isAnonymous
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-blue-300 hover:border-blue-500/60'
                    }`}
                  >
                    Enter My Name
                  </button>
                </div>
              </div>

              {!isAnonymous && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Optional Phone for SMS / WhatsApp Notification */}
              <div className="pt-2 border-t border-slate-700/80 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsSMS}
                      onChange={(e) => setWantsSMS(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300">
                      Send my ticket and live arrival updates via SMS
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsWhatsApp}
                      onChange={(e) => setWantsWhatsApp(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300">
                      Send updates via official WhatsApp Business
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleGenerateTicket}
                  disabled={isSubmitting}
                  className="flex-[2] py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Issuing Ticket...</span>
                    </>
                  ) : (
                    <>
                      <span>Issue Ticket Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Confirmation Ticket Screen */}
        {currentStep === 4 && generatedToken && (
          <div className="max-w-xl mx-auto w-full space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-2">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Your Ticket Is Ready!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Please take a photo, save, or print your pass.
              </p>
            </div>

            {/* Boarding-Pass Style Card */}
            <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden border-4 border-blue-600">
              <div className="flex items-center justify-between pb-4 border-b border-dashed border-slate-300 text-xs text-slate-500">
                <span className="font-bold text-blue-600 uppercase tracking-wider">
                  {currentInstitution.name}
                </span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>

              {/* Huge Token Typography */}
              <div className="py-6 space-y-1">
                <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Your Queue Token
                </div>
                <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-slate-900">
                  {generatedToken.tokenNumber}
                </div>
              </div>

              {/* Department & Wait Details */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left mb-6">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">
                    Department
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {availableDepartments.find((d) => d.departmentId === generatedToken.departmentId)?.name || 'General Services'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">
                    Est. Wait Time
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    ~{generatedToken.estimatedWaitMinutes || 15} minutes
                  </div>
                </div>
              </div>

              {/* QR Code Pass */}
              <div className="flex flex-col items-center justify-center pt-2">
                <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-sm mb-2">
                  <svg className="w-36 h-36 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="5" y="5" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="12" y="12" width="14" height="14" rx="2" />
                    <rect x="67" y="5" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="74" y="12" width="14" height="14" rx="2" />
                    <rect x="5" y="67" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="12" y="74" width="14" height="14" rx="2" />
                    <rect x="42" y="10" width="7" height="7" rx="1" />
                    <rect x="52" y="10" width="7" height="7" rx="1" />
                    <rect x="42" y="42" width="16" height="16" rx="2" />
                    <rect x="67" y="42" width="7" height="7" rx="1" />
                    <rect x="83" y="42" width="7" height="7" rx="1" />
                    <rect x="42" y="67" width="7" height="7" rx="1" />
                    <rect x="67" y="67" width="12" height="7" rx="1" />
                  </svg>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-600">
                  {generatedToken.tokenId}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Scan at desk or lobby display to verify check-in
                </span>
              </div>

              {/* Notification Banner */}
              {notificationStatus && (
                <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 text-left">
                  {notificationStatus}
                </div>
              )}
            </div>

              {/* Kiosk Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-blue-300 hover:border-blue-500/50 text-white text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetKiosk}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <span>Finish & Next Visitor</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            {/* Auto-reset Countdown */}
            <div className="text-xs text-slate-400">
              Kiosk will automatically reset in{' '}
              <span className="font-bold font-mono text-blue-400">{resetCountdown}s</span> for the next visitor.
            </div>
          </div>
        )}
      </main>

      {/* Kiosk Bottom Bar */}
      <footer className="bg-slate-950 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        QueueLess Universal Smart Queue &bull; Contactless Walk-In Terminal
      </footer>
    </div>
  );
};
