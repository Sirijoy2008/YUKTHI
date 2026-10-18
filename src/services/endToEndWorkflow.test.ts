import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPaymentCase } from './paymentAssistant';
import { calculateCashFlowForecast } from './cashFlowCalculator';
import { getPaymentGuidance } from './paymentGuidance';
import { getActionCentreItems, resolveActionCentreItem } from './actionCentre';
import { updateFinancialActivityStatus } from './financialActivity';
import { ActivityStatus, ActivityType } from '@prisma/client';

// Simulated database state for the end-to-end workflow test
let state = {
  financialActivities: [] as any[],
  paymentCases: [] as any[],
  cashFlowItems: [] as any[],
  riskAssessments: [] as any[],
};

vi.mock('@/lib/prisma', () => ({
  default: {
    financialActivity: {
      create: vi.fn((args) => {
        const id = `act-${state.financialActivities.length + 1}`;
        const act = {
          id,
          userId: args.data.userId,
          type: args.data.type,
          amount: args.data.amount,
          currency: args.data.currency,
          status: args.data.status,
          date: args.data.date,
          referenceNumber: args.data.referenceNumber,
          createdAt: new Date(),
          updatedAt: new Date(),
          paymentCase: null as any,
          riskAssessment: null as any
        };

        if (args.data.paymentCase?.create) {
          const pcId = `case-${state.paymentCases.length + 1}`;
          const pc = {
            id: pcId,
            financialActivityId: id,
            issueType: args.data.paymentCase.create.issueType,
            resolutionStatus: args.data.paymentCase.create.resolutionStatus,
            nextActionDate: args.data.paymentCase.create.nextActionDate,
            createdAt: new Date(),
            updatedAt: new Date(),
            financialActivity: act
          };
          state.paymentCases.push(pc);
          act.paymentCase = pc;
        }

        state.financialActivities.push(act);
        return Promise.resolve(act);
      }),
      findMany: vi.fn((args) => {
        return Promise.resolve(
          state.financialActivities.filter((a) => {
            if (args.where?.userId && a.userId !== args.where.userId) return false;
            if (args.where?.status && a.status !== args.where.status) return false;
            if (args.where?.type && a.type !== args.where.type) return false;
            if (args.where?.paymentCase === null && a.paymentCase !== null) return false;
            return true;
          })
        );
      }),
      findUnique: vi.fn((args) => {
        const act = state.financialActivities.find((a) => a.id === args.where.id);
        return Promise.resolve(act || null);
      }),
      findFirst: vi.fn((args) => {
        const act = state.financialActivities.find(
          (a) => a.userId === args.where.userId && a.referenceNumber === args.where.referenceNumber
        );
        return Promise.resolve(act || null);
      }),
      update: vi.fn((args) => {
        const act = state.financialActivities.find((a) => a.id === args.where.id);
        if (act) {
          if (args.data.status) act.status = args.data.status;
          act.updatedAt = new Date();
        }
        return Promise.resolve(act);
      }),
    },
    paymentCase: {
      findMany: vi.fn((args) => {
        return Promise.resolve(
          state.paymentCases.filter((p) => {
            if (args.where?.financialActivity?.userId && p.financialActivity.userId !== args.where.financialActivity.userId) return false;
            if (args.where?.resolutionStatus?.in && !args.where.resolutionStatus.in.includes(p.resolutionStatus)) return false;
            return true;
          })
        );
      }),
      findUnique: vi.fn((args) => {
        const pc = state.paymentCases.find((p) => p.id === args.where.id);
        return Promise.resolve(pc || null);
      }),
      update: vi.fn((args) => {
        const pc = state.paymentCases.find((p) => p.id === args.where.id);
        if (pc) {
          if (args.data.resolutionStatus) pc.resolutionStatus = args.data.resolutionStatus;
          pc.updatedAt = new Date();
        }
        return Promise.resolve(pc);
      }),
    },
    cashFlowItem: {
      findMany: vi.fn((args) => {
        return Promise.resolve(state.cashFlowItems.filter((i) => i.userId === args.where.userId));
      }),
      update: vi.fn(),
    },
    riskAssessment: {
      findMany: vi.fn(() => Promise.resolve([])),
    },
    $transaction: vi.fn((cb) => cb({
      paymentCase: {
        update: vi.fn((args) => {
          const pc = state.paymentCases.find((p) => p.id === args.where.id);
          if (pc) pc.resolutionStatus = args.data.resolutionStatus;
          return Promise.resolve(pc);
        })
      },
      financialActivity: {
        update: vi.fn((args) => {
          const act = state.financialActivities.find((a) => a.id === args.where.id);
          if (act) act.status = args.data.status;
          return Promise.resolve(act);
        })
      }
    })),
  },
}));

