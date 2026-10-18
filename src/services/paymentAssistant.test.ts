import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPaymentCase,
  getPaymentCases,
  getPaymentCaseById,
  updatePaymentCase,
  isValidStatusTransition,
  PaymentCaseNotFoundError,
  PaymentCaseForbiddenError,
  InvalidStatusTransitionError,
  SensitiveDataError
} from './paymentAssistant';
import { ActivityStatus, ActivityType } from '@prisma/client';

const mockCreateActivity = vi.fn();
const mockFindManyCases = vi.fn();
const mockFindUniqueCase = vi.fn();
const mockUpdateCase = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    financialActivity: {
      create: (...args: any[]) => mockCreateActivity(...args),
    },
    paymentCase: {
      findMany: (...args: any[]) => mockFindManyCases(...args),
      findUnique: (...args: any[]) => mockFindUniqueCase(...args),
      update: (...args: any[]) => mockUpdateCase(...args),
    },
  },
}));

describe('Payment Assistant Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Status Transitions', () => {
    it('should validate permitted transitions from OPEN', () => {
      expect(isValidStatusTransition('OPEN', 'IN_PROGRESS')).toBe(true);
      expect(isValidStatusTransition('OPEN', 'RESOLVED')).toBe(true);
      expect(isValidStatusTransition('OPEN', 'CLOSED')).toBe(true);
      expect(isValidStatusTransition('OPEN', 'OPEN')).toBe(true);
    });

    it('should validate permitted transitions from IN_PROGRESS', () => {
      expect(isValidStatusTransition('IN_PROGRESS', 'RESOLVED')).toBe(true);
      expect(isValidStatusTransition('IN_PROGRESS', 'CLOSED')).toBe(true);
      expect(isValidStatusTransition('IN_PROGRESS', 'OPEN')).toBe(true);
    });

    it('should permit transitions from RESOLVED only to CLOSED or reopening to OPEN', () => {
      expect(isValidStatusTransition('RESOLVED', 'CLOSED')).toBe(true);
      expect(isValidStatusTransition('RESOLVED', 'OPEN')).toBe(true);
      expect(isValidStatusTransition('RESOLVED', 'IN_PROGRESS')).toBe(false);
    });

    it('should permit transitions from CLOSED only to OPEN (reopen)', () => {
      expect(isValidStatusTransition('CLOSED', 'OPEN')).toBe(true);
      expect(isValidStatusTransition('CLOSED', 'IN_PROGRESS')).toBe(false);
      expect(isValidStatusTransition('CLOSED', 'RESOLVED')).toBe(false);
    });
  });

  describe('createPaymentCase', () => {
    it('should create a payment case linked to FinancialActivity with UNCONFIRMED status for pending issue', async () => {
      const mockResult = {
        id: 'act-1',
        userId: 'user-123',
        type: ActivityType.EXPENSE,
        amount: 50000,
        currency: 'INR',
        status: ActivityStatus.UNCONFIRMED,
        date: new Date('2026-10-01T10:00:00Z'),
        referenceNumber: 'REF12345678',
        paymentCase: {
          id: 'case-1',
          financialActivityId: 'act-1',
          issueType: 'DEBITED_NOT_CREDITED',
          resolutionStatus: 'OPEN',
          nextActionDate: null,
          createdAt: new Date('2026-10-01T10:00:00Z'),
          updatedAt: new Date('2026-10-01T10:00:00Z'),
        }
      };

      mockCreateActivity.mockResolvedValue(mockResult);

      const res = await createPaymentCase('user-123', {
        issueType: 'DEBITED_NOT_CREDITED',
        amount: 50000,
        date: new Date('2026-10-01T10:00:00Z'),
        referenceNumber: 'REF12345678'
      });

      expect(mockCreateActivity).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          type: ActivityType.EXPENSE,
          amount: 50000,
          currency: 'INR',
          status: ActivityStatus.UNCONFIRMED,
          referenceNumber: 'REF12345678',
          paymentCase: {
            create: {
              issueType: 'DEBITED_NOT_CREDITED',
              resolutionStatus: 'OPEN',
              nextActionDate: null,
            }
          }
        }),
        include: { paymentCase: true }
      });

      expect(res.case.id).toBe('case-1');
      expect(res.verification.isIndependentlyVerified).toBe(false);
      expect(res.guidance.title).toBe('Amount Debited but Recipient Not Credited');
      expect(res.disclaimer).toBeDefined();
    });

    it('should set FinancialActivity status to FAILED when issueType is FAILED', async () => {
      const mockResult = {
        id: 'act-2',
        userId: 'user-123',
        type: ActivityType.EXPENSE,
        amount: 25000,
        currency: 'INR',
        status: ActivityStatus.FAILED,
        date: new Date(),
        referenceNumber: null,
        paymentCase: {
          id: 'case-2',
          financialActivityId: 'act-2',
          issueType: 'FAILED',
          resolutionStatus: 'OPEN',
          nextActionDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      };

      mockCreateActivity.mockResolvedValue(mockResult);

      await createPaymentCase('user-123', {
        issueType: 'FAILED',
        amount: 25000,
        date: new Date()
      });

      expect(mockCreateActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ActivityStatus.FAILED
          })
        })
      );
    });

    it('should reject negative or zero amounts', async () => {
      await expect(
        createPaymentCase('user-123', {
          issueType: 'FAILED',
          amount: -500,
          date: new Date()
        })
      ).rejects.toThrow('Amount must be a positive integer in minor units (paise)');

      await expect(
        createPaymentCase('user-123', {
          issueType: 'FAILED',
          amount: 0,
          date: new Date()
        })
      ).rejects.toThrow('Amount must be a positive integer in minor units (paise)');
    });

    it('should reject reference numbers containing sensitive credentials', async () => {
      await expect(
        createPaymentCase('user-123', {
          issueType: 'PENDING',
          amount: 1000,
          date: new Date(),
          referenceNumber: 'My banking PIN is 4455'
        })
      ).rejects.toThrow(SensitiveDataError);
    });
  });

  describe('getPaymentCases', () => {
    it('should fetch payment cases belonging to the user', async () => {
      const mockCases = [
        {
          id: 'case-1',
          financialActivityId: 'act-1',
          issueType: 'DELAYED',
          resolutionStatus: 'OPEN',
          nextActionDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          financialActivity: {
            id: 'act-1',
            userId: 'user-123',
            type: ActivityType.EXPENSE,
            amount: 10000,
            currency: 'INR',
            status: ActivityStatus.UNCONFIRMED,
            date: new Date(),
            referenceNumber: null,
          }
        }
      ];

      mockFindManyCases.mockResolvedValue(mockCases);

      const cases = await getPaymentCases('user-123');
      expect(cases).toHaveLength(1);
      expect(cases[0].case.id).toBe('case-1');
      expect(mockFindManyCases).toHaveBeenCalledWith({
        where: { financialActivity: { userId: 'user-123' } },
        include: { financialActivity: true },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('getPaymentCaseById', () => {
    it('should return case when owned by user', async () => {
      const mockCase = {
        id: 'case-1',
        financialActivityId: 'act-1',
        issueType: 'PENDING',
        resolutionStatus: 'OPEN',
        nextActionDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        financialActivity: {
          id: 'act-1',
          userId: 'user-123',
          type: ActivityType.EXPENSE,
          amount: 10000,
          currency: 'INR',
          status: ActivityStatus.UNCONFIRMED,
          date: new Date(),
          referenceNumber: null,
        }
      };

      mockFindUniqueCase.mockResolvedValue(mockCase);

      const res = await getPaymentCaseById('user-123', 'case-1');
      expect(res.case.id).toBe('case-1');
      expect(res.guidance.title).toBe('Payment Pending');
    });

    it('should throw PaymentCaseNotFoundError if case does not exist', async () => {
      mockFindUniqueCase.mockResolvedValue(null);

      await expect(getPaymentCaseById('user-123', 'non-existent')).rejects.toThrow(
        PaymentCaseNotFoundError
      );
    });

    it('should throw PaymentCaseForbiddenError if case belongs to different user', async () => {
      const mockCase = {
        id: 'case-1',
        financialActivityId: 'act-1',
        issueType: 'PENDING',
        resolutionStatus: 'OPEN',
        nextActionDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        financialActivity: {
          id: 'act-1',
          userId: 'other-user',
          type: ActivityType.EXPENSE,
          amount: 10000,
          currency: 'INR',
          status: ActivityStatus.UNCONFIRMED,
          date: new Date(),
          referenceNumber: null,
        }
      };

      mockFindUniqueCase.mockResolvedValue(mockCase);

      await expect(getPaymentCaseById('user-123', 'case-1')).rejects.toThrow(
        PaymentCaseForbiddenError
      );
    });
  });

  describe('updatePaymentCase', () => {
    const existingCase = {
      id: 'case-1',
      financialActivityId: 'act-1',
      issueType: 'DEBITED_NOT_CREDITED',
      resolutionStatus: 'OPEN',
      nextActionDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      financialActivity: {
        id: 'act-1',
        userId: 'user-123',
        type: ActivityType.EXPENSE,
        amount: 50000,
        currency: 'INR',
        status: ActivityStatus.UNCONFIRMED,
        date: new Date(),
        referenceNumber: null,
      }
    };

    it('should successfully update status from OPEN to IN_PROGRESS', async () => {
      mockFindUniqueCase.mockResolvedValue(existingCase);
      mockUpdateCase.mockResolvedValue({
        ...existingCase,
        resolutionStatus: 'IN_PROGRESS',
        updatedAt: new Date(),
      });

      const res = await updatePaymentCase('user-123', 'case-1', {
        resolutionStatus: 'IN_PROGRESS'
      });

      expect(res.case.resolutionStatus).toBe('IN_PROGRESS');
      expect(mockUpdateCase).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: expect.objectContaining({
          resolutionStatus: 'IN_PROGRESS'
        }),
        include: { financialActivity: true }
      });
    });

    it('should update financialActivity status to CONFIRMED when resolved', async () => {
      mockFindUniqueCase.mockResolvedValue(existingCase);
      mockUpdateCase.mockResolvedValue({
        ...existingCase,
        resolutionStatus: 'RESOLVED',
        financialActivity: {
          ...existingCase.financialActivity,
          status: ActivityStatus.CONFIRMED,
        }
      });

      const res = await updatePaymentCase('user-123', 'case-1', {
        resolutionStatus: 'RESOLVED'
      });

      expect(res.case.resolutionStatus).toBe('RESOLVED');
      expect(mockUpdateCase).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: expect.objectContaining({
          resolutionStatus: 'RESOLVED',
          financialActivity: {
            update: {
              status: ActivityStatus.CONFIRMED
            }
          }
        }),
        include: { financialActivity: true }
      });
    });

    it('should reject invalid status transition', async () => {
      const closedCase = {
        ...existingCase,
        resolutionStatus: 'CLOSED'
      };
      mockFindUniqueCase.mockResolvedValue(closedCase);

      await expect(
        updatePaymentCase('user-123', 'case-1', {
          resolutionStatus: 'RESOLVED'
        })
      ).rejects.toThrow(InvalidStatusTransitionError);
    });

    it('should reject updating with sensitive referenceNumber', async () => {
      mockFindUniqueCase.mockResolvedValue(existingCase);

      await expect(
        updatePaymentCase('user-123', 'case-1', {
          referenceNumber: 'secret-otp-654321'
        })
      ).rejects.toThrow(SensitiveDataError);
    });

    it('should throw forbidden if different user attempts update', async () => {
      mockFindUniqueCase.mockResolvedValue(existingCase);

      await expect(
        updatePaymentCase('malicious-user', 'case-1', {
          resolutionStatus: 'IN_PROGRESS'
        })
      ).rejects.toThrow(PaymentCaseForbiddenError);
    });
  });
});
