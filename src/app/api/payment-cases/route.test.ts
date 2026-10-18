import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './route';
import { NextRequest } from 'next/server';
import * as paymentAssistantService from '@/services/paymentAssistant';

vi.mock('@/services/paymentAssistant', async () => {
  const actual = await vi.importActual<any>('@/services/paymentAssistant');
  return {
    ...actual,
    createPaymentCase: vi.fn(),
    getPaymentCases: vi.fn(),
  };
});

describe('Payment Cases API Route (/api/payment-cases)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/payment-cases', () => {
    it('should return 401 Unauthorized if x-user-id header is missing', async () => {
      const req = new NextRequest('http://localhost/api/payment-cases', {
        method: 'POST',
        body: JSON.stringify({
          issueType: 'FAILED',
          amount: 50000,
          date: '2026-10-09T10:00:00.000Z',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Unauthorized');
    });

    it('should return 400 Bad Request for missing required fields', async () => {
      const req = new NextRequest('http://localhost/api/payment-cases', {
        method: 'POST',
        headers: { 'x-user-id': 'user-123' },
        body: JSON.stringify({
          // missing issueType, amount, date
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
    });

    it('should return 400 Bad Request for invalid issueType', async () => {
      const req = new NextRequest('http://localhost/api/payment-cases', {
        method: 'POST',
        headers: { 'x-user-id': 'user-123' },
        body: JSON.stringify({
          issueType: 'INVALID_ISSUE',
          amount: 50000,
          date: '2026-10-09T10:00:00.000Z',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/FAILED.*PENDING.*DELAYED.*DEBITED_NOT_CREDITED/);
    });

    it('should return 400 Bad Request for non-positive or non-integer amount', async () => {
      const req = new NextRequest('http://localhost/api/payment-cases', {
        method: 'POST',
        headers: { 'x-user-id': 'user-123' },
        body: JSON.stringify({
          issueType: 'FAILED',
          amount: -100,
          date: '2026-10-09T10:00:00.000Z',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('positive integer');
    });

    it('should return 400 when referenceNumber contains sensitive credentials', async () => {
      vi.mocked(paymentAssistantService.createPaymentCase).mockRejectedValueOnce(
        new paymentAssistantService.SensitiveDataError('Reference number cannot contain credentials')
      );

      const req = new NextRequest('http://localhost/api/payment-cases', {
        method: 'POST',
        headers: { 'x-user-id': 'user-123' },
        body: JSON.stringify({
          issueType: 'PENDING',
          amount: 5000,
          date: '2026-10-09T10:00:00.000Z',
          referenceNumber: 'My secret pin 1234'
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Reference number cannot contain credentials');
    });

    it('should successfully create a payment case and return 201', async () => {
      const mockCreated = {
        case: {
          id: 'case-abc',
          financialActivityId: 'act-xyz',
          issueType: 'DEBITED_NOT_CREDITED',
          resolutionStatus: 'OPEN',
          nextActionDate: null,
          createdAt: '2026-10-09T10:00:00.000Z',
          updatedAt: '2026-10-09T10:00:00.000Z',
          financialActivity: {
            id: 'act-xyz',
            userId: 'user-123',
            type: 'EXPENSE',
            amount: 75000,
            currency: 'INR',
            status: 'UNCONFIRMED',
            date: '2026-10-09T10:00:00.000Z',
            referenceNumber: 'UTR987654321012',
          }
        },
        verification: {
          reportedStatus: 'DEBITED_NOT_CREDITED',
          verifiedStatus: 'UNVERIFIED',
          isIndependentlyVerified: false,
          verificationSource: 'None (No direct bank integration)'
        },
        guidance: {
          title: 'Amount Debited but Recipient Not Credited',
          explanation: 'Money was deducted...',
          expectedTimeline: 'T+1 working days',
          recommendedActions: ['Obtain UTR'],
          supportChannels: ['UPI App Support']
        },
        disclaimer: 'YUKTHI is an independent guidance and tracking assistant...'
      };

      vi.mocked(paymentAssistantService.createPaymentCase).mockResolvedValueOnce(mockCreated as any);

      const req = new NextRequest('http://localhost/api/payment-cases', {
        method: 'POST',
        headers: { 'x-user-id': 'user-123' },
        body: JSON.stringify({
          issueType: 'DEBITED_NOT_CREDITED',
          amount: 75000,
          date: '2026-10-09T10:00:00.000Z',
          referenceNumber: 'UTR987654321012',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.case.id).toBe('case-abc');
      expect(json.data.verification.isIndependentlyVerified).toBe(false);
      expect(json.data.disclaimer).toBeDefined();
    });

    it('should return 500 when database/service throws an unexpected error', async () => {
      vi.mocked(paymentAssistantService.createPaymentCase).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const req = new NextRequest('http://localhost/api/payment-cases', {
        method: 'POST',
        headers: { 'x-user-id': 'user-123' },
        body: JSON.stringify({
          issueType: 'FAILED',
          amount: 1000,
          date: '2026-10-09T10:00:00.000Z',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
    });
  });

  describe('GET /api/payment-cases', () => {
    it('should return 401 Unauthorized if x-user-id header is missing', async () => {
      const req = new NextRequest('http://localhost/api/payment-cases', {
        method: 'GET',
      });

      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
    });

    it('should return 200 and list payment cases for authenticated user', async () => {
      vi.mocked(paymentAssistantService.getPaymentCases).mockResolvedValueOnce([
        {
          case: { id: 'c-1' },
          verification: { isIndependentlyVerified: false },
        } as any
      ]);

      const req = new NextRequest('http://localhost/api/payment-cases', {
        method: 'GET',
        headers: { 'x-user-id': 'user-123' },
      });

      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.cases).toHaveLength(1);
      expect(json.data.disclaimer).toBeDefined();
    });

    it('should return 500 if database query fails', async () => {
      vi.mocked(paymentAssistantService.getPaymentCases).mockRejectedValueOnce(
        new Error('Database timeout')
      );

      const req = new NextRequest('http://localhost/api/payment-cases', {
        method: 'GET',
        headers: { 'x-user-id': 'user-123' },
      });

      const res = await GET(req);
      expect(res.status).toBe(500);
    });
  });
});
