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
      className={`p-5 bg-white rounded-xl border border-borderSoft shadow-subtle ${
        onClick ? 'cursor-pointer hover:border-slate-300 transition-colors' : ''
      }`}
    >
      <div className="flex items-center justify-between text-textMuted mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</span>
        {icon && <div className="text-navy">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-textMain tracking-tight">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium inline-flex items-center gap-0.5 ${
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-textMuted mt-1">{subtitle}</p>}
    </div>
  );
};
