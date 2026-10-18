/**
 * In-memory sliding-window rate limiter for Route Handlers.
 * Protects endpoints from abuse and brute-force attempts without external dependencies.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 300000); // 5 minutes
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export interface RateLimitOptions {
  windowMs?: number; // Time window in ms (default: 60,000ms = 1 min)
  maxRequests?: number; // Maximum requests allowed in window (default: 60)
  keyPrefix?: string;
}

export interface RateLimitResult {
  isAllowed: boolean;
  remaining: number;
  resetSeconds: number;
  totalLimit: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const windowMs = options.windowMs ?? 60000;
  const maxRequests = options.maxRequests ?? 60;
  const key = `${options.keyPrefix || 'rl'}:${identifier}`;

  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Remove timestamps outside window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));
    return {
      isAllowed: false,
      remaining: 0,
      resetSeconds,
      totalLimit: maxRequests,
    };
  }

  // Record this request
  record.timestamps.push(now);
  const remaining = maxRequests - record.timestamps.length;
  const resetSeconds = Math.ceil(windowMs / 1000);

  return {
    isAllowed: true,
    remaining,
    resetSeconds,
    totalLimit: maxRequests,
  };
}

/**
 * Resets rate limit for a specific key (useful for tests or successful auth)
 */
export function resetRateLimit(identifier: string, prefix = 'rl'): void {
  rateLimitStore.delete(`${prefix}:${identifier}`);
}
