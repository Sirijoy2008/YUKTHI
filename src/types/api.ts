/**
 * FINOVA API Types & Data Contracts
 * Consistent with backend route handlers and services.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errorCode?: string;
  requestId?: string;
  details?: unknown;
}

// ----------------------------------------------------
// Scam Checker Types
// ----------------------------------------------------

export interface ScamIndicatorDetail {
  id: string;
  name: string;
  description: string;
  reason: string;
  recommendation: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface ScamAnalysisData {
  indicators: string[];
  details: ScamIndicatorDetail[];
  riskLevel: RiskLevel;
  recommendations: string[];
  disclaimer: string;
}

// ----------------------------------------------------
// Shared Financial Activity Types
// ----------------------------------------------------

export type ActivityType = 'INCOME' | 'EXPENSE';
export type ActivityStatus = 'CONFIRMED' | 'UNCONFIRMED' | 'FAILED';

export interface FinancialActivity {
  id: string;
  userId: string;
  type: ActivityType;
  amount: number; // represented in paise
  currency: string;
  status: ActivityStatus;
  date: string;
  referenceNumber?: string | null;
  paymentCase?: {
    id: string;
    issueType: PaymentIssueType;
    resolutionStatus: ResolutionStatus;
  } | null;
  riskAssessment?: {
    id: string;
    riskLevel: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// Payment Assistant Types
// ----------------------------------------------------

export type PaymentIssueType =
  | 'FAILED'
  | 'PENDING'
  | 'DELAYED'
  | 'DEBITED_NOT_CREDITED';

export type ResolutionStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED';

export interface OfficialPortal {
  name: string;
  url: string;
  description: string;
}

export interface PaymentGuidance {
  title?: string;
  explanation?: string;
  expectedTimeline?: string;
  tatCategory?: string;
  statutoryCompensation?: string;
  recommendedSteps: string[];
  recommendedActions?: string[];
  estimatedResolutionHours: number;
  supportChannels?: string[];
  officialPortals: OfficialPortal[];
  escalationWarning?: string;
}

export interface PaymentCaseItem {
  id: string;
  userId: string;
  financialActivityId?: string | null;
  issueType: PaymentIssueType;
  resolutionStatus: ResolutionStatus;
  amount?: number | null; // in paise
  currency?: string;
  referenceNumber?: string | null;
  notes?: string | null;
  nextActionDate?: string | null;
  financialActivity?: {
    id: string;
    type: ActivityType;
    amount: number;
    currency: string;
    status: ActivityStatus;
    date: string;
    referenceNumber?: string | null;
  } | null;
  guidance?: PaymentGuidance | null;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// Cash-Flow Planner Types
// ----------------------------------------------------

export interface CashFlowItemRecord {
  id: string;
  userId: string;
  financialActivityId?: string | null;
  amount: number; // in paise
  currency: string;
  isIncome: boolean;
  isConfirmed: boolean;
  isHypothetical: boolean;
  dueDate: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HypotheticalScenarioResult {
  scenarioName: string;
  projectedBalance: number; // in paise
  variance: number; // in paise
  isShortfall: boolean;
}

export interface CashFlowForecastData {
  summary?: {
    confirmedAvailableFunds: number; // in paise
    confirmedIncomingFunds: number; // in paise
    totalConfirmedLiquid: number; // in paise
    unconfirmedReceipts: number; // in paise
    upcomingExpenses: number; // in paise
  };
  primaryForecast?: {
    netAmount: number; // in paise
    isShortfall: boolean;
    shortfallAmount: number; // in paise
    surplusAmount: number; // in paise
    statusText: string;
  };
  conditionalScenarios?: {
    unconfirmedReceiptsCleared?: {
      projectedLiquid: number;
      netAmount: number;
      isShortfall: boolean;
      shortfallAmount: number;
      surplusAmount: number;
      statusText: string;
      description: string;
    };
    hypotheticals?: Array<{
      name: string;
      projectedNet: number;
      isShortfall: boolean;
      shortfallAmount: number;
      surplusAmount: number;
      statusText: string;
    }>;
  };
  explanation?: {
    calculationFormula: string;
    breakdown: string[];
    assumptions: string[];
  };
  // Fallbacks & direct aliases for views:
  availableFunds?: number; // in paise
  confirmedUpcomingIncome?: number; // in paise
  unconfirmedUpcomingIncome?: number; // in paise
  upcomingExpenses?: number; // in paise
  netCashFlow?: number; // in paise
  isShortfall?: boolean;
  shortfallAmount?: number; // in paise
  hypotheticalScenarios?: HypotheticalScenarioResult[];
  disclaimer?: string;
}

// ----------------------------------------------------
// Action Centre Types
// ----------------------------------------------------

export type ActionUrgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionCategory =
  | 'PAYMENT_FOLLOWUP'
  | 'SCAM_ALERT'
  | 'CASH_FLOW_WARNING'
  | 'GENERAL';
export type ActionStatus = 'PENDING' | 'COMPLETED' | 'DISMISSED';

export interface ActionCentreItem {
  id: string;
  type?: string;
  title: string;
  description: string;
  urgency: ActionUrgency;
  category?: ActionCategory;
  status: ActionStatus | 'PENDING' | 'RESOLVED';
  recommendedAction?: string;
  actionPrompt?: string;
  externalUrl?: string | null;
  deadline?: string | null;
  targetDate?: string | null;
  sourceEntity?: {
    entityType: 'PAYMENT_CASE' | 'FINANCIAL_ACTIVITY' | 'CASH_FLOW' | 'RISK_ASSESSMENT';
    entityId: string;
  };
  userId?: string;
  financialActivityId?: string | null;
  paymentCaseId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActionSummary {
  totalActions: number;
  highUrgencyCount: number;
  mediumUrgencyCount?: number;
  lowUrgencyCount?: number;
  criticalCount?: number;
  mediumCount?: number;
  lowCount?: number;
}

export interface ActionCentreData {
  summary: ActionSummary;
  items?: ActionCentreItem[];
  actions?: ActionCentreItem[];
  disclaimer?: string;
}
