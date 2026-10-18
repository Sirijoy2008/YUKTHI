import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  TimeoutError,
  SensitiveDataError,
  InvalidStatusTransitionError,
} from './errors';
import {
  errorResponse,
  successResponse,
  sanitizeErrorMessage,
  handleApiError,
} from './apiResponse';
import { logger, redactSensitiveData, sanitizeString } from './logger';
import { checkRateLimit, resetRateLimit } from './rateLimiter';
import { withTimeout, withRetry, safeExternalFetch } from './resilience';
import { z } from 'zod';

describe('Complete End-to-End Error Handling Pipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Application Error Hierarchy
  // =========================================================================
  describe('1. Standard Application Error Hierarchy', () => {
    it('creates AppError with correct defaults and metadata', () => {
      const err = new AppError('Something went wrong', 500, 'INTERNAL_SERVER_ERROR', {
        requestId: 'req-123',
        details: { field: 'test' },
      });

      expect(err.statusCode).toBe(500);
      expect(err.errorCode).toBe('INTERNAL_SERVER_ERROR');
      expect(err.userMessage).toBe('Something went wrong');
      expect(err.requestId).toBe('req-123');
      expect(err.isOperational).toBe(true);
      expect(err.details).toEqual({ field: 'test' });
    });

    it('creates specific error subclasses with correct HTTP status codes', () => {
      expect(new ValidationError('Invalid input').statusCode).toBe(400);
      expect(new ValidationError('Invalid input').errorCode).toBe('VALIDATION_ERROR');

      expect(new UnauthorizedError().statusCode).toBe(401);
      expect(new UnauthorizedError().errorCode).toBe('UNAUTHORIZED');

      expect(new ForbiddenError().statusCode).toBe(403);
      expect(new ForbiddenError().errorCode).toBe('FORBIDDEN');

      expect(new NotFoundError().statusCode).toBe(404);
      expect(new NotFoundError().errorCode).toBe('NOT_FOUND');

      expect(new ConflictError('Duplicate key').statusCode).toBe(409);
      expect(new ConflictError('Duplicate key').errorCode).toBe('CONFLICT');

      const rateLimitErr = new RateLimitError(30);
      expect(rateLimitErr.statusCode).toBe(429);
      expect(rateLimitErr.errorCode).toBe('RATE_LIMIT_EXCEEDED');
      expect(rateLimitErr.retryAfterSeconds).toBe(30);

      expect(new DatabaseError().statusCode).toBe(500);
      expect(new DatabaseError().errorCode).toBe('DATABASE_ERROR');

      expect(new ExternalServiceError('SMSGateway').statusCode).toBe(502);
      expect(new ExternalServiceError('SMSGateway').errorCode).toBe('EXTERNAL_SERVICE_ERROR');

      expect(new TimeoutError('BankGateway', 5000).statusCode).toBe(504);
      expect(new TimeoutError('BankGateway', 5000).errorCode).toBe('TIMEOUT_ERROR');

      expect(new SensitiveDataError().statusCode).toBe(400);
      expect(new SensitiveDataError().errorCode).toBe('SENSITIVE_DATA_DETECTED');

      expect(new InvalidStatusTransitionError().statusCode).toBe(400);
      expect(new InvalidStatusTransitionError().errorCode).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  // =========================================================================
  // 2. Error Message Sanitization & Security Shield
  // =========================================================================
  describe('2. Error Message Sanitization & Security Shield', () => {
    it('returns userMessage for operational AppErrors', () => {
      const appErr = new ValidationError('Please enter a valid phone number');
      expect(sanitizeErrorMessage(appErr)).toBe('Please enter a valid phone number');
    });

    it('scrubs database credentials and connection strings', () => {
      const raw = new Error('FATAL: password authentication failed for postgresql://app_user:s3cr3t_pass@prod.db.com:5432/yukthi');
      const sanitized = sanitizeErrorMessage(raw);
      expect(sanitized).toBe('An internal database error occurred');
      expect(sanitized).not.toContain('s3cr3t_pass');
      expect(sanitized).not.toContain('postgresql://');
    });

    it('scrubs Prisma driver error codes and internal SQL statements', () => {
      const prismaErr = new Error('Raw query failed: SELECT * FROM user_profiles WHERE id = 123 (P2002)');
      expect(sanitizeErrorMessage(prismaErr)).toBe('An internal database error occurred');
    });

    it('scrubs file system paths and stack traces', () => {
      const traceErr = new Error('Crash in C:\\Users\\DELL\\project\\src\\index.ts\n  at Object.<anonymous> (file.ts:10:5)');
      expect(sanitizeErrorMessage(traceErr)).toBe('An unexpected error occurred. Please try again later.');
    });

    it('sanitizes string inputs containing database URLs', () => {
      const sanitized = sanitizeErrorMessage('Error connecting to postgres://admin:hunter2@db.org:5432');
      expect(sanitized).toBe('An internal database error occurred');
      expect(sanitized).not.toContain('hunter2');
    });

    it('converts timeout errors into friendly user messages', () => {
      const timeoutErr = new Error('connect ETIMEDOUT 10.0.0.1');
      expect(sanitizeErrorMessage(timeoutErr)).toBe('The request timed out. Please try again.');
    });
  });

  // =========================================================================
  // 3. Structured Server Logging & Data Redaction
  // =========================================================================
  describe('3. Structured Server Logging & Data Redaction', () => {
    it('redacts sensitive keys in objects recursively', () => {
      const payload = {
        userId: 'user-123',
        account: {
          password: 'plain_password',
          upiPin: '123456',
          otp: '998877',
          cvv: '999',
          cardNumber: '4111222233334444',
          aadhaar: '1234 5678 9012',
        },
        safeData: 'hello world',
      };

      const redacted = redactSensitiveData(payload);
      expect(redacted.account.password).toBe('[REDACTED]');
      expect(redacted.account.upiPin).toBe('[REDACTED]');
      expect(redacted.account.otp).toBe('[REDACTED]');
      expect(redacted.account.cvv).toBe('[REDACTED]');
      expect(redacted.account.cardNumber).toBe('[REDACTED]');
      expect(redacted.account.aadhaar).toBe('[REDACTED]');
      expect(redacted.safeData).toBe('hello world');
      expect(redacted.userId).toBe('user-123');
    });

    it('strips postgres connection credentials and bearer tokens from raw strings', () => {
      const raw = 'Connected to postgresql://admin:secret123@db.prod.internal:5432 with Bearer eyJhbGciOi...';
      const clean = sanitizeString(raw);
      expect(clean).toContain('postgres://admin:***@');
      expect(clean).toContain('Bearer ***');
      expect(clean).not.toContain('secret123');
    });

    it('emits structured JSON logs without leaking credentials', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.error('Database connection failed', new Error('Connection refused'), {
        route: '/api/test',
        requestId: 'req-999',
        password: 'do_not_log_me',
      });

      expect(consoleSpy).toHaveBeenCalled();
      const loggedJson = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(loggedJson.level).toBe('error');
      expect(loggedJson.route).toBe('/api/test');
      expect(loggedJson.requestId).toBe('req-999');
      expect(loggedJson.meta.password).toBe('[REDACTED]');
      expect(loggedJson.timestamp).toBeDefined();

      consoleSpy.mockRestore();
    });
  });

  // =========================================================================
  // 4. Central handleApiError Dispatcher
  // =========================================================================
  describe('4. Central handleApiError Dispatcher', () => {
    it('dispatches AppError with status and errorCode', async () => {
      const err = new NotFoundError('Payment case not found');
      const res = handleApiError(err, {
        requestId: 'req-404',
        route: '/api/payment-cases/123',
      });

      expect(res.status).toBe(404);
      expect(res.headers.get('x-request-id')).toBe('req-404');
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Payment case not found');
      expect(body.errorCode).toBe('NOT_FOUND');
      expect(body.requestId).toBe('req-404');
    });

    it('dispatches Zod validation errors with 400 and details', async () => {
      const schema = z.object({ amount: z.number().positive('Amount must be positive') });
      const parseResult = schema.safeParse({ amount: -50 });

      if (!parseResult.success) {
        const res = handleApiError(parseResult.error, {
          requestId: 'req-zod',
          route: '/api/test',
        });

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.success).toBe(false);
        expect(body.errorCode).toBe('VALIDATION_ERROR');
        expect(body.error).toBe('Amount must be positive');
        expect(body.details).toBeDefined();
      }
    });

    it('dispatches database/Prisma errors with 500 and DATABASE_ERROR', async () => {
      const dbErr = new Error('P1001: Cannot reach database server at localhost:5432');
      const res = handleApiError(dbErr, {
        requestId: 'req-db',
        route: '/api/activities',
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.errorCode).toBe('DATABASE_ERROR');
      expect(body.error).toBe('An internal database error occurred');
    });

    it('dispatches network timeouts with 504 and TIMEOUT_ERROR', async () => {
      const timeoutErr = new TimeoutError('ExternalBank', 5000);
      const res = handleApiError(timeoutErr, {
        requestId: 'req-timeout',
        route: '/api/payment-cases',
      });

      expect(res.status).toBe(504);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.errorCode).toBe('TIMEOUT_ERROR');
    });
  });

  // =========================================================================
  // 5. Rate Limiting Protection
  // =========================================================================
  describe('5. In-Memory Sliding-Window Rate Limiter', () => {
    it('permits requests within configured window and rate', () => {
      resetRateLimit('user-rl-1', 'test');
      const r1 = checkRateLimit('user-rl-1', { maxRequests: 3, windowMs: 1000, keyPrefix: 'test' });
      expect(r1.isAllowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit('user-rl-1', { maxRequests: 3, windowMs: 1000, keyPrefix: 'test' });
      expect(r2.isAllowed).toBe(true);
      expect(r2.remaining).toBe(1);
    });

    it('rejects requests exceeding limit with retryAfterSeconds', () => {
      resetRateLimit('user-rl-2', 'test');
      for (let i = 0; i < 3; i++) {
        checkRateLimit('user-rl-2', { maxRequests: 3, windowMs: 5000, keyPrefix: 'test' });
      }

      const rejected = checkRateLimit('user-rl-2', { maxRequests: 3, windowMs: 5000, keyPrefix: 'test' });
      expect(rejected.isAllowed).toBe(false);
      expect(rejected.remaining).toBe(0);
      expect(rejected.resetSeconds).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 6. External Service Resilience (Timeouts & Retries)
  // =========================================================================
  describe('6. Resilience: Timeouts, Controlled Retries, and safeExternalFetch', () => {
    it('withTimeout resolves when inner promise completes in time', async () => {
      const result = await withTimeout(Promise.resolve('OK'), 1000);
      expect(result).toBe('OK');
    });

    it('withTimeout rejects with TimeoutError if operation exceeds limit', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 500));
      await expect(withTimeout(slowPromise, 50, 'SlowTask')).rejects.toThrow(TimeoutError);
    });

    it('withRetry retries failed transient operations and succeeds', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Transient error');
        }
        return 'success';
      };

      const result = await withRetry(fn, {
        maxRetries: 2,
        initialDelayMs: 10,
        backoffFactor: 1,
      });

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('safeExternalFetch retries transient 5xx responses', async () => {
      let fetchCalls = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        fetchCalls++;
        if (fetchCalls === 1) {
          return { status: 503, ok: false } as Response;
        }
        return { status: 200, ok: true } as Response;
      });

      vi.stubGlobal('fetch', mockFetch);

      const res = await safeExternalFetch('https://api.external.com/verify', {
        retries: 2,
        timeoutMs: 1000,
        serviceName: 'TestExternal',
      });

      expect(res.status).toBe(200);
      expect(fetchCalls).toBe(2);

      vi.unstubAllGlobals();
    });

    it('safeExternalFetch converts aborts to TimeoutError', async () => {
      const mockFetch = vi.fn().mockImplementation(() => {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        return Promise.reject(err);
      });

      vi.stubGlobal('fetch', mockFetch);

      await expect(
        safeExternalFetch('https://api.external.com/slow', {
          retries: 0,
          timeoutMs: 50,
          serviceName: 'SlowGateway',
        })
      ).rejects.toThrow(TimeoutError);

      vi.unstubAllGlobals();
    });
  });

  // =========================================================================
  // 7. Success and Error Responses with Correlation IDs
  // =========================================================================
  describe('7. Standard Envelope Responses', () => {
    it('attaches correlation ID in headers and JSON payload for success', async () => {
      const res = successResponse({ balance: 500 }, 'Success message', 200, {
        requestId: 'corr-123',
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('x-request-id')).toBe('corr-123');
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.balance).toBe(500);
      expect(body.requestId).toBe('corr-123');
    });

    it('attaches correlation ID in headers and JSON payload for error', async () => {
      const res = errorResponse('Bad request', 400, {
        requestId: 'corr-err-999',
        errorCode: 'VALIDATION_ERROR',
      });

      expect(res.status).toBe(400);
      expect(res.headers.get('x-request-id')).toBe('corr-err-999');
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Bad request');
      expect(body.errorCode).toBe('VALIDATION_ERROR');
      expect(body.requestId).toBe('corr-err-999');
    });
  });
});
