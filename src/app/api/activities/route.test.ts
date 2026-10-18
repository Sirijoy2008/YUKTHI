import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import * as financialActivityService from '@/services/financialActivity';

vi.mock('@/services/financialActivity', async () => {
  const actual = await vi.importActual<any>('@/services/financialActivity');
  return {
    ...actual,
    getFinancialActivities: vi.fn(),
    createFinancialActivity: vi.fn(),
  };
});

describe('Financial Activities Route (/api/activities)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/activities', () => {
    it('should return 401 if x-user-id header is missing', async () => {
      const req = new NextRequest('http://localhost/api/activities', { method: 'GET' });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('should return 200 and list activities for authenticated user', async () => {
      vi.mocked(financialActivityService.getFinancialActivities).mockResolvedValueOnce([
        { id: 'act-1', amount: 200000 } as any
      ]);

      const req = new NextRequest('http://localhost/api/activities', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' }
      });

      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.activities).toHaveLength(1);
    });
  });

  describe('POST /api/activities', () => {
    it('should return 401 if x-user-id header is missing', async () => {
      const req = new NextRequest('http://localhost/api/activities', {
        method: 'POST',
        body: JSON.stringify({ type: 'INCOME', amount: 200000, date: '2026-10-09T10:00:00Z' })
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('should return 400 on missing or invalid fields', async () => {
      const req = new NextRequest('http://localhost/api/activities', {
        method: 'POST',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({ amount: -500 }) // missing type, date, negative amount
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 201 on successful activity creation', async () => {
      vi.mocked(financialActivityService.createFinancialActivity).mockResolvedValueOnce({
        id: 'act-new',
        type: 'INCOME',
        amount: 200000,
        status: 'UNCONFIRMED'
      } as any);

      const req = new NextRequest('http://localhost/api/activities', {
        method: 'POST',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({
          type: 'INCOME',
          amount: 200000,
          date: '2026-10-09T10:00:00.000Z',
          referenceNumber: 'UTR-123456789'
        })
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('act-new');
    });
  });
});
