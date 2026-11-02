import React from 'react';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  title: string;
  value: string | number;
  numericValue?: number;
  prefix?: string;
  suffix?: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: 'red' | 'amber' | 'emerald' | 'blue';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  numericValue,
  prefix = '',
  suffix = '',
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'blue',
  trend
}) => {
  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'red': return 'bg-red-50 text-red-700 border-red-200';
      case 'amber': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const numVal = numericValue !== undefined ? numericValue : (typeof value === 'number' ? value : null);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
          <Icon className="w-4 h-4 transition-colors duration-200" />
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline justify-between">
        <div className="text-2xl font-bold font-mono text-[#172B4D] tracking-tight">
          {numVal !== null ? (
            <AnimatedCounter value={numVal} prefix={prefix} suffix={suffix} />
          ) : (
            value
          )}
        </div>
        {badge && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getBadgeStyle()}`}>
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>{subtitle}</span>
          {trend && <span className="font-mono text-[11px] text-slate-600 font-medium">{trend}</span>}
        </div>
      )}
    </div>
  );
};
