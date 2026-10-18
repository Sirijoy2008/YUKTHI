import { describe, it, expect } from 'vitest';
import {
  calculateCashFlowForecast,
  formatCurrencyPaise,
  CASH_FLOW_DISCLAIMER
} from './cashFlowCalculator';

describe('Cash-Flow Calculation Engine (cashFlowCalculator)', () => {
  describe('formatCurrencyPaise', () => {
    it('should format positive and negative amounts correctly into INR', () => {
      expect(formatCurrencyPaise(500000)).toBe('₹5,000.00');
      expect(formatCurrencyPaise(800000)).toBe('₹8,000.00');
      expect(formatCurrencyPaise(-300000)).toBe('-₹3,000.00');
      expect(formatCurrencyPaise(0)).toBe('₹0.00');
      expect(formatCurrencyPaise(99)).toBe('₹0.99');
    });
  });

  describe('Required Acceptance Criteria', () => {
    // Available funds: ₹5,000. Upcoming expenses: ₹8,000.
    // Expected result: potential shortfall of ₹3,000.
    it('Case A: Available ₹5,000 and upcoming expenses ₹8,000 -> shortfall of ₹3,000', () => {
      const res = calculateCashFlowForecast({
        currentAvailableFunds: 500000, // ₹5,000 in paise
        expenses: 800000 // ₹8,000 in paise
      });

      expect(res.summary.confirmedAvailableFunds).toBe(500000);
      expect(res.summary.upcomingExpenses).toBe(800000);
      expect(res.primaryForecast.netAmount).toBe(-300000);
      expect(res.primaryForecast.isShortfall).toBe(true);
      expect(res.primaryForecast.shortfallAmount).toBe(300000);
      expect(res.primaryForecast.surplusAmount).toBe(0);
      expect(res.primaryForecast.statusText).toContain('Potential shortfall of ₹3,000.00');
    });

    // If an additional ₹2,000 receipt is unconfirmed, primary forecast must still show ₹3,000 shortfall.
    // A separate conditional scenario may show a ₹1,000 shortfall if that receipt arrives.
    it('Case B: Unconfirmed ₹2,000 receipt excluded from primary, but shown in conditional scenario', () => {
      const res = calculateCashFlowForecast({
        currentAvailableFunds: 500000, // ₹5,000
        unconfirmedReceipts: 200000, // ₹2,000 unconfirmed
        expenses: 800000 // ₹8,000
      });

      // Primary forecast must NOT change
      expect(res.primaryForecast.isShortfall).toBe(true);
      expect(res.primaryForecast.shortfallAmount).toBe(300000);
      expect(res.primaryForecast.statusText).toContain('Potential shortfall of ₹3,000.00');

      // Conditional scenario
      const scenario = res.conditionalScenarios.unconfirmedReceiptsCleared;
      expect(scenario.projectedLiquid).toBe(700000); // 5000 + 2000
      expect(scenario.netAmount).toBe(-100000);
      expect(scenario.isShortfall).toBe(true);
      expect(scenario.shortfallAmount).toBe(100000); // ₹1,000
      expect(scenario.statusText).toContain('Potential shortfall of ₹1,000.00 if unconfirmed receipts clear');
      expect(scenario.description).toContain('all pending or unconfirmed receipts arrive');
    });

    // If the receipt is later confirmed and actually available, primary forecast updates.
    it('Case C: When ₹2,000 receipt is confirmed, primary forecast reflects ₹1,000 shortfall', () => {
      const res = calculateCashFlowForecast({
        currentAvailableFunds: 500000, // ₹5,000
        confirmedIncome: 200000, // ₹2,000 confirmed
        unconfirmedReceipts: 0,
        expenses: 800000 // ₹8,000
      });

      expect(res.summary.totalConfirmedLiquid).toBe(700000);
      expect(res.primaryForecast.netAmount).toBe(-100000);
      expect(res.primaryForecast.isShortfall).toBe(true);
      expect(res.primaryForecast.shortfallAmount).toBe(100000);
      expect(res.primaryForecast.statusText).toContain('Potential shortfall of ₹1,000.00');
    });
  });

  describe('Surplus and Surplus with Receipts', () => {
    it('should correctly project a surplus when funds exceed expenses', () => {
      const res = calculateCashFlowForecast({
        currentAvailableFunds: 1000000, // ₹10,000
        expenses: 400000 // ₹4,000
      });

      expect(res.primaryForecast.isShortfall).toBe(false);
      expect(res.primaryForecast.shortfallAmount).toBe(0);
      expect(res.primaryForecast.surplusAmount).toBe(600000);
      expect(res.primaryForecast.statusText).toContain('Projected surplus of ₹6,000.00');
    });
  });

  describe('Deduplication and Double Counting Prevention', () => {
    it('should deduplicate items with identical IDs to prevent double counting', () => {
      const res = calculateCashFlowForecast({
        currentAvailableFunds: 500000,
        items: [
          { id: 'exp-1', amount: 200000, isIncome: false, isConfirmed: true },
          { id: 'exp-1', amount: 200000, isIncome: false, isConfirmed: true }, // duplicate!
          { id: 'inc-1', amount: 100000, isIncome: true, isConfirmed: false },
          { id: 'inc-1', amount: 100000, isIncome: true, isConfirmed: false } // duplicate!
        ]
      });

      // Should count exp-1 only once (200000) and inc-1 only once (100000)
      expect(res.summary.upcomingExpenses).toBe(200000);
      expect(res.summary.unconfirmedReceipts).toBe(100000);
      expect(res.primaryForecast.netAmount).toBe(300000); // 500000 - 200000
    });
  });

  describe('Hypothetical Scenarios', () => {
    it('should evaluate user-defined what-if hypothetical scenarios in separate category', () => {
      const res = calculateCashFlowForecast({
        currentAvailableFunds: 500000,
        expenses: 800000,
        hypotheticalScenarios: [
          {
            name: 'Freelance Project Signed',
            additionalIncome: 500000, // +₹5,000
            additionalExpense: 0
          },
          {
            name: 'Emergency Medical Expense',
            additionalIncome: 0,
            additionalExpense: 300000 // -₹3,000
          }
        ]
      });

      expect(res.conditionalScenarios.hypotheticals).toBeDefined();
      expect(res.conditionalScenarios.hypotheticals).toHaveLength(2);

      const gig = res.conditionalScenarios.hypotheticals![0];
      expect(gig.name).toBe('Freelance Project Signed');
      // 500000 + 500000 - 800000 = +200000
      expect(gig.isShortfall).toBe(false);
      expect(gig.surplusAmount).toBe(200000);
      expect(gig.statusText).toContain('Projected surplus of ₹2,000.00');

      const med = res.conditionalScenarios.hypotheticals![1];
      expect(med.name).toBe('Emergency Medical Expense');
      // 500000 - 800000 - 300000 = -600000
      expect(med.isShortfall).toBe(true);
      expect(med.shortfallAmount).toBe(600000);
      expect(med.statusText).toContain('Potential shortfall of ₹6,000.00');
    });
  });

  describe('Validation & Explanations', () => {
    it('should throw an error for negative amounts', () => {
      expect(() =>
        calculateCashFlowForecast({
          currentAvailableFunds: -500
        })
      ).toThrow('must be a non-negative integer');
    });

    it('should provide transparent formulas and assumptions', () => {
      const res = calculateCashFlowForecast({
        currentAvailableFunds: 500000,
        expenses: 800000
      });

      expect(res.explanation.calculationFormula).toContain('Primary Net = Total Confirmed Liquid');
      expect(res.explanation.assumptions.length).toBeGreaterThan(0);
      expect(res.disclaimer).toBe(CASH_FLOW_DISCLAIMER);
    });
  });
});
