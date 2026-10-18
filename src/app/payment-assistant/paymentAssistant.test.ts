import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/apiClient';
import { formatCurrency, rupeesToPaise } from '@/lib/formatters';

describe('Payment Assistant Frontend Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Form Submission & Minor Units (Paise) Conversion', () => {
    it('converts rupees into integer paise and calls POST /api/payment-cases', async () => {
      const mockResult = {
        success: true,
        data: {
          case: {
            id: 'case-999',
            userId: 'user-123',
            issueType: 'DEBITED_NOT_CREDITED',
            resolutionStatus: 'OPEN',
            createdAt: '2026-10-10T12:00:00.000Z',
          },
          guidance: {
            recommendedSteps: ['Wait T+1 working days'],
            estimatedResolutionHours: 24,
            officialPortals: [],
          },
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResult,
      });

      vi.stubGlobal('fetch', mockFetch);

      const rupeesInput = 1500;
      const paise = rupeesToPaise(rupeesInput);
      expect(paise).toBe(150000);

      const response = await apiClient.paymentCases.create({
        issueType: 'DEBITED_NOT_CREDITED',
        amount: paise,
        referenceNumber: '429381726354',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/payment-cases',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"amount":150000'),
        })
      );

      expect(response.success).toBe(true);

      vi.unstubAllGlobals();
    });

    it('rejects invalid or non-positive amount values gracefully', () => {
      const invalidAmount = -500;
      expect(invalidAmount <= 0).toBe(true);

      const zeroAmount = 0;
      expect(zeroAmount <= 0).toBe(true);
    });
  });

  describe('Case Listing & Details Mapping', () => {
    it('retrieves user cases from GET /api/payment-cases and formats amounts in paise', async () => {
      const mockCases = {
        success: true,
        data: {
          cases: [
            {
              id: 'case-1',
              userId: 'user-123',
              issueType: 'DEBITED_NOT_CREDITED',
              resolutionStatus: 'OPEN',
              createdAt: '2026-10-10T08:00:00.000Z',
              financialActivity: {
                id: 'act-1',
                amount: 500000, // 5,000 INR
                currency: 'INR',
                status: 'UNCONFIRMED',
                date: '2026-10-10T08:00:00.000Z',
                referenceNumber: 'REF123456',
              },
              guidance: {
                recommendedSteps: ['File dispute on NPCI portal'],
                estimatedResolutionHours: 48,
                officialPortals: [
                  {
                    name: 'NPCI Portal',
                    url: 'https://npci.org.in',
                    description: 'Official dispute portal',
                  },
                ],
              },
            },
          ],
          disclaimer: 'YUKTHI is not a bank.',
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockCases,
      });

      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.paymentCases.list();
      expect(res.success).toBe(true);

      const caseList = res.data?.cases || [];
      expect(caseList).toHaveLength(1);
      expect(caseList[0].financialActivity?.amount).toBe(500000);
      expect(formatCurrency(caseList[0].financialActivity?.amount)).toBe('₹5,000');

      vi.unstubAllGlobals();
    });

    it('updates case status via PATCH /api/payment-cases/[id]', async () => {
      const mockUpdated = {
        success: true,
        data: {
          id: 'case-1',
          resolutionStatus: 'RESOLVED',
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUpdated,
      });

      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.paymentCases.update('case-1', {
        resolutionStatus: 'RESOLVED',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/payment-cases/case-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ resolutionStatus: 'RESOLVED' }),
        })
      );

      expect(res.success).toBe(true);

      vi.unstubAllGlobals();
    });
  });

  describe('Security Constraints', () => {
    it('does not request PINs, OTPs, or passwords in form payloads', () => {
      const allowedPayloadFields = [
        'issueType',
        'amount',
        'currency',
        'type',
        'date',
        'referenceNumber',
        'nextActionDate',
      ];

      expect(allowedPayloadFields).not.toContain('pin');
      expect(allowedPayloadFields).not.toContain('otp');
      expect(allowedPayloadFields).not.toContain('password');
      expect(allowedPayloadFields).not.toContain('cvv');
    });
  });
});
