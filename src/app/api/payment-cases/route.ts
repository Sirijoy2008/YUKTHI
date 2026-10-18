import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, sanitizeErrorMessage, handleApiError } from '@/lib/apiResponse';
import {
  createPaymentCase,
  getPaymentCases,
  SensitiveDataError
} from '@/services/paymentAssistant';
import { PAYMENT_ASSISTANT_DISCLAIMER } from '@/services/paymentGuidance';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimiter';
import { ActivityType } from '@prisma/client';

const createCaseSchema = z.object({
  issueType: z.enum(['FAILED', 'PENDING', 'DELAYED', 'DEBITED_NOT_CREDITED'], {
    error: 'issueType must be one of: FAILED, PENDING, DELAYED, DEBITED_NOT_CREDITED'
  }),
  amount: z
    .number({ error: 'amount is required' })
    .int('amount must be an integer in minor units (paise)')
    .positive('amount must be a positive integer'),
  currency: z.string().min(1).max(3).optional().default('INR'),
  type: z.enum(['INCOME', 'EXPENSE']).optional().default('EXPENSE'),
  date: z
    .string({ error: 'date is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'date must be a valid ISO 8601 date string'
    }),
  referenceNumber: z.string().min(1).max(50).optional().nullable(),
  nextActionDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'nextActionDate must be a valid ISO 8601 date string'
    })
    .optional()
    .nullable(),
  notes: z.string().max(500).optional().nullable(),
});

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

    // Rate limit case creation: 30 requests per minute per user
    const rateLimit = checkRateLimit(`payment_cases:${userId}`, { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.isAllowed) {
      return errorResponse('Too many requests. Please wait a moment before creating another case.', 429, {
        errorCode: 'RATE_LIMIT_EXCEEDED',
        requestId,
        headers: { 'Retry-After': String(rateLimit.resetSeconds) },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse('Invalid JSON payload', 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
      });
    }

    const validation = createCaseSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error?.issues?.[0]?.message || 'Invalid request data';
      return errorResponse(errorMessage, 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
        details: validation.error?.issues,
      });
    }

    const { issueType, amount, currency, type, date, referenceNumber, nextActionDate, notes } =
      validation.data;

    const result = await createPaymentCase(userId, {
      issueType,
      amount,
      currency,
      type: type as ActivityType,
      date: new Date(date),
      referenceNumber: referenceNumber ?? null,
      nextActionDate: nextActionDate ? new Date(nextActionDate) : null,
      notes: notes ?? null,
    });

    // Sensitive data (amount, reference number) is NOT logged as per security policy
    logger.info('PaymentCase_Created', {
      caseId: result.case.id,
      issueType: result.case.issueType,
      userId,
      requestId,
      route: '/api/payment-cases',
    });

    return successResponse(result, 'Payment case created successfully', 201, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/payment-cases',
      defaultMessage: 'Error creating payment case',
    });
  }
}

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

    const cases = await getPaymentCases(userId);

    logger.info('PaymentCases_Listed', {
      userId,
      count: cases.length,
      requestId,
      route: '/api/payment-cases',
    });

    return successResponse(
      {
        cases,
        disclaimer: PAYMENT_ASSISTANT_DISCLAIMER
      },
      undefined,
      200,
      { requestId }
    );
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/payment-cases',
      defaultMessage: 'Error fetching payment cases',
    });
  }
}
