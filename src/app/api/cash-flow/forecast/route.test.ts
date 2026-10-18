import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import * as cashFlowService from '@/services/cashFlowService';

vi.mock('@/services/cashFlowService', async () => {
  const actual = await vi.importActual<any>('@/services/cashFlowService');
  return {
    ...actual,
    getUserCashFlowForecast: vi.fn(),
  };
});

describe('Cash-Flow Forecast API Route (/api/cash-flow/forecast)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/cash-flow/forecast', () => {
    it('should return 401 Unauthorized if x-user-id header is missing', async () => {
      const req = new NextRequest('http://localhost/api/cash-flow/forecast', {
        method: 'GET'
      });

      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Unauthorized');
    });

    it('should return 200 OK with forecast for authenticated user', async () => {
      const mockForecast = {
        summary: {
          confirmedAvailableFunds: 500000,
          confirmedIncomingFunds: 0,
          totalConfirmedLiquid: 500000,
          unconfirmedReceipts: 200000,
          upcomingExpenses: 800000
        },
        primaryForecast: {
          netAmount: -300000,
          isShortfall: true,
          shortfallAmount: 300000,
          surplusAmount: 0,
          statusText: 'Potential shortfall of ₹3,000.00'
        },
        conditionalScenarios: {
          unconfirmedReceiptsCleared: {
            netAmount: -100000,
            isShortfall: true,
            shortfallAmount: 100000,
            surplusAmount: 0,
            statusText: 'Potential shortfall of ₹1,000.00 if unconfirmed receipts clear'
          }
        },
        disclaimer: 'Informational calculation...'
      };

      vi.mocked(cashFlowService.getUserCashFlowForecast).mockResolvedValueOnce(
        mockForecast as any
      );

      const req = new NextRequest('http://localhost/api/cash-flow/forecast', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' }
      });

      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.primaryForecast.shortfallAmount).toBe(300000);
      expect(json.data.conditionalScenarios.unconfirmedReceiptsCleared.shortfallAmount).toBe(
        100000
      );
    });

    it('should return 500 if an error occurs fetching forecast', async () => {
      vi.mocked(cashFlowService.getUserCashFlowForecast).mockRejectedValueOnce(
        new Error('Database query failure')
      );

      const req = new NextRequest('http://localhost/api/cash-flow/forecast', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' }
      });

      const res = await GET(req);
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/cash-flow/forecast (Simulation / What-If)', () => {
    it('should return 400 Bad Request for invalid payload values', async () => {
      const req = new NextRequest('http://localhost/api/cash-flow/forecast', {
        method: 'POST',
        body: JSON.stringify({
          currentAvailableFunds: -500 // negative amount
        })
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
    });

    it('should execute deterministic acceptance example via POST simulation', async () => {
      const req = new NextRequest('http://localhost/api/cash-flow/forecast', {
        method: 'POST',
        body: JSON.stringify({
          currentAvailableFunds: 500000, // ₹5,000
          expenses: 800000, // ₹8,000
          unconfirmedReceipts: 200000 // ₹2,000
        })
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.primaryForecast.isShortfall).toBe(true);
      expect(json.data.primaryForecast.shortfallAmount).toBe(300000);
      expect(json.data.conditionalScenarios.unconfirmedReceiptsCleared.shortfallAmount).toBe(
        100000
      );
    });

    it('should evaluate hypothetical scenarios within POST simulation', async () => {
      const req = new NextRequest('http://localhost/api/cash-flow/forecast', {
        method: 'POST',
        body: JSON.stringify({
          currentAvailableFunds: 500000,
          expenses: 800000,
          hypotheticalScenarios: [
            {
              name: 'Bonus Incoming',
              additionalIncome: 400000
            }
          ]
        })
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.conditionalScenarios.hypotheticals).toHaveLength(1);
      expect(json.data.conditionalScenarios.hypotheticals[0].surplusAmount).toBe(100000);
    });
  });
});
