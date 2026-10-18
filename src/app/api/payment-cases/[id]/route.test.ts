import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';
import { NextRequest } from 'next/server';
import * as paymentAssistantService from '@/services/paymentAssistant';

vi.mock('@/services/paymentAssistant', async () => {
  const actual = await vi.importActual<any>('@/services/paymentAssistant');
  return {
    ...actual,
    getPaymentCaseById: vi.fn(),
    updatePaymentCase: vi.fn(),
  };
});

describe('Single Payment Case API Route (/api/payment-cases/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/payment-cases/[id]', () => {
    it('should return 401 Unauthorized if x-user-id header is missing', async () => {
      const req = new NextRequest('http://localhost/api/payment-cases/case-123', {
        method: 'GET',
      });

      const res = await GET(req, { params: Promise.resolve({ id: 'case-123' }) });
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
    });

    it('should return 404 Not Found if payment case does not exist', async () => {
      vi.mocked(paymentAssistantService.getPaymentCaseById).mockRejectedValueOnce(
        new paymentAssistantService.PaymentCaseNotFoundError('Case not found')
      );

      const req = new NextRequest('http://localhost/api/payment-cases/nonexistent', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error).toContain('not found');
    });

    it('should return 403 Forbidden if user does not own the case', async () => {
      vi.mocked(paymentAssistantService.getPaymentCaseById).mockRejectedValueOnce(
        new paymentAssistantService.PaymentCaseForbiddenError('User is not authorized')
      );

      const req = new NextRequest('http://localhost/api/payment-cases/case-123', {
        method: 'GET',
        headers: { 'x-user-id': 'other-user' },
      });

      const res = await GET(req, { params: Promise.resolve({ id: 'case-123' }) });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toContain('not authorized');
    });

    it('should return 200 OK with full case details when authorized', async () => {
      const mockCase = {
        case: { id: 'case-123', resolutionStatus: 'OPEN' },
        verification: { verifiedStatus: 'UNVERIFIED', isIndependentlyVerified: false },
        guidance: { title: 'Payment Pending' },
        disclaimer: 'FINOVA disclaimer...'
      };

      vi.mocked(paymentAssistantService.getPaymentCaseById).mockResolvedValueOnce(mockCase as any);

      const req = new NextRequest('http://localhost/api/payment-cases/case-123', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const res = await GET(req, { params: Promise.resolve({ id: 'case-123' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.case.id).toBe('case-123');
      expect(json.data.verification.isIndependentlyVerified).toBe(false);
    });
  });

  describe('PATCH /api/payment-cases/[id]', () => {
    it('should return 401 Unauthorized if x-user-id header is missing', async () => {
      const req = new NextRequest('http://localhost/api/payment-cases/case-123', {
        method: 'PATCH',
        body: JSON.stringify({ resolutionStatus: 'IN_PROGRESS' }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'case-123' }) });
      expect(res.status).toBe(401);
    });

    it('should return 400 Bad Request if no fields are provided to update', async () => {
      const req = new NextRequest('http://localhost/api/payment-cases/case-123', {
        method: 'PATCH',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({}),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'case-123' }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('At least one field');
    });

    it('should return 400 Bad Request for invalid status transition', async () => {
      vi.mocked(paymentAssistantService.updatePaymentCase).mockRejectedValueOnce(
        new paymentAssistantService.InvalidStatusTransitionError(
          "Invalid status transition from 'CLOSED' to 'IN_PROGRESS'"
        )
      );

      const req = new NextRequest('http://localhost/api/payment-cases/case-123', {
        method: 'PATCH',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({ resolutionStatus: 'IN_PROGRESS' }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'case-123' }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Invalid status transition');
    });

    it('should return 400 Bad Request if referenceNumber contains sensitive PIN/password', async () => {
      vi.mocked(paymentAssistantService.updatePaymentCase).mockRejectedValueOnce(
        new paymentAssistantService.SensitiveDataError(
          'Reference number cannot contain credentials such as PIN'
        )
      );

      const req = new NextRequest('http://localhost/api/payment-cases/case-123', {
        method: 'PATCH',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({ referenceNumber: 'otp-9990' }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'case-123' }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('credentials');
    });

    it('should return 404 Not Found if case does not exist during update', async () => {
      vi.mocked(paymentAssistantService.updatePaymentCase).mockRejectedValueOnce(
        new paymentAssistantService.PaymentCaseNotFoundError('Case not found')
      );

      const req = new NextRequest('http://localhost/api/payment-cases/nonexistent', {
        method: 'PATCH',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({ resolutionStatus: 'RESOLVED' }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) });
      expect(res.status).toBe(404);
    });

    it('should return 403 Forbidden if updating another user case', async () => {
      vi.mocked(paymentAssistantService.updatePaymentCase).mockRejectedValueOnce(
        new paymentAssistantService.PaymentCaseForbiddenError('Not authorized')
      );

      const req = new NextRequest('http://localhost/api/payment-cases/case-123', {
        method: 'PATCH',
        headers: { 'x-user-id': 'other-user' },
        body: JSON.stringify({ resolutionStatus: 'RESOLVED' }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'case-123' }) });
      expect(res.status).toBe(403);
    });

    it('should return 200 OK and updated case details on valid update', async () => {
      const mockUpdated = {
        case: { id: 'case-123', resolutionStatus: 'RESOLVED' },
        verification: { isIndependentlyVerified: false },
        guidance: { title: 'Payment Failed' },
        disclaimer: 'FINOVA disclaimer'
      };

      vi.mocked(paymentAssistantService.updatePaymentCase).mockResolvedValueOnce(mockUpdated as any);

      const req = new NextRequest('http://localhost/api/payment-cases/case-123', {
        method: 'PATCH',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({ resolutionStatus: 'RESOLVED' }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'case-123' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.case.resolutionStatus).toBe('RESOLVED');
    });
  });
});
