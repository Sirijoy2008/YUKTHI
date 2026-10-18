import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const userId = req.headers.get('x-user-id') || 'user-123';

    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    } catch (dbErr: any) {
      logger.warn('Auth_StatusPrismaFallback', {
        reason: dbErr?.message || 'Database unavailable',
        requestId,
      });
      user = null;
    }

    logger.info('Auth_StatusCheck', {
      userId,
      requestId,
      route: '/api/auth/status',
    });

    return successResponse(
      {
        userId,
        email: user?.email || 'user@yukthi.in',
        displayName: user?.displayName || 'YUKTHI User',
        preferredLanguage: user?.preferredLanguage || 'en',
        verification: {
          status: 'NOT_STARTED', // Explicit: Never falsely reports 'VERIFIED'
          providerConfigured: false,
          providerStatusMessage:
            'Verification integration not configured. Production deployment requires authorized UIDAI/DigiLocker ASA gateway credentials.',
          isOptionalForBasicFeatures: true,
        },
      },
      undefined,
      200,
      { requestId }
    );
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/auth/status',
      defaultMessage: 'Failed to retrieve authentication status',
    });
  }
}
