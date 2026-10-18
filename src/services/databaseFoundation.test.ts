import { describe, it, expect, vi } from 'vitest';
import { calculateCashFlowForecast } from './cashFlowCalculator';
import { sanitizeErrorMessage, errorResponse } from '@/lib/apiResponse';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema validation tests mirroring the Supabase schema definitions
const financialActivitySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().int().positive('Amount must be positive in minor units (paise)'),
  currency: z.string().length(3).default('INR'),
  status: z.enum(['CONFIRMED', 'UNCONFIRMED', 'FAILED']),
  date: z.string().datetime(),
  referenceNumber: z.string().nullable().optional(),
});

const paymentCaseSchema = z.object({
  id: z.string().uuid(),
  financialActivityId: z.string().uuid(),
  issueType: z.enum(['FAILED', 'PENDING', 'DELAYED', 'DEBITED_NOT_CREDITED']),
  resolutionStatus: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  nextActionDate: z.string().datetime().nullable().optional(),
});

describe('FINOVA Phase 2: Supabase Database Foundation & Data Integrity Tests', () => {
  describe('1. Schema & Validation Constraints', () => {
    it('should validate valid financial activity record', () => {
      const validRecord = {
        id: '11111111-1111-4111-a111-111111111111',
        userId: '22222222-2222-4222-a222-222222222222',
        type: 'INCOME',
        amount: 500000, // ₹5,000 in paise
        currency: 'INR',
        status: 'CONFIRMED',
        date: new Date().toISOString(),
        referenceNumber: 'REF-UPI-12345',
      };

      const result = financialActivitySchema.safeParse(validRecord);
      expect(result.success).toBe(true);
    });

    it('should reject invalid monetary amounts (negative amounts or non-integers)', () => {
      const negativeRecord = {
        id: '11111111-1111-4111-a111-111111111111',
        userId: '22222222-2222-4222-a222-222222222222',
        type: 'EXPENSE',
        amount: -5000, // Invalid: negative
        currency: 'INR',
        status: 'CONFIRMED',
        date: new Date().toISOString(),
      };

      const result = financialActivitySchema.safeParse(negativeRecord);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Amount must be positive');
      }
    });

    it('should reject non-integer floating point amounts to prevent IEEE-754 drift', () => {
      const floatRecord = {
        id: '11111111-1111-4111-a111-111111111111',
        userId: '22222222-2222-4222-a222-222222222222',
        type: 'EXPENSE',
        amount: 5000.75, // Invalid: floating point
        currency: 'INR',
        status: 'CONFIRMED',
        date: new Date().toISOString(),
      };

      const result = financialActivitySchema.safeParse(floatRecord);
      expect(result.success).toBe(false);
    });
  });

  describe('2. Financial Calculation Integrity & Uncertain Receipt Handling', () => {
    it('should accurately calculate ₹5,000 available funds against ₹8,000 expenses resulting in ₹3,000 shortfall', () => {
      const calculation = calculateCashFlowForecast({
        currentAvailableFunds: 500000, // ₹5,000.00
        confirmedIncome: 0,
        unconfirmedReceipts: 0,
        expenses: 800000, // ₹8,000.00
      });

      expect(calculation.primaryForecast.shortfallAmount).toBe(300000); // ₹3,000.00
      expect(calculation.primaryForecast.netAmount).toBe(-300000);
      expect(calculation.primaryForecast.isShortfall).toBe(true);
    });

    it('should exclude an unconfirmed ₹2,000 receipt from the primary forecast and isolate it in conditional scenario', () => {
      const calculation = calculateCashFlowForecast({
        currentAvailableFunds: 500000, // ₹5,000.00
        confirmedIncome: 0,
        unconfirmedReceipts: 200000, // ₹2,000.00 unconfirmed
        expenses: 800000, // ₹8,000.00
      });

      // Primary forecast MUST remain at ₹3,000 shortfall
      expect(calculation.primaryForecast.netAmount).toBe(-300000);
      expect(calculation.primaryForecast.shortfallAmount).toBe(300000);
      expect(calculation.primaryForecast.isShortfall).toBe(true);

      // Conditional scenario if the unconfirmed receipt clears shows reduced shortfall of ₹1,000
      expect(calculation.conditionalScenarios.unconfirmedReceiptsCleared.netAmount).toBe(-100000);
      expect(calculation.conditionalScenarios.unconfirmedReceiptsCleared.shortfallAmount).toBe(100000);
      expect(calculation.conditionalScenarios.unconfirmedReceiptsCleared.isShortfall).toBe(true);
    });

    it('should update primary forecast when the ₹2,000 receipt is confirmed', () => {
      const calculation = calculateCashFlowForecast({
        currentAvailableFunds: 500000, // ₹5,000.00
        confirmedIncome: 200000, // ₹2,000.00 confirmed
        unconfirmedReceipts: 0,
        expenses: 800000, // ₹8,000.00
      });

      // Now primary forecast reflects the confirmed income: 5,000 + 2,000 - 8,000 = -1,000
      expect(calculation.primaryForecast.netAmount).toBe(-100000);
      expect(calculation.primaryForecast.shortfallAmount).toBe(100000);
      expect(calculation.primaryForecast.isShortfall).toBe(true);
    });
  });

  describe('3. Database Security & Error Sanitization', () => {
    it('should never leak database connection strings, passwords, or SQL details in error responses', () => {
      const dbError = new Error(
        'connect ECONNREFUSED postgresql://postgres:SuperSecretPassword123@db.supabase.co:5432/postgres'
      );
      const sanitized = sanitizeErrorMessage(dbError);

      expect(sanitized).not.toContain('SuperSecretPassword123');
      expect(sanitized).not.toContain('postgresql://');
      expect(sanitized).toBe('An internal database error occurred');
    });

    it('should return standardized 500 error envelope for database failure', () => {
      const response = errorResponse('Internal server error', 500);
      expect(response.status).toBe(500);
    });
  });

  describe('4. Status Transitions and Business Invariants', () => {
    it('should validate valid payment case status values', () => {
      const validCase = {
        id: '33333333-3333-4333-a333-333333333333',
        financialActivityId: '11111111-1111-4111-a111-111111111111',
        issueType: 'DEBITED_NOT_CREDITED',
        resolutionStatus: 'OPEN',
      };

      const result = paymentCaseSchema.safeParse(validCase);
      expect(result.success).toBe(true);
    });

    it('should reject invalid resolution status values', () => {
      const invalidCase = {
        id: '33333333-3333-4333-a333-333333333333',
        financialActivityId: '11111111-1111-4111-a111-111111111111',
        issueType: 'DEBITED_NOT_CREDITED',
        resolutionStatus: 'INVALID_STATUS',
      };

      const result = paymentCaseSchema.safeParse(invalidCase);
      expect(result.success).toBe(false);
    });
  });
});