describe('Phase 6 End-to-End Workflow Integration Test', () => {
  const userId = 'fintech-user-100';

  beforeEach(() => {
    state = {
      financialActivities: [],
      paymentCases: [],
      cashFlowItems: [],
      riskAssessments: [],
    };
    vi.clearAllMocks();
  });

  it('verifies the full delayed-payment-to-cash-flow and action-centre lifecycle', async () => {
    // PRECONDITION: User has ₹5,000 available funds and ₹8,000 upcoming expenses
    // 1. User records a delayed incoming payment of ₹2,000 (200000 paise) via Payment Assistant
    const paymentCaseCreation = await createPaymentCase(userId, {
      type: ActivityType.INCOME,
      amount: 200000, // ₹2,000
      issueType: 'DELAYED',
      date: new Date('2026-10-09T10:00:00Z'),
      referenceNumber: 'UTR-DELAYED-9988'
    });

    // 2. FINOVA creates the associated financial activity with status UNCONFIRMED
    expect(paymentCaseCreation.case.issueType).toBe('DELAYED');
    expect(paymentCaseCreation.case.resolutionStatus).toBe('OPEN');
    expect(paymentCaseCreation.case.financialActivity.status).toBe(ActivityStatus.UNCONFIRMED);
    expect(paymentCaseCreation.case.financialActivity.amount).toBe(200000);

    // 3. Payment Assistant provides status-appropriate follow-up guidance
    const guidance = getPaymentGuidance('DELAYED');
    expect(guidance.title).toBe('Payment Delayed');
    expect(guidance.expectedTimeline).toContain('NEFT');
    expect(paymentCaseCreation.guidance.title).toBe('Payment Delayed');

    // 4. Cash-Flow Planner reflects the unresolved receipt as uncertain:
    // Base available ₹5,000, upcoming expenses ₹8,000, unconfirmed receipts ₹2,000
    const initialForecast = calculateCashFlowForecast({
      currentAvailableFunds: 500000, // ₹5,000
      unconfirmedReceipts: 200000, // ₹2,000 (from delayed payment case)
      expenses: 800000 // ₹8,000 upcoming expenses
    });

    // Primary forecast MUST strictly show a ₹3,000 shortfall
    expect(initialForecast.primaryForecast.isShortfall).toBe(true);
    expect(initialForecast.primaryForecast.shortfallAmount).toBe(300000); // ₹3,000
    expect(initialForecast.summary.unconfirmedReceipts).toBe(200000);

    // Conditional scenario shows a ₹1,000 shortfall if that receipt clears
    expect(initialForecast.conditionalScenarios.unconfirmedReceiptsCleared.isShortfall).toBe(true);
    expect(initialForecast.conditionalScenarios.unconfirmedReceiptsCleared.shortfallAmount).toBe(
      100000
    ); // ₹1,000

    // 5. The Action Centre displays the follow-up action and current status
    const actionCentreInitial = await getActionCentreItems(userId);
    expect(actionCentreInitial.summary.totalActions).toBeGreaterThanOrEqual(1);

    const followUpAction = actionCentreInitial.items.find(
      (i) => i.type === 'PAYMENT_FOLLOW_UP' && i.sourceEntity.entityId === paymentCaseCreation.case.id
    );
    expect(followUpAction).toBeDefined();
    expect(followUpAction?.status).toBe('PENDING');
    expect(followUpAction?.actionPrompt).toContain('UTR-DELAYED-9988');

    // 6. When the receipt is confirmed and available:
    // User updates or resolves the action
    const resolvedResult = await resolveActionCentreItem(
      userId,
      'PAYMENT_CASE',
      paymentCaseCreation.case.id
    );
    expect(resolvedResult.resolved).toBe(true);

    // Verify atomic state update: PaymentCase is RESOLVED and FinancialActivity is CONFIRMED
    const updatedCase = state.paymentCases.find((p) => p.id === paymentCaseCreation.case.id);
    const updatedActivity = state.financialActivities.find(
      (a) => a.id === paymentCaseCreation.case.financialActivityId
    );
    expect(updatedCase?.resolutionStatus).toBe('RESOLVED');
    expect(updatedActivity?.status).toBe(ActivityStatus.CONFIRMED);

    // 7. Cash-Flow Planner recalculates with the confirmed funds in primary available funds
    const updatedForecast = calculateCashFlowForecast({
      currentAvailableFunds: 500000, // ₹5,000
      confirmedIncome: 200000, // ₹2,000 now confirmed!
      unconfirmedReceipts: 0,
      expenses: 800000 // ₹8,000
    });

    // Primary forecast now updates to a ₹1,000 shortfall!
    expect(updatedForecast.summary.totalConfirmedLiquid).toBe(700000);
    expect(updatedForecast.primaryForecast.netAmount).toBe(-100000);
    expect(updatedForecast.primaryForecast.shortfallAmount).toBe(100000);

    // 8. Action Centre reflects the resolved state (payment follow-up is cleared from active list)
    const actionCentreUpdated = await getActionCentreItems(userId);
    const pendingPaymentActions = actionCentreUpdated.items.filter(
      (i) => i.type === 'PAYMENT_FOLLOW_UP' && i.sourceEntity.entityId === paymentCaseCreation.case.id
    );
    expect(pendingPaymentActions).toHaveLength(0);
  });
});
