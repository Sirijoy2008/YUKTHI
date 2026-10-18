'use client';

import React from 'react';
import { useUserSession } from '@/hooks/useUserSession';
import Link from 'next/link';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { userId, userName } = useUserSession();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 lg:px-8 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Open sidebar"
            className="lg:hidden p-2 rounded-lg text-[#475569] hover:bg-[#F0F7FF] hover:text-[#0F2744] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-medium text-[#065F46]">
          <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
          <span>Core Services Verified</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <LanguageSelector variant="compact" />

        {/* Currency & Market Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F0F7FF] border border-[#BAE6FD] text-xs font-medium text-[#0369A1] transition-colors hover:bg-[#E0F2FE]">
          <span className="text-[#0284C7] font-bold">₹</span>
          <span>INR Minor Units (Paise)</span>
        </div>

        {/* User Identity Session Chip */}
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F0F7FF] hover:border-[#93C5FD] transition-all duration-200 text-xs shadow-2xs hover:shadow-xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          title="My Account"
        >
          <div className="w-6 h-6 rounded-full bg-[#0F2744] text-white flex items-center justify-center font-bold text-[11px] group-hover:bg-[#1E3E62] transition-colors">
            {userName ? userName.charAt(0).toUpperCase() : userId.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-semibold text-[#0F2744] leading-tight">
              {userName || 'User'}
            </span>
            <span className="text-[10px] text-[#0284C7] font-medium">My Account</span>
          </div>
        </Link>
      </div>
    </header>
  );
};
