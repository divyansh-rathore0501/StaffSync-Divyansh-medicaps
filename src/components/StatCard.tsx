import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  colorScheme?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
  badge?: {
    text: string;
    variant: 'positive' | 'negative' | 'neutral';
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'indigo',
  badge
}) => {
  const schemeStyles = {
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      borderAccent: 'hover:border-indigo-200'
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      borderAccent: 'hover:border-emerald-200'
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      borderAccent: 'hover:border-rose-200'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      borderAccent: 'hover:border-amber-200'
    },
    slate: {
      iconBg: 'bg-slate-50 text-slate-600 border-slate-100',
      borderAccent: 'hover:border-slate-200'
    }
  }[colorScheme];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all duration-200 ${schemeStyles.borderAccent}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl border ${schemeStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subtitle || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle}</span>
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-full font-medium ${
                badge.variant === 'positive'
                  ? 'bg-emerald-50 text-emerald-700'
                  : badge.variant === 'negative'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {badge.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
