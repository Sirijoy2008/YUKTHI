import React, { forwardRef, TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error = false, className = '', disabled, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] ${
          error
            ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
            : 'border-[#CBD5E1] hover:border-[#93C5FD] focus:border-[#2563EB] focus:ring-2 focus:ring-[#93C5FD]/40'
        } ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
