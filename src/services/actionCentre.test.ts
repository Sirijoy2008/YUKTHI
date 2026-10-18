import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getActionCentreItems,
  resolveActionCentreItem,
  ACTION_CENTRE_DISCLAIMER
} from './actionCentre';
import { ActivityStatus, ActivityType } from '@prisma/client';

const mockFindManyCases = vi.fn();
const mockFindUniqueCase = vi.fn();
const mockUpdateCase = vi.fn();
const mockFindManyActivities = vi.fn();
const mockUpdateActivity = vi.fn();
const mockFindManyScams = vi.fn();
const mockGetUserCashFlowForecast = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    paymentCase: {
      findMany: (...args: any[]) => mockFindManyCases(...args),
      findUnique: (...args: any[]) => mockFindUniqueCase(...args),
      update: (...args: any[]) => mockUpdateCase(...args),
    },
    financialActivity: {
      findMany: (...args: any[]) => mockFindManyActivities(...args),
      findUnique: vi.fn(),
      update: (...args: any[]) => mockUpdateActivity(...args),
    },
    riskAssessment: {
      findMany: (...args: any[]) => mockFindManyScams(...args),
    },
    $transaction: (cb: any) => cb({
      paymentCase: { update: (...args: any[]) => mockUpdateCase(...args) },
      financialActivity: { update: (...args: any[]) => mockUpdateActivity(...args) },
    }),
  },
}));

vi.mock('./cashFlowService', () => ({
  getUserCashFlowForecast: (...args: any[]) => mockGetUserCashFlowForecast(...args),
  updateCashFlowItem: vi.fn(),
}));

describe('Action Centre Service (actionCentre)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActionCentreItems', () => {
    it('should aggregate unresolved payment cases, shortfalls, and unconfirmed receipts', async () => {
      // 1. Unresolved payment case
      const mockCases = [
        {
          id: 'case-1',
          issueType: 'DELAYED',
          resolutionStatus: 'OPEN',
          nextActionDate: new Date('2026-10-10T10:00:00Z'),
          financialActivity: {
            id: 'act-1',
            userId: 'user-1',
            amount: 200000,
            currency: 'INR',
            referenceNumber: 'UTR-123456789'
          }
        }
      ];
      mockFindManyCases.mockResolvedValue(mockCases);

      // 2. Unconfirmed activity without payment case
      const mockActivities = [
        {
          id: 'act-standalone',
          userId: 'user-1',
          type: ActivityType.INCOME,
          amount: 150000,
          currency: 'INR',
          status: ActivityStatus.UNCONFIRMED,
          date: new Date('2026-10-12T00:00:00Z'),
          referenceNumber: null
        }
      ];
      mockFindManyActivities.mockResolvedValue(mockActivities);

      // 3. Impending cash flow shortfall
      mockGetUserCashFlowForecast.mockResolvedValue({
        summary: { totalConfirmedLiquid: 500000, upcomingExpenses: 800000 },
        primaryForecast: {
          isShortfall: true,
          shortfallAmount: 300000
        }
      });

      // 4. No high risk scams
      mockFindManyScams.mockResolvedValue([]);

      const result = await getActionCentreItems('user-1');

      expect(result.summary.totalActions).toBe(3);
      expect(result.summary.highUrgencyCount).toBeGreaterThanOrEqual(1); // Shortfall is HIGH
      expect(result.items.some((i) => i.type === 'PAYMENT_FOLLOW_UP')).toBe(true);
      expect(result.items.some((i) => i.type === 'CASH_FLOW_SHORTFALL')).toBe(true);
      expect(result.items.some((i) => i.type === 'UNCONFIRMED_RECEIPT')).toBe(true);
      expect(result.disclaimer).toBe(ACTION_CENTRE_DISCLAIMER);
    });

    it('should prioritize HIGH urgency items before MEDIUM urgency items', async () => {
      mockFindManyCases.mockResolvedValue([
        {
          id: 'case-pending',
          issueType: 'PENDING',
          resolutionStatus: 'OPEN',
          nextActionDate: null,
          financialActivity: { amount: 50000, currency: 'INR', referenceNumber: null }
        }
      ]);
      mockFindManyActivities.mockResolvedValue([]);
      mockGetUserCashFlowForecast.mockResolvedValue({
        summary: { totalConfirmedLiquid: 200000, upcomingExpenses: 600000 },
        primaryForecast: { isShortfall: true, shortfallAmount: 400000 }
      });
      mockFindManyScams.mockResolvedValue([]);

      const result = await getActionCentreItems('user-1');

      // CASH_FLOW_SHORTFALL (HIGH) must come before PENDING payment (MEDIUM)
      expect(result.items[0].type).toBe('CASH_FLOW_SHORTFALL');
      expect(result.items[0].urgency).toBe('HIGH');
      expect(result.items[1].urgency).toBe('MEDIUM');
    });
  });

  describe('resolveActionCentreItem', () => {
    it('should atomically resolve a payment case and confirm underlying activity', async () => {
      mockFindUniqueCase.mockResolvedValue({
        id: 'case-1',
        financialActivityId: 'act-1',
        financialActivity: { userId: 'user-1' }
      });

      const res = await resolveActionCentreItem('user-1', 'PAYMENT_CASE', 'case-1');

      expect(res.resolved).toBe(true);
      expect(mockUpdateCase).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: { resolutionStatus: 'RESOLVED' }
      });
      expect(mockUpdateActivity).toHaveBeenCalledWith({
        where: { id: 'act-1' },
        data: { status: ActivityStatus.CONFIRMED }
      });
    });

    it('should throw an error if resolving case for wrong user', async () => {
      mockFindUniqueCase.mockResolvedValue({
        id: 'case-1',
        financialActivityId: 'act-1',
        financialActivity: { userId: 'other-user' }
      });

      await expect(
        resolveActionCentreItem('user-1', 'PAYMENT_CASE', 'case-1')
      ).rejects.toThrow('unauthorized');
    });
  });
});
