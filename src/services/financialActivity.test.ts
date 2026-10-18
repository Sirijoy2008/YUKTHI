import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAvailableFunds,
  createFinancialActivity,
  getFinancialActivities,
  updateFinancialActivityStatus,
  FinancialActivityNotFoundError,
  FinancialActivityForbiddenError
} from './financialActivity';
import { ActivityStatus, ActivityType } from '@prisma/client';

const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
const mockUpdateActivity = vi.fn();
const mockUpdatePaymentCase = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    financialActivity: {
      findMany: (...args: any[]) => mockFindMany(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
      findFirst: (...args: any[]) => mockFindFirst(...args),
      create: (...args: any[]) => mockCreate(...args),
      update: (...args: any[]) => mockUpdateActivity(...args),
    },
    paymentCase: {
      update: (...args: any[]) => mockUpdatePaymentCase(...args),
    },
    $transaction: (cb: any) =>
      cb({
        financialActivity: { update: (...args: any[]) => mockUpdateActivity(...args) },
        paymentCase: { update: (...args: any[]) => mockUpdatePaymentCase(...args) },
      }),
  },
}));

describe('Financial Activity Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailableFunds', () => {
    it('should calculate available funds correctly, ignoring unconfirmed items', async () => {
      const mockActivities = [
        { id: '1', userId: 'user-1', type: ActivityType.INCOME, amount: 500000, status: ActivityStatus.CONFIRMED },
        { id: '2', userId: 'user-1', type: ActivityType.EXPENSE, amount: 200000, status: ActivityStatus.CONFIRMED },
        { id: '3', userId: 'user-1', type: ActivityType.INCOME, amount: 300000, status: ActivityStatus.UNCONFIRMED },
      ];

      mockFindMany.mockResolvedValue(
        mockActivities.filter((a) => a.status === 'CONFIRMED')
      );

      const funds = await getAvailableFunds('user-1');
      expect(funds).toBe(300000);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'CONFIRMED' }
      });
    });
  });

  describe('createFinancialActivity', () => {
    it('should throw an error if amount is negative or non-integer', async () => {
      await expect(
        createFinancialActivity({
          userId: 'user-1',
          type: ActivityType.INCOME,
          amount: -100,
          status: ActivityStatus.CONFIRMED,
          date: new Date()
        })
      ).rejects.toThrow('Amount must be a positive integer in minor units (paise)');
    });

    it('should return existing record when same referenceNumber is retried (idempotency)', async () => {
      const existing = {
        id: 'existing-act',
        userId: 'user-1',
        amount: 500000,
        referenceNumber: 'UTR-123456789'
      };

      mockFindFirst.mockResolvedValue(existing);

      const res = await createFinancialActivity({
        userId: 'user-1',
        type: ActivityType.EXPENSE,
        amount: 500000,
        status: ActivityStatus.UNCONFIRMED,
        date: new Date(),
        referenceNumber: 'UTR-123456789'
      });

      expect(res.id).toBe('existing-act');
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('getFinancialActivities', () => {
    it('should list activities with relations ordered by date desc', async () => {
      mockFindMany.mockResolvedValue([{ id: 'act-1' }]);

      const res = await getFinancialActivities('user-1');
      expect(res).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { paymentCase: true, riskAssessment: true },
        orderBy: { date: 'desc' }
      });
    });
  });

  describe('updateFinancialActivityStatus', () => {
    it('should atomically cascade status to PaymentCase (RESOLVED on CONFIRMED)', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'act-1',
        userId: 'user-1',
        status: ActivityStatus.UNCONFIRMED,
        paymentCase: { id: 'case-1', resolutionStatus: 'OPEN' }
      });

      mockUpdateActivity.mockResolvedValue({
        id: 'act-1',
        status: ActivityStatus.CONFIRMED,
        paymentCase: { id: 'case-1', resolutionStatus: 'RESOLVED' }
      });

      const res = await updateFinancialActivityStatus('user-1', 'act-1', ActivityStatus.CONFIRMED);

      expect(res.status).toBe(ActivityStatus.CONFIRMED);
      expect(mockUpdatePaymentCase).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: { resolutionStatus: 'RESOLVED' }
      });
    });

    it('should throw not found if activity does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        updateFinancialActivityStatus('user-1', 'missing', ActivityStatus.CONFIRMED)
      ).rejects.toThrow(FinancialActivityNotFoundError);
    });

    it('should throw forbidden if wrong user', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'act-1',
        userId: 'other-user'
      });

      await expect(
        updateFinancialActivityStatus('user-1', 'act-1', ActivityStatus.CONFIRMED)
      ).rejects.toThrow(FinancialActivityForbiddenError);
    });
  });
});
