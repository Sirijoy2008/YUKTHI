import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, DELETE } from './route';
import { NextRequest } from 'next/server';
import * as cashFlowService from '@/services/cashFlowService';

vi.mock('@/services/cashFlowService', async () => {
  const actual = await vi.importActual<any>('@/services/cashFlowService');
  return {
    ...actual,
    updateCashFlowItem: vi.fn(),
    deleteCashFlowItem: vi.fn(),
  };
});

describe('Single Cash-Flow Item Route (/api/cash-flow/items/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH /api/cash-flow/items/[id]', () => {
    it('should return 401 if x-user-id header is missing', async () => {
      const req = new NextRequest('http://localhost/api/cash-flow/items/cf-1', {
        method: 'PATCH',
        body: JSON.stringify({ isConfirmed: true })
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'cf-1' }) });
      expect(res.status).toBe(401);
    });

    it('should return 400 if empty update body provided', async () => {
      const req = new NextRequest('http://localhost/api/cash-flow/items/cf-1', {
        method: 'PATCH',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({})
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'cf-1' }) });
      expect(res.status).toBe(400);
    });

    it('should return 404 if item does not exist', async () => {
      vi.mocked(cashFlowService.updateCashFlowItem).mockRejectedValueOnce(
        new cashFlowService.CashFlowItemNotFoundError('Not found')
      );

      const req = new NextRequest('http://localhost/api/cash-flow/items/cf-1', {
        method: 'PATCH',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({ isConfirmed: true })
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'cf-1' }) });
      expect(res.status).toBe(404);
    });

    it('should return 403 if unauthorized user', async () => {
      vi.mocked(cashFlowService.updateCashFlowItem).mockRejectedValueOnce(
        new cashFlowService.CashFlowItemForbiddenError('Forbidden')
      );

      const req = new NextRequest('http://localhost/api/cash-flow/items/cf-1', {
        method: 'PATCH',
        headers: { 'x-user-id': 'other-user' },
        body: JSON.stringify({ isConfirmed: true })
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'cf-1' }) });
      expect(res.status).toBe(403);
    });

    it('should return 200 on successful update', async () => {
      vi.mocked(cashFlowService.updateCashFlowItem).mockResolvedValueOnce({
        id: 'cf-1',
        amount: 800000,
        isConfirmed: true
      } as any);

      const req = new NextRequest('http://localhost/api/cash-flow/items/cf-1', {
        method: 'PATCH',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({ isConfirmed: true })
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'cf-1' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.isConfirmed).toBe(true);
    });
  });

  describe('DELETE /api/cash-flow/items/[id]', () => {
    it('should return 401 if x-user-id header is missing', async () => {
      const req = new NextRequest('http://localhost/api/cash-flow/items/cf-1', {
        method: 'DELETE'
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: 'cf-1' }) });
      expect(res.status).toBe(401);
    });

    it('should return 404 if item does not exist', async () => {
      vi.mocked(cashFlowService.deleteCashFlowItem).mockRejectedValueOnce(
        new cashFlowService.CashFlowItemNotFoundError('Not found')
      );

      const req = new NextRequest('http://localhost/api/cash-flow/items/cf-1', {
        method: 'DELETE',
        headers: { 'x-user-id': 'user-1' }
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: 'cf-1' }) });
      expect(res.status).toBe(404);
    });

    it('should return 200 on successful deletion', async () => {
      vi.mocked(cashFlowService.deleteCashFlowItem).mockResolvedValueOnce({
        id: 'cf-1'
      } as any);

      const req = new NextRequest('http://localhost/api/cash-flow/items/cf-1', {
        method: 'DELETE',
        headers: { 'x-user-id': 'user-1' }
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: 'cf-1' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });
});
