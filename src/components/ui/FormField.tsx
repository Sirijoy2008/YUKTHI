import React from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  description,
  required = false,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold uppercase tracking-wider text-[#334155]"
        >
          {label}
          {required && <span className="ml-1 text-[#DC2626]">*</span>}
        </label>
      </div>
      {children}
      {description && !error && (
        <p className="text-xs text-[#64748B] leading-relaxed">{description}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-[#DC2626] flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
