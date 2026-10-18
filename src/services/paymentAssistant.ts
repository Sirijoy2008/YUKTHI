import prisma from '@/lib/prisma';
import { ActivityType, ActivityStatus } from '@prisma/client';
import {
  PaymentIssueType,
  getPaymentGuidance,
  getVerificationStatus,
  containsSensitiveCredentials,
  PAYMENT_ASSISTANT_DISCLAIMER
} from './paymentGuidance';

import {
  NotFoundError,
  ForbiddenError,
  SensitiveDataError as BaseSensitiveDataError,
  InvalidStatusTransitionError as BaseInvalidStatusTransitionError
} from '@/lib/errors';

export type ResolutionStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export const VALID_ISSUE_TYPES: PaymentIssueType[] = [
  'FAILED',
  'PENDING',
  'DELAYED',
  'DEBITED_NOT_CREDITED'
];

export const VALID_RESOLUTION_STATUSES: ResolutionStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED'
];

export class PaymentCaseNotFoundError extends NotFoundError {
  constructor(message: string, requestId?: string) {
    super(message, requestId);
    this.name = 'PaymentCaseNotFoundError';
  }
}

export class PaymentCaseForbiddenError extends ForbiddenError {
  constructor(message: string, requestId?: string) {
    super(message, requestId);
    this.name = 'PaymentCaseForbiddenError';
  }
}

export class InvalidStatusTransitionError extends BaseInvalidStatusTransitionError {
  constructor(message: string, requestId?: string) {
    super(message, requestId);
    this.name = 'InvalidStatusTransitionError';
  }
}

export class SensitiveDataError extends BaseSensitiveDataError {
  constructor(message: string, requestId?: string) {
    super(message, requestId);
    this.name = 'SensitiveDataError';
  }
}

const PERMITTED_TRANSITIONS: Record<ResolutionStatus, ResolutionStatus[]> = {
  OPEN: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['OPEN', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'OPEN'],
  CLOSED: ['OPEN']
};

