import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, sanitizeErrorMessage, handleApiError } from '@/lib/apiResponse';
import {
  createCashFlowItem,
  getUserCashFlowItems
} from '@/services/cashFlowService';
import { logger } from '@/lib/logger';

const createItemSchema = z.object({
  amount: z
    .number({ error: 'amount is required' })
    .int('amount must be an integer in minor units (paise)')
    .positive('amount must be a positive integer'),
  currency: z.string().min(1).max(3).optional().default('INR'),
  isIncome: z.boolean({ error: 'isIncome is required' }),
  isConfirmed: z.boolean().optional().default(false),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'dueDate must be a valid ISO 8601 date string'
    })
    .optional()
    .nullable()
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

    const items = await getUserCashFlowItems(userId);

    logger.info('CashFlowItems_Listed', {
      userId,
      count: items.length,
      requestId,
      route: '/api/cash-flow/items',
    });

    return successResponse({ items }, undefined, 200, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/cash-flow/items',
      defaultMessage: 'Error fetching cash-flow items',
    });
  }
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return errorResponse('Unauthorized: Missing x-user-id header', 401, {
        errorCode: 'UNAUTHORIZED',
        requestId,
      });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse('Invalid JSON payload', 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
      });
    }

    const validation = createItemSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error?.issues?.[0]?.message || 'Invalid request data';
      return errorResponse(errorMessage, 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
        details: validation.error?.issues,
      });
    }

    const { amount, currency, isIncome, isConfirmed, dueDate } = validation.data;

    const item = await createCashFlowItem(userId, {
      amount,
      currency,
      isIncome,
      isConfirmed,
      dueDate: dueDate ? new Date(dueDate) : null
    });

    logger.info('CashFlowItem_Created', {
      itemId: item.id,
      isIncome,
      isConfirmed,
      userId,
      requestId,
      route: '/api/cash-flow/items',
    });

    return successResponse(item, 'Cash-flow item created successfully', 201, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/cash-flow/items',
      defaultMessage: 'Error creating cash-flow item',
    });
  }
}
