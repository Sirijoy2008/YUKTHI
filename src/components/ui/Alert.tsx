import React from 'react';

export interface AlertProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  children,
  variant = 'info',
  className = '',
  onClose,
}) => {
  const styles = {
    info: {
      bg: 'bg-[#F0F9FF]',
      border: 'border-[#BAE6FD]',
      text: 'text-[#0C4A6E]',
      icon: (
        <svg className="w-5 h-5 text-[#0284C7] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    success: {
      bg: 'bg-[#ECFDF5]',
      border: 'border-[#A7F3D0]',
      text: 'text-[#064E3B]',
      icon: (
        <svg className="w-5 h-5 text-[#059669] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-[#FFFBEB]',
      border: 'border-[#FDE68A]',
      text: 'text-[#78350F]',
      icon: (
        <svg className="w-5 h-5 text-[#D97706] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    danger: {
      bg: 'bg-[#FEF2F2]',
      border: 'border-[#FECACA]',
      text: 'text-[#7F1D1D]',
      icon: (
        <svg className="w-5 h-5 text-[#DC2626] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  }[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-lg border ${styles.bg} ${styles.border} ${styles.text} ${className}`}
    >
      {styles.icon}
      <div className="flex-1 text-sm leading-relaxed">
        {title && <h5 className="font-semibold text-sm mb-1">{title}</h5>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss alert"
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
