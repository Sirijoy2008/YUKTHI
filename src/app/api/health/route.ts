import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/apiResponse';

export async function GET(req?: NextRequest) {
  const requestId = req?.headers?.get?.('x-request-id') || crypto.randomUUID();
  try {
    return successResponse({ status: 'ok', timestamp: new Date().toISOString() }, 'Service is healthy', 200, { requestId });
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/health',
      defaultMessage: 'Health check failed',
    });
  }
}
