'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { apiClient, setSessionUserId, setSessionUser } from '@/lib/apiClient';
import { SupportedLanguage } from '@/lib/i18n';

export default function SignUpPage() {
  const { t, language, setLanguage, languages } = useLanguage();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 1. Validation
    if (!fullName.trim()) {
      setError(t('errRequired'));
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError(t('errInvalidEmail'));
      return;
    }

    const cleanMobile = mobile.trim();
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError(t('errInvalidPhone'));
      return;
    }

    if (password.length < 8) {
      setError(t('errPasswordLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('errPasswordMismatch'));
      return;
    }

    if (!acceptTerms) {
      setError(t('errAcceptTerms'));
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient.auth.signup({
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: cleanMobile,
        password,
        confirmPassword,
        preferredLanguage: language,
        acceptTerms,
      });

      if (res.success && res.data?.user) {
        setSuccess(t('successAccountCreated'));
        setSessionUser({
          id: res.data.user.id,
          name: fullName.trim() || res.data.user.displayName,
          email: email.trim(),
        });

        // Guide user to Aadhaar verification step
        setTimeout(() => {
          router.push('/verify-aadhaar');
        }, 900);
      } else {
        setError(res.error || 'Failed to create account.');
      }
    } catch {
      setError(t('errNetwork'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#BAE6FD]/40 selection:text-[#0F2744]">
      {/* Top Header with Language Selector */}
      <div className="absolute top-6 right-6">
        <LanguageSelector variant="compact" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/welcome" className="inline-flex flex-col items-center gap-2 group">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#CBD5E1] bg-white flex items-center justify-center shadow-xs group-hover:border-[#0284C7] transition-all">
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
        <h2 className="mt-4 text-2xl font-black text-[#0F2744]">
          {t('signupTitle')}
        </h2>
        <p className="mt-1 text-xs text-[#64748B]">
          {t('signupSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#E2E8F0] rounded-2xl sm:px-10 space-y-6">
          {error && (
            <Alert variant="danger" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <FormField label={t('signupFullNameLabel')} required>
              <Input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('signupFullNamePlaceholder')}
                disabled={isLoading}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <FormField label={t('signupEmailLabel')} required>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('signupEmailPlaceholder')}
                  disabled={isLoading}
                />
              </FormField>

              {/* Mobile Number */}
              <FormField label={t('signupMobileLabel')} required>
                <Input
                  type="tel"
                  autoComplete="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder={t('signupMobilePlaceholder')}
                  maxLength={10}
                  disabled={isLoading}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <FormField label={t('signupPasswordLabel')} required>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('signupPasswordPlaceholder')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                  >
                    {showPassword ? t('btnHide') : t('btnShow')}
                  </button>
                </div>
              </FormField>

              {/* Confirm Password */}
              <FormField label={t('signupConfirmPasswordLabel')} required>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('signupConfirmPasswordPlaceholder')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                  >
                    {showConfirmPassword ? t('btnHide') : t('btnShow')}
                  </button>
                </div>
              </FormField>
            </div>

            {/* Password Requirement Note */}
            <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
              <svg className="w-4 h-4 text-[#0D9488] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('signupPasswordRule')}</span>
            </div>

            {/* Preferred Language Selection */}
            <FormField label={t('signupLanguageLabel')}>
              <div className="flex gap-2">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLanguage(l.code as SupportedLanguage)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      language === l.code
                        ? 'border-[#0B192C] bg-[#0B192C] text-white shadow-xs'
                        : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="block">{l.nativeName}</span>
                    <span className="text-[10px] opacity-70">({l.label})</span>
                  </button>
                ))}
              </div>
            </FormField>

            {/* Terms Acceptance */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#0F2744] focus:ring-[#0F2744]"
                />
                <span className="text-[#475569] leading-relaxed">
                  {t('signupTermsLabel')}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full justify-center"
              >
                {t('signupSubmitButton')}
              </Button>
            </div>
          </form>

          {/* Login Link */}
          <div className="pt-2 border-t border-[#F1F5F9] text-center text-xs text-[#475569]">
            {t('signupHaveAccountText')}{' '}
            <Link href="/login" className="font-bold text-[#0F2744] hover:underline">
              {t('signupHaveAccountLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
