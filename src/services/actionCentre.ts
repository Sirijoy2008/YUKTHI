import prisma from '@/lib/prisma';
import { formatCurrencyPaise } from './cashFlowCalculator';
import { getUserCashFlowForecast } from './cashFlowService';
import { updateFinancialActivityStatus } from './financialActivity';
import { updateCashFlowItem } from './cashFlowService';
import { getPaymentGuidance, PaymentIssueType } from './paymentGuidance';
import { ActivityStatus } from '@prisma/client';

export type ActionItemUrgency = 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionItemType =
  | 'PAYMENT_FOLLOW_UP'
  | 'CASH_FLOW_SHORTFALL'
  | 'UNCONFIRMED_RECEIPT'
  | 'SCAM_ALERT';

export interface ActionItem {
  id: string;
  type: ActionItemType;
  title: string;
  description: string;
  urgency: ActionItemUrgency;
  status: 'PENDING' | 'RESOLVED';
  targetDate: string | null;
  sourceEntity: {
    entityType: 'PAYMENT_CASE' | 'FINANCIAL_ACTIVITY' | 'CASH_FLOW' | 'RISK_ASSESSMENT';
    entityId: string;
  };
  actionPrompt: string;
  metadata?: Record<string, any>;
}

export interface ActionCentreResponse {
  summary: {
    totalActions: number;
    highUrgencyCount: number;
    mediumUrgencyCount: number;
    lowUrgencyCount: number;
  };
  items: ActionItem[];
  disclaimer: string;
}

export const ACTION_CENTRE_DISCLAIMER =
  'The Action Centre prioritizes user-reported follow-ups and cash-flow projections. YUKTHI does not automatically verify bank records, execute reversals, or guarantee financial outcomes.';

