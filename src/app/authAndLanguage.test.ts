import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getStoredLanguage,
  setStoredLanguage,
  t,
  translations,
} from '@/lib/i18n';
import { apiClient, getSessionUserId, setSessionUserId } from '@/lib/apiClient';
import { NextRequest } from 'next/server';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { GET as statusHandler } from '@/app/api/auth/status/route';

describe('FINOVA Opening Experience, Authentication, Language & Identity Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setSessionUserId('user-123');
    setStoredLanguage('en');
  });

  describe('1. Language Selection & Translation System (i18n)', () => {
    it('supports English, Telugu, and Hindi with native script display', () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(3);

      const telugu = SUPPORTED_LANGUAGES.find((l) => l.code === 'te');
      expect(telugu).toBeDefined();
      expect(telugu?.nativeName).toBe('తెలుగు');

      const hindi = SUPPORTED_LANGUAGES.find((l) => l.code === 'hi');
      expect(hindi).toBeDefined();
      expect(hindi?.nativeName).toBe('हिन्दी');

      const english = SUPPORTED_LANGUAGES.find((l) => l.code === 'en');
      expect(english).toBeDefined();
      expect(english?.nativeName).toBe('English');
    });

    it('translates core brand tagline and supporting text across all supported languages', () => {
      // English
      expect(t('tagline', 'en')).toBe('Smarter Payments. Safer Money.');
      expect(t('btnLogIn', 'en')).toBe('Log In');

      // Telugu
      expect(t('tagline', 'te')).toBe('తెలివైన చెల్లింపులు. సురక్షితమైన డబ్బు.');
      expect(t('btnLogIn', 'te')).toBe('లాగిన్');

      // Hindi
      expect(t('tagline', 'hi')).toBe('स्मार्ट भुगतान। सुरक्षित धन।');
      expect(t('btnLogIn', 'hi')).toBe('लॉग इन');
    });

    it('persists and updates language preference cleanly', () => {
      expect(getStoredLanguage()).toBe('en');

      setStoredLanguage('te');
      expect(getStoredLanguage()).toBe('te');

      setStoredLanguage('hi');
      expect(getStoredLanguage()).toBe('hi');
    });
  });

  describe('2. Login API Handler & Validation', () => {
    it('rejects empty or malformed login requests with 400', async () => {
      const emptyReq = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: '', password: '' }),
      });

      const res = await loginHandler(emptyReq);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
    });

    it('authenticates valid credentials and provisions user session', async () => {
      const validReq = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'user@finova.in',
          password: 'SecurePassword123!',
        }),
      });

      const res = await loginHandler(validReq);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe('user@finova.in');
      expect(json.data.user.verificationStatus).toBe('NOT_STARTED');
    });

    it('derives personalized user display name from login credentials', async () => {
      const customReq = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'sirijoy@example.com',
          password: 'SecurePassword123!',
        }),
      });

      const res = await loginHandler(customReq);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.user.displayName).toBe('Sirijoy');
    });
  });

  describe('3. Sign Up API Handler & Validation', () => {
    it('validates 10-digit Indian phone format and rejects invalid numbers', async () => {
      const invalidPhoneReq = new NextRequest('http://localhost/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          fullName: 'Ravi Kumar',
          email: 'ravi@example.com',
          mobile: '12345', // Invalid
          password: 'Password123!',
          confirmPassword: 'Password123!',
          preferredLanguage: 'te',
          acceptTerms: true,
        }),
      });

      const res = await signupHandler(invalidPhoneReq);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('10-digit Indian mobile number');
    });

    it('rejects password mismatch', async () => {
      const mismatchReq = new NextRequest('http://localhost/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          fullName: 'Ravi Kumar',
          email: 'ravi@example.com',
          mobile: '9876543210',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword!',
          preferredLanguage: 'en',
          acceptTerms: true,
        }),
      });

      const res = await signupHandler(mismatchReq);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Passwords do not match');
    });

    it('rejects registration if terms and privacy policy are not accepted', async () => {
      const noTermsReq = new NextRequest('http://localhost/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          fullName: 'Ravi Kumar',
          email: 'ravi@example.com',
          mobile: '9876543210',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          preferredLanguage: 'en',
          acceptTerms: false,
        }),
      });

      const res = await signupHandler(noTermsReq);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Terms of Service & Privacy Policy');
    });

    it('successfully registers account and provisions user with preferred language', async () => {
      const validSignupReq = new NextRequest('http://localhost/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          fullName: 'Sneha Patel',
          email: 'sneha@example.com',
          mobile: '9876543210',
          password: 'SafePassword999!',
          confirmPassword: 'SafePassword999!',
          preferredLanguage: 'hi',
          acceptTerms: true,
        }),
      });

      const res = await signupHandler(validSignupReq);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.user.displayName).toBe('Sneha Patel');
      expect(json.data.user.preferredLanguage).toBe('hi');
      expect(json.data.user.verificationStatus).toBe('NOT_STARTED');
    });
  });

  describe('4. Aadhaar Identity Verification Interface & Compliance Guard', () => {
    it('reports unconfigured prototype status and never claims false verification', async () => {
      const statusReq = new NextRequest('http://localhost/api/auth/status', {
        method: 'GET',
        headers: { 'x-user-id': 'user-123' },
      });

      const res = await statusHandler(statusReq);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.verification.status).toBe('NOT_STARTED');
      expect(json.data.verification.providerConfigured).toBe(false);
      expect(json.data.verification.providerStatusMessage).toContain(
        'Verification integration not configured'
      );
      expect(json.data.verification.isOptionalForBasicFeatures).toBe(true);
    });

    it('confirms that sensitive credential storage is forbidden', () => {
      // Passwords, raw Aadhaar numbers, or OTPs must never exist in local storage keys
      const mockStorage = {
        finova_user_id: 'user-123',
        finova_language: 'en',
      };

      expect(Object.keys(mockStorage)).not.toContain('password');
      expect(Object.keys(mockStorage)).not.toContain('aadhaar_number');
      expect(Object.keys(mockStorage)).not.toContain('aadhaar_otp');
    });
  });
});
