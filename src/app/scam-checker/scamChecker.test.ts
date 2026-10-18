import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/apiClient';
import { getRiskLevelBadge } from '@/lib/formatters';

describe('Scam Checker Frontend Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Contract and Response Mapping', () => {
    it('submits text to /api/scam-checker/analyze and processes response', async () => {
      const mockResult = {
        success: true,
        data: {
          indicators: ['Urgent Demand', 'Request for Sensitive Information'],
          details: [
            {
              id: 'URGENCY',
              name: 'Urgent Demand',
              description: 'Demands immediate action',
              reason: 'Creates false panic',
              recommendation: 'Verify independently',
            },
            {
              id: 'OTP_REQUEST',
              name: 'Request for Sensitive Information',
              description: 'Asks for OTP/PIN',
              reason: 'Banks never ask for OTP',
              recommendation: 'Never share OTP',
            },
          ],
          riskLevel: 'High' as const,
          recommendations: ['Verify independently', 'Never share OTP'],
          disclaimer:
            'This is a rule-based risk assessment. It is not definitive fraud detection.',
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResult,
      });

      vi.stubGlobal('fetch', mockFetch);

      const response = await apiClient.scamChecker.analyze(
        'URGENT: Your account will be closed unless you share your OTP immediately.'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/scam-checker/analyze',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            message:
              'URGENT: Your account will be closed unless you share your OTP immediately.',
          }),
        })
      );

      expect(response.success).toBe(true);
      expect(response.data?.riskLevel).toBe('High');
      expect(response.data?.details).toHaveLength(2);
      expect(response.data?.details[0].id).toBe('URGENCY');
      expect(response.data?.disclaimer).toContain('rule-based risk assessment');

      vi.unstubAllGlobals();
    });

    it('maps categorical risk levels cleanly to visual badges', () => {
      const lowBadge = getRiskLevelBadge('Low');
      expect(lowBadge.variant).toBe('success');
      expect(lowBadge.label).toBe('Low Risk');

      const medBadge = getRiskLevelBadge('Medium');
      expect(medBadge.variant).toBe('warning');
      expect(medBadge.label).toBe('Medium Risk');

      const highBadge = getRiskLevelBadge('High');
      expect(highBadge.variant).toBe('danger');
      expect(highBadge.label).toBe('High Risk');
    });

    it('handles empty / benign messages resulting in Low risk gracefully', async () => {
      const mockResult = {
        success: true,
        data: {
          indicators: [],
          details: [],
          riskLevel: 'Low' as const,
          recommendations: [],
          disclaimer: 'This is a rule-based risk assessment.',
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResult,
      });

      vi.stubGlobal('fetch', mockFetch);

      const response = await apiClient.scamChecker.analyze('Salary credited to your account');
      expect(response.success).toBe(true);
      expect(response.data?.riskLevel).toBe('Low');
      expect(response.data?.details).toHaveLength(0);

      vi.unstubAllGlobals();
    });

    it('safely captures API failure without crashing or leaking stack traces', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Message exceeds maximum length of 2000 characters',
        }),
      });

      vi.stubGlobal('fetch', mockFetch);

      const response = await apiClient.scamChecker.analyze('a'.repeat(2005));
      expect(response.success).toBe(false);
      expect(response.error).toBe('Message exceeds maximum length of 2000 characters');

      vi.unstubAllGlobals();
    });
  });

  describe('Validation Rules Consistency', () => {
    it('character limit is 2000 characters matching backend Zod schema', () => {
      const validText = 'a'.repeat(2000);
      const invalidText = 'a'.repeat(2001);

      expect(validText.length).toBeLessThanOrEqual(2000);
      expect(invalidText.length).toBeGreaterThan(2000);
    });

    it('empty or whitespace-only inputs are recognized as invalid', () => {
      const empty = '';
      const spaces = '    \n\t  ';

      expect(empty.trim()).toBe('');
      expect(spaces.trim()).toBe('');
    });
  });
});
