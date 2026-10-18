import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, sanitizeErrorMessage, handleApiError } from '@/lib/apiResponse';
import {
  getPaymentCaseById,
  updatePaymentCase,
  PaymentCaseNotFoundError,
  PaymentCaseForbiddenError,
  InvalidStatusTransitionError,
  SensitiveDataError,
  ResolutionStatus
} from '@/services/paymentAssistant';
import { logger } from '@/lib/logger';

const updateCaseSchema = z
  .object({
    resolutionStatus: z
      .enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], {
        error: 'resolutionStatus must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED'
      })
      .optional(),
    nextActionDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'nextActionDate must be a valid ISO 8601 date string'
      })
      .optional()
      .nullable(),
    referenceNumber: z.string().min(1).max(50).optional().nullable(),
  })
  .refine(
    (data) =>
      data.resolutionStatus !== undefined ||
      data.nextActionDate !== undefined ||
      data.referenceNumber !== undefined,
    {
      message: 'At least one field (resolutionStatus, nextActionDate, referenceNumber) must be provided to update'
    }
  );

export async function GET(
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
      return errorResponse('Case ID is required', 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
      });
    }

    const result = await getPaymentCaseById(userId, id);

    logger.info('PaymentCase_Fetched', {
      caseId: id,
      userId,
      requestId,
      route: '/api/payment-cases/[id]',
    });

    return successResponse(result, undefined, 200, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/payment-cases/[id]',
      defaultMessage: 'Error fetching payment case',
    });
  }
}

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
      return errorResponse('Case ID is required', 400, {
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

    const validation = updateCaseSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error?.issues?.[0]?.message || 'Invalid request data';
      return errorResponse(errorMessage, 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
        details: validation.error?.issues,
      });
    }

    const { resolutionStatus, nextActionDate, referenceNumber } = validation.data;

    const result = await updatePaymentCase(userId, id, {
      resolutionStatus: resolutionStatus as ResolutionStatus | undefined,
      nextActionDate:
        nextActionDate !== undefined
          ? nextActionDate === null
            ? null
            : new Date(nextActionDate)
          : undefined,
      referenceNumber: referenceNumber !== undefined ? referenceNumber : undefined
    });

    // Logging only safe identifiers without sensitive values
    logger.info('PaymentCase_Updated', {
      caseId: id,
      newStatus: resolutionStatus,
      userId,
      requestId,
      route: '/api/payment-cases/[id]',
    });

    return successResponse(result, 'Payment case updated successfully', 200, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/payment-cases/[id]',
      defaultMessage: 'Error updating payment case',
    });
  }
}
