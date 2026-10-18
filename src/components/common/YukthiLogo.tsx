import React from 'react';

interface YukthiLogoProps {
  variant?: 'icon' | 'full' | 'horizontal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export function YukthiLogo({
  variant = 'horizontal',
  size = 'md',
  showTagline = true,
  className = '',
}: YukthiLogoProps) {
  if (variant === 'full') {
    const sizeClasses = {
      sm: 'w-24',
      md: 'w-36',
      lg: 'w-48',
      xl: 'w-60',
    };
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <img
          src="/yukthi-logo.jpg"
          alt="Yukthi — Your Money. Your Security. Your Future."
          className={`${sizeClasses[size]} h-auto object-contain rounded-xl`}
        />
      </div>
    );
  }

  if (variant === 'icon') {
    const iconSizes = {
      sm: 'w-7 h-7',
      md: 'w-9 h-9',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    };
    return (
      <div
        className={`${iconSizes[size]} rounded-xl overflow-hidden border border-[#E2E8F0] bg-white flex items-center justify-center shadow-xs shrink-0 ${className}`}
      >
        <img
          src="/yukthi-icon.png"
          alt="Yukthi Shield Emblem"
          className="w-full h-full object-contain p-0.5"
        />
      </div>
    );
  }

  // variant === 'horizontal'
  const iconSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-xl',
    xl: 'w-14 h-14 rounded-2xl',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${iconSizes[size]} overflow-hidden border border-[#CBD5E1] bg-white flex items-center justify-center shadow-xs shrink-0 group-hover:border-[#0284C7] transition-all`}
      >
        <img
          src="/yukthi-icon.png"
          alt="Yukthi Shield Emblem"
          className="w-full h-full object-contain p-0.5"
        />
      </div>
      <div className="flex flex-col min-w-0">
        <span
          className={`font-black tracking-tight text-[#0F2744] leading-tight ${textSizes[size]}`}
        >
          Yukthi
        </span>
        {showTagline && (
          <span className="text-[10px] text-[#0284C7] font-bold tracking-wider uppercase truncate -mt-0.5">
            FinTech Platform
          </span>
        )}
      </div>
    </div>
  );
}

export default YukthiLogo;
