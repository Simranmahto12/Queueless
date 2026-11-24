import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Ticket,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export const VisitorLoginView: React.FC = () => {
  const navigate = useNavigate();
  const { loginVisitor } = useAdmin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDemoBox, setShowDemoBox] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginVisitor(email.trim(), password);
      navigate('/visitor/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-appBg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-md border border-primary">
            <Ticket className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-navy">
          Sign In to Visitor Portal
        </h2>
        <p className="mt-1 text-center text-xs text-textMuted">
          Book digital tokens, view live queue positions and manage your visits.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-borderSoft rounded-2xl sm:px-10">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-textMain mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-textMuted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-borderSoft rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-textMain transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-textMain">
                  Password
                </label>
                <Link
                  to="/visitor/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-textMuted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-borderSoft rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-textMain transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-textMuted hover:text-textMain transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm disabled:opacity-50 transition-all mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Visitor</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-5 border-t border-borderSoft">
            <button
              type="button"
              onClick={() => setShowDemoBox(!showDemoBox)}
              className="w-full flex items-center justify-between text-xs font-medium text-textMuted hover:text-textMain transition-colors py-1"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tester Quick Fill Helper</span>
              </span>
              {showDemoBox ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDemoBox && (
              <div className="mt-3 p-3 bg-slate-50 border border-borderSoft rounded-xl space-y-2">
                <p className="text-[11px] text-textMuted leading-relaxed">
                  Use this pre-seeded visitor demo account or register a new one:
                </p>
                <div
                  onClick={() => fillQuickDemo('visitor.david@example.com', 'VisitorPass123!')}
                  className="p-2 bg-white rounded-lg border border-borderSoft hover:border-primary/40 cursor-pointer transition text-left"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-navy">
                    <span>David Miller (Visitor)</span>
                    <span className="text-[10px] text-primary">Autofill</span>
                  </div>
                  <div className="text-[11px] text-textMuted mt-0.5">visitor.david@example.com &bull; VisitorPass123!</div>
                </div>
              </div>
            )}
          </div>

          {/* Link to Register */}
          <div className="mt-5 text-center text-xs text-textMuted">
            <span>Don't have a visitor account? </span>
            <Link to="/visitor/register" className="text-primary font-semibold hover:underline">
              Register now
            </Link>
          </div>

          {/* Link to Admin */}
          <div className="mt-4 pt-4 border-t border-borderSoft text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs text-textMuted hover:text-navy font-medium transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-navy" />
              <span>Are you an institution staff or administrator? Sign in here</span>
            </Link>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-textMuted hover:text-textMain transition-colors">
            &larr; Back to QueueLess Welcome Page
          </Link>
        </div>
      </div>
    </div>
  );
};
