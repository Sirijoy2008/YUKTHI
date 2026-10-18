import prisma from '@/lib/prisma';
import { ActivityType, ActivityStatus } from '@prisma/client';

import { NotFoundError, ForbiddenError } from '@/lib/errors';

export class FinancialActivityNotFoundError extends NotFoundError {
  constructor(message: string, requestId?: string) {
    super(message, requestId);
    this.name = 'FinancialActivityNotFoundError';
  }
}

export class FinancialActivityForbiddenError extends ForbiddenError {
  constructor(message: string, requestId?: string) {
    super(message, requestId);
    this.name = 'FinancialActivityForbiddenError';
  }
}

export interface CreateFinancialActivityInput {
  userId: string;
  type: ActivityType;
  amount: number;
  status: ActivityStatus;
  date: Date;
  currency?: string;
  referenceNumber?: string | null;
  issueType?: string; // Optional linked payment issue (e.g. DELAYED)
}

export async function getFinancialActivities(userId: string) {
  return await prisma.financialActivity.findMany({
    where: { userId },
    include: {
      paymentCase: true,
      riskAssessment: true
    },
    orderBy: { date: 'desc' }
  });
}

export async function createFinancialActivity(data: CreateFinancialActivityInput) {
  if (!Number.isInteger(data.amount) || data.amount <= 0) {
    throw new Error('Amount must be a positive integer in minor units (paise)');
  }

  // Idempotency / Retry prevention: if matching referenceNumber exists for this user, reuse it
  if (data.referenceNumber && data.referenceNumber.trim() !== '') {
    const existing = await prisma.financialActivity.findFirst({
      where: {
        userId: data.userId,
        referenceNumber: data.referenceNumber.trim()
      },
      include: {
        paymentCase: true,
        riskAssessment: true
      }
    });

    if (existing) {
      return existing;
    }
  }

  return await prisma.financialActivity.create({
    data: {
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      currency: data.currency || 'INR',
      status: data.status,
      date: data.date,
      referenceNumber: data.referenceNumber ? data.referenceNumber.trim() : null,
      ...(data.issueType
        ? {
            paymentCase: {
              create: {
                issueType: data.issueType,
                resolutionStatus: data.status === ActivityStatus.CONFIRMED ? 'RESOLVED' : 'OPEN'
              }
            }
          }
        : {})
    },
    include: {
      paymentCase: true,
      riskAssessment: true
    }
  });
}

export async function updateFinancialActivityStatus(
  userId: string,
  activityId: string,
  newStatus: ActivityStatus
) {
  const existing = await prisma.financialActivity.findUnique({
    where: { id: activityId },
    include: { paymentCase: true }
  });

  if (!existing) {
    throw new FinancialActivityNotFoundError(`Financial activity ${activityId} not found`);
  }

  if (existing.userId !== userId) {
    throw new FinancialActivityForbiddenError(
      'User is not authorized to update this financial activity'
    );
  }

  // Atomic state synchronization: update FinancialActivity and cascade to PaymentCase
  const cascadeResolutionStatus =
    newStatus === ActivityStatus.CONFIRMED
      ? 'RESOLVED'
      : newStatus === ActivityStatus.FAILED
      ? 'CLOSED'
      : 'OPEN';

  // Use transaction to ensure both records are updated atomically
  const result = await prisma.$transaction(async (tx: any) => {
    if (existing.paymentCase) {
      await tx.paymentCase.update({
        where: { id: existing.paymentCase.id },
        data: { resolutionStatus: cascadeResolutionStatus }
      });
    }

    return await tx.financialActivity.update({
      where: { id: activityId },
      data: { status: newStatus },
      include: {
        paymentCase: true,
        riskAssessment: true
      }
    });
  });

  return result;
}

export async function getAvailableFunds(userId: string): Promise<number> {
  const activities = await prisma.financialActivity.findMany({
    where: {
      userId,
      status: 'CONFIRMED'
    }
  });

  return activities.reduce((total: number, activity: any) => {
    return activity.type === 'INCOME'
      ? total + activity.amount
      : total - activity.amount;
  }, 0);
}

export async function getUnconfirmedIncome(userId: string): Promise<number> {
  const activities = await prisma.financialActivity.findMany({
    where: {
      userId,
      type: 'INCOME',
      status: 'UNCONFIRMED'
    }
  });

  return activities.reduce((total: number, activity: any) => total + activity.amount, 0);
}
