import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types/api';
import { AppError, AppErrorCode } from './errors';
import { logger } from './logger';

export type { ApiResponse };

export interface ResponseOptions {
  requestId?: string;
  errorCode?: AppErrorCode | string;
  details?: unknown;
  headers?: Record<string, string>;
}

/**
 * Creates a standard success response with optional correlation ID.
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status = 200,
  options?: ResponseOptions
) {
  const payload: ApiResponse<T> = {
    success: true,
    ...(message ? { message } : {}),
    data,
    ...(options?.requestId ? { requestId: options.requestId } : {}),
  };

  const responseHeaders = new Headers(options?.headers || {});
  if (options?.requestId) {
    responseHeaders.set('x-request-id', options.requestId);
  }

  return NextResponse.json(payload, {
    status,
    headers: responseHeaders,
  });
}

/**
 * Creates a standard error response with status code, error code, and correlation ID.
 * Guarantees no sensitive internal errors, SQL queries, or stack traces leak.
 */
export function errorResponse(
  error: unknown,
  status = 400,
  options?: ResponseOptions
) {
  let resolvedStatus = status;
  let resolvedErrorCode = options?.errorCode;
  let resolvedDetails = options?.details;

  if (error instanceof AppError) {
    // If status was left as default 400, prioritize AppError's explicit statusCode
    if (status === 400 && error.statusCode !== 400) {
      resolvedStatus = error.statusCode;
    }
    if (!resolvedErrorCode) {
      resolvedErrorCode = error.errorCode;
    }
    if (resolvedDetails === undefined && error.details !== undefined) {
      resolvedDetails = error.details;
    }
  }

  const safeMessage = sanitizeErrorMessage(error);

  const payload: ApiResponse = {
    success: false,
    error: safeMessage,
    ...(resolvedErrorCode ? { errorCode: resolvedErrorCode } : {}),
    ...(options?.requestId ? { requestId: options.requestId } : {}),
    ...(resolvedDetails !== undefined ? { details: resolvedDetails } : {}),
  };

  const responseHeaders = new Headers(options?.headers || {});
  if (options?.requestId) {
    responseHeaders.set('x-request-id', options.requestId);
  }

  return NextResponse.json(payload, {
    status: resolvedStatus,
    headers: responseHeaders,
  });
}

/**
 * Strips technical database internals, connection strings, credentials,
 * and stack traces from any error message to protect client security.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof AppError && error.isOperational) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    const raw = error.message;

    // Detect database, connection, or driver internals
    if (
      /postgres(ql)?:\/\/|econnrefused|prisma|foreign key|syntax error at or near|p1000|p1001|p1002|p1003|p1008|p1017|p2002|p2003|p2024|p2025|sqlite|select .* from|insert into|update .* set/i.test(
        raw
      ) ||
      /password\s*[:=]|postgresql:\/\//i.test(raw)
    ) {
      return 'An internal database error occurred';
    }

    // Detect timeout errors
    if (/timeout|timed out|etimedout/i.test(raw)) {
      return 'The request timed out. Please try again.';
    }

    // Strip any possible stack trace or path indicators
    if (raw.includes('\n') || raw.includes('at ') || raw.includes('C:\\') || raw.includes('/Users/')) {
      return 'An unexpected error occurred. Please try again later.';
    }

    return raw;
  }

  if (typeof error === 'string') {
    if (
      /postgres(ql)?:\/\/|econnrefused|prisma|select .* from/i.test(error) ||
      /password\s*[:=]|postgresql:\/\//i.test(error)
    ) {
      return 'An internal database error occurred';
    }
    if (error.includes('\n') || error.includes('at ') || error.includes('C:\\')) {
      return 'An unexpected error occurred. Please try again later.';
    }
    return error;
  }

  return 'An unexpected error occurred. Please try again later.';
}

export interface HandleApiErrorOptions {
  requestId: string;
  route?: string;
  defaultMessage?: string;
  details?: unknown;
}

/**
 * Centralized API error dispatcher for Route Handlers.
 * Dispatches AppError, ZodError, domain errors, and unexpected exceptions
 * with appropriate logging, correct status code, safe message, and correlation ID.
 */
export function handleApiError(
  error: unknown,
  options: HandleApiErrorOptions
): NextResponse {
  const { requestId, route = 'unknown_route', defaultMessage, details } = options;

  // 1. AppError hierarchy (ValidationError, NotFoundError, UnauthorizedError, etc.)
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(error.message, error, {
        route,
        requestId,
        errorCode: error.errorCode,
      });
    } else {
      logger.warn(error.message, {
        route,
        requestId,
        errorCode: error.errorCode,
        details: error.details,
      });
    }

    return errorResponse(error.userMessage, error.statusCode, {
      errorCode: error.errorCode,
      requestId,
      details: details ?? error.details,
    });
  }

  // 2. Zod Validation Error
  if (error && typeof error === 'object' && 'issues' in error && Array.isArray((error as any).issues)) {
    const issues = (error as any).issues;
    const firstMessage = issues[0]?.message || 'Validation failed';
    logger.warn(`Validation failure on ${route}: ${firstMessage}`, {
      route,
      requestId,
      errorCode: 'VALIDATION_ERROR',
      details: issues,
    });

    return errorResponse(firstMessage, 400, {
      errorCode: 'VALIDATION_ERROR',
      requestId,
      details: issues,
    });
  }

  // 3. Domain Named Errors
  if (error instanceof Error) {
    const errName = error.name;

    if (errName.includes('NotFound')) {
      return errorResponse(error.message, 404, {
        errorCode: 'NOT_FOUND',
        requestId,
      });
    }

    if (errName.includes('Forbidden')) {
      return errorResponse(error.message, 403, {
        errorCode: 'FORBIDDEN',
        requestId,
      });
    }

    if (errName.includes('SensitiveData')) {
      return errorResponse(error.message, 400, {
        errorCode: 'SENSITIVE_DATA_DETECTED',
        requestId,
      });
    }

    if (errName.includes('InvalidStatusTransition')) {
      return errorResponse(error.message, 400, {
        errorCode: 'INVALID_STATUS_TRANSITION',
        requestId,
      });
    }

    if (errName.includes('Conflict')) {
      return errorResponse(error.message, 409, {
        errorCode: 'CONFLICT',
        requestId,
      });
    }

    // Database / Prisma Driver Errors
    if (
      errName.includes('Prisma') ||
      /database|postgres|econnrefused|p1001|p1002|p2002|p2025/i.test(error.message)
    ) {
      logger.error(`Database error on ${route}`, error, {
        route,
        requestId,
        errorCode: 'DATABASE_ERROR',
      });
      return errorResponse('An internal database error occurred', 500, {
        errorCode: 'DATABASE_ERROR',
        requestId,
      });
    }

    // Network / Timeout Errors
    if (errName === 'AbortError' || /timeout|etimedout/i.test(error.message)) {
      logger.warn(`Request timeout on ${route}`, {
        route,
        requestId,
        errorCode: 'TIMEOUT_ERROR',
      });
      return errorResponse('The request timed out. Please try again.', 504, {
        errorCode: 'TIMEOUT_ERROR',
        requestId,
      });
    }
  }

  // 4. Unexpected server error
  logger.error(defaultMessage || `Unhandled error on ${route}`, error, {
    route,
    requestId,
    errorCode: 'INTERNAL_SERVER_ERROR',
  });

  return errorResponse(
    sanitizeErrorMessage(error),
    500,
    {
      errorCode: 'INTERNAL_SERVER_ERROR',
      requestId,
    }
  );
}
