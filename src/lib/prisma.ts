import { PrismaClient } from '@prisma/client';
import { inMemoryPrisma } from './inMemoryDb';
import { logger } from './logger';

const isDatabaseConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');

const TRANSIENT_CONNECTION_ERROR_CODES = new Set([
  'P1000', // Authentication failed
  'P1001', // Can't reach database server
  'P1002', // Database server timed out
  'P1003', // Database does not exist
  'P1008', // Operations timed out
  'P1017', // Server has closed the connection
  'P2024', // Timed out fetching a connection from pool
]);

function isDatabaseConnectionError(err: any): boolean {
  if (!err) return false;
  if (err?.name === 'PrismaClientInitializationError') return true;
  if (TRANSIENT_CONNECTION_ERROR_CODES.has(err?.code)) return true;

  const msg = typeof err?.message === 'string' ? err.message.toLowerCase() : '';
  return (
    msg.includes('environment variable not found: database_url') ||
    msg.includes("can't reach database server") ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('enotfound') ||
    msg.includes('econnreset') ||
    msg.includes('connection closed') ||
    msg.includes('timeout')
  );
}

function createPrismaProxy(): any {
  if (!isDatabaseConfigured) {
    logger.info('Database_RunningInMemory', {
      reason: 'DATABASE_URL not configured. Operating in high-fidelity in-memory demo mode.',
    });
    return inMemoryPrisma;
  }

  try {
    const realPrisma = new PrismaClient();

    // Wrap in a defensive proxy that delegates to real Prisma,
    // but automatically falls back to in-memory store if connection fails
    return new Proxy(realPrisma, {
      get(target: any, prop: string | symbol) {
        if (prop === '$transaction') {
          return async (fnOrArray: any) => {
            try {
              return await target.$transaction(fnOrArray);
            } catch (err: any) {
              if (isDatabaseConnectionError(err)) {
                logger.warn('Prisma_TransactionFallback', {
                  error: err?.message,
                  errorCode: err?.code,
                });
                return await inMemoryPrisma.$transaction(fnOrArray);
              }
              throw err;
            }
          };
        }

        const realModel = target[prop];
        const memoryModel = (inMemoryPrisma as any)[prop];

        if (!realModel && memoryModel) {
          return memoryModel;
        }

        if (typeof realModel === 'object' && realModel !== null) {
          return new Proxy(realModel, {
            get(mTarget: any, mProp: string | symbol) {
              const origMethod = mTarget[mProp];
              const memMethod = memoryModel ? memoryModel[mProp] : undefined;

              if (typeof origMethod === 'function') {
                return async (...args: any[]) => {
                  try {
                    return await origMethod.apply(mTarget, args);
                  } catch (err: any) {
                    if (isDatabaseConnectionError(err)) {
                      logger.warn('Prisma_MethodFallback', {
                        model: String(prop),
                        method: String(mProp),
                        errorCode: err?.code,
                        error: err?.message,
                      });
                      if (typeof memMethod === 'function') {
                        return await memMethod(...args);
                      }
                    }
                    throw err;
                  }
                };
              }
              return origMethod;
            },
          });
        }

        return realModel;
      },
    });
  } catch (err: any) {
    logger.warn('Prisma_InitFailed_UsingInMemory', { error: err?.message });
    return inMemoryPrisma;
  }
}

declare global {
  var prismaGlobal: any;
}

const prisma: any = globalThis.prismaGlobal ?? createPrismaProxy();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
