import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-3 bg-white rounded-xl border border-borderSoft shadow-card ${
        onClick ? 'cursor-pointer hover:border-slate-300 transition-colors' : ''
      }`}
    >
      <div className="flex items-center justify-between text-textMuted mb-1">
        <span className="rounded-full bg-navy-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">{title}</span>
        {icon && <div className="w-6 h-6 rounded-md bg-navy-50 text-navy flex items-center justify-center">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-textMain tracking-tight">{value}</span>
        {trend && (
          <span
            className={`text-[10px] font-medium inline-flex items-center gap-0.5 ${
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="text-[10px] font-medium text-textMain mt-0.5">{subtitle}</p>}
    </div>
  );
};
