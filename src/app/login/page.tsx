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

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError(t('errRequired'));
      return;
    }

    if (!password) {
      setError(t('errRequired'));
      return;
    }

    if (password.length < 6) {
      setError(t('errPasswordLength'));
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient.auth.login({
        identifier: cleanIdentifier,
        password,
        rememberMe,
      });

      if (res.success && res.data?.user) {
        setSuccess(t('successLoggedIn'));
        const resolvedName = res.data.user.displayName || cleanIdentifier;
        setSessionUser({
          id: res.data.user.id,
          name: resolvedName,
          email: res.data.user.email || cleanIdentifier,
        });

        // Redirect after brief delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      } else {
        setError(res.error || t('errInvalidCredentials'));
      }
    } catch {
      setError(t('errNetwork'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#BAE6FD]/40 selection:text-[#0F2744] overflow-hidden">
      {/* Background Graphic */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
        style={{
          backgroundImage: `url('/login-bg.png')`,
        }}
        aria-hidden="true"
      />

      {/* Subtle softening overlay for readability and contrast */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-white/20 backdrop-blur-[0.5px]"
        aria-hidden="true"
      />

      {/* Top Header with Language Selector */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSelector variant="compact" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/welcome" className="inline-flex flex-col items-center gap-2 group">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/80 bg-white/95 backdrop-blur-md flex items-center justify-center shadow-md group-hover:border-[#0284C7] transition-all">
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
          {t('loginTitle')}
        </h2>
        <p className="mt-1 text-xs text-[#64748B]">
          {t('loginSubtitle')}
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-xl border border-white/90 rounded-3xl sm:px-10 space-y-6">
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
            {/* Email or Mobile */}
            <FormField label={t('loginIdentifierLabel')} required>
              <Input
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t('loginIdentifierPlaceholder')}
                disabled={isLoading}
              />
            </FormField>

            {/* Password */}
            <FormField label={t('loginPasswordLabel')} required>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('loginPasswordPlaceholder')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-[#64748B] hover:text-[#0F2744] cursor-pointer"
                >
                  {showPassword ? t('btnHide') : t('btnShow')}
                </button>
              </div>
            </FormField>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#0F2744] focus:ring-[#0F2744]"
                />
                <span className="text-[#475569]">{t('loginRememberMe')}</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-semibold text-[#0284C7] hover:underline cursor-pointer"
              >
                {t('loginForgotPassword')}
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full justify-center"
              >
                {t('loginSubmitButton')}
              </Button>
            </div>
          </form>

          {/* Privacy Note */}
          <div className="pt-2 border-t border-[#F1F5F9] text-[11px] text-[#64748B] text-center leading-relaxed">
            {t('loginPrivacyNote')}
          </div>

          {/* Sign Up Link */}
          <div className="text-center text-xs text-[#475569]">
            {t('loginNoAccountText')}{' '}
            <Link href="/signup" className="font-bold text-[#0F2744] hover:underline">
              {t('loginNoAccountLink')}
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in">
            <h3 className="font-bold text-base text-[#0F172A]">Password Recovery</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              For security and regulatory compliance, YUKTHI authenticates user sessions through verified local tenancy. To reset credentials, please contact your account grievance officer or register a fresh tenant profile.
            </p>
            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForgotPassword(false)}>
                {t('btnCancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
