/**
 * Standard Error Codes and Application Error Hierarchy
 * for YUKTHI / FINOVA.
 */

export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'TIMEOUT_ERROR'
  | 'SENSITIVE_DATA_DETECTED'
  | 'INVALID_STATUS_TRANSITION'
  | 'NETWORK_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export interface AppErrorOptions {
  cause?: unknown;
  details?: unknown;
  isOperational?: boolean;
  requestId?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: AppErrorCode;
  public readonly userMessage: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;
  public readonly requestId?: string;

  constructor(
    message: string,
    statusCode = 500,
    errorCode: AppErrorCode = 'INTERNAL_SERVER_ERROR',
    options?: AppErrorOptions
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.userMessage = message;
    this.details = options?.details;
    this.isOperational = options?.isOperational ?? true;
    this.requestId = options?.requestId;
    if (options?.cause) {
      this.cause = options.cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown, requestId?: string) {
    super(message, 400, 'VALIDATION_ERROR', { details, requestId });
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized: Authentication required', requestId?: string) {
    super(message, 401, 'UNAUTHORIZED', { requestId });
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden: Access denied', requestId?: string) {
    super(message, 403, 'FORBIDDEN', { requestId });
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', requestId?: string) {
    super(message, 404, 'NOT_FOUND', { requestId });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, requestId?: string) {
    super(message, 409, 'CONFLICT', { requestId });
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds = 60, message = 'Too many requests. Please slow down and try again later.', requestId?: string) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { details: { retryAfterSeconds }, requestId });
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'A database error occurred. Please try again later.', requestId?: string, cause?: unknown) {
    super(message, 500, 'DATABASE_ERROR', { requestId, cause });
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(serviceName: string, message = 'External service is temporarily unavailable. Please try again.', requestId?: string, cause?: unknown) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', { details: { serviceName }, requestId, cause });
    this.name = 'ExternalServiceError';
  }
}

export class TimeoutError extends AppError {
  constructor(operation = 'Operation', timeoutMs?: number, requestId?: string) {
    const msg = `${operation} timed out${timeoutMs ? ` after ${timeoutMs}ms` : ''}. Please retry.`;
    super(msg, 504, 'TIMEOUT_ERROR', { details: { operation, timeoutMs }, requestId });
    this.name = 'TimeoutError';
  }
}

export class SensitiveDataError extends AppError {
  constructor(message = 'Sensitive credentials detected in input', requestId?: string) {
    super(message, 400, 'SENSITIVE_DATA_DETECTED', { requestId });
    this.name = 'SensitiveDataError';
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(message = 'Invalid status transition', requestId?: string) {
    super(message, 400, 'INVALID_STATUS_TRANSITION', { requestId });
    this.name = 'InvalidStatusTransitionError';
  }
}

