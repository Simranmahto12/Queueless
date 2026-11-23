import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = (val: string) => {
    switch (val.toUpperCase()) {
      case 'OPEN':
      case 'COMPLETED':
      case 'NORMAL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'WAITING':
      case 'ISSUED':
      case 'MODERATE':
      case 'CHECKED_IN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
      case 'BUSY':
      case 'CALLED':
      case 'ELEVATED':
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'CRITICAL':
      case 'OVERCROWDED':
      case 'PAUSED':
      case 'NO_SHOW':
      case 'CANCELLED':
      case 'CLOSED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle(
        status
      )} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
