import React, { forwardRef, ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    }[size];

    const variantStyles = {
      primary:
        'bg-[#0F2744] text-white hover:bg-[#1E3E62] active:bg-[#0A192C] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
      secondary:
        'bg-[#F0F7FF] text-[#0F2744] border border-[#BAE6FD] hover:bg-[#E0F2FE] hover:border-[#7DD3FC] hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0',
      destructive:
        'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#DC2626]',
      outline:
        'border border-[#CBD5E1] bg-white text-[#0F2744] hover:border-[#93C5FD] hover:bg-[#F0F7FF] hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0',
      ghost:
        'bg-transparent text-[#475569] hover:bg-[#F0F7FF] hover:text-[#0F2744] active:bg-[#E0F2FE]',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
