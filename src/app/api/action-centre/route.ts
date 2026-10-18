import { NextRequest } from 'next/server';
import { successResponse, errorResponse, sanitizeErrorMessage, handleApiError } from '@/lib/apiResponse';
import { getActionCentreItems } from '@/services/actionCentre';
import { logger } from '@/lib/logger';

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

    const data = await getActionCentreItems(userId);

    logger.info('ActionCentre_Fetched', {
      userId,
      totalActions: data.summary.totalActions,
      highUrgencyCount: data.summary.highUrgencyCount,
      requestId,
      route: '/api/action-centre',
    });

    return successResponse(data, undefined, 200, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/action-centre',
      defaultMessage: 'Error fetching action centre items',
    });
  }
}
