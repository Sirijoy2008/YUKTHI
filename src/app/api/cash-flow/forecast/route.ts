import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, sanitizeErrorMessage, handleApiError } from '@/lib/apiResponse';
import {
  calculateCashFlowForecast,
  CashFlowForecastResult
} from '@/services/cashFlowCalculator';
import { getUserCashFlowForecast } from '@/services/cashFlowService';
import { logger } from '@/lib/logger';

const forecastPostSchema = z.object({
  currentAvailableFunds: z.number().int().nonnegative().optional(),
  confirmedIncome: z.number().int().nonnegative().optional(),
  unconfirmedReceipts: z.number().int().nonnegative().optional(),
  expenses: z.number().int().nonnegative().optional(),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        amount: z.number().int().nonnegative(),
        currency: z.string().optional().default('INR'),
        isIncome: z.boolean(),
        isConfirmed: z.boolean(),
        dueDate: z.string().optional().nullable()
      })
    )
    .optional(),
  hypotheticalScenarios: z
    .array(
      z.object({
        name: z.string().min(1),
        additionalIncome: z.number().int().nonnegative().optional(),
        additionalExpense: z.number().int().nonnegative().optional()
      })
    )
    .optional()
});

export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return errorResponse('Unauthorized: Missing x-user-id header', 401, {
        errorCode: 'UNAUTHORIZED',
        requestId,
      });
    }

    const forecast = await getUserCashFlowForecast(userId);

    logger.info('CashFlowForecast_Generated', {
      userId,
      isShortfall: forecast.primaryForecast.isShortfall,
      requestId,
      route: '/api/cash-flow/forecast',
    });

    return successResponse(forecast, undefined, 200, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/cash-flow/forecast',
      defaultMessage: 'Error generating cash-flow forecast',
    });
  }
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse('Invalid JSON payload', 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
      });
    }

    const validation = forecastPostSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error?.issues?.[0]?.message || 'Invalid request data';
      return errorResponse(errorMessage, 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
        details: validation.error?.issues,
      });
    }

    const data = validation.data;
    const userId = req.headers.get('x-user-id');

    let result: CashFlowForecastResult;

    // If explicit values are provided, execute pure deterministic calculation
    if (
      data.currentAvailableFunds !== undefined ||
      data.confirmedIncome !== undefined ||
      data.unconfirmedReceipts !== undefined ||
      data.expenses !== undefined ||
      data.items !== undefined
    ) {
      result = calculateCashFlowForecast({
        currentAvailableFunds: data.currentAvailableFunds,
        confirmedIncome: data.confirmedIncome,
        unconfirmedReceipts: data.unconfirmedReceipts,
        expenses: data.expenses,
        items: data.items,
        hypotheticalScenarios: data.hypotheticalScenarios
      });
    } else if (userId) {
      // If no explicit funds provided but user ID is provided, use user DB state with custom hypotheticals
      result = await getUserCashFlowForecast(userId, {
        hypotheticalScenarios: data.hypotheticalScenarios
      });
    } else {
      // Default empty baseline calculation
      result = calculateCashFlowForecast({
        hypotheticalScenarios: data.hypotheticalScenarios
      });
    }

    logger.info('CashFlow_CalculationExecuted', {
      isShortfall: result.primaryForecast.isShortfall,
      hypotheticalsCount: data.hypotheticalScenarios?.length ?? 0,
      requestId,
      route: '/api/cash-flow/forecast',
    });

    return successResponse(result, undefined, 200, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/cash-flow/forecast',
      defaultMessage: 'Error calculating cash-flow forecast',
    });
  }
}
