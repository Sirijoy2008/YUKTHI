'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { Tooltip } from '@/components/ui/Tooltip';
import { apiClient } from '@/lib/apiClient';
import { getRiskLevelBadge, formatDate } from '@/lib/formatters';
import { ScamAnalysisData, FinancialActivity } from '@/types/api';
import { useUserSession } from '@/hooks/useUserSession';

const MAX_CHARS = 2000;

interface SampleScenario {
  title: string;
  category: string;
  text: string;
}

const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    title: 'Electricity Cut-off Alert',
    category: 'Urgent Threat',
    text: 'URGENT: Your electricity power will be suspended tonight at 9:30 PM due to an unpaid bill. Call officer immediately or your account will be closed.',
  },
  {
    title: 'Bank KYC / APK Lure',
    category: 'Phishing Link',
    text: 'Dear Customer, your bank account is blocked. Click http://bit.ly/bank-kyc-verify to download the official support app and provide OTP immediately.',
  },
  {
    title: 'Lottery Prize Claim',
    category: 'Advance Fee',
    text: 'Congratulations! You have won a cash prize of Rs. 25,00,000 in the lucky draw. Pay 500 processing fee to claim your money via wire transfer.',
  },
  {
    title: 'Legitimate Salary Credit',
    category: 'Benign Alert',
    text: 'Your salary of Rs. 65,000 for October has been credited to your account ending in 4102. Reference UTR: HDFC202610100987.',
  },
];

