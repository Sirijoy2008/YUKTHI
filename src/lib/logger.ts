/**
 * Safe structured server-side logger for YUKTHI / FINOVA.
 * Automatically redacts sensitive fields (passwords, PINs, OTPs, tokens, CVVs, database credentials)
 * and formats logs with ISO timestamps, correlation IDs, and error codes.
 */

const SENSITIVE_KEY_REGEX =
  /password|pass|pin|otp|secret|token|auth|bearer|cookie|jwt|cvv|aadhaar|card|credential|database_url|connstring/i;

const DATABASE_URL_REGEX =
  /postgres(ql)?:\/\/([^:]+):([^@]+)@/gi;

/**
 * Strips database credentials and obvious tokens from any free-form string.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;
  return input
    .replace(DATABASE_URL_REGEX, 'postgres://$2:***@')
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer ***');
}

/**
 * Recursively deep-clones an object while replacing sensitive keys with '[REDACTED]'.
 */
export function redactSensitiveData<T = any>(data: T, depth = 0): T {
  if (depth > 6 || data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeString(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1)) as unknown as T;
  }

  if (typeof data === 'object') {
    // If it's a Buffer, Date, RegExp, etc.
    if (data instanceof Date || data instanceof RegExp) {
      return data;
    }

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = redactSensitiveData(value, depth + 1);
      } else if (typeof value === 'string') {
        result[key] = sanitizeString(value);
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }

  return data;
}

export interface LogContext {
  requestId?: string;
  route?: string;
  errorCode?: string;
  userId?: string;
  [key: string]: any;
}

export const logger = {
  info: (message: string, meta?: LogContext | any) => {
    const cleanMeta = meta ? redactSensitiveData(meta) : undefined;
    const logPayload: Record<string, any> = {
      level: 'info',
      message: sanitizeString(message),
      timestamp: new Date().toISOString(),
    };
    if (cleanMeta?.requestId) logPayload.requestId = cleanMeta.requestId;
    if (cleanMeta?.route) logPayload.route = cleanMeta.route;
    if (cleanMeta?.errorCode) logPayload.errorCode = cleanMeta.errorCode;
    if (cleanMeta) logPayload.meta = cleanMeta;

    console.log(JSON.stringify(logPayload));
  },

  warn: (message: string, meta?: LogContext | any) => {
    const cleanMeta = meta ? redactSensitiveData(meta) : undefined;
    const logPayload: Record<string, any> = {
      level: 'warn',
      message: sanitizeString(message),
      timestamp: new Date().toISOString(),
    };
    if (cleanMeta?.requestId) logPayload.requestId = cleanMeta.requestId;
    if (cleanMeta?.route) logPayload.route = cleanMeta.route;
    if (cleanMeta?.errorCode) logPayload.errorCode = cleanMeta.errorCode;
    if (cleanMeta) logPayload.meta = cleanMeta;

    console.warn(JSON.stringify(logPayload));
  },

  error: (message: string, error?: any, meta?: LogContext | any) => {
    const cleanMeta = meta ? redactSensitiveData(meta) : undefined;

    let safeError: any;
    if (error instanceof Error) {
      safeError = {
        name: error.name,
        message: sanitizeString(error.message),
        ...(error as any).code ? { code: (error as any).code } : {},
      };
      // Keep stack sanitized and truncated in dev / server logs without leaking credentials
      if (error.stack && process.env.NODE_ENV !== 'production') {
        safeError.stack = sanitizeString(error.stack.split('\n').slice(0, 5).join('\n'));
      }
    } else if (error && typeof error === 'object') {
      safeError = redactSensitiveData(error);
    } else if (error !== undefined) {
      safeError = sanitizeString(String(error));
    }

    const logPayload: Record<string, any> = {
      level: 'error',
      message: sanitizeString(message),
      timestamp: new Date().toISOString(),
    };

    const requestId = cleanMeta?.requestId || (error as any)?.requestId;
    const route = cleanMeta?.route;
    const errorCode = cleanMeta?.errorCode || (error as any)?.errorCode;

    if (requestId) logPayload.requestId = requestId;
    if (route) logPayload.route = route;
    if (errorCode) logPayload.errorCode = errorCode;
    if (safeError !== undefined) logPayload.error = safeError;
    if (cleanMeta) logPayload.meta = cleanMeta;

    console.error(JSON.stringify(logPayload));
  },
};
