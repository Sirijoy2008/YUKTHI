import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCashFlowItem,
  getUserCashFlowItems,
  updateCashFlowItem,
  deleteCashFlowItem,
  getUserCashFlowForecast,
  CashFlowItemNotFoundError,
  CashFlowItemForbiddenError
} from './cashFlowService';
import { ActivityStatus, ActivityType } from '@prisma/client';

const mockCreateItem = vi.fn();
const mockFindManyItems = vi.fn();
const mockFindUniqueItem = vi.fn();
const mockUpdateItem = vi.fn();
const mockDeleteItem = vi.fn();
const mockFindManyActivities = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    cashFlowItem: {
      create: (...args: any[]) => mockCreateItem(...args),
      findMany: (...args: any[]) => mockFindManyItems(...args),
      findUnique: (...args: any[]) => mockFindUniqueItem(...args),
      update: (...args: any[]) => mockUpdateItem(...args),
      delete: (...args: any[]) => mockDeleteItem(...args),
    },
    financialActivity: {
      findMany: (...args: any[]) => mockFindManyActivities(...args),
    },
  },
}));

describe('Cash-Flow Service (cashFlowService)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCashFlowItem', () => {
    it('should create a cash-flow item with positive integer paise amount', async () => {
      const mockItem = {
        id: 'cf-1',
        userId: 'user-1',
        amount: 800000,
        currency: 'INR',
        isIncome: false,
        isConfirmed: false,
        dueDate: new Date('2026-10-15T00:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCreateItem.mockResolvedValue(mockItem);

      const res = await createCashFlowItem('user-1', {
        amount: 800000,
        isIncome: false,
        isConfirmed: false,
        dueDate: new Date('2026-10-15T00:00:00Z')
      });

      expect(res.id).toBe('cf-1');
      expect(mockCreateItem).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          amount: 800000,
          currency: 'INR',
          isIncome: false,
          isConfirmed: false,
          dueDate: new Date('2026-10-15T00:00:00Z')
        }
      });
    });

    it('should reject non-positive or non-integer amounts', async () => {
      await expect(
        createCashFlowItem('user-1', {
          amount: -100,
          isIncome: false
        })
      ).rejects.toThrow('Amount must be a positive integer');

      await expect(
        createCashFlowItem('user-1', {
          amount: 50.5,
          isIncome: false
        })
      ).rejects.toThrow('Amount must be a positive integer');
    });
  });

  describe('getUserCashFlowItems', () => {
    it('should list items belonging to the user', async () => {
      mockFindManyItems.mockResolvedValue([{ id: 'cf-1', userId: 'user-1' }]);

      const items = await getUserCashFlowItems('user-1');
      expect(items).toHaveLength(1);
      expect(mockFindManyItems).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { dueDate: 'asc' }
      });
    });
  });

  describe('updateCashFlowItem', () => {
    const existing = {
      id: 'cf-1',
      userId: 'user-1',
      amount: 800000,
      isConfirmed: false
    };

    it('should successfully update confirmation status', async () => {
      mockFindUniqueItem.mockResolvedValue(existing);
      mockUpdateItem.mockResolvedValue({ ...existing, isConfirmed: true });

      const updated = await updateCashFlowItem('user-1', 'cf-1', { isConfirmed: true });
      expect(updated.isConfirmed).toBe(true);
      expect(mockUpdateItem).toHaveBeenCalledWith({
        where: { id: 'cf-1' },
        data: { isConfirmed: true }
      });
    });

    it('should throw CashFlowItemNotFoundError if item does not exist', async () => {
      mockFindUniqueItem.mockResolvedValue(null);

      await expect(
        updateCashFlowItem('user-1', 'nonexistent', { isConfirmed: true })
      ).rejects.toThrow(CashFlowItemNotFoundError);
    });

    it('should throw CashFlowItemForbiddenError if item belongs to different user', async () => {
      mockFindUniqueItem.mockResolvedValue(existing);

      await expect(
        updateCashFlowItem('other-user', 'cf-1', { isConfirmed: true })
      ).rejects.toThrow(CashFlowItemForbiddenError);
    });
  });

  describe('deleteCashFlowItem', () => {
    const existing = {
      id: 'cf-1',
      userId: 'user-1'
    };

    it('should delete item when owned by user', async () => {
      mockFindUniqueItem.mockResolvedValue(existing);
      mockDeleteItem.mockResolvedValue(existing);

      const deleted = await deleteCashFlowItem('user-1', 'cf-1');
      expect(deleted.id).toBe('cf-1');
      expect(mockDeleteItem).toHaveBeenCalledWith({ where: { id: 'cf-1' } });
    });

    it('should throw forbidden if wrong user', async () => {
      mockFindUniqueItem.mockResolvedValue(existing);

      await expect(deleteCashFlowItem('other-user', 'cf-1')).rejects.toThrow(
        CashFlowItemForbiddenError
      );
    });
  });

  describe('getUserCashFlowForecast', () => {
    it('should aggregate confirmed funds, unconfirmed receipts, and items accurately', async () => {
      // Confirmed activities: ₹5,000 (500000 paise)
      const mockConfirmedActivities = [
        {
          id: 'act-1',
          userId: 'user-1',
          type: ActivityType.INCOME,
          amount: 500000,
          status: ActivityStatus.CONFIRMED
        }
      ];

      // Unconfirmed activities: ₹2,000 (200000 paise)
      const mockUnconfirmedActivities = [
        {
          id: 'act-2',
          userId: 'user-1',
          type: ActivityType.INCOME,
          amount: 200000,
          status: ActivityStatus.UNCONFIRMED
        }
      ];

      mockFindManyActivities.mockImplementation(({ where }: any) => {
        if (where.status === ActivityStatus.CONFIRMED) {
          return Promise.resolve(mockConfirmedActivities);
        }
        if (where.status === ActivityStatus.UNCONFIRMED) {
          return Promise.resolve(mockUnconfirmedActivities);
        }
        return Promise.resolve([]);
      });

      // Planned items: ₹8,000 expense
      const mockPlannedItems = [
        {
          id: 'cf-1',
          userId: 'user-1',
          amount: 800000,
          currency: 'INR',
          isIncome: false,
          isConfirmed: false,
          dueDate: new Date('2026-10-15T00:00:00Z')
        }
      ];
      mockFindManyItems.mockResolvedValue(mockPlannedItems);

      const forecast = await getUserCashFlowForecast('user-1');

      // Primary forecast should show shortfall of ₹3,000
      expect(forecast.summary.confirmedAvailableFunds).toBe(500000);
      expect(forecast.summary.upcomingExpenses).toBe(800000);
      expect(forecast.summary.unconfirmedReceipts).toBe(200000);
      expect(forecast.primaryForecast.isShortfall).toBe(true);
      expect(forecast.primaryForecast.shortfallAmount).toBe(300000);

      // Conditional scenario should show shortfall of ₹1,000
      expect(forecast.conditionalScenarios.unconfirmedReceiptsCleared.shortfallAmount).toBe(
        100000
      );
    });
  });
});
