import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Ticket, Shield } from 'lucide-react';

export const NotFoundView: React.FC = () => {
  return (
    <div className="min-h-screen bg-appBg flex flex-col items-center justify-center p-6 text-center font-sans select-none">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-borderSoft flex items-center justify-center text-textMuted mb-6 shadow-xs">
        <HelpCircle className="w-8 h-8 text-primary" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
        404 &bull; Page Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight mb-2">
        We couldn't find that page
      </h1>

      <p className="text-sm text-textMuted max-w-md mx-auto mb-8 leading-relaxed">
        The destination URL may have moved or doesn't exist. Please choose an authentic portal below to continue.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-navy text-white hover:bg-slate-800 transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>QueueLess Home</span>
        </Link>
        <Link
          to="/visitor/login"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-blue-700 transition shadow-xs"
        >
          <Ticket className="w-4 h-4" />
          <span>Visitor Portal</span>
        </Link>
        <Link
          to="/admin/login"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-borderSoft text-textMain hover:bg-slate-50 transition shadow-xs"
        >
          <Shield className="w-4 h-4 text-navy" />
          <span>Admin Portal</span>
        </Link>
      </div>
    </div>
  );
};
