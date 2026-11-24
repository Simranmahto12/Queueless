import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import {
  decodeAndValidateQRPayload,
  checkInVisitorWithQR,
  getInMemoryTokenById,
  listenSingleToken,
  Token,
  TokenStatus,
  TokenPriority,
  MOCK_DEPARTMENTS,
  MOCK_SERVICES,
  MOCK_INSTITUTIONS,
} from '@queueless/shared';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Share2,
  Copy,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const PublicPassView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const params = useParams<{ tokenId?: string }>();

  const idParam = searchParams.get('id') || params.tokenId || '';
  const dataParam = searchParams.get('data') || searchParams.get('qr') || '';

  const [token, setToken] = useState<Token | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
  const [checkInSuccess, setCheckInSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Initial resolve from token ID or decoded payload
  useEffect(() => {
    let resolvedToken: Token | null = null;

    if (idParam) {
      const found = getInMemoryTokenById(idParam);
      if (found) resolvedToken = found;
    }

    if (!resolvedToken && dataParam) {
      const qrRes = decodeAndValidateQRPayload(dataParam);
      if (qrRes.isValid && qrRes.payload) {
        const found = getInMemoryTokenById(qrRes.payload.tokenId);
        if (found) {
          resolvedToken = found;
        } else {
          // Construct synthetic token from valid payload for standalone phone view
          resolvedToken = {
            id: qrRes.payload.tokenId,
            tokenId: qrRes.payload.tokenId,
            tokenNumber: qrRes.payload.tokenNumber,
            institutionId: qrRes.payload.institutionId,
            branchId: qrRes.payload.branchId,
            departmentId: 'dep-cardio',
            serviceId: 'srv-ecg',
            visitorId: 'mobile-visitor',
            visitorName: 'Mobile Visitor',
            priority: TokenPriority.STANDARD,
            status: TokenStatus.ISSUED,
            scheduledSlot: {
              date: new Date().toISOString().split('T')[0],
              startTime: '10:30',
              endTime: '11:00',
            },
            smartArrivalSlot: {
              recommendedArrivalStart: new Date().toISOString(),
              recommendedArrivalEnd: new Date().toISOString(),
            },
            estimatedWaitMinutes: 12,
            issuedAt: new Date(qrRes.payload.issuedAt).toISOString(),
            qrCodeValue: dataParam,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      }
    }

    if (resolvedToken) {
      setToken(resolvedToken);
      if (resolvedToken.status === TokenStatus.COMPLETED) {
        setCheckInSuccess(true);
      }
    } else {
      // Fallback lookup by token number if id was passed as e.g. T-CARD-601
      const fallback = getInMemoryTokenById(idParam);
      if (fallback) {
        setToken(fallback);
      }
    }
  }, [idParam, dataParam]);

  // Real-time listener for live status updates on phone
  useEffect(() => {
    if (!token?.tokenId) return;
    const unsub = listenSingleToken(token.tokenId, (updated: Token | null) => {
      if (updated) {
        setToken(updated);
        if (updated.status === TokenStatus.COMPLETED) {
          setCheckInSuccess(true);
        }
      }
    });
    return () => unsub();
  }, [token?.tokenId]);

  const handlePerformCheckIn = async () => {
    if (!token) return;
    setIsCheckingIn(true);
    setErrorMessage(null);

    try {
      const res = await checkInVisitorWithQR({
        qrPayload: dataParam || token.qrCodeValue || token.tokenId,
        expectedInstitutionId: token.institutionId,
        expectedBranchId: token.branchId,
        targetZoneId: 'zone-apex-cardio',
        markAsCompleted: true,
      });

      if (res.success) {
        setCheckInSuccess(true);
        if (res.token) {
          setToken(res.token);
        } else {
          setToken((prev) => (prev ? { ...prev, status: TokenStatus.COMPLETED } : prev));
        }
      } else {
        setErrorMessage(res.errorMessage || 'Check-in validation failed.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Check-in validation failed.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const institutionName =
    MOCK_INSTITUTIONS.find((i) => i.institutionId === token?.institutionId)?.name ||
    'Apex City Hospital & Medical Center';
  const departmentName =
    MOCK_DEPARTMENTS.find((d) => d.departmentId === token?.departmentId)?.name ||
    'Cardiology & Vascular';
  const serviceName =
    MOCK_SERVICES.find((s) => s.serviceId === token?.serviceId)?.name ||
    'General Medical Consultation';

  const shareText = `🏥 QueueLess Pass: Token ${token?.tokenNumber || 'Queue Pass'} at ${institutionName}. Scheduled arrival: ${token?.scheduledSlot?.startTime || '10:30'} - ${token?.scheduledSlot?.endTime || '11:00'}. Live pass: ${window.location.href}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const smsUrl = `sms:?&body=${encodeURIComponent(shareText)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!token && !idParam && !dataParam) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-6 text-center border border-slate-700 shadow-xl">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-2">No Ticket Pass Specified</h1>
          <p className="text-xs text-slate-400 mb-6">
            Please scan the QR code from your booking screen or provide a valid ticket identifier.
          </p>
          <Link
            to="/visitor/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
          >
            <span>Go to Visitor Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = token?.status === TokenStatus.COMPLETED || checkInSuccess;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-sans flex flex-col items-center justify-start py-6 px-4 sm:px-6">
      {/* Top Bar / Brand */}
      <header className="max-w-md w-full flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-sm">
            Q
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">QueueLess</span>
            <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">
              Live Digital Mobile Pass
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Synchronized</span>
        </div>
      </header>

      {/* Main Boarding Pass Card */}
      <main className="max-w-md w-full bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Pass Header Band */}
        <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-700 text-white relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider block">
                {institutionName}
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">{departmentName}</h2>
              <p className="text-xs text-blue-100/90 mt-0.5">{serviceName}</p>
            </div>
            <div className="shrink-0 p-2 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <Sparkles className="w-5 h-5 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Token Big Number & Status Hero */}
        <div className="p-6 text-center border-b border-dashed border-slate-800 relative">
          {/* Decorative Notch cutouts on edges (boarding pass style) */}
          <div className="w-6 h-6 rounded-full bg-slate-950 absolute -left-3 -bottom-3 border-r border-slate-800" />
          <div className="w-6 h-6 rounded-full bg-slate-950 absolute -right-3 -bottom-3 border-l border-slate-800" />

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Your Token Number
          </span>
          <div className="font-mono text-4xl sm:text-5xl font-black text-white tracking-wider my-1 text-shadow-sm">
            {token?.tokenNumber || idParam || 'T-PASS'}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>✓ Pass Verified & Completed</span>
              </span>
            ) : token?.status === TokenStatus.CALLED ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                <span>🔔 Now Being Called to Desk</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                <span>Confirmed • Ready for Check-In</span>
              </span>
            )}
          </div>
        </div>

        {/* Schedule & ETA Metrics */}
        <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-800/80">
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Arrival Window</span>
            </div>
            <div className="text-sm font-bold text-white">
              {token?.scheduledSlot?.startTime || '10:30'} - {token?.scheduledSlot?.endTime || '11:00'}
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium mb-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Est. Wait</span>
            </div>
            <div className="text-sm font-bold text-white">
              {token?.estimatedWaitMinutes || 12} mins
            </div>
          </div>
        </div>

        {/* Interactive Check-In & Action Zone */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isCompleted ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-sm font-bold text-white">Pass Successfully Used & Completed</h3>
              <p className="text-xs text-emerald-300/90 mt-1 max-w-xs mx-auto">
                Your single-use QR pass has been verified and registered in the system history. You are now free to book another ticket!
              </p>
              <div className="mt-4 pt-3 border-t border-emerald-900/60 flex items-center justify-center gap-3">
                <Link
                  to="/visitor/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  <span>Book Another Ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={handlePerformCheckIn}
                disabled={isCheckingIn}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base tracking-wide transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isCheckingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying & Checking In...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                    <span>✓ Tap to Check In at Facility</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Single-use cryptographic pass. Tapping completes check-in and admits you into queue.
              </p>
            </div>
          )}

          {/* Quick Share to Mobile (WhatsApp & SMS) */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Deliver Pass to Your Phone
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send via WhatsApp</span>
              </a>

              <a
                href={smsUrl}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Open in SMS</span>
              </a>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full mt-2 flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? '✓ Pass Link Copied!' : 'Copy Mobile Pass Link'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="max-w-md w-full text-center mt-6 text-[11px] text-slate-500">
        QueueLess Smart Physical Operations &bull; Single-Use Verified Pass
      </footer>
    </div>
  );
};
