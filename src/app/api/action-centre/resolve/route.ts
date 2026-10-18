import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, sanitizeErrorMessage, handleApiError } from '@/lib/apiResponse';
import { resolveActionCentreItem } from '@/services/actionCentre';
import { logger } from '@/lib/logger';

const resolveActionSchema = z.object({
  actionId: z.string({ error: 'actionId is required' }),
  entityType: z.enum(
    ['PAYMENT_CASE', 'FINANCIAL_ACTIVITY', 'CASH_FLOW', 'RISK_ASSESSMENT'],
    { error: 'entityType is required' }
  ),
  entityId: z.string({ error: 'entityId is required' })
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

    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse('Invalid JSON payload', 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
      });
    }

    const validation = resolveActionSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error?.issues?.[0]?.message || 'Invalid request data';
      return errorResponse(errorMessage, 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
        details: validation.error?.issues,
      });
    }

    const { actionId, entityType, entityId } = validation.data;

    const result = await resolveActionCentreItem(userId, entityType, entityId);

    logger.info('ActionCentre_ItemResolved', {
      actionId,
      entityType,
      entityId,
      userId,
      requestId,
      route: '/api/action-centre/resolve',
    });

    return successResponse(
      { actionId, ...result },
      'Action item resolved and underlying records updated',
      200,
      { requestId }
    );
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/action-centre/resolve',
      defaultMessage: 'Error resolving action centre item',
    });
  }
}
