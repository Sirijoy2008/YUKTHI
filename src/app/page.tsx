'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export default function LandingPage() {
  const { t } = useLanguage();

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

      {/* Navigation Bar */}
      <header className="sticky top-0 z-30 h-20 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-6 lg:px-12 flex items-center justify-between shadow-2xs">
        <Link href="/" className="flex items-center gap-3 group">
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

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475569]">
          <Link href="#features" className="hover:text-[#0F2744] transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-[#0F2744] transition-colors">
            How It Works
          </Link>
          <Link href="#security" className="hover:text-[#0F2744] transition-colors">
            Security & Privacy
          </Link>
        </nav>

        {/* CTA Actions */}
        <div className="flex items-center gap-3">
          {/* Visible Language Selector */}
          <LanguageSelector variant="compact" />

          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center font-semibold rounded-lg text-sm px-4 py-2 border border-[#CBD5E1] text-[#0F2744] hover:bg-[#F0F7FF] hover:border-[#93C5FD] transition-all duration-200"
          >
            {t('btnLogIn')}
          </Link>

          <Link
            href="/signup"
            className="hidden sm:inline-flex items-center justify-center font-semibold rounded-lg text-sm px-4 py-2 bg-[#0284C7] text-white hover:bg-[#0369A1] transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            {t('btnSignUp')}
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center font-semibold rounded-lg text-sm px-4 py-2 bg-[#0F2744] text-white hover:bg-[#1E3E62] transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            {t('btnLaunchDashboard')}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-16 lg:py-24 px-6 lg:px-12 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#BAE6FD] text-[#0369A1] text-xs font-semibold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-pulse" />
          Engineered for India FinTech Ecosystem · NPCI & RBI Frameworks
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F2744] tracking-tight max-w-4xl mx-auto leading-[1.15]">
          {t('tagline')}
        </h1>

        <p className="text-lg sm:text-xl text-[#334155] max-w-2xl mx-auto leading-relaxed font-normal bg-white/40 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none rounded-xl px-4 py-1">
          {t('supportingText')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center font-semibold rounded-lg text-base px-7 py-3.5 bg-[#0F2744] text-white hover:bg-[#1E3E62] transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            {t('btnGetStarted')}
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center font-semibold rounded-lg text-base px-7 py-3.5 bg-white border border-[#CBD5E1] text-[#0F2744] hover:bg-[#F0F7FF] hover:border-[#93C5FD] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0"
          >
            {t('btnLogIn')}
          </Link>
          <Link
            href="/verify-aadhaar"
            className="w-full sm:w-auto inline-flex items-center justify-center font-semibold rounded-lg text-base px-7 py-3.5 border border-[#0284C7] text-[#0284C7] bg-white/80 hover:bg-[#F0F7FF] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 backdrop-blur-xs"
          >
            {t('btnStartVerification')} &rarr;
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#475569]">
          <div className="flex items-center gap-1.5 bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#E2E8F0] shadow-2xs">
            <svg className="w-4 h-4 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Exact Paise (Minor Unit) Accounting</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#E2E8F0] shadow-2xs">
            <svg className="w-4 h-4 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Zero Banking Password or PIN Storage</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#E2E8F0] shadow-2xs">
            <svg className="w-4 h-4 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Conservative Cash-Flow Calculations</span>
          </div>
        </div>
      </section>

      {/* Feature Modules Section */}
      <section id="features" className="py-16 px-6 lg:px-12 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0284C7]">
            Core Modules
          </span>
          <h2 className="text-3xl font-extrabold text-[#0F2744]">
            Three Interconnected Financial Protections
          </h2>
          <p className="text-sm text-[#475569] max-w-xl mx-auto">
            Each tool connects to a shared financial ledger and action centre, so updates in one module immediately safeguard your overall cash flow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Scam Checker */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-xs hover:border-[#93C5FD] hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#0F2744]">Check for Scams</h3>
              <p className="text-xs text-[#0284C7] font-semibold -mt-2">
                Check if a payment request looks suspicious.
              </p>
              <p className="text-sm text-[#475569] leading-relaxed">
                Evaluates SMS messages, WhatsApp requests, and payment notices using transparent keyword heuristics. Identifies APK download traps and fake electricity cutoff alerts without claiming unverified fraud proof.
              </p>
            </div>
            <Link
              href="/scam-checker"
              className="inline-flex items-center text-sm font-semibold text-[#0284C7] hover:text-[#0F2744] transition-colors"
            >
              Check for scams &rarr;
            </Link>
          </div>

          {/* Card 2: Payment Assistant */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-xs hover:border-[#93C5FD] hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#F0F7FF] text-[#0284C7] flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#0F2744]">Payment Help</h3>
              <p className="text-xs text-[#0284C7] font-semibold -mt-2">
                Get help with failed, delayed, or missing payments.
              </p>
              <p className="text-sm text-[#475569] leading-relaxed">
                Step-by-step guidance for debited-not-credited and delayed transactions. Formulates clear escalation timelines based on standard NPCI auto-reversal periods without requiring bank login credentials.
              </p>
            </div>
            <Link
              href="/payment-assistant"
              className="inline-flex items-center text-sm font-semibold text-[#0284C7] hover:text-[#0F2744] transition-colors"
            >
              Get payment help &rarr;
            </Link>
          </div>

          {/* Card 3: Cash-Flow Planner */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-xs hover:border-[#93C5FD] hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#0F2744]">Money Planner</h3>
              <p className="text-xs text-[#0284C7] font-semibold -mt-2">
                Track money coming in, money going out, and upcoming expenses.
              </p>
              <p className="text-sm text-[#475569] leading-relaxed">
                Conservative projections that keep unconfirmed receipts strictly segregated from available balances. Simulates what-if scenarios so you understand real deficits before obligations become overdue.
              </p>
            </div>
            <Link
              href="/cash-flow"
              className="inline-flex items-center text-sm font-semibold text-[#0284C7] hover:text-[#0F2744] transition-colors"
            >
              Plan your money &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="how-it-works" className="py-16 px-6 lg:px-12 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0284C7]">
              Connected Workflow
            </span>
            <h2 className="text-3xl font-extrabold text-[#0F2744]">
              How YUKTHI Resolves Financial Uncertainty
            </h2>
            <p className="text-sm text-[#475569] max-w-xl mx-auto">
              A deterministic path from spotting an anomaly to verifying your funds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#93C5FD] hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#0F2744] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="font-bold text-sm text-[#0F2744]">Encounter Ambiguity</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                You receive a high-urgency SMS demanding payment or notice a UPI debit where the merchant didn't receive funds.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#93C5FD] hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#0F2744] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="font-bold text-sm text-[#0F2744]">Run Rule Analysis</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                YUKTHI breaks down explicit keyword triggers or compiles NPCI dispute guidelines without ever asking for passwords or PINs.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#93C5FD] hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#0F2744] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="font-bold text-sm text-[#0F2744]">Safeguard Cash Flow</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                The unresolved transfer is marked as unconfirmed in your planner. Your primary balance is never inflated by uncertain receipts.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#93C5FD] hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#0F2744] text-white flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h4 className="font-bold text-sm text-[#0F2744]">Alerts & Actions Follow-up</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                A prioritized task is created in Alerts & Actions. When the bank resolves the issue, confirm the receipt to refresh your forecast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy Section */}
      <section id="security" className="py-16 px-6 lg:px-12 max-w-6xl mx-auto w-full space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#059669]">
            Verified Safeguards
          </span>
          <h2 className="text-3xl font-extrabold text-[#0F2744]">
            Privacy & Security by Design
          </h2>
          <p className="text-sm text-[#475569] max-w-xl mx-auto">
            We only promise what our architecture implements. No marketing exaggerations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#93C5FD] hover:shadow-sm transition-all duration-200 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0F2744]">
              <svg className="w-5 h-5 text-[#059669] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Zero Credential Collection
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              YUKTHI never requests, logs, or stores banking passwords, debit card PINs, UPI PINs, or one-time passwords (OTPs).
            </p>
          </div>

          <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#93C5FD] hover:shadow-sm transition-all duration-200 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0F2744]">
              <svg className="w-5 h-5 text-[#059669] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Transparent Heuristics, No False Promises
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              Risk scores are explainable rule matches. We explicitly state limitations and never claim to provide proof of fraud or guaranteed bank recovery.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#93C5FD] hover:shadow-sm transition-all duration-200 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0F2744]">
              <svg className="w-5 h-5 text-[#059669] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Row Level Security & Tenant Boundary
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              Database entities are strictly bounded by user ownership with PostgreSQL Row Level Security (RLS) policies enforcing multi-tenant isolation.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#93C5FD] hover:shadow-sm transition-all duration-200 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0F2744]">
              <svg className="w-5 h-5 text-[#059669] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Error Sanitization & Credential Shield
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              Internal database errors, Postgres connection parameters, and server-side keys are intercepted and sanitized before returning responses to the browser.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 lg:px-12 border-t border-[#E2E8F0] bg-white text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#CBD5E1] bg-white flex items-center justify-center shadow-2xs">
              <img
                src="/yukthi-icon.png"
                alt="Yukthi Emblem"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <span className="font-extrabold text-sm text-[#0F2744]">YUKTHI</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/dashboard" className="hover:text-[#0F2744] transition-colors">
              Home
            </Link>
            <Link href="/scam-checker" className="hover:text-[#0F2744] transition-colors">
              Check for Scams
            </Link>
            <Link href="/payment-assistant" className="hover:text-[#0F2744] transition-colors">
              Payment Help
            </Link>
            <Link href="/cash-flow" className="hover:text-[#0F2744] transition-colors">
              Money Planner
            </Link>
            <Link href="/action-centre" className="hover:text-[#0F2744] transition-colors">
              Alerts & Actions
            </Link>
            <Link href="/settings" className="hover:text-[#0F2744] transition-colors">
              My Account
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 text-center space-y-2">
          <p>
            &copy; 2026 YUKTHI · Smarter Payments. Safer Money.
          </p>
          <p className="text-[11px] max-w-2xl mx-auto text-[#94A3B8] leading-relaxed">
            YUKTHI is an educational and organizational assistance platform for the Indian financial market. It does not provide direct banking services, account holding, payment processing, or legal fraud indemnification.
          </p>
        </div>
      </footer>
    </div>
  );
}