export default function ScamCheckerPage() {
  const { userId } = useUserSession();
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<ScamAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [historyActivities, setHistoryActivities] = useState<FinancialActivity[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load account's past evaluated assessments if available
  useEffect(() => {
    setIsLoadingHistory(true);
    apiClient.activities
      .list()
      .then((res) => {
        if (res.success && res.data?.activities) {
          const withAssessments = res.data.activities.filter((a) => a.riskAssessment);
          setHistoryActivities(withAssessments);
        }
      })
      .catch((err: unknown) => {
        // Non-blocking history fetch: safely fall back to empty history without crashing
        setHistoryActivities([]);
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  }, [userId]);

  const handleClear = () => {
    setMessage('');
    setResult(null);
    setValidationError(null);
    setApiError(null);
  };

  const handleAnalyze = async (overrideText?: string) => {
    if (isLoading) return; // Prevent duplicate concurrent submissions

    const textToSubmit = overrideText !== undefined ? overrideText : message;
    const trimmed = textToSubmit.trim();

    // Input Validation
    if (!trimmed) {
      setValidationError('Please enter or paste a message to analyze.');
      setResult(null);
      return;
    }

    if (trimmed.length > MAX_CHARS) {
      setValidationError(`Message exceeds the maximum limit of ${MAX_CHARS} characters.`);
      setResult(null);
      return;
    }

    setValidationError(null);
    setApiError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.scamChecker.analyze(trimmed);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setApiError(
          response.error || 'Failed to analyze the message. Please check your connection and retry.'
        );
      }
    } catch (err: unknown) {
      setApiError(
        err instanceof Error ? err.message : 'An unexpected error occurred while contacting the server.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = message.length;
  const isOverLimit = charCount > MAX_CHARS;
  const badgeInfo = result ? getRiskLevelBadge(result.riskLevel) : null;

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title="Check for Scams"
          description="Check if a payment request looks suspicious."
          breadcrumbs={[{ label: 'Check for Scams' }]}
        />

        {/* Global API Failure Alert */}
        {apiError && (
          <Alert variant="danger" title="Analysis Error" onClose={() => setApiError(null)}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span>{apiError}</span>
              <Button variant="outline" size="sm" onClick={() => handleAnalyze()}>
                Try Again
              </Button>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Input & Analysis Panel (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="scam-message-input"
                  className="text-xs font-bold uppercase tracking-wider text-[#334155]"
                >
                  Message Text to Check
                </label>
                <span
                  className={`text-xs font-mono font-medium ${
                    isOverLimit ? 'text-[#DC2626]' : charCount > 1800 ? 'text-[#D97706]' : 'text-[#94A3B8]'
                  }`}
                >
                  {charCount} / {MAX_CHARS}
                </span>
              </div>

              <Textarea
                id="scam-message-input"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Paste the suspicious SMS, WhatsApp message, email excerpt, or payment notice here..."
                rows={6}
                error={Boolean(validationError) || isOverLimit}
                disabled={isLoading}
                aria-describedby="scam-privacy-notice"
              />

              {validationError && (
                <p className="text-xs font-medium text-[#DC2626] flex items-center gap-1.5" role="alert">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {validationError}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={isLoading || (!message && !result)}
                >
                  Clear Text
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    onClick={() => handleAnalyze()}
                    isLoading={isLoading}
                    disabled={isLoading || !message.trim() || isOverLimit}
                  >
                    {isLoading ? 'Checking Patterns...' : 'Check This Message'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Privacy Notice (Documented actual backend behavior) */}
            <div
              id="scam-privacy-notice"
              className="p-4 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] text-xs text-[#0C4A6E] space-y-2"
            >
              <div className="flex items-center gap-2 font-bold text-xs text-[#075985]">
                <svg className="w-4 h-4 text-[#0284C7] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Privacy & Data Safeguards
              </div>
              <p className="leading-relaxed text-[11px]">
                Submitted messages are parsed <strong>in-memory</strong> on our backend using deterministic keyword patterns. Raw message content is never stored permanently on disk or logged in production logs.
              </p>
              <p className="leading-relaxed text-[11px] font-semibold text-[#DC2626]">
                Never enter banking passwords, debit card PINs, UPI PINs, or SMS OTPs into this or any form.
              </p>
            </div>

            {/* Sample Scenarios to Test */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Test Scenarios (Click to Load)
                </span>
                <span className="text-[11px] text-[#94A3B8]">Preset demonstrations</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_SCENARIOS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      setMessage(sample.text);
                      handleAnalyze(sample.text);
                    }}
                    className="p-3.5 text-left rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F0F7FF] hover:border-[#93C5FD] hover:shadow-xs transition-all duration-200 text-xs space-y-1.5 cursor-pointer disabled:opacity-50 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F2744] group-hover:text-[#0284C7] transition-colors">{sample.title}</span>
                      <span className="text-[10px] text-[#0284C7] font-bold bg-[#F0F7FF] px-1.5 py-0.5 rounded border border-[#BAE6FD]">{sample.category}</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                      {sample.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results & Guidance Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {isLoading ? (
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center space-y-4">
                <Spinner size="lg" className="mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#0F172A]">Analyzing Heuristics...</h4>
                  <p className="text-xs text-[#64748B]">
                    Checking for urgent language, suspicious links, lottery lures, and sensitive data requests.
                  </p>
                </div>
              </div>
            ) : result && badgeInfo ? (
              /* Successful Analysis Result */
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      Risk Assessment
                    </span>
                    <h3 className="text-base font-extrabold text-[#0F2744]">
                      Classification Result
                    </h3>
                  </div>
                  <Badge variant={badgeInfo.variant} size="md">
                    {badgeInfo.label}
                  </Badge>
                </div>

                {/* Score / Model Transparency Callout */}
                <div className="p-3 rounded-lg bg-[#F0F7FF] border border-[#BAE6FD] text-xs text-[#334155] space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#0F2744]">
                    <span>Analysis Method:</span>
                    <span className="font-mono text-[11px] text-[#0284C7] font-bold">Rule-Based Heuristics</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Evaluated against static safety rules. No numerical score is fabricated; the rating is categorized as Low, Medium, or High according to triggered patterns.
                  </p>
                </div>

                {/* Detected Indicators */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                      Triggered Indicators ({result.details.length})
                    </h4>
                  </div>

                  {result.details.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] space-y-1">
                      <span className="font-bold block">No Known Indicators Detected</span>
                      <p className="text-[11px] leading-relaxed">
                        The submitted text does not contain common urgency cues, unverified URL patterns, or known lottery triggers. However, novel or sophisticated scams may still evade static rules.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {result.details.map((detail) => (
                        <div
                          key={detail.id}
                          className="p-3.5 rounded-xl bg-[#FEF2F2]/60 border border-[#FECACA] space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#991B1B]">
                              {detail.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#DC2626] font-semibold">
                              {detail.id}
                            </span>
                          </div>
                          <p className="text-xs text-[#475569] leading-relaxed">
                            {detail.description}
                          </p>
                          <div className="pt-1 text-[11px] text-[#7F1D1D] bg-white/70 p-2 rounded-md border border-[#FECACA]/60">
                            <strong>Why this matters:</strong> {detail.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommended Next Steps */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                      Recommended Safe Next Steps
                    </h4>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] leading-relaxed"
                        >
                          <span className="font-bold text-[#15803D] shrink-0 mt-0.5">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Disclaimers & Official Channels */}
                <div className="space-y-3 pt-3 border-t border-[#F1F5F9]">
                  <div className="text-[11px] text-[#64748B] italic leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                    <strong>Assessment Notice:</strong> {result.disclaimer}
                  </div>

                  {/* Verification via Official Authorities */}
                  <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] space-y-1.5 text-xs">
                    <span className="font-bold text-[#0F172A] block text-[11px] uppercase tracking-wider">
                      Official India Reporting Channels:
                    </span>
                    <ul className="text-[11px] text-[#475569] space-y-1">
                      <li>
                        • <strong>National Cyber Helpline:</strong> Dial <strong>1930</strong> (Free 24x7)
                      </li>
                      <li>
                        • <strong>Cyber Crime Portal:</strong>{' '}
                        <a
                          href="https://cybercrime.gov.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0D9488] font-semibold hover:underline"
                        >
                          cybercrime.gov.in
                        </a>
                      </li>
                      <li>
                        • <strong>DoT Chakshu Portal:</strong>{' '}
                        <a
                          href="https://sancharsaathi.gov.in/sfc/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0D9488] font-semibold hover:underline"
                        >
                          sancharsaathi.gov.in
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                <Button variant="secondary" size="sm" className="w-full" onClick={handleClear}>
                  Analyze Another Message
                </Button>
              </div>
            ) : (
              /* Idle State */
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#0F172A]">Ready to Assess</h4>
                  <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
                    Paste a message on the left or select a sample scenario to run transparent pattern analysis.
                  </p>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-lg text-left text-xs text-[#475569] space-y-1">
                  <span className="font-semibold text-[#0F172A] block text-[11px] uppercase tracking-wider">
                    What this module checks:
                  </span>
                  <ul className="text-[11px] text-[#64748B] space-y-1">
                    <li>• False urgency and disconnection threats</li>
                    <li>• Requests for passwords, OTPs, or PINs</li>
                    <li>• Shortened, disguised, or unverified URLs</li>
                    <li>• Unexpected lottery or unearned money claims</li>
                    <li>• Requests for payments via unusual channels</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Account's Recent Assessment Records (if user has activities) */}
            {historyActivities.length > 0 && (
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#334155]">
                    Account History ({historyActivities.length})
                  </h4>
                  <span className="text-[10px] text-[#94A3B8]">From activity ledger</span>
                </div>

                <div className="divide-y divide-[#F1F5F9] text-xs">
                  {historyActivities.slice(0, 3).map((act) => (
                    <div key={act.id} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#0F172A] block">
                          {act.referenceNumber ? `Ref: ${act.referenceNumber}` : 'Message Check'}
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          {formatDate(act.date)}
                        </span>
                      </div>
                      <Badge variant="info" size="sm">
                        Logged
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
