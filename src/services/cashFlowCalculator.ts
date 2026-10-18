/**
 * Domain Service: Pure Cash-Flow Calculation Engine
 * 
 * Implements deterministic cash-flow projections adhering strictly to:
 * 1. Strict separation of confirmed liquid funds from unconfirmed receipts.
 * 2. Unconfirmed receipts are NEVER included in the primary forecast.
 * 3. Conditional scenarios show what-if impacts if unconfirmed receipts clear.
 * 4. User-provided hypotheticals remain distinct categories.
 * 5. All monetary calculations are performed in minor integer units (paise for INR).
 */

export interface CashFlowInputItem {
  id?: string;
  amount: number; // minor units (paise)
  currency?: string;
  isIncome: boolean;
  isConfirmed: boolean;
  dueDate?: Date | string | null;
}

export interface HypotheticalScenario {
  name: string;
  additionalIncome?: number; // minor units (paise)
  additionalExpense?: number; // minor units (paise)
}

export interface CalculateCashFlowParams {
  currentAvailableFunds?: number; // Base confirmed liquid balance (paise)
  confirmedIncome?: number; // Explicit confirmed incoming funds (paise)
  unconfirmedReceipts?: number; // Explicit unconfirmed receipts (paise)
  expenses?: number; // Explicit upcoming expenses (paise)
  items?: CashFlowInputItem[]; // Itemized records (deduplicated by id)
  hypotheticalScenarios?: HypotheticalScenario[];
}

export interface ScenarioResult {
  projectedLiquid: number;
  netAmount: number;
  isShortfall: boolean;
  shortfallAmount: number;
  surplusAmount: number;
  statusText: string;
  description: string;
}

export interface CashFlowForecastResult {
  summary: {
    confirmedAvailableFunds: number; // paise
    confirmedIncomingFunds: number; // paise
    totalConfirmedLiquid: number; // paise
    unconfirmedReceipts: number; // paise
    upcomingExpenses: number; // paise
  };
  primaryForecast: {
    netAmount: number; // totalConfirmedLiquid - upcomingExpenses
    isShortfall: boolean;
    shortfallAmount: number; // positive or 0
    surplusAmount: number; // positive or 0
    statusText: string;
  };
  conditionalScenarios: {
    unconfirmedReceiptsCleared: ScenarioResult;
    hypotheticals?: Array<{
      name: string;
      projectedNet: number;
      isShortfall: boolean;
      shortfallAmount: number;
      surplusAmount: number;
      statusText: string;
    }>;
  };
  explanation: {
    calculationFormula: string;
    breakdown: string[];
    assumptions: string[];
  };
  disclaimer: string;
}

export const CASH_FLOW_DISCLAIMER =
  "This cash-flow projection is an informational calculation based on user-provided and unverified records. It does not constitute financial, investment, or credit advice and does not guarantee future account balances.";

/**
 * Formats minor units (paise) to readable INR display string (e.g., 500000 -> "₹5,000.00")
 */
