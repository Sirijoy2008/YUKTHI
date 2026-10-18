'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Button } from '@/components/ui/Button';

export default function WelcomePage() {
  const { t } = useLanguage();
  const [activeCardIndex, setActiveCardIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);

  // Auto-roll across the 4 unique cards every 4 seconds
  React.useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Smoothly roll the container horizontally when active card changes
  React.useEffect(() => {
    if (trackRef.current && trackRef.current.children[activeCardIndex]) {
      const targetCard = trackRef.current.children[activeCardIndex] as HTMLElement;
      targetCard.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCardIndex]);

  const handlePrev = () => {
    setActiveCardIndex((prev) => (prev - 1 + 4) % 4);
  };

  const handleNext = () => {
    setActiveCardIndex((prev) => (prev + 1) % 4);
  };

  const fourUniqueFeatures = [
    {
      id: 'scam-checker',
      badge: 'Check for Scams',
      badgeColor: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
      title: t('featScamTitle'),
      subtitle: 'Real-time Threat Detection',
      desc: t('featScamDesc'),
      href: '/scam-checker',
      iconBg: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      bullets: [
        'SMS, WhatsApp & UPI message risk analysis',
        'Instant scam confidence score (0-100%)',
        'Suspicious APK & phishing link alerts',
      ],
    },
    {
      id: 'payment-assistant',
      badge: 'Payment Help',
      badgeColor: 'bg-[#F0F7FF] text-[#0284C7] border-[#BAE6FD]',
      title: t('featPaymentTitle'),
      subtitle: 'NPCI & Bank Escalation',
      desc: t('featPaymentDesc'),
      href: '/payment-assistant',
      iconBg: 'bg-[#F0F7FF] border-[#BAE6FD] text-[#0284C7]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      bullets: [
        'NPCI T+1 to T+5 turnaround tracking',
        'Auto-generated formal bank complaint letters',
        'Delayed & debited payment status timeline',
      ],
    },
    {
      id: 'cash-flow',
      badge: 'Money Planner',
      badgeColor: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
      title: t('featCashFlowTitle'),
      subtitle: 'Guaranteed Funds Safety',
      desc: t('featCashFlowDesc'),
      href: '/cash-flow',
      iconBg: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bullets: [
        'Strict isolation of unconfirmed receipts',
        'Committed outgoing payables schedule',
        'Conservative surplus & safe spend runway',
      ],
    },
    {
      id: 'verify-aadhaar',
      badge: 'Identity Verification (KYC)',
      badgeColor: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
      title: t('aadhaarTitle'),
      subtitle: 'UIDAI & DigiLocker Gateway',
      desc: 'Authorized DigiLocker / UIDAI ASA gateway token exchange without storing biometrics or raw Aadhaar numbers.',
      href: '/verify-aadhaar',
      iconBg: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      bullets: [
        'UIDAI ASA compliant gateway interface',
        'Zero raw biometric or UID number storage',
        'Secure sandbox & production token verification',
      ],
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#334155] flex flex-col selection:bg-[#BAE6FD]/40 selection:text-[#0F2744] overflow-x-hidden">
      {/* Seamless Merging Background Illustration */}
      <div
        className="absolute inset-x-0 top-0 h-[920px] pointer-events-none z-0 overflow-hidden select-none"
        aria-hidden="true"
      >
        {/* Soft airy atmospheric sky bloom matching illustration tones */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-[#BAE6FD]/20 via-[#E0F2FE]/10 to-transparent blur-3xl -z-10" />

        {/* High-Fidelity Illustration in a delicate, light presentation */}
        <div
          className="absolute inset-0 bg-top bg-no-repeat bg-cover sm:bg-contain opacity-35 brightness-[1.03] transition-opacity duration-700 mask-radial-merge"
          style={{
            backgroundImage: `url('/welcome-bg.jpg')`,
          }}
        />

        {/* Top dissolve under header */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent" />

        {/* Bottom feathering dissolving directly into the page body */}
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent" />

        {/* Lateral edge softeners for ultra-wide screens */}
        <div className="absolute inset-y-0 left-0 w-24 sm:w-48 lg:w-72 bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/70 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 sm:w-48 lg:w-72 bg-gradient-to-l from-[#F8FAFC] via-[#F8FAFC]/70 to-transparent" />

        {/* Lighter translucent wash overlay for an airy, elegant feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/45 to-[#F8FAFC]/85" />
      </div>

      {/* Top Navigation Bar with Language Selector */}
      <header className="sticky top-0 z-30 h-20 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-6 lg:px-12 flex items-center justify-between shadow-2xs">
        <Link href="/welcome" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#CBD5E1] bg-white flex items-center justify-center shadow-xs group-hover:border-[#0284C7] transition-all">
            <img
              src="/yukthi-icon.png"
              alt="Yukthi Emblem"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#0F2744]">
              YUKTHI
            </span>
            <span className="block text-[10px] text-[#0284C7] font-bold tracking-widest uppercase -mt-1">
              Smarter Payments. Safer Money.
            </span>
          </div>
        </Link>

        {/* Right side controls: Language Selector + Auth Buttons */}
        <div className="flex items-center gap-3">
          {/* Visible Language Selector */}
          <LanguageSelector variant="compact" />

          <Link href="/verify-aadhaar" className="hidden sm:inline-block">
            <Button variant="ghost" size="sm" className="text-[#0284C7] hover:bg-[#F0F7FF] hover:text-[#0F2744]">
              {t('aadhaarTitle')}
            </Button>
          </Link>

          <Link href="/login">
            <Button variant="outline" size="sm">
              {t('btnLogIn')}
            </Button>
          </Link>

          <Link href="/signup">
            <Button variant="primary" size="sm">
              {t('btnSignUp')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Welcome Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center py-16 lg:py-24 px-6 lg:px-12 max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-[#BAE6FD] text-[#0369A1] text-xs font-semibold mx-auto shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-pulse" />
          <span>India FinTech & Regulatory Safety Framework · RBI & NPCI Compliant</span>
        </div>

        {/* Tagline & Supporting Copy */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F2744] tracking-tight max-w-4xl mx-auto leading-[1.15] drop-shadow-2xs">
          {t('tagline')}
        </h1>

        <p className="text-lg sm:text-xl text-[#1E293B] font-medium max-w-2xl mx-auto leading-relaxed">
          {t('supportingText')}
        </p>

        {/* Primary Call-to-Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
              {t('btnLogIn')} &rarr;
            </Button>
          </Link>

          <Link href="/signup" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
              {t('btnSignUp')}
            </Button>
          </Link>

          {/* Start Secure Verification Button */}
          <Link href="/verify-aadhaar" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-8 border-[#0284C7] text-[#0284C7] hover:bg-[#F0F7FF] font-semibold"
            >
              {t('btnStartVerification')}
            </Button>
          </Link>
        </div>

        {/* Privacy & Security Statement */}
        <div className="p-4 rounded-xl border border-[#E2E8F0]/90 bg-white/85 backdrop-blur-md text-xs text-[#64748B] max-w-3xl mx-auto leading-relaxed shadow-2xs">
          <strong>Security Guarantee:</strong> {t('securityPledge')}
        </div>

        {/* Horizontal Rolling Core Features Section — 4 Distinct Cards */}
        <div 
          className="pt-10 w-screen relative left-1/2 -translate-x-1/2 overflow-hidden space-y-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#BAE6FD] text-[11px] font-bold text-[#0284C7] uppercase tracking-wider shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-ping" />
                Auto-Rolling Showcase
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F2744] mt-1.5">
                Core Protection Modules
              </h2>
            </div>

            {/* Carousel Controls & Module Navigator */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handlePrev}
                className="w-9 h-9 rounded-xl border border-[#CBD5E1] bg-white/90 backdrop-blur-md flex items-center justify-center text-[#0F2744] hover:bg-[#F0F7FF] hover:border-[#0284C7] transition-all shadow-2xs font-bold cursor-pointer"
                aria-label="Roll to previous card"
              >
                &larr;
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-9 h-9 rounded-xl border border-[#CBD5E1] bg-white/90 backdrop-blur-md flex items-center justify-center text-[#0F2744] hover:bg-[#F0F7FF] hover:border-[#0284C7] transition-all shadow-2xs font-bold cursor-pointer"
                aria-label="Roll to next card"
              >
                &rarr;
              </button>
              <div className="text-xs font-semibold text-[#64748B] bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-[#E2E8F0] shadow-2xs ml-1">
                Card <span className="font-bold text-[#0F2744]">{activeCardIndex + 1}</span> of 4
              </div>
            </div>
          </div>

          {/* Module Selector Indicator Pills */}
          <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center gap-2">
            {fourUniqueFeatures.map((feat, index) => {
              const isActive = activeCardIndex === index;
              return (
                <button
                  key={`pill-${feat.id}`}
                  type="button"
                  onClick={() => setActiveCardIndex(index)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0F2744] text-white border-[#0F2744] shadow-xs'
                      : 'bg-white/80 text-[#64748B] border-[#E2E8F0] hover:border-[#93C5FD] hover:text-[#0F2744]'
                  }`}
                >
                  {index + 1}. {feat.badge}
                </button>
              );
            })}
          </div>

          {/* Rolling Track Container */}
          <div className="relative w-full overflow-hidden py-4">
            {/* Left and Right Fade Masks for Clean Visual Horizon */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-20 z-20 bg-gradient-to-r from-[#F8FAFC]/90 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-20 z-20 bg-gradient-to-l from-[#F8FAFC]/90 to-transparent" />

            {/* Horizontal Scroll Track containing exactly the 4 distinct cards */}
            <div
              ref={trackRef}
              className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth py-4 px-6 sm:px-16 lg:px-24 snap-x snap-mandatory"
            >
              {fourUniqueFeatures.map((feat, index) => {
                const isActive = activeCardIndex === index;
                return (
                  <div
                    key={feat.id}
                    onClick={() => setActiveCardIndex(index)}
                    className={`w-[295px] sm:w-[350px] lg:w-[370px] shrink-0 snap-center rounded-2xl border p-6 transition-all duration-300 flex flex-col justify-between text-left cursor-pointer group ${
                      isActive
                        ? 'border-[#0284C7] ring-2 ring-[#BAE6FD] bg-white shadow-xl scale-[1.02]'
                        : 'border-[#E2E8F0]/90 bg-white/90 backdrop-blur-md shadow-xs hover:border-[#93C5FD] hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-11 h-11 rounded-xl border flex items-center justify-center shadow-2xs ${feat.iconBg}`}
                        >
                          {feat.icon}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-2xs ${feat.badgeColor}`}
                        >
                          {feat.badge}
                        </span>
                      </div>

                      <div>
                        <h3
                          className={`font-extrabold text-base leading-tight transition-colors ${
                            isActive
                              ? 'text-[#0284C7]'
                              : 'text-[#0F2744] group-hover:text-[#0284C7]'
                          }`}
                        >
                          {feat.title}
                        </h3>
                        <span className="text-[11px] font-semibold text-[#0284C7] block mt-0.5">
                          {feat.subtitle}
                        </span>
                        <p className="text-xs text-[#475569] leading-relaxed mt-2 line-clamp-3">
                          {feat.desc}
                        </p>
                      </div>

                      {/* Explainable Feature Bullet Highlights */}
                      <div className="pt-3 border-t border-[#F1F5F9] space-y-1.5">
                        {feat.bullets.map((b, bIdx) => (
                          <div
                            key={bIdx}
                            className="flex items-start gap-1.5 text-[11px] text-[#64748B]"
                          >
                            <span className="text-[#059669] font-bold text-xs mt-0.5 leading-none">
                              ✓
                            </span>
                            <span className="leading-tight">{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link
                      href={feat.href}
                      className="mt-5 pt-3 border-t border-[#F1F5F9] inline-flex items-center justify-between text-xs font-bold text-[#0284C7] group-hover:text-[#0F2744] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Explore Module</span>
                      <span className="group-hover:translate-x-1 transition-transform font-black">
                        &rarr;
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-8 px-6 lg:px-12 border-t border-[#E2E8F0]/90 bg-white/90 backdrop-blur-md text-xs text-[#64748B]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0F2744]">YUKTHI</span>
            <span>&copy; 2026 YUKTHI · Smarter Payments. Safer Money.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-[#0F2744] transition-colors">
              {t('btnLogIn')}
            </Link>
            <Link href="/signup" className="hover:text-[#0F2744] transition-colors">
              {t('btnSignUp')}
            </Link>
            <Link href="/dashboard" className="hover:text-[#0F2744] transition-colors">
              {t('navDashboard')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
