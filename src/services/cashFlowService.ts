import prisma from '@/lib/prisma';
import {
  calculateCashFlowForecast,
  CashFlowForecastResult,
  CashFlowInputItem,
  HypotheticalScenario
} from './cashFlowCalculator';
import { ActivityStatus, ActivityType } from '@prisma/client';

import { NotFoundError, ForbiddenError } from '@/lib/errors';

export class CashFlowItemNotFoundError extends NotFoundError {
  constructor(message: string, requestId?: string) {
    super(message, requestId);
    this.name = 'CashFlowItemNotFoundError';
  }
}

export class CashFlowItemForbiddenError extends ForbiddenError {
  constructor(message: string, requestId?: string) {
    super(message, requestId);
    this.name = 'CashFlowItemForbiddenError';
  }
}

export interface CreateCashFlowItemInput {
  amount: number; // minor units (paise)
  currency?: string;
  isIncome: boolean;
  isConfirmed?: boolean;
  dueDate?: Date | null;
}

export interface UpdateCashFlowItemInput {
  amount?: number;
  isConfirmed?: boolean;
  dueDate?: Date | null;
}

export async function createCashFlowItem(
  userId: string,
  input: CreateCashFlowItemInput
) {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error('Amount must be a positive integer in minor units (paise)');
  }

  return await prisma.cashFlowItem.create({
    data: {
      userId,
      amount: input.amount,
      currency: input.currency || 'INR',
      isIncome: input.isIncome,
      isConfirmed: input.isConfirmed ?? false,
      dueDate: input.dueDate ?? null
    }
  });
}

export async function getUserCashFlowItems(userId: string) {
  return await prisma.cashFlowItem.findMany({
    where: { userId },
    orderBy: { dueDate: 'asc' }
  });
}

export async function updateCashFlowItem(
  userId: string,
  itemId: string,
  input: UpdateCashFlowItemInput
) {
  const existing = await prisma.cashFlowItem.findUnique({
    where: { id: itemId }
  });

  if (!existing) {
    throw new CashFlowItemNotFoundError(`Cash-flow item ${itemId} not found`);
  }

  if (existing.userId !== userId) {
    throw new CashFlowItemForbiddenError('User is not authorized to modify this cash-flow item');
  }

  if (input.amount !== undefined && (!Number.isInteger(input.amount) || input.amount <= 0)) {
    throw new Error('Amount must be a positive integer in minor units (paise)');
  }

  return await prisma.cashFlowItem.update({
    where: { id: itemId },
    data: {
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.isConfirmed !== undefined ? { isConfirmed: input.isConfirmed } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {})
    }
  });
}

export async function deleteCashFlowItem(userId: string, itemId: string) {
  const existing = await prisma.cashFlowItem.findUnique({
    where: { id: itemId }
  });

  if (!existing) {
    throw new CashFlowItemNotFoundError(`Cash-flow item ${itemId} not found`);
  }

  if (existing.userId !== userId) {
    throw new CashFlowItemForbiddenError('User is not authorized to delete this cash-flow item');
  }

  return await prisma.cashFlowItem.delete({
    where: { id: itemId }
  });
}

/**
 * Aggregates all persisted financial activities and cash-flow items for a user,
 * then generates a complete forecast with separation of unconfirmed receipts.
 */
export async function getUserCashFlowForecast(
  userId: string,
  options?: {
    hypotheticalScenarios?: HypotheticalScenario[];
  }
): Promise<CashFlowForecastResult> {
  // 1. Fetch confirmed financial activities (base available funds calculation)
  const confirmedActivities = await prisma.financialActivity.findMany({
    where: {
      userId,
      status: ActivityStatus.CONFIRMED
    }
  });

  const baseBalance = confirmedActivities.reduce((acc: number, act: any) => {
    return act.type === ActivityType.INCOME ? acc + act.amount : acc - act.amount;
  }, 0);

  // Guarantee non-negative scalar for calculator; if negative, treat as 0 available funds and excess as existing expense
  const availableFunds = Math.max(0, baseBalance);
  const baselineNegativeDeficit = baseBalance < 0 ? Math.abs(baseBalance) : 0;

  // 2. Fetch unconfirmed incoming activities (e.g. pending/delayed receipts from Payment Assistant)
  const unconfirmedActivities = await prisma.financialActivity.findMany({
    where: {
      userId,
      type: ActivityType.INCOME,
      status: ActivityStatus.UNCONFIRMED
    }
  });

  const unconfirmedActivityTotal = unconfirmedActivities.reduce(
    (acc: number, act: any) => acc + act.amount,
    0
  );

  // 3. Fetch user's planned cash-flow items (expenses and scheduled receipts)
  const plannedItems = await prisma.cashFlowItem.findMany({
    where: { userId }
  });

  const inputItems: CashFlowInputItem[] = plannedItems.map((item: any) => ({
    id: item.id,
    amount: item.amount,
    currency: item.currency,
    isIncome: item.isIncome,
    isConfirmed: item.isConfirmed,
    dueDate: item.dueDate
  }));

  // 4. Calculate deterministic forecast
  return calculateCashFlowForecast({
    currentAvailableFunds: availableFunds,
    unconfirmedReceipts: unconfirmedActivityTotal,
    expenses: baselineNegativeDeficit,
    items: inputItems,
    hypotheticalScenarios: options?.hypotheticalScenarios
  });
}
