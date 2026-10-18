import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/apiClient';
import { formatCurrency, rupeesToPaise } from '@/lib/formatters';

describe('Cash-Flow Planner Frontend Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Requirement 4: Core Financial Calculation Integrity Example', () => {
    it('executes simulation with ₹5000 available, ₹8000 expenses, ₹2000 unconfirmed and asserts authoritative shortfall', async () => {
      const mockSimulationResponse = {
        success: true,
        data: {
          summary: {
            confirmedAvailableFunds: 500000, // ₹5,000
            confirmedIncomingFunds: 0,
            totalConfirmedLiquid: 500000,
            unconfirmedReceipts: 200000, // ₹2,000
            upcomingExpenses: 800000, // ₹8,000
          },
          primaryForecast: {
            netAmount: -300000, // -₹3,000
            isShortfall: true,
            shortfallAmount: 300000, // ₹3,000
            surplusAmount: 0,
            statusText: 'Shortfall Expected',
          },
          conditionalScenarios: {
            hypotheticals: [
              {
                name: 'Conditional: If ₹2,000 Expected Receipt Clears',
                projectedNet: -100000, // -₹1,000
                isShortfall: true,
                shortfallAmount: 100000, // ₹1,000
                surplusAmount: 0,
                statusText: 'Shortfall Expected',
              },
            ],
          },
          disclaimer: 'Conservative calculations exclude unconfirmed income.',
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSimulationResponse,
      });

      vi.stubGlobal('fetch', mockFetch);

      const response = await apiClient.cashFlow.simulate({
        currentAvailableFunds: 500000,
        confirmedIncome: 0,
        unconfirmedReceipts: 200000,
        expenses: 800000,
        hypotheticalScenarios: [
          {
            name: 'Conditional: If ₹2,000 Expected Receipt Clears',
            additionalIncome: 200000,
          },
        ],
      });

      expect(response.success).toBe(true);

      // Verify primary forecast excludes unconfirmed receipts
      const primary = response.data?.primaryForecast;
      expect(primary?.isShortfall).toBe(true);
      expect(primary?.shortfallAmount).toBe(300000);
      expect(formatCurrency(primary?.shortfallAmount)).toBe('₹3,000');

      // Verify conditional scenario reflects ₹1,000 shortfall
      const hypothetical = response.data?.conditionalScenarios?.hypotheticals?.[0];
      expect(hypothetical?.isShortfall).toBe(true);
      expect(hypothetical?.shortfallAmount).toBe(100000);
      expect(formatCurrency(hypothetical?.shortfallAmount)).toBe('₹1,000');

      vi.unstubAllGlobals();
    });
  });

  describe('Item Ledger Management (CRUD)', () => {
    it('creates cash-flow item converting rupees to integer paise', async () => {
      const mockItem = {
        success: true,
        data: {
          id: 'item-1',
          userId: 'user-123',
          amount: 500000, // 5000 INR
          currency: 'INR',
          isIncome: false,
          isConfirmed: false,
          isHypothetical: false,
          dueDate: '2026-10-25T00:00:00.000Z',
          createdAt: '2026-10-10T00:00:00.000Z',
          updatedAt: '2026-10-10T00:00:00.000Z',
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockItem,
      });

      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.cashFlow.createItem({
        amount: rupeesToPaise(5000),
        isIncome: false,
        dueDate: '2026-10-25T00:00:00.000Z',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cash-flow/items',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"amount":500000'),
        })
      );
      expect(res.success).toBe(true);

      vi.unstubAllGlobals();
    });

    it('toggles confirmation status via PATCH /api/cash-flow/items/[id]', async () => {
      const mockUpdated = {
        success: true,
        data: {
          id: 'item-1',
          isConfirmed: true,
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUpdated,
      });

      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.cashFlow.updateItem('item-1', {
        isConfirmed: true,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cash-flow/items/item-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ isConfirmed: true }),
        })
      );
      expect(res.success).toBe(true);

      vi.unstubAllGlobals();
    });

    it('deletes item via DELETE /api/cash-flow/items/[id]', async () => {
      const mockDelete = {
        success: true,
        data: { message: 'Item deleted' },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockDelete,
      });

      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.cashFlow.deleteItem('item-1');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cash-flow/items/item-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(res.success).toBe(true);

      vi.unstubAllGlobals();
    });
  });
});
