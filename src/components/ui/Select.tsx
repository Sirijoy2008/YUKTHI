import React, { forwardRef, SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error = false, className = '', disabled, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={`w-full appearance-none rounded-lg border bg-white px-3.5 py-2 pr-9 text-sm text-[#0F172A] transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
              : 'border-[#CBD5E1] hover:border-[#93C5FD] focus:border-[#2563EB] focus:ring-2 focus:ring-[#93C5FD]/40'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#64748B]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
