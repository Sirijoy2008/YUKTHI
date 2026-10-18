import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, sanitizeErrorMessage, handleApiError } from '@/lib/apiResponse';
import {
  updateFinancialActivityStatus,
  FinancialActivityNotFoundError,
  FinancialActivityForbiddenError
} from '@/services/financialActivity';
import { logger } from '@/lib/logger';
import { ActivityStatus } from '@prisma/client';

const updateStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'UNCONFIRMED', 'FAILED'], {
    error: 'status is required (CONFIRMED, UNCONFIRMED, or FAILED)'
  })
});

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
      return errorResponse('Activity ID is required', 400, {
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

    const validation = updateStatusSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error?.issues?.[0]?.message || 'Invalid request data';
      return errorResponse(errorMessage, 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
        details: validation.error?.issues,
      });
    }

    const { status } = validation.data;

    const updated = await updateFinancialActivityStatus(
      userId,
      id,
      status as ActivityStatus
    );

    logger.info('FinancialActivity_StatusUpdated', {
      activityId: id,
      newStatus: status,
      userId,
      requestId,
      route: '/api/activities/[id]',
    });

    return successResponse(updated, 'Financial activity status updated successfully', 200, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/activities/[id]',
      defaultMessage: 'Error updating financial activity',
    });
  }
}
