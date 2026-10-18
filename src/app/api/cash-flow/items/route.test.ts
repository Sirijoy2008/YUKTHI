import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import * as cashFlowService from '@/services/cashFlowService';

vi.mock('@/services/cashFlowService', async () => {
  const actual = await vi.importActual<any>('@/services/cashFlowService');
  return {
    ...actual,
    createCashFlowItem: vi.fn(),
    getUserCashFlowItems: vi.fn(),
  };
});

describe('Cash-Flow Items Route (/api/cash-flow/items)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/cash-flow/items', () => {
    it('should return 401 if x-user-id is missing', async () => {
      const req = new NextRequest('http://localhost/api/cash-flow/items', { method: 'GET' });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('should return 200 and items for user', async () => {
      vi.mocked(cashFlowService.getUserCashFlowItems).mockResolvedValueOnce([
        { id: 'cf-1', amount: 50000 } as any
      ]);

      const req = new NextRequest('http://localhost/api/cash-flow/items', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' }
      });

      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.items).toHaveLength(1);
    });
  });

  describe('POST /api/cash-flow/items', () => {
    it('should return 401 if x-user-id is missing', async () => {
      const req = new NextRequest('http://localhost/api/cash-flow/items', {
        method: 'POST',
        body: JSON.stringify({ amount: 50000, isIncome: true })
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid amount or missing fields', async () => {
      const req = new NextRequest('http://localhost/api/cash-flow/items', {
        method: 'POST',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({ amount: -500 }) // missing isIncome, negative amount
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 201 on successful item creation', async () => {
      vi.mocked(cashFlowService.createCashFlowItem).mockResolvedValueOnce({
        id: 'cf-new',
        amount: 800000,
        isIncome: false,
        isConfirmed: false
      } as any);

      const req = new NextRequest('http://localhost/api/cash-flow/items', {
        method: 'POST',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({
          amount: 800000,
          isIncome: false,
          isConfirmed: false
        })
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('cf-new');
    });
  });
});
