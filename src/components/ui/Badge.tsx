import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  const variantStyles = {
    success: 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]',
    warning: 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]',
    danger: 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]',
    info: 'bg-[#F0F9FF] text-[#075985] border border-[#BAE6FD]',
    neutral: 'bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]',
  }[variant];

  return (
    <span className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}>
      {children}
    </span>
  );
};
