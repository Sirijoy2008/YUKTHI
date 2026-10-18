import { describe, it, expect } from 'vitest';
import {
  getPaymentGuidance,
  getVerificationStatus,
  containsSensitiveCredentials,
  PAYMENT_ASSISTANT_DISCLAIMER
} from './paymentGuidance';

describe('Payment Guidance Service', () => {
  it('should return appropriate guidance for FAILED payments', () => {
    const guidance = getPaymentGuidance('FAILED');
    expect(guidance.title).toBe('Payment Failed');
    expect(guidance.explanation).toContain('reversal');
    expect(guidance.expectedTimeline).toContain('T+1');
    expect(guidance.recommendedActions.length).toBeGreaterThan(0);
    expect(guidance.supportChannels.length).toBeGreaterThan(0);
  });

  it('should return appropriate guidance for PENDING payments', () => {
    const guidance = getPaymentGuidance('PENDING');
    expect(guidance.title).toBe('Payment Pending');
    expect(guidance.explanation).toContain('intermediate state');
    expect(guidance.expectedTimeline).toBeDefined();
    expect(guidance.recommendedActions).toContainEqual(
      expect.stringContaining('Wait for the transaction timeout')
    );
  });

  it('should return appropriate guidance for DELAYED payments', () => {
    const guidance = getPaymentGuidance('DELAYED');
    expect(guidance.title).toBe('Payment Delayed');
    expect(guidance.expectedTimeline).toContain('NEFT');
    expect(guidance.recommendedActions).toBeDefined();
  });

  it('should return appropriate guidance for DEBITED_NOT_CREDITED payments', () => {
    const guidance = getPaymentGuidance('DEBITED_NOT_CREDITED');
    expect(guidance.title).toBe('Amount Debited but Recipient Not Credited');
    expect(guidance.explanation).toContain('reconciliation');
    expect(guidance.expectedTimeline).toContain('Turnaround Time');
    expect(guidance.recommendedActions).toContainEqual(
      expect.stringContaining('12-digit UPI Transaction Reference')
    );
    expect(guidance.supportChannels).toContainEqual(
      expect.stringContaining('RBI Complaint Management System')
    );
  });

  it('should detect sensitive credentials accurately', () => {
    expect(containsSensitiveCredentials('123456')).toBe(false);
    expect(containsSensitiveCredentials('UPI-123456789012')).toBe(false);
    expect(containsSensitiveCredentials('BANK-REF-9988')).toBe(false);

    // Prohibited keywords
    expect(containsSensitiveCredentials('My OTP is 9876')).toBe(true);
    expect(containsSensitiveCredentials('upipin123')).toBe(true);
    expect(containsSensitiveCredentials('secret-password')).toBe(true);
    expect(containsSensitiveCredentials('cvv 999')).toBe(true);
    expect(containsSensitiveCredentials('mpin 1234')).toBe(true);
  });

  it('should provide unverified status metadata by default', () => {
    const verification = getVerificationStatus('DEBITED_NOT_CREDITED');
    expect(verification.reportedStatus).toBe('DEBITED_NOT_CREDITED');
    expect(verification.verifiedStatus).toBe('UNVERIFIED');
    expect(verification.isIndependentlyVerified).toBe(false);
    expect(verification.verificationSource).toContain('No direct bank integration');
  });

  it('disclaimer should explicitly mention inability to reverse payments', () => {
    expect(PAYMENT_ASSISTANT_DISCLAIMER).toContain('cannot reverse, settle, or refund');
    expect(PAYMENT_ASSISTANT_DISCLAIMER).toContain('user-reported and not independently verified');
    expect(PAYMENT_ASSISTANT_DISCLAIMER).toContain('Never share OTPs, UPI PINs');
  });
});
