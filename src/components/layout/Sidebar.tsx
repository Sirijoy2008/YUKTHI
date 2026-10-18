'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export interface NavItem {
  name: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export const navItems: NavItem[] = [
  {
    name: 'Home',
    description: 'See your money overview and important updates.',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Check for Scams',
    description: 'Check if a payment request looks suspicious.',
    href: '/scam-checker',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    name: 'Payment Help',
    description: 'Get help with failed, delayed, or missing payments.',
    href: '/payment-assistant',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: 'Money Planner',
    description: 'Track money coming in, money going out, and upcoming expenses.',
    href: '/cash-flow',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Alerts & Actions',
    description: 'See important warnings and what you need to do next.',
    href: '/action-centre',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    name: 'My Account',
    description: 'Manage your profile and account preferences.',
    href: '/settings',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const getTranslatedName = (href: string, fallback: string) => {
    switch (href) {
      case '/dashboard':
        return t('navDashboard');
      case '/scam-checker':
        return t('navScamChecker');
      case '/payment-assistant':
        return t('navPaymentAssistant');
      case '/cash-flow':
        return t('navCashFlow');
      case '/action-centre':
        return t('navActionCentre');
      case '/settings':
        return t('navSettings');
      default:
        return fallback;
    }
  };

  const getTranslatedDesc = (href: string, fallback: string) => {
    switch (href) {
      case '/dashboard':
        return t('navDashboardDesc');
      case '/scam-checker':
        return t('navScamCheckerDesc');
      case '/payment-assistant':
        return t('navPaymentAssistantDesc');
      case '/cash-flow':
        return t('navCashFlowDesc');
      case '/action-centre':
        return t('navActionCentreDesc');
      case '/settings':
        return t('navSettingsDesc');
      default:
        return fallback;
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-2xs"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white text-[#0F2744] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-[#E2E8F0] shadow-xs`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#E2E8F0] bg-white">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#CBD5E1] bg-white flex items-center justify-center shadow-2xs shrink-0 group-hover:border-[#0284C7] transition-all">
              <img
                src="/yukthi-icon.png"
                alt="Yukthi Emblem"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black tracking-tight text-lg text-[#0F2744] leading-tight">
                YUKTHI
              </span>
              <span className="text-[10px] text-[#0284C7] font-semibold tracking-tight -mt-0.5 truncate">
                Smarter Payments. Safer Money.
              </span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-[#64748B] hover:text-[#0F2744] p-1.5 rounded-lg hover:bg-[#F0F7FF] transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation list: Six core tabs only */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                  isActive
                    ? 'bg-[#F0F7FF] text-[#0284C7] border-l-4 border-[#0284C7] shadow-2xs'
                    : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F2744] border-l-4 border-transparent hover:border-[#BAE6FD]'
                }`}
              >
                <span className={`shrink-0 transition-colors ${isActive ? 'text-[#0284C7]' : 'text-[#64748B] group-hover:text-[#0284C7]'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 text-sm font-semibold tracking-tight truncate">
                  {getTranslatedName(item.href, item.name)}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* System Trust & Security Banner */}
        <div className="p-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <svg className="w-4 h-4 text-[#0284C7] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-medium text-[11px] leading-tight text-[#475569]">
              Verified Security · NPCI & RBI Frameworks
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
