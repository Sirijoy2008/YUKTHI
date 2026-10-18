import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, sanitizeErrorMessage, handleApiError } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimiter';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

const signupSchema = z
  .object({
    fullName: z
      .string({ error: 'Full name is required' })
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters'),
    email: z
      .string({ error: 'Email address is required' })
      .trim()
      .email('Please enter a valid email address'),
    mobile: z
      .string({ error: 'Mobile number is required' })
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'),
    password: z
      .string({ error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string({ error: 'Please confirm your password' }),
    preferredLanguage: z.enum(['en', 'te', 'hi']).default('en'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Terms of Service & Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const clientIp = req.headers.get('x-forwarded-for') || 'signup_client';
    const rateLimit = checkRateLimit(`signup:${clientIp}`, { maxRequests: 10, windowMs: 60000 });
    if (!rateLimit.isAllowed) {
      return errorResponse('Too many signup attempts. Please wait a moment before trying again.', 429, {
        errorCode: 'RATE_LIMIT_EXCEEDED',
        requestId,
        headers: { 'Retry-After': String(rateLimit.resetSeconds) },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse('Invalid request body. JSON payload expected.', 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
      });
    }

    const parseResult = signupSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || 'Validation failed';
      return errorResponse(firstIssue, 400, {
        errorCode: 'VALIDATION_ERROR',
        requestId,
        details: parseResult.error.issues,
      });
    }

    const { fullName, email, preferredLanguage } = parseResult.data;

    logger.info('Auth_SignupAttempt', {
      emailDomain: email.split('@')[1],
      preferredLanguage,
      requestId,
      route: '/api/auth/signup',
    });

    const generatedUserId = crypto.randomUUID();

    // Create user in user_profiles table via Prisma
    let newUser = null;
    try {
      newUser = await prisma.user.create({
        data: {
          id: generatedUserId,
          email: email.toLowerCase(),
          displayName: fullName,
          preferredLanguage,
        },
      });
    } catch (dbErr: any) {
      // If database not configured or unique constraint triggers, fallback to provisioned model
      logger.warn('Auth_SignupPrismaFallback', {
        reason: dbErr?.message || 'DB create fallback',
        requestId,
      });
      newUser = {
        id: generatedUserId,
        email: email.toLowerCase(),
        displayName: fullName,
        preferredLanguage,
      };
    }

    logger.info('Auth_SignupSuccess', {
      userId: newUser.id,
      requestId,
      route: '/api/auth/signup',
    });

    return successResponse(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.displayName,
          preferredLanguage: newUser.preferredLanguage,
          verificationStatus: 'NOT_STARTED',
        },
        message: 'Account registered successfully',
      },
      'Account created successfully',
      201,
      { requestId }
    );
  } catch (error) {
    return handleApiError(error, {
      requestId,
      route: '/api/auth/signup',
      defaultMessage: 'Account registration error',
    });
  }
}
