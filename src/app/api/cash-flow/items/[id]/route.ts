import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, sanitizeErrorMessage, handleApiError } from '@/lib/apiResponse';
import {
  updateCashFlowItem,
  deleteCashFlowItem,
  CashFlowItemNotFoundError,
  CashFlowItemForbiddenError
} from '@/services/cashFlowService';
import { logger } from '@/lib/logger';

const updateItemSchema = z
  .object({
    amount: z.number().int().positive().optional(),
    isConfirmed: z.boolean().optional(),
    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'dueDate must be a valid ISO 8601 date string'
      })
      .optional()
      .nullable()
  })
  .refine(
    (data) =>
      data.amount !== undefined ||
      data.isConfirmed !== undefined ||
      data.dueDate !== undefined,
    {
      message: 'At least one field (amount, isConfirmed, dueDate) must be provided'
    }
  );

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return errorResponse('Unauthorized: Missing x-user-id header', 401, {
        errorCode: 'UNAUTHORIZED',
        requestId,
      });
    }

    const { id } = await params;
    if (!id) {
      return errorResponse('Item ID is required', 400, {
        errorCode: 'VALIDATION_ERROR',
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

    const validation = updateItemSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error?.issues?.[0]?.message || 'Invalid request data';
      return errorResponse(errorMessage, 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
        details: validation.error?.issues,
      });
    }

    const { amount, isConfirmed, dueDate } = validation.data;

    const updated = await updateCashFlowItem(userId, id, {
      amount,
      isConfirmed,
      dueDate: dueDate !== undefined ? (dueDate === null ? null : new Date(dueDate)) : undefined
    });

    logger.info('CashFlowItem_Updated', {
      itemId: id,
      isConfirmed,
      userId,
      requestId,
      route: '/api/cash-flow/items/[id]',
    });

    return successResponse(updated, 'Cash-flow item updated successfully', 200, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/cash-flow/items/[id]',
      defaultMessage: 'Error updating cash-flow item',
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return errorResponse('Unauthorized: Missing x-user-id header', 401, {
        errorCode: 'UNAUTHORIZED',
        requestId,
      });
    }

    const { id } = await params;
    if (!id) {
      return errorResponse('Item ID is required', 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
      });
    }

    const deleted = await deleteCashFlowItem(userId, id);

    logger.info('CashFlowItem_Deleted', {
      itemId: id,
      userId,
      requestId,
      route: '/api/cash-flow/items/[id]',
    });

    return successResponse(deleted, 'Cash-flow item deleted successfully', 200, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/cash-flow/items/[id]',
      defaultMessage: 'Error deleting cash-flow item',
    });
  }
}
