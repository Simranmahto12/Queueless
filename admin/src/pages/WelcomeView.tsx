import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Building2,
  Ticket,
  Clock,
  QrCode,
  BarChart3,
  Flame,
  ArrowRight,
  Sparkles,
  HeartPulse,
  Landmark,
  GraduationCap,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { ConnectionStatusBadge } from '../components/ConnectionStatusBadge';

export const WelcomeView: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    isVisitor,
    isAdmin,
    connectionState,
    connectionHealth,
    connectionError,
  } = useAdmin();

  return (
    <div className="min-h-screen bg-appBg text-textMain flex flex-col font-sans selection:bg-primary/20">
      {/* Top Header */}
      <header className="bg-white border-b border-borderSoft sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center text-white font-bold text-lg shadow-sm border border-navy">
              Q
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-navy">QueueLess</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-textMuted font-medium border-l border-borderSoft pl-2">
                Smart Queue & Crowd Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ConnectionStatusBadge
              connectionState={connectionState}
              connectionHealth={connectionHealth}
              connectionError={connectionError}
            />
            {currentUser ? (
              <button
                onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/visitor/dashboard')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-navy text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                <span>Go to {isAdmin ? 'Admin Dashboard' : 'Visitor Portal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Universal Smart Queue Platform</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-navy leading-tight sm:leading-tight">
            Control when visitors arrive, where they wait, and how facilities flow.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-textMuted leading-relaxed">
            QueueLess replaces chaotic physical waiting lines with intelligent digital tokens,
            smart arrival slots, live counter triage, and real-time crowd heatmaps.
          </p>
        </div>

        {/* Two Portals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Card A: Visitor Portal */}
          <div className="bg-white rounded-2xl border border-borderSoft p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/60 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
                  <Ticket className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                  For Visitors & Citizens
                </span>
              </div>

              <h2 className="text-2xl font-bold text-navy mb-2">Visitor Portal</h2>
              <p className="text-sm text-textMuted leading-relaxed mb-6">
                Discover service facilities, generate digital tokens, receive calculated arrival windows,
                and track queue progress from anywhere without standing in line.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-textMain font-medium">
                    Discover hospitals, banks, colleges, and municipal offices
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-textMain font-medium">
                    Smart arrival slots minimize on-site waiting time
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-textMain font-medium">
                    Live queue position tracking and real-time estimated wait
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <QrCode className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-textMain font-medium">
                    Contactless digital QR pass for instant on-site check-in
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-borderSoft space-y-3">
              {currentUser && isVisitor ? (
                <Link
                  to="/visitor/dashboard"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                  <span>Open Your Visitor Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/visitor/login"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
                  >
                    <span>Visitor Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/visitor/register"
                    className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-borderSoft bg-slate-50 text-textMain text-sm font-semibold hover:bg-slate-100 transition"
                  >
                    <span>Register</span>
                  </Link>
                </div>
              )}
              <p className="text-[11px] text-center text-textMuted">
                Free self-registration for all citizens, students, and patients.
              </p>
            </div>
          </div>

          {/* Card B: Institution Admin Portal */}
          <div className="bg-white rounded-2xl border border-borderSoft p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-navy/10 border border-navy/20 flex items-center justify-center text-navy">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-navy bg-navy/10 px-2.5 py-1 rounded-md">
                  Authorized Personnel Only
                </span>
              </div>

              <h2 className="text-2xl font-bold text-navy mb-2">Institution Admin Portal</h2>
              <p className="text-sm text-textMuted leading-relaxed mb-6">
                Institutional command center for queue triage, counter operations, staff allocation,
                overcrowding heatmaps, and actionable throughput analytics.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                  <span className="text-xs text-textMain font-medium">
                    Live queue triage across multiple counters and departments
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-textMain font-medium">
                    Real-time crowd heatmaps and predictive overcrowding alerts
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                  <span className="text-xs text-textMain font-medium">
                    Branch, department, counter, and service rate configuration
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                  <span className="text-xs text-textMain font-medium">
                    Auditable operations log and throughput intelligence
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-borderSoft space-y-3">
              {currentUser && isAdmin ? (
                <Link
                  to="/admin/dashboard"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
                >
                  <span>Open Institution Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/admin/login"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
                >
                  <span>Administrator Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <p className="text-[11px] text-center text-textMuted">
                Restricted access. Requires provisioned institutional credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Physical Facility Stations & Terminals Bar */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-5xl mx-auto mb-16 shadow-lg border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>On-Site Physical Operations</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Dedicated Terminals for Physical Facilities
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Zero-setup dedicated modes for lobby screens, self-service walk-in kiosks, and front-desk counter staff.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            {/* Terminal 1: Lobby TV Display */}
            <Link
              to="/display"
              className="p-5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 transition-all duration-200 group flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                <div className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider mb-1">
                  Public Board
                </div>
                <h4 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Lobby TV Display
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Fullscreen wall-mounted display with live queue calls, next in line, and voice announcements.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-700/80">
                <div className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-400 text-xs font-semibold transition-all duration-200 shadow-sm">
                  <span>Launch TV Mode</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Terminal 2: Walk-In Kiosk */}
            <Link
              to="/kiosk"
              className="p-5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 transition-all duration-200 group flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                <div className="text-xs font-bold font-mono text-blue-400 uppercase tracking-wider mb-1">
                  Self-Service
                </div>
                <h4 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  Walk-In Ticket Kiosk
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Touchscreen terminal for walk-in visitors to select services, issue tokens, and print QR tickets.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-700/80">
                <div className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-400 text-xs font-semibold transition-all duration-200 shadow-sm">
                  <span>Open Kiosk Mode</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Terminal 3: Counter Station */}
            <Link
              to="/admin/login"
              className="p-5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-[#935222]/60 transition-all duration-200 group flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                <div className="text-xs font-bold font-mono text-[#d4a373] uppercase tracking-wider mb-1">
                  Desk Station
                </div>
                <h4 className="text-lg font-bold text-white group-hover:text-[#e2be9b] transition-colors">
                  Counter Focus Mode
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Distraction-free desk view for staff with 64px tokens, keyboard shortcuts, and synthesized chimes.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-700/80">
                <div className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#783e15]/25 text-[#e2be9b] border border-[#935222]/40 group-hover:bg-[#783e15] group-hover:text-white group-hover:border-[#a66230] text-xs font-semibold transition-all duration-200 shadow-sm">
                  <span>Staff Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Multi-Sector Institutional Coverage */}
        <div className="border border-borderSoft bg-white rounded-2xl p-6 sm:p-8 max-w-5xl mx-auto shadow-sm">
          <div className="text-center mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-textMuted">
              Built for Universal Multi-Sector Deployments
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-2">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-navy">Healthcare</span>
              <span className="text-[11px] text-textMuted mt-0.5">Hospitals & Clinics</span>
            </div>

            <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-navy">Banking</span>
              <span className="text-[11px] text-textMuted mt-0.5">Retail & Wealth Branches</span>
            </div>

            <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-2">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-navy">Higher Education</span>
              <span className="text-[11px] text-textMuted mt-0.5">Admissions & Registrar</span>
            </div>

            <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-2">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-navy">Government</span>
              <span className="text-[11px] text-textMuted mt-0.5">Public Service Centers</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-borderSoft bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-textMuted">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-navy">QueueLess</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/display" className="hover:text-primary transition-colors">
              Lobby TV Display
            </Link>
            <Link to="/kiosk" className="hover:text-primary transition-colors">
              Walk-In Kiosk
            </Link>
            <Link to="/visitor/login" className="hover:text-primary transition-colors">
              Visitor Portal
            </Link>
            <Link to="/admin/login" className="hover:text-navy transition-colors">
              Institution Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