export function formatCurrencyPaise(paise: number): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = (absPaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${isNegative ? '-' : ''}₹${rupees}`;
}

/**
 * Pure calculation function for cash flow forecasts.
 */
export function calculateCashFlowForecast(
  params: CalculateCashFlowParams
): CashFlowForecastResult {
  let baseAvailable = params.currentAvailableFunds ?? 0;
  let explicitConfirmedIncome = params.confirmedIncome ?? 0;
  let explicitUnconfirmedReceipts = params.unconfirmedReceipts ?? 0;
  let explicitExpenses = params.expenses ?? 0;

  // Validate non-negative integer constraints for explicit scalars
  const scalars = [
    { name: 'currentAvailableFunds', val: baseAvailable },
    { name: 'confirmedIncome', val: explicitConfirmedIncome },
    { name: 'unconfirmedReceipts', val: explicitUnconfirmedReceipts },
    { name: 'expenses', val: explicitExpenses }
  ];

  for (const s of scalars) {
    if (!Number.isInteger(s.val) || s.val < 0) {
      throw new Error(`${s.name} must be a non-negative integer in minor units (paise)`);
    }
  }

  // Deduplicate itemized records by ID to prevent double counting
  let itemConfirmedIncome = 0;
  let itemUnconfirmedReceipts = 0;
  let itemExpenses = 0;

  if (params.items && params.items.length > 0) {
    const seenIds = new Set<string>();

    for (const item of params.items) {
      if (item.id) {
        if (seenIds.has(item.id)) {
          // Skip duplicate record to prevent unintended double counting
          continue;
        }
        seenIds.add(item.id);
      }

      if (!Number.isInteger(item.amount) || item.amount < 0) {
        throw new Error('Item amount must be a non-negative integer in minor units (paise)');
      }

      if (item.isIncome) {
        if (item.isConfirmed) {
          itemConfirmedIncome += item.amount;
        } else {
          itemUnconfirmedReceipts += item.amount;
        }
      } else {
        // All expenses, confirmed or scheduled, must be budgeted
        itemExpenses += item.amount;
      }
    }
  }

  const confirmedAvailableFunds = baseAvailable;
  const confirmedIncomingFunds = explicitConfirmedIncome + itemConfirmedIncome;
  const totalConfirmedLiquid = confirmedAvailableFunds + confirmedIncomingFunds;
  const unconfirmedReceipts = explicitUnconfirmedReceipts + itemUnconfirmedReceipts;
  const upcomingExpenses = explicitExpenses + itemExpenses;

  // Primary Forecast Calculation (Excludes unconfirmed receipts strictly)
  const primaryNetAmount = totalConfirmedLiquid - upcomingExpenses;
  const primaryIsShortfall = primaryNetAmount < 0;
  const primaryShortfallAmount = primaryIsShortfall ? Math.abs(primaryNetAmount) : 0;
  const primarySurplusAmount = !primaryIsShortfall ? primaryNetAmount : 0;

  const primaryStatusText = primaryIsShortfall
    ? `Potential shortfall of ${formatCurrencyPaise(primaryShortfallAmount)}`
    : `Projected surplus of ${formatCurrencyPaise(primarySurplusAmount)}`;

  // Conditional Scenario 1: What if unconfirmed receipts clear and arrive?
  const projectedLiquidCleared = totalConfirmedLiquid + unconfirmedReceipts;
  const clearedNetAmount = projectedLiquidCleared - upcomingExpenses;
  const clearedIsShortfall = clearedNetAmount < 0;
  const clearedShortfallAmount = clearedIsShortfall ? Math.abs(clearedNetAmount) : 0;
  const clearedSurplusAmount = !clearedIsShortfall ? clearedNetAmount : 0;

  const clearedStatusText = clearedIsShortfall
    ? `Potential shortfall of ${formatCurrencyPaise(clearedShortfallAmount)} if unconfirmed receipts clear`
    : `Projected surplus of ${formatCurrencyPaise(clearedSurplusAmount)} if unconfirmed receipts clear`;

  const unconfirmedClearedScenario: ScenarioResult = {
    projectedLiquid: projectedLiquidCleared,
    netAmount: clearedNetAmount,
    isShortfall: clearedIsShortfall,
    shortfallAmount: clearedShortfallAmount,
    surplusAmount: clearedSurplusAmount,
    statusText: clearedStatusText,
    description:
      'Conditional projection assuming all pending or unconfirmed receipts arrive and become available.'
  };

  // Conditional Scenario 2: User-defined hypotheticals
  const hypotheticalsResult: Array<{
    name: string;
    projectedNet: number;
    isShortfall: boolean;
    shortfallAmount: number;
    surplusAmount: number;
    statusText: string;
  }> = [];

  if (params.hypotheticalScenarios && params.hypotheticalScenarios.length > 0) {
    for (const h of params.hypotheticalScenarios) {
      const extraInc = h.additionalIncome ?? 0;
      const extraExp = h.additionalExpense ?? 0;

      if (!Number.isInteger(extraInc) || extraInc < 0 || !Number.isInteger(extraExp) || extraExp < 0) {
        throw new Error(`Hypothetical scenario '${h.name}' values must be non-negative integers`);
      }

      // Base hypotheticals on primary confirmed liquid funds + hypothetical variance
      const hypNet = totalConfirmedLiquid + extraInc - upcomingExpenses - extraExp;
      const hypIsShortfall = hypNet < 0;
      const hypShortfall = hypIsShortfall ? Math.abs(hypNet) : 0;
      const hypSurplus = !hypIsShortfall ? hypNet : 0;

      hypotheticalsResult.push({
        name: h.name,
        projectedNet: hypNet,
        isShortfall: hypIsShortfall,
        shortfallAmount: hypShortfall,
        surplusAmount: hypSurplus,
        statusText: hypIsShortfall
          ? `Potential shortfall of ${formatCurrencyPaise(hypShortfall)}`
          : `Projected surplus of ${formatCurrencyPaise(hypSurplus)}`
      });
    }
  }

  // Explanation and breakdown
  const explanation = {
    calculationFormula: `Primary Net = Total Confirmed Liquid (${formatCurrencyPaise(
      totalConfirmedLiquid
    )}) - Upcoming Expenses (${formatCurrencyPaise(upcomingExpenses)}) = ${formatCurrencyPaise(
      primaryNetAmount
    )}`,
    breakdown: [
      `Confirmed available funds: ${formatCurrencyPaise(confirmedAvailableFunds)}`,
      `Confirmed incoming funds: ${formatCurrencyPaise(confirmedIncomingFunds)}`,
      `Total confirmed liquid funds: ${formatCurrencyPaise(totalConfirmedLiquid)}`,
      `Upcoming expenses due: ${formatCurrencyPaise(upcomingExpenses)}`,
      `Unconfirmed receipts excluded from primary: ${formatCurrencyPaise(unconfirmedReceipts)}`
    ],
    assumptions: [
      'Unconfirmed receipts are strictly excluded from the primary forecast until verified and confirmed.',
      'All listed upcoming expenses are assumed payable in full on their designated due dates.',
      'Double-counting is prevented across financial activities and cash-flow items.',
      'Estimates do not represent guaranteed financial outcomes or credit advice.'
    ]
  };

  return {
    summary: {
      confirmedAvailableFunds,
      confirmedIncomingFunds,
      totalConfirmedLiquid,
      unconfirmedReceipts,
      upcomingExpenses
    },
    primaryForecast: {
      netAmount: primaryNetAmount,
      isShortfall: primaryIsShortfall,
      shortfallAmount: primaryShortfallAmount,
      surplusAmount: primarySurplusAmount,
      statusText: primaryStatusText
    },
    conditionalScenarios: {
      unconfirmedReceiptsCleared: unconfirmedClearedScenario,
      ...(hypotheticalsResult.length > 0 ? { hypotheticals: hypotheticalsResult } : {})
    },
    explanation,
    disclaimer: CASH_FLOW_DISCLAIMER
  };
}
