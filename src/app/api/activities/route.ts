import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, sanitizeErrorMessage, handleApiError } from '@/lib/apiResponse';
import {
  getFinancialActivities,
  createFinancialActivity
} from '@/services/financialActivity';
import { logger } from '@/lib/logger';
import { ActivityStatus, ActivityType } from '@prisma/client';

const createActivitySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], {
    error: 'type is required (INCOME or EXPENSE)'
  }),
  amount: z
    .number({ error: 'amount is required' })
    .int('amount must be an integer in minor units (paise)')
    .positive('amount must be positive'),
  currency: z.string().min(1).max(3).optional().default('INR'),
  status: z
    .enum(['CONFIRMED', 'UNCONFIRMED', 'FAILED'])
    .optional()
    .default('UNCONFIRMED'),
  date: z
    .string({ error: 'date is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'date must be a valid ISO 8601 date string'
    }),
  referenceNumber: z.string().min(1).max(50).optional().nullable(),
  issueType: z
    .enum(['FAILED', 'PENDING', 'DELAYED', 'DEBITED_NOT_CREDITED'])
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

    const activities = await getFinancialActivities(userId);

    logger.info('FinancialActivities_Listed', {
      userId,
      count: activities.length,
      requestId,
      route: '/api/activities',
    });

    return successResponse({ activities }, undefined, 200, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/activities',
      defaultMessage: 'Error fetching financial activities',
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

    const validation = createActivitySchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error?.issues?.[0]?.message || 'Invalid request data';
      return errorResponse(errorMessage, 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
        details: validation.error?.issues,
      });
    }

    const { type, amount, currency, status, date, referenceNumber, issueType } =
      validation.data;

    const activity = await createFinancialActivity({
      userId,
      type: type as ActivityType,
      amount,
      currency,
      status: status as ActivityStatus,
      date: new Date(date),
      referenceNumber: referenceNumber ?? null,
      issueType
    });

    logger.info('FinancialActivity_CreatedOrRetrieved', {
      activityId: activity.id,
      userId,
      status: activity.status,
      requestId,
      route: '/api/activities',
    });

    return successResponse(activity, 'Financial activity saved successfully', 201, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/activities',
      defaultMessage: 'Error creating financial activity',
    });
  }
}
