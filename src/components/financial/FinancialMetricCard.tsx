import React from 'react';
import { formatCurrency } from '@/lib/formatters';

export interface FinancialMetricCardProps {
  title: string;
  amountPaise: number | null | undefined;
  subtitle?: string;
  badge?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
  className?: string;
  isNegative?: boolean;
}

export const FinancialMetricCard: React.FC<FinancialMetricCardProps> = ({
  title,
  amountPaise,
  subtitle,
  badge,
  variant = 'default',
  icon,
  className = '',
  isNegative = false,
}) => {
  const variantStyles = {
    default: {
      border: 'border-[#E2E8F0]',
      bg: 'bg-white',
      accent: 'text-[#0F2744]',
    },
    success: {
      border: 'border-[#A7F3D0]',
      bg: 'bg-white',
      accent: 'text-[#059669]',
    },
    warning: {
      border: 'border-[#FDE68A]',
      bg: 'bg-white',
      accent: 'text-[#D97706]',
    },
    danger: {
      border: 'border-[#FECACA]',
      bg: 'bg-white',
      accent: 'text-[#DC2626]',
    },
    info: {
      border: 'border-[#BAE6FD]',
      bg: 'bg-white',
      accent: 'text-[#0284C7]',
    },
  }[variant];

  return (
    <div
      className={`rounded-xl border ${variantStyles.border} ${variantStyles.bg} p-5 shadow-xs transition-all duration-200 hover:border-[#93C5FD] hover:shadow-md hover:-translate-y-0.5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {badge}
          {icon && <div className="text-[#64748B] hover:text-[#0F2744] transition-colors">{icon}</div>}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold tracking-tight ${variantStyles.accent}`}>
          {isNegative ? '-' : ''}
          {formatCurrency(amountPaise)}
        </span>
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