export async function getActionCentreItems(userId: string): Promise<ActionCentreResponse> {
  const items: ActionItem[] = [];

  // 1. Fetch unresolved payment cases (OPEN or IN_PROGRESS)
  const unresolvedCases = await prisma.paymentCase.findMany({
    where: {
      financialActivity: { userId },
      resolutionStatus: { in: ['OPEN', 'IN_PROGRESS'] }
    },
    include: { financialActivity: true }
  });

  const now = new Date();

  for (const pc of unresolvedCases) {
    const isPastDue = pc.nextActionDate && new Date(pc.nextActionDate) <= now;
    const isCriticalIssue =
      pc.issueType === 'FAILED' || pc.issueType === 'DEBITED_NOT_CREDITED';

    const urgency: ActionItemUrgency = isPastDue || isCriticalIssue ? 'HIGH' : 'MEDIUM';

    const guidance = getPaymentGuidance(pc.issueType as PaymentIssueType);
    const recommendedStep =
      guidance.recommendedActions[0] || 'Contact remitting bank with transaction reference';

    const formattedAmount = formatCurrencyPaise(pc.financialActivity.amount);

    items.push({
      id: `action-pc-${pc.id}`,
      type: 'PAYMENT_FOLLOW_UP',
      title: `Follow up on ${pc.issueType.replace(/_/g, ' ').toLowerCase()} payment (${formattedAmount})`,
      description: `Payment of ${formattedAmount} marked as ${pc.issueType} is currently ${pc.resolutionStatus}.`,
      urgency,
      status: 'PENDING',
      targetDate: pc.nextActionDate ? new Date(pc.nextActionDate).toISOString() : null,
      sourceEntity: {
        entityType: 'PAYMENT_CASE',
        entityId: pc.id
      },
      actionPrompt: pc.financialActivity.referenceNumber
        ? `${recommendedStep} (Ref: ${pc.financialActivity.referenceNumber})`
        : recommendedStep,
      metadata: {
        amount: pc.financialActivity.amount,
        currency: pc.financialActivity.currency,
        issueType: pc.issueType,
        resolutionStatus: pc.resolutionStatus,
        referenceNumber: pc.financialActivity.referenceNumber
      }
    });
  }

  // 2. Fetch unconfirmed income activities WITHOUT a payment case to avoid duplicate entries
  const unconfirmedActivities = await prisma.financialActivity.findMany({
    where: {
      userId,
      type: 'INCOME',
      status: ActivityStatus.UNCONFIRMED,
      paymentCase: null
    }
  });

  for (const act of unconfirmedActivities) {
    const formattedAmount = formatCurrencyPaise(act.amount);
    items.push({
      id: `action-fa-${act.id}`,
      type: 'UNCONFIRMED_RECEIPT',
      title: `Confirm incoming receipt (${formattedAmount})`,
      description: `Expected incoming payment of ${formattedAmount} is unconfirmed and excluded from primary available funds.`,
      urgency: 'MEDIUM',
      status: 'PENDING',
      targetDate: act.date ? new Date(act.date).toISOString() : null,
      sourceEntity: {
        entityType: 'FINANCIAL_ACTIVITY',
        entityId: act.id
      },
      actionPrompt: 'Verify bank deposit and mark as Confirmed to include in available cash flow',
      metadata: {
        amount: act.amount,
        currency: act.currency,
        referenceNumber: act.referenceNumber
      }
    });
  }

  // 3. Evaluate cash flow forecast for impending shortfall
  try {
    const forecast = await getUserCashFlowForecast(userId);
    if (forecast.primaryForecast.isShortfall) {
      const shortfallStr = formatCurrencyPaise(forecast.primaryForecast.shortfallAmount);
      items.push({
        id: `action-cf-shortfall-${userId}`,
        type: 'CASH_FLOW_SHORTFALL',
        title: `Impending cash-flow shortfall (${shortfallStr})`,
        description: `Upcoming budgeted expenses exceed current confirmed liquid funds by ${shortfallStr}.`,
        urgency: 'HIGH',
        status: 'PENDING',
        targetDate: null,
        sourceEntity: {
          entityType: 'CASH_FLOW',
          entityId: userId
        },
        actionPrompt: 'Review upcoming expenses or confirm pending receipts to balance your cash flow',
        metadata: {
          shortfallAmount: forecast.primaryForecast.shortfallAmount,
          upcomingExpenses: forecast.summary.upcomingExpenses,
          totalConfirmedLiquid: forecast.summary.totalConfirmedLiquid
        }
      });
    }
  } catch (error) {
    // Non-fatal if user has no cash flow data yet
  }

  // 4. Fetch recent High Risk scam assessments for the user
  const highRiskScams = await prisma.riskAssessment.findMany({
    where: {
      riskLevel: 'HIGH',
      financialActivity: { userId }
    },
    take: 3
  });

  for (const scam of highRiskScams) {
    items.push({
      id: `action-scam-${scam.id}`,
      type: 'SCAM_ALERT',
      title: 'High-risk payment security alert',
      description: 'A recent payment communication triggered high-risk indicators.',
      urgency: 'HIGH',
      status: 'PENDING',
      targetDate: scam.createdAt ? new Date(scam.createdAt).toISOString() : null,
      sourceEntity: {
        entityType: 'RISK_ASSESSMENT',
        entityId: scam.id
      },
      actionPrompt: 'Never share OTPs, UPI PINs, or click unverified links',
      metadata: {
        indicatorsFound: scam.indicatorsFound,
        riskLevel: scam.riskLevel
      }
    });
  }

  // Priority sorting: HIGH urgency first, then MEDIUM, then LOW
  const urgencyWeight: Record<ActionItemUrgency, number> = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  };

  items.sort((a, b) => {
    const weightDiff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    if (weightDiff !== 0) return weightDiff;
    // Secondary sort: targetDate ascending
    if (a.targetDate && b.targetDate) {
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    }
    return 0;
  });

  const highUrgencyCount = items.filter((i) => i.urgency === 'HIGH').length;
  const mediumUrgencyCount = items.filter((i) => i.urgency === 'MEDIUM').length;
  const lowUrgencyCount = items.filter((i) => i.urgency === 'LOW').length;

  return {
    summary: {
      totalActions: items.length,
      highUrgencyCount,
      mediumUrgencyCount,
      lowUrgencyCount
    },
    items,
    disclaimer: ACTION_CENTRE_DISCLAIMER
  };
}

export async function resolveActionCentreItem(
  userId: string,
  entityType: string,
  entityId: string
) {
  const now = new Date().toISOString();

  if (entityType === 'PAYMENT_CASE') {
    // Atomically resolve payment case and confirm underlying financial activity
    const paymentCase = await prisma.paymentCase.findUnique({
      where: { id: entityId },
      include: { financialActivity: true }
    });

    if (!paymentCase || paymentCase.financialActivity.userId !== userId) {
      throw new Error('Payment case not found or unauthorized');
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.paymentCase.update({
        where: { id: entityId },
        data: { resolutionStatus: 'RESOLVED' }
      });
      await tx.financialActivity.update({
        where: { id: paymentCase.financialActivityId },
        data: { status: ActivityStatus.CONFIRMED }
      });
    });

    return {
      entityType,
      entityId,
      resolved: true,
      updatedAt: now
    };
  }

  if (entityType === 'FINANCIAL_ACTIVITY') {
    // Confirm financial activity and cascade to payment case if linked
    await updateFinancialActivityStatus(userId, entityId, ActivityStatus.CONFIRMED);

    return {
      entityType,
      entityId,
      resolved: true,
      updatedAt: now
    };
  }

  if (entityType === 'CASH_FLOW') {
    // If it's a specific cash flow item, confirm it
    if (entityId !== userId) {
      await updateCashFlowItem(userId, entityId, { isConfirmed: true });
    }
    return {
      entityType,
      entityId,
      resolved: true,
      updatedAt: now
    };
  }

  return {
    entityType,
    entityId,
    resolved: true,
    updatedAt: now
  };
}
