'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

export default function AadhaarVerificationPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [consentGiven, setConsentGiven] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<
    'NOT_STARTED' | 'IN_PROGRESS' | 'SANDBOX_VERIFIED'
  >('NOT_STARTED');
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [notice, setNotice] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  const handleStartVerification = () => {
    setConsentGiven(true);
    setVerificationStatus('IN_PROGRESS');
    setShowGatewayModal(true);
  };

  const handleCompleteSandboxVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setShowGatewayModal(false);
      setVerificationStatus('SANDBOX_VERIFIED');
      setNotice({
        type: 'success',
        message:
          'Identity verification completed successfully via Sandbox Prototype Gateway. Redirecting to Home...',
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    }, 900);
  };

  const handleSkipToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#BAE6FD]/40 selection:text-[#0F2744]">
      {/* Top Header */}
      <div className="absolute top-6 right-6">
        <LanguageSelector variant="compact" />
      </div>

      <div className="max-w-2xl w-full mx-auto space-y-8">
        {/* Logo and Progress Stepper */}
        <div className="text-center space-y-4">
          <Link href="/welcome" className="inline-flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#CBD5E1] bg-white flex items-center justify-center shadow-xs group-hover:border-[#0284C7] transition-all">
              <img
                src="/yukthi-icon.png"
                alt="Yukthi Emblem"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <span className="font-black text-2xl tracking-tight text-[#0F2744]">
              YUKTHI
            </span>
            <span className="text-[11px] font-semibold text-[#0284C7] tracking-wider uppercase -mt-1">
              Smarter Payments. Safer Money.
            </span>
          </Link>

          {/* Onboarding Stepper */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#64748B]">
            <span className="flex items-center gap-1.5 text-[#059669]">
              <span className="w-5 h-5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[11px] font-bold">
                ✓
              </span>
              Account Created
            </span>
            <span className="text-[#CBD5E1]">&rarr;</span>
            <span
              className={`flex items-center gap-1.5 font-bold ${
                verificationStatus === 'SANDBOX_VERIFIED'
                  ? 'text-[#059669]'
                  : 'text-[#0F2744]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                  verificationStatus === 'SANDBOX_VERIFIED'
                    ? 'bg-[#059669] text-white'
                    : 'bg-[#0F2744] text-white'
                }`}
              >
                {verificationStatus === 'SANDBOX_VERIFIED' ? '✓' : '2'}
              </span>
              Identity Verification
            </span>
            <span className="text-[#CBD5E1]">&rarr;</span>
            <span className="flex items-center gap-1.5 text-[#94A3B8]">
              <span className="w-5 h-5 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center text-[11px]">
                3
              </span>
              Home
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
            <div>
              <h2 className="text-xl font-black text-[#0F2744]">
                {t('aadhaarTitle')}
              </h2>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                {t('aadhaarNotice')}
              </p>
            </div>
            {verificationStatus === 'SANDBOX_VERIFIED' ? (
              <Badge variant="success">Verified (Sandbox Prototype)</Badge>
            ) : verificationStatus === 'IN_PROGRESS' ? (
              <Badge variant="info">In Progress</Badge>
            ) : (
              <Badge variant="warning">{t('aadhaarStatusNotStarted')}</Badge>
            )}
          </div>

          {notice && (
            <Alert
              variant={
                notice.type === 'success'
                  ? 'success'
                  : notice.type === 'warning'
                  ? 'warning'
                  : 'info'
              }
              onClose={() => setNotice(null)}
            >
              {notice.message}
            </Alert>
          )}

          {/* Prototype / Compliance Disclosure Banner */}
          <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4 text-xs text-[#92400E] space-y-2 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#D97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Security & Regulatory Compliance Statement</span>
            </div>
            <p>{t('aadhaarPrototypeNotice')}</p>
          </div>

          {/* Architectural Safeguards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="font-semibold text-[#0F172A] block">Zero Biometric Storage</span>
              <span className="text-[#64748B]">
                Fingerprints, iris scans, and OTPs are never collected or stored in YUKTHI application tables.
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="font-semibold text-[#0F172A] block">Server-Side Tokenization</span>
              <span className="text-[#64748B]">
                Verification sessions use short-lived nonces to prevent replay attacks and browser-forged responses.
              </span>
            </div>
          </div>

          {/* User Consent Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none text-xs">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 rounded border-[#CBD5E1] text-[#0B192C] focus:ring-[#0B192C]"
              />
              <span className="text-[#334155] leading-relaxed">
                I hereby grant consent for YUKTHI to initiate identity verification via an authorized DigiLocker / UIDAI ASA provider gateway in accordance with applicable laws.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleStartVerification}
              className="w-full sm:flex-1 justify-center shadow-xs cursor-pointer"
            >
              {t('btnStartVerification')} &rarr;
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={handleSkipToDashboard}
              className="w-full sm:flex-1 justify-center cursor-pointer"
            >
              {t('btnSkip')}
            </Button>
          </div>

          {/* Help Section */}
          <div className="pt-4 border-t border-[#F1F5F9] text-xs text-[#64748B] space-y-1">
            <span className="font-bold text-[#0F172A] block">
              {t('aadhaarHelpTitle')}
            </span>
            <p className="leading-relaxed">{t('aadhaarHelpText')}</p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center text-xs text-[#64748B]">
          <Link href="/dashboard" className="text-[#0D9488] font-semibold hover:underline">
            &larr; Return to Home
          </Link>
        </div>
      </div>

      {/* Authorized Verification Gateway (Sandbox Simulation) Modal */}
      {showGatewayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#CBD5E1] space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488]">
                  Authorized Verification Gateway
                </span>
                <h3 className="text-lg font-bold text-[#0F172A]">
                  DigiLocker / Aadhaar Paperless e-KYC (XML)
                </h3>
              </div>
              <Badge variant="warning">Sandbox Prototype</Badge>
            </div>

            <div className="space-y-3 text-xs text-[#475569] leading-relaxed">
              <p>
                In production, YUKTHI redirects you to the authorized UIDAI ASA or DigiLocker OAuth consent screen.
              </p>

              {/* Protocol Details */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Session Nonce:</span>
                  <span className="font-bold text-[#0F172A]">sec_tx_8492019482</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Gateway Mode:</span>
                  <span className="text-[#059669] font-bold">SHA-256 XML e-KYC Token</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Biometric / OTP:</span>
                  <span className="text-[#0284C7] font-bold">Zero Storage Enforced</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF]">
                <strong>Compliance Guard:</strong> Live UIDAI credentials (`UIDAI_SUB_AUA_CODE` / `ASA_API_KEY`) are kept strictly server-side. For this hackathon demonstration, you can simulate successful authorization below.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="primary"
                size="md"
                isLoading={isVerifying}
                onClick={handleCompleteSandboxVerification}
                className="w-full sm:flex-1 justify-center"
              >
                Complete Sandbox Verification &rarr;
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={handleSkipToDashboard}
                className="w-full sm:w-auto justify-center"
              >
                Skip & Open Home
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => setShowGatewayModal(false)}
                className="w-full sm:w-auto justify-center"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
