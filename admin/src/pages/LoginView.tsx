import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Info,
  Ticket,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { getDemoAccountsForDev } from '@queueless/shared';

export const LoginView: React.FC = () => {
  const { login, resetPassword } = useAdmin();
  const showDeveloperAccounts =
    import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEVELOPER_CONTROLS === 'true';

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [isResetLoading, setIsResetLoading] = useState(false);

  // Demo accounts helper (for development / reviewer evaluation)
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const demoAccounts = showDeveloperAccounts ? getDemoAccountsForDev() : [];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your institutional email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResetSuccessMessage(null);

    if (!resetEmail.trim()) {
      setErrorMessage('Please provide the email address associated with your account.');
      return;
    }

    setIsResetLoading(true);
    try {
      const res = await resetPassword(resetEmail.trim());
      setResetSuccessMessage(res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to dispatch password reset instructions.';
      setErrorMessage(msg);
    } finally {
      setIsResetLoading(false);
    }
  };

  const fillDemoAccount = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-appBg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-white font-bold text-2xl shadow-md border border-navy">
            Q
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-textMain">
          QueueLess Admin Portal
        </h2>
        <p className="mt-1 text-center text-xs text-textMuted font-medium">
          Multi-Sector Queue & Institution Crowd Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-borderSoft rounded-2xl sm:px-10">
          {/* Main Error or Visitor Alert Banner */}
          {errorMessage && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-xs animate-fadeIn ${
                errorMessage.includes('visitor')
                  ? 'bg-blue-50/90 border border-blue-200 text-blue-900'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {errorMessage.includes('visitor') ? (
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold leading-relaxed">{errorMessage}</div>
                {errorMessage.includes('visitor') && (
                  <div className="mt-2 text-[11px] text-blue-700 leading-normal space-y-2">
                    <p>
                      The Admin Portal is reserved for institutional operations and staff triage.
                    </p>
                    <Link
                      to="/visitor/login"
                      className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline bg-white px-2.5 py-1 rounded-md border border-blue-200"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Switch to Visitor Portal &rarr;</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isForgotPassword ? (
            /* Sign In Form */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-textMain mb-1.5">
                  Institutional Email
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@institution.org"
                    autoComplete="email"
                    required
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-borderSoft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-textMain placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-textMain">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsForgotPassword(true);
                      setErrorMessage(null);
                    }}
                    className="text-xs text-primary font-medium hover:underline focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="block w-full pl-9 pr-10 py-2 text-xs border border-borderSoft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-textMain placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-navy hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Admin Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Security Policy Reminder */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2 text-[11px] text-textMuted leading-relaxed">
                <Shield className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                <span>
                  Admin console access is restricted to verified institution personnel. Visitor accounts are not authorized and must use the mobile application.
                </span>
              </div>
            </form>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleResetSubmit} className="space-y-5 animate-fadeIn">
              <div className="text-center sm:text-left">
                <h3 className="text-sm font-bold text-textMain">Reset Administrator Password</h3>
                <p className="mt-1 text-xs text-textMuted leading-relaxed">
                  Enter your registered institutional email to receive secure password recovery instructions.
                </p>
              </div>

              {resetSuccessMessage ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{resetSuccessMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetSuccessMessage(null);
                      setErrorMessage(null);
                    }}
                    className="w-full py-2 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-textMain mb-1.5">
                      Institutional Email
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="admin@institution.org"
                        required
                        className="block w-full pl-9 pr-3 py-2 text-xs border border-borderSoft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-textMain placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setErrorMessage(null);
                      }}
                      className="w-1/3 flex items-center justify-center gap-1.5 py-2 px-3 border border-borderSoft rounded-lg text-xs font-medium text-textMuted hover:bg-slate-50 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isResetLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-primary hover:bg-blue-700 transition-colors disabled:opacity-60"
                    >
                      {isResetLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending Link...</span>
                        </>
                      ) : (
                        <span>Send Instructions</span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* Explicitly enabled development-only account helper */}
          {showDeveloperAccounts && (
            <div className="mt-6 pt-5 border-t border-borderSoft">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-navy" />
                <span>Development & Evaluation Accounts</span>
              </div>
              {showDemoAccounts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDemoAccounts && (
              <div className="mt-3 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs animate-fadeIn">
                <p className="text-[11px] text-textMuted leading-relaxed">
                  Click any account below to autofill and verify authentication, role-based access, and session management:
                </p>
                <div className="space-y-1.5 pt-1">
                  {demoAccounts.map((acc) => (
                    <div
                      key={acc.email}
                      className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[11px] text-textMain truncate">
                            {acc.email}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              acc.role === 'VISITOR'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {acc.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-textMuted truncate">{acc.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fillDemoAccount(acc.email, acc.defaultPass)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded shrink-0 transition-colors"
                      >
                        Autofill
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          )}
        </div>

        {/* Navigation Switchers */}
        <div className="mt-6 flex flex-col items-center gap-2 text-xs text-textMuted">
          <div>
            <span>Are you a visitor booking a token? </span>
            <Link to="/visitor/login" className="text-primary font-semibold hover:underline">
              Enter Visitor Portal
            </Link>
          </div>
          <div>
            <Link to="/" className="text-textMuted hover:text-textMain transition-colors">
              &larr; Back to QueueLess Welcome Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
