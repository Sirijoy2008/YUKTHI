import crypto from 'crypto';
import { ActivityType, ActivityStatus } from '@prisma/client';

export interface InMemoryUser {
  id: string;
  email: string | null;
  displayName: string | null;
  preferredLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryFinancialActivity {
  id: string;
  userId: string;
  type: ActivityType;
  amount: number;
  currency: string;
  status: ActivityStatus;
  date: Date;
  referenceNumber: string | null;
  title: string | null;
  description: string | null;
  sourceModule: string | null;
  confidenceOrVerificationState: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryPaymentCase {
  id: string;
  userId: string | null;
  financialActivityId: string;
  paymentMethod: string | null;
  issueType: string;
  reportedStatus: string | null;
  verificationStatus: string | null;
  amount: number | null;
  currency: string | null;
  referenceNumber: string | null;
  issueDescription: string | null;
  resolutionStatus: string;
  nextActionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryCashFlowItem {
  id: string;
  userId: string;
  financialActivityId: string | null;
  amount: number;
  currency: string;
  isIncome: boolean;
  isConfirmed: boolean;
  availabilityStatus: string | null;
  dueDate: Date | null;
  description: string | null;
  scenarioId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryRiskAssessment {
  id: string;
  userId: string | null;
  financialActivityId: string | null;
  indicatorsFound: string[];
  riskLevel: string;
  assessmentMethod: string | null;
  limitationsDisclosed: boolean | null;
  createdAt: Date;
}

export interface InMemoryActionCentreItem {
  id: string;
  userId: string;
  financialActivityId: string | null;
  paymentCaseId: string | null;
  title: string;
  description: string | null;
  urgency: string;
  status: string;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryDatabase {
  users: InMemoryUser[];
  financialActivities: InMemoryFinancialActivity[];
  paymentCases: InMemoryPaymentCase[];
  cashFlowItems: InMemoryCashFlowItem[];
  riskAssessments: InMemoryRiskAssessment[];
  actionCentreItems: InMemoryActionCentreItem[];
}

function generateUuid(): string {
  return crypto.randomUUID();
}

function initializeSeedData(): InMemoryDatabase {
  const defaultUserId = 'user-123';
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const act1Id = 'act-seed-1';
  const act2Id = 'act-seed-2';
  const act3Id = 'act-seed-3';

  return {
    users: [
      {
        id: defaultUserId,
        email: 'ananya.sharma@yukthi.in',
        displayName: 'Ananya Sharma',
        preferredLanguage: 'en',
        createdAt: twoDaysAgo,
        updatedAt: now,
      },
    ],
    financialActivities: [
      {
        id: act1Id,
        userId: defaultUserId,
        type: ActivityType.EXPENSE,
        amount: 249900, // ₹2,499.00
        currency: 'INR',
        status: ActivityStatus.UNCONFIRMED,
        date: yesterday,
        referenceNumber: '429182749102',
        title: 'Merchant UPI Transfer (Disputed)',
        description: 'Debited but merchant store claims money was not credited.',
        sourceModule: 'PAYMENT_ASSISTANT',
        confidenceOrVerificationState: 'USER_REPORTED',
        createdAt: yesterday,
        updatedAt: yesterday,
      },
      {
        id: act2Id,
        userId: defaultUserId,
        type: ActivityType.INCOME,
        amount: 4500000, // ₹45,000.00
        currency: 'INR',
        status: ActivityStatus.CONFIRMED,
        date: twoDaysAgo,
        referenceNumber: '992837162534',
        title: 'Consulting Honorarium Receipt',
        description: 'Direct NEFT deposit confirmed in account.',
        sourceModule: 'FINANCIAL_ACTIVITY',
        confidenceOrVerificationState: 'CONFIRMED',
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
      {
        id: act3Id,
        userId: defaultUserId,
        type: ActivityType.EXPENSE,
        amount: 850000, // ₹8,500.00
        currency: 'INR',
        status: ActivityStatus.CONFIRMED,
        date: twoDaysAgo,
        referenceNumber: '110293847562',
        title: 'Office Rental & Cloud Hosting',
        description: 'Auto-debited utility and workstation cost.',
        sourceModule: 'FINANCIAL_ACTIVITY',
        confidenceOrVerificationState: 'CONFIRMED',
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
    ],
    paymentCases: [
      {
        id: 'case-seed-1',
        userId: defaultUserId,
        financialActivityId: act1Id,
        paymentMethod: 'UPI',
        issueType: 'DEBITED_NOT_CREDITED',
        reportedStatus: 'DISPUTED',
        verificationStatus: 'UNVERIFIED',
        amount: 249900,
        currency: 'INR',
        referenceNumber: '429182749102',
        issueDescription: 'Amount debited via UPI QR but merchant PoS failed.',
        resolutionStatus: 'OPEN',
        nextActionDate: tomorrow,
        createdAt: yesterday,
        updatedAt: yesterday,
      },
    ],
    cashFlowItems: [
      {
        id: 'cf-seed-1',
        userId: defaultUserId,
        financialActivityId: null,
        amount: 1500000, // ₹15,000.00
        currency: 'INR',
        isIncome: true,
        isConfirmed: false,
        availabilityStatus: 'PENDING',
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        description: 'Expected Advisory Retainer Payment',
        scenarioId: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cf-seed-2',
        userId: defaultUserId,
        financialActivityId: null,
        amount: 400000, // ₹4,000.00
        currency: 'INR',
        isIncome: false,
        isConfirmed: true,
        availabilityStatus: 'SCHEDULED',
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        description: 'Telecom & Fiber Broadband Bill',
        scenarioId: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    riskAssessments: [
      {
        id: 'risk-seed-1',
        userId: defaultUserId,
        financialActivityId: null,
        indicatorsFound: ['URGENT_CALL_TO_ACTION', 'SUSPICIOUS_PAYMENT_LINK'],
        riskLevel: 'HIGH',
        assessmentMethod: 'RULE_ENGINE_V1',
        limitationsDisclosed: true,
        createdAt: yesterday,
      },
    ],
    actionCentreItems: [],
  };
}

declare global {
  var __yukthi_memory_db: InMemoryDatabase | undefined;
  var __finova_memory_db: InMemoryDatabase | undefined;
}

export function getInMemoryDb(): InMemoryDatabase {
  if (!globalThis.__yukthi_memory_db && !globalThis.__finova_memory_db) {
    const initialized = initializeSeedData();
    globalThis.__yukthi_memory_db = initialized;
    globalThis.__finova_memory_db = initialized;
  }
  return globalThis.__yukthi_memory_db || globalThis.__finova_memory_db!;
}

// ---------------------------------------------------------------------------
// High-Fidelity Prisma-Compatible Mock Operations
// ---------------------------------------------------------------------------

export const inMemoryPrisma = {
  user: {
    findUnique: async (args: { where: { id?: string; email?: string } }) => {
      const db = getInMemoryDb();
      if (args.where.id) {
        return db.users.find((u) => u.id === args.where.id) || null;
      }
      if (args.where.email) {
        const needle = args.where.email.toLowerCase();
        return db.users.find((u) => u.email?.toLowerCase() === needle) || null;
      }
      return null;
    },
    findFirst: async (args?: { where?: any }) => {
      const db = getInMemoryDb();
      if (!args?.where) return db.users[0] || null;
      if (args.where.OR && Array.isArray(args.where.OR)) {
        for (const condition of args.where.OR) {
          const matched = db.users.find((u) => {
            if (condition.email?.contains && u.email?.toLowerCase().includes(condition.email.contains.toLowerCase())) {
              return true;
            }
            if (condition.displayName?.contains && u.displayName?.toLowerCase().includes(condition.displayName.contains.toLowerCase())) {
              return true;
            }
            return false;
          });
          if (matched) return matched;
        }
      }
      return db.users[0] || null;
    },
    create: async (args: { data: { email?: string; displayName?: string; preferredLanguage?: string } }) => {
      const db = getInMemoryDb();
      const newUser: InMemoryUser = {
        id: generateUuid(),
        email: args.data.email?.toLowerCase() || null,
        displayName: args.data.displayName || null,
        preferredLanguage: args.data.preferredLanguage || 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.users.push(newUser);
      return newUser;
    },
  },

  financialActivity: {
    findMany: async (args?: {
      where?: {
        userId?: string;
        status?: ActivityStatus | { in?: ActivityStatus[] };
        type?: ActivityType;
        paymentCase?: any;
      };
      include?: { paymentCase?: boolean; riskAssessment?: boolean };
      orderBy?: { date?: 'asc' | 'desc'; createdAt?: 'asc' | 'desc' };
    }) => {
      const db = getInMemoryDb();
      let list = [...db.financialActivities];

      if (args?.where) {
        const { userId, status, type, paymentCase } = args.where;
        if (userId) {
          list = list.filter((a) => a.userId === userId);
        }
        if (type) {
          list = list.filter((a) => a.type === type);
        }
        if (status) {
          if (typeof status === 'string') {
            list = list.filter((a) => a.status === status);
          } else if (status.in && Array.isArray(status.in)) {
            list = list.filter((a) => status.in!.includes(a.status));
          }
        }
        if (paymentCase === null) {
          const caseActivityIds = new Set(db.paymentCases.map((pc) => pc.financialActivityId));
          list = list.filter((a) => !caseActivityIds.has(a.id));
        }
      }

      if (args?.orderBy?.date === 'desc') {
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else if (args?.orderBy?.date === 'asc') {
        list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }

      return list.map((a) => {
        const result: any = { ...a };
        if (args?.include?.paymentCase) {
          result.paymentCase = db.paymentCases.find((pc) => pc.financialActivityId === a.id) || null;
        }
        if (args?.include?.riskAssessment) {
          result.riskAssessment = db.riskAssessments.find((r) => r.financialActivityId === a.id) || null;
        }
        return result;
      });
    },

    findUnique: async (args: {
      where: { id: string };
      include?: { paymentCase?: boolean; riskAssessment?: boolean };
    }) => {
      const db = getInMemoryDb();
      const activity = db.financialActivities.find((a) => a.id === args.where.id);
      if (!activity) return null;

      const result: any = { ...activity };
      if (args?.include?.paymentCase) {
        result.paymentCase = db.paymentCases.find((pc) => pc.financialActivityId === activity.id) || null;
      }
      if (args?.include?.riskAssessment) {
        result.riskAssessment = db.riskAssessments.find((r) => r.financialActivityId === activity.id) || null;
      }
      return result;
    },

    findFirst: async (args: {
      where: { userId?: string; referenceNumber?: string };
      include?: { paymentCase?: boolean; riskAssessment?: boolean };
    }) => {
      const db = getInMemoryDb();
      const activity = db.financialActivities.find((a) => {
        if (args.where.userId && a.userId !== args.where.userId) return false;
        if (args.where.referenceNumber && a.referenceNumber !== args.where.referenceNumber) return false;
        return true;
      });
      if (!activity) return null;

      const result: any = { ...activity };
      if (args?.include?.paymentCase) {
        result.paymentCase = db.paymentCases.find((pc) => pc.financialActivityId === activity.id) || null;
      }
      if (args?.include?.riskAssessment) {
        result.riskAssessment = db.riskAssessments.find((r) => r.financialActivityId === activity.id) || null;
      }
      return result;
    },

    create: async (args: {
      data: {
        userId: string;
        type: ActivityType;
        amount: number;
        currency?: string;
        status: ActivityStatus;
        date: Date;
        referenceNumber?: string | null;
        title?: string | null;
        description?: string | null;
        paymentCase?: {
          create: {
            issueType: string;
            resolutionStatus?: string;
            nextActionDate?: Date | null;
          };
        };
      };
      include?: { paymentCase?: boolean; riskAssessment?: boolean };
    }) => {
      const db = getInMemoryDb();
      const activityId = generateUuid();
      const now = new Date();

      const newActivity: InMemoryFinancialActivity = {
        id: activityId,
        userId: args.data.userId,
        type: args.data.type,
        amount: args.data.amount,
        currency: args.data.currency || 'INR',
        status: args.data.status,
        date: new Date(args.data.date),
        referenceNumber: args.data.referenceNumber || null,
        title: args.data.title || 'Financial Activity',
        description: args.data.description || null,
        sourceModule: args.data.paymentCase ? 'PAYMENT_ASSISTANT' : 'FINANCIAL_ACTIVITY',
        confidenceOrVerificationState: 'USER_REPORTED',
        createdAt: now,
        updatedAt: now,
      };

      db.financialActivities.push(newActivity);

      let createdPaymentCase: InMemoryPaymentCase | null = null;
      if (args.data.paymentCase?.create) {
        const pcData = args.data.paymentCase.create;
        createdPaymentCase = {
          id: generateUuid(),
          userId: args.data.userId,
          financialActivityId: activityId,
          paymentMethod: 'UPI',
          issueType: pcData.issueType,
          reportedStatus: 'DISPUTED',
          verificationStatus: 'UNVERIFIED',
          amount: args.data.amount,
          currency: args.data.currency || 'INR',
          referenceNumber: args.data.referenceNumber || null,
          issueDescription: (pcData as any).issueDescription || (pcData as any).notes || null,
          resolutionStatus: pcData.resolutionStatus || 'OPEN',
          nextActionDate: pcData.nextActionDate ? new Date(pcData.nextActionDate) : null,
          createdAt: now,
          updatedAt: now,
        };
        db.paymentCases.push(createdPaymentCase);
      }

      const result: any = { ...newActivity };
      if (args.include?.paymentCase) {
        result.paymentCase = createdPaymentCase;
      }
      if (args.include?.riskAssessment) {
        result.riskAssessment = null;
      }

      return result;
    },

    update: async (args: {
      where: { id: string };
      data: Partial<InMemoryFinancialActivity>;
      include?: { paymentCase?: boolean; riskAssessment?: boolean };
    }) => {
      const db = getInMemoryDb();
      const index = db.financialActivities.findIndex((a) => a.id === args.where.id);
      if (index === -1) {
        throw new Error(`FinancialActivity with id ${args.where.id} not found`);
      }

      const existing = db.financialActivities[index];
      const updated: InMemoryFinancialActivity = {
        ...existing,
        ...args.data,
        updatedAt: new Date(),
      };
      db.financialActivities[index] = updated;

      const result: any = { ...updated };
      if (args.include?.paymentCase) {
        result.paymentCase = db.paymentCases.find((pc) => pc.financialActivityId === updated.id) || null;
      }
      if (args.include?.riskAssessment) {
        result.riskAssessment = db.riskAssessments.find((r) => r.financialActivityId === updated.id) || null;
      }

      return result;
    },
  },

  paymentCase: {
    findMany: async (args?: {
      where?: {
        financialActivity?: { userId: string };
        userId?: string;
        resolutionStatus?: string | { in?: string[] };
      };
      include?: { financialActivity?: boolean };
      orderBy?: { createdAt?: 'asc' | 'desc' };
    }) => {
      const db = getInMemoryDb();
      let list = [...db.paymentCases];

      if (args?.where) {
        const targetUserId = args.where.financialActivity?.userId || args.where.userId;
        if (targetUserId) {
          list = list.filter((pc) => {
            if (pc.userId === targetUserId) return true;
            const act = db.financialActivities.find((a) => a.id === pc.financialActivityId);
            return act?.userId === targetUserId;
          });
        }

        const resStatus = args.where.resolutionStatus;
        if (resStatus) {
          if (typeof resStatus === 'string') {
            list = list.filter((pc) => pc.resolutionStatus === resStatus);
          } else if (resStatus.in && Array.isArray(resStatus.in)) {
            list = list.filter((pc) => resStatus.in!.includes(pc.resolutionStatus));
          }
        }
      }

      if (args?.orderBy?.createdAt === 'desc') {
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (args?.orderBy?.createdAt === 'asc') {
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }

      return list.map((pc) => {
        const result: any = { ...pc };
        if (args?.include?.financialActivity) {
          result.financialActivity = db.financialActivities.find((a) => a.id === pc.financialActivityId) || null;
        }
        return result;
      });
    },

    findUnique: async (args: {
      where: { id: string };
      include?: { financialActivity?: boolean };
    }) => {
      const db = getInMemoryDb();
      const pc = db.paymentCases.find((c) => c.id === args.where.id);
      if (!pc) return null;

      const result: any = { ...pc };
      if (args?.include?.financialActivity) {
        result.financialActivity = db.financialActivities.find((a) => a.id === pc.financialActivityId) || null;
      }
      return result;
    },

    create: async (args: {
      data: {
        userId?: string | null;
        financialActivityId: string;
        paymentMethod?: string | null;
        issueType: string;
        reportedStatus?: string | null;
        verificationStatus?: string | null;
        amount?: number | null;
        currency?: string | null;
        referenceNumber?: string | null;
        issueDescription?: string | null;
        resolutionStatus?: string;
        nextActionDate?: Date | null;
      };
      include?: { financialActivity?: boolean };
    }) => {
      const db = getInMemoryDb();
      const now = new Date();
      const newPc: InMemoryPaymentCase = {
        id: generateUuid(),
        userId: args.data.userId || null,
        financialActivityId: args.data.financialActivityId,
        paymentMethod: args.data.paymentMethod || 'UPI',
        issueType: args.data.issueType,
        reportedStatus: args.data.reportedStatus || 'DISPUTED',
        verificationStatus: args.data.verificationStatus || 'UNVERIFIED',
        amount: args.data.amount || null,
        currency: args.data.currency || 'INR',
        referenceNumber: args.data.referenceNumber || null,
        issueDescription: args.data.issueDescription || null,
        resolutionStatus: args.data.resolutionStatus || 'OPEN',
        nextActionDate: args.data.nextActionDate ? new Date(args.data.nextActionDate) : null,
        createdAt: now,
        updatedAt: now,
      };

      db.paymentCases.push(newPc);

      const result: any = { ...newPc };
      if (args.include?.financialActivity) {
        result.financialActivity = db.financialActivities.find((a) => a.id === newPc.financialActivityId) || null;
      }
      return result;
    },

    update: async (args: {
      where: { id: string };
      data: {
        resolutionStatus?: string;
        nextActionDate?: Date | null;
        financialActivity?: {
          update: {
            referenceNumber?: string;
            status?: ActivityStatus;
          };
        };
      };
      include?: { financialActivity?: boolean };
    }) => {
      const db = getInMemoryDb();
      const index = db.paymentCases.findIndex((c) => c.id === args.where.id);
      if (index === -1) {
        throw new Error(`PaymentCase with id ${args.where.id} not found`);
      }

      const existing = db.paymentCases[index];
      const updated: InMemoryPaymentCase = {
        ...existing,
        ...(args.data.resolutionStatus ? { resolutionStatus: args.data.resolutionStatus } : {}),
        ...(args.data.nextActionDate !== undefined ? { nextActionDate: args.data.nextActionDate } : {}),
        updatedAt: new Date(),
      };
      db.paymentCases[index] = updated;

      // Cascade update to financial activity if requested
      if (args.data.financialActivity?.update) {
        const actIndex = db.financialActivities.findIndex((a) => a.id === existing.financialActivityId);
        if (actIndex !== -1) {
          const act = db.financialActivities[actIndex];
          db.financialActivities[actIndex] = {
            ...act,
            ...args.data.financialActivity.update,
            updatedAt: new Date(),
          };
        }
      }

      const result: any = { ...updated };
      if (args.include?.financialActivity) {
        result.financialActivity = db.financialActivities.find((a) => a.id === updated.financialActivityId) || null;
      }
      return result;
    },
  },

  cashFlowItem: {
    findMany: async (args?: {
      where?: { userId?: string };
      orderBy?: { dueDate?: 'asc' | 'desc' };
    }) => {
      const db = getInMemoryDb();
      let list = [...db.cashFlowItems];
      if (args?.where?.userId) {
        list = list.filter((i) => i.userId === args.where!.userId);
      }
      if (args?.orderBy?.dueDate === 'asc') {
        list.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      }
      return list;
    },

    findUnique: async (args: { where: { id: string } }) => {
      const db = getInMemoryDb();
      return db.cashFlowItems.find((i) => i.id === args.where.id) || null;
    },

    create: async (args: {
      data: {
        userId: string;
        amount: number;
        currency?: string;
        isIncome: boolean;
        isConfirmed?: boolean;
        dueDate?: Date | null;
        description?: string | null;
      };
    }) => {
      const db = getInMemoryDb();
      const now = new Date();
      const item: InMemoryCashFlowItem = {
        id: generateUuid(),
        userId: args.data.userId,
        financialActivityId: null,
        amount: args.data.amount,
        currency: args.data.currency || 'INR',
        isIncome: args.data.isIncome,
        isConfirmed: args.data.isConfirmed ?? false,
        availabilityStatus: args.data.isConfirmed ? 'CONFIRMED' : 'PENDING',
        dueDate: args.data.dueDate ? new Date(args.data.dueDate) : null,
        description: args.data.description || null,
        scenarioId: null,
        createdAt: now,
        updatedAt: now,
      };
      db.cashFlowItems.push(item);
      return item;
    },

    update: async (args: {
      where: { id: string };
      data: Partial<InMemoryCashFlowItem>;
    }) => {
      const db = getInMemoryDb();
      const index = db.cashFlowItems.findIndex((i) => i.id === args.where.id);
      if (index === -1) {
        throw new Error(`CashFlowItem with id ${args.where.id} not found`);
      }
      const existing = db.cashFlowItems[index];
      const updated = { ...existing, ...args.data, updatedAt: new Date() };
      db.cashFlowItems[index] = updated;
      return updated;
    },

    delete: async (args: { where: { id: string } }) => {
      const db = getInMemoryDb();
      const index = db.cashFlowItems.findIndex((i) => i.id === args.where.id);
      if (index === -1) {
        throw new Error(`CashFlowItem with id ${args.where.id} not found`);
      }
      const deleted = db.cashFlowItems.splice(index, 1)[0];
      return deleted;
    },
  },

  riskAssessment: {
    findMany: async (args?: {
      where?: { riskLevel?: string; financialActivity?: { userId: string } };
      take?: number;
    }) => {
      const db = getInMemoryDb();
      let list = [...db.riskAssessments];
      if (args?.where?.riskLevel) {
        list = list.filter((r) => r.riskLevel === args.where!.riskLevel);
      }
      if (args?.take) {
        list = list.slice(0, args.take);
      }
      return list;
    },

    create: async (args: {
      data: {
        userId?: string | null;
        financialActivityId?: string | null;
        indicatorsFound: string[];
        riskLevel: string;
        assessmentMethod?: string | null;
        limitationsDisclosed?: boolean | null;
      };
    }) => {
      const db = getInMemoryDb();
      const assessment: InMemoryRiskAssessment = {
        id: generateUuid(),
        userId: args.data.userId || null,
        financialActivityId: args.data.financialActivityId || null,
        indicatorsFound: args.data.indicatorsFound,
        riskLevel: args.data.riskLevel,
        assessmentMethod: args.data.assessmentMethod || 'RULE_ENGINE_V1',
        limitationsDisclosed: args.data.limitationsDisclosed ?? true,
        createdAt: new Date(),
      };
      db.riskAssessments.push(assessment);
      return assessment;
    },
  },

  actionCentreItem: {
    findMany: async (args?: { where?: { userId?: string } }) => {
      const db = getInMemoryDb();
      let list = [...db.actionCentreItems];
      if (args?.where?.userId) {
        list = list.filter((i) => i.userId === args.where!.userId);
      }
      return list;
    },

    create: async (args: { data: any }) => {
      const db = getInMemoryDb();
      const now = new Date();
      const item: InMemoryActionCentreItem = {
        id: generateUuid(),
        userId: args.data.userId,
        financialActivityId: args.data.financialActivityId || null,
        paymentCaseId: args.data.paymentCaseId || null,
        title: args.data.title,
        description: args.data.description || null,
        urgency: args.data.urgency || 'MEDIUM',
        status: args.data.status || 'PENDING',
        dueAt: args.data.dueAt ? new Date(args.data.dueAt) : null,
        createdAt: now,
        updatedAt: now,
      };
      db.actionCentreItems.push(item);
      return item;
    },
  },

  $transaction: async (fnOrArray: any) => {
    if (typeof fnOrArray === 'function') {
      return await fnOrArray(inMemoryPrisma);
    }
    if (Array.isArray(fnOrArray)) {
      const results = [];
      for (const op of fnOrArray) {
        results.push(await op);
      }
      return results;
    }
    return fnOrArray;
  },
};