export function isValidStatusTransition(
  currentStatus: ResolutionStatus,
  targetStatus: ResolutionStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = PERMITTED_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

export interface CreatePaymentCaseInput {
  issueType: PaymentIssueType;
  amount: number;
  currency?: string;
  type?: ActivityType;
  date: Date;
  referenceNumber?: string | null;
  nextActionDate?: Date | null;
  notes?: string | null;
}

export interface UpdatePaymentCaseInput {
  resolutionStatus?: ResolutionStatus;
  nextActionDate?: Date | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

export function formatPaymentCaseResponse(
  paymentCase: any,
  financialActivity: any
) {
  const guidance = getPaymentGuidance(paymentCase.issueType as PaymentIssueType);
  const verification = getVerificationStatus(paymentCase.issueType);

  return {
    case: {
      id: paymentCase.id,
      financialActivityId: paymentCase.financialActivityId,
      issueType: paymentCase.issueType,
      resolutionStatus: paymentCase.resolutionStatus,
      nextActionDate: paymentCase.nextActionDate ? new Date(paymentCase.nextActionDate).toISOString() : null,
      notes: paymentCase.issueDescription ?? paymentCase.notes ?? null,
      createdAt: new Date(paymentCase.createdAt).toISOString(),
      updatedAt: new Date(paymentCase.updatedAt).toISOString(),
      financialActivity: {
        id: financialActivity.id,
        userId: financialActivity.userId,
        type: financialActivity.type,
        amount: financialActivity.amount,
        currency: financialActivity.currency,
        status: financialActivity.status,
        date: new Date(financialActivity.date).toISOString(),
        referenceNumber: financialActivity.referenceNumber ?? null,
      }
    },
    verification,
    guidance,
    disclaimer: PAYMENT_ASSISTANT_DISCLAIMER
  };
}

export async function createPaymentCase(userId: string, input: CreatePaymentCaseInput) {
  if (containsSensitiveCredentials(input.referenceNumber) || containsSensitiveCredentials(input.notes)) {
    throw new SensitiveDataError(
      'Reference number and notes cannot contain credentials such as PIN, OTP, password, or CVV'
    );
  }

  if (input.amount <= 0 || !Number.isInteger(input.amount)) {
    throw new Error('Amount must be a positive integer in minor units (paise)');
  }

  const activityStatus: ActivityStatus =
    input.issueType === 'FAILED' ? ActivityStatus.FAILED : ActivityStatus.UNCONFIRMED;

  const financialActivity = await prisma.financialActivity.create({
    data: {
      userId,
      type: input.type || ActivityType.EXPENSE,
      amount: input.amount,
      currency: input.currency || 'INR',
      status: activityStatus,
      date: input.date,
      referenceNumber: input.referenceNumber || null,
      paymentCase: {
        create: {
          issueType: input.issueType,
          resolutionStatus: 'OPEN',
          nextActionDate: input.nextActionDate || null,
          ...(input.notes ? { issueDescription: input.notes } : {}),
        }
      }
    },
    include: {
      paymentCase: true,
    }
  });

  if (!financialActivity.paymentCase) {
    throw new Error('Failed to create payment case record');
  }

  return formatPaymentCaseResponse(financialActivity.paymentCase, financialActivity);
}

export async function getPaymentCases(userId: string) {
  const cases = await prisma.paymentCase.findMany({
    where: {
      financialActivity: {
        userId,
      }
    },
    include: {
      financialActivity: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  return cases.map((c: any) => formatPaymentCaseResponse(c, c.financialActivity));
}

export async function getPaymentCaseById(userId: string, caseId: string) {
  const paymentCase = await prisma.paymentCase.findUnique({
    where: { id: caseId },
    include: {
      financialActivity: true,
    }
  });

  if (!paymentCase) {
    throw new PaymentCaseNotFoundError(`Payment case with ID ${caseId} not found`);
  }

  if (paymentCase.financialActivity.userId !== userId) {
    throw new PaymentCaseForbiddenError('User is not authorized to access this payment case');
  }

  return formatPaymentCaseResponse(paymentCase, paymentCase.financialActivity);
}

export async function updatePaymentCase(
  userId: string,
  caseId: string,
  input: UpdatePaymentCaseInput
) {
  const existingCase = await prisma.paymentCase.findUnique({
    where: { id: caseId },
    include: {
      financialActivity: true,
    }
  });

  if (!existingCase) {
    throw new PaymentCaseNotFoundError(`Payment case with ID ${caseId} not found`);
  }

  if (existingCase.financialActivity.userId !== userId) {
    throw new PaymentCaseForbiddenError('User is not authorized to access this payment case');
  }

  if (input.referenceNumber && containsSensitiveCredentials(input.referenceNumber)) {
    throw new SensitiveDataError(
      'Reference number cannot contain credentials such as PIN, OTP, password, or CVV'
    );
  }

  if (input.resolutionStatus && input.resolutionStatus !== existingCase.resolutionStatus) {
    if (!VALID_RESOLUTION_STATUSES.includes(input.resolutionStatus)) {
      throw new InvalidStatusTransitionError(`Invalid resolution status: ${input.resolutionStatus}`);
    }

    if (
      !isValidStatusTransition(
        existingCase.resolutionStatus as ResolutionStatus,
        input.resolutionStatus
      )
    ) {
      throw new InvalidStatusTransitionError(
        `Invalid status transition from '${existingCase.resolutionStatus}' to '${input.resolutionStatus}'`
      );
    }
  }

  const updateData: any = {};
  if (input.resolutionStatus) {
    updateData.resolutionStatus = input.resolutionStatus;
  }
  if (input.nextActionDate !== undefined) {
    updateData.nextActionDate = input.nextActionDate;
  }

  const activityUpdateData: any = {};
  if (input.referenceNumber !== undefined) {
    activityUpdateData.referenceNumber = input.referenceNumber;
  }
  if (input.resolutionStatus === 'RESOLVED') {
    activityUpdateData.status = ActivityStatus.CONFIRMED;
  }

  const updatedCase = await prisma.paymentCase.update({
    where: { id: caseId },
    data: {
      ...updateData,
      ...(Object.keys(activityUpdateData).length > 0
        ? {
            financialActivity: {
              update: activityUpdateData,
            }
          }
        : {})
    },
    include: {
      financialActivity: true,
    }
  });

  return formatPaymentCaseResponse(updatedCase, updatedCase.financialActivity);
}
