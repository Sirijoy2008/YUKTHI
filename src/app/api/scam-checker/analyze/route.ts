import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, sanitizeErrorMessage, handleApiError } from '@/lib/apiResponse';
import { analyzeMessage } from '@/services/scamChecker';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimiter';

// Max length 2000 chars as per specification
const analyzeSchema = z.object({
  message: z.string({ error: "Message is required" })
    .min(1, "Message cannot be empty")
    .max(2000, "Message exceeds maximum length of 2000 characters"),
});

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-user-id') || 'anonymous_user';
    const rateLimit = checkRateLimit(`scam_analyze:${clientIp}`, { maxRequests: 20, windowMs: 60000 });
    if (!rateLimit.isAllowed) {
      return errorResponse('Too many analysis requests. Please wait a moment before trying again.', 429, {
        errorCode: 'RATE_LIMIT_EXCEEDED',
        requestId,
        headers: { 'Retry-After': String(rateLimit.resetSeconds) },
      });
    }

    const body = await req.json().catch(() => null);
    
    if (!body) {
      return errorResponse("Invalid JSON payload", 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
      });
    }

    const result = analyzeSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error?.issues?.[0]?.message || 'Invalid request data';
      return errorResponse(errorMessage, 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
        details: result.error?.issues,
      });
    }

    // Never log raw message content for privacy reasons (avoiding PII exposure)
    logger.info("Analyzing a new message for scams", {
      length: result.data.message.length,
      requestId,
      route: '/api/scam-checker/analyze',
    });

    const analysis = analyzeMessage(result.data.message);

    // Provide the required output with the explicit disclaimer
    return successResponse(
      {
        indicators: analysis.indicators.map(ind => ind.name),
        riskLevel: analysis.riskLevel,
        recommendations: analysis.indicators.map(ind => ind.recommendation),
        details: analysis.indicators,
        disclaimer: "This is a rule-based risk assessment. It is not definitive fraud detection. A message may still be a scam even if no risk indicators were found. False positives and false negatives are possible. This system is not integrated with live threat intelligence."
      },
      undefined,
      200,
      { requestId }
    );
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/scam-checker/analyze',
      defaultMessage: 'Error analyzing message',
    });
  }
}
