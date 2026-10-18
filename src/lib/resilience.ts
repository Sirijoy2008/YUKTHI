/**
 * Resilience utilities for backend and external service interactions:
 * - Timeouts
 * - Retries with exponential backoff and jitter
 * - Safe network calls
 */

import { TimeoutError, ExternalServiceError } from './errors';
import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  operationName?: string;
  shouldRetry?: (error: any) => boolean;
}

/**
 * Executes an async operation with a hard timeout.
 * Rejects with a TimeoutError if the operation takes longer than timeoutMs.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName = 'Operation'
): Promise<T> {
  let timer: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new TimeoutError(operationName, timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Executes an async operation with controlled exponential backoff retries.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const initialDelayMs = options.initialDelayMs ?? 200;
  const maxDelayMs = options.maxDelayMs ?? 2000;
  const backoffFactor = options.backoffFactor ?? 2;
  const operationName = options.operationName ?? 'Operation';

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err: any) {
      lastError = err;

      // Check if we should retry this specific error
      if (options.shouldRetry && !options.shouldRetry(err)) {
        throw err;
      }

      if (attempt === maxRetries) {
        break;
      }

      const delay = Math.min(
        initialDelayMs * Math.pow(backoffFactor, attempt) + Math.random() * 50,
        maxDelayMs
      );

      logger.warn(`Retrying_${operationName}`, {
        attempt: attempt + 1,
        maxRetries,
        delayMs: Math.round(delay),
        error: err?.message || String(err),
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Safe fetch wrapper for external services with configurable timeout and retries.
 * Prevents unhandled network crashes, DNS failures, or hanging connections.
 */
export async function safeExternalFetch(
  url: string,
  options: RequestInit & { timeoutMs?: number; serviceName?: string; retries?: number } = {}
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const serviceName = options.serviceName ?? 'ExternalService';
  const retries = options.retries ?? 1;

  return withRetry(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        if (res.status >= 500) {
          throw new ExternalServiceError(
            serviceName,
            `${serviceName} returned status ${res.status}`,
            undefined
          );
        }

        return res;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new TimeoutError(serviceName, timeoutMs);
        }
        throw new ExternalServiceError(
          serviceName,
          `Failed to connect to ${serviceName}: ${err.message || 'Network failure'}`,
          undefined,
          err
        );
      } finally {
        clearTimeout(timeoutId);
      }
    },
    {
      maxRetries: retries,
      operationName: `fetch_${serviceName}`,
      shouldRetry: (err) => err instanceof ExternalServiceError || err instanceof TimeoutError,
    }
  );
}
