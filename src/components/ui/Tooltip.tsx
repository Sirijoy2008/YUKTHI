'use client';

import React, { useState } from 'react';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 ${positionStyles} px-2.5 py-1.5 text-xs font-normal text-white bg-[#0B192C] rounded-md shadow-md max-w-xs whitespace-normal pointer-events-none transition-opacity duration-150 animate-in fade-in`}
        >
          {content}
          <div
            className={`absolute w-1.5 h-1.5 bg-[#0B192C] rotate-45 ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 -mt-0.5'
                : position === 'bottom'
                ? 'bottom-full left-1/2 -translate-x-1/2 -mb-0.5'
                : position === 'left'
                ? 'left-full top-1/2 -translate-y-1/2 -ml-0.5'
                : 'right-full top-1/2 -translate-y-1/2 -mr-0.5'
            }`}
          />
        </div>
      )}
    </div>
  );
};
