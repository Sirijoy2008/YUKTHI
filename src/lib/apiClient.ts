/**
 * Central YUKTHI API Client
 * Wraps all backend Route Handlers with type safety, authentication headers,
 * and unified error handling.
 */

import {
  ApiResponse,
  ScamAnalysisData,
  FinancialActivity,
  ActivityType,
  ActivityStatus,
  PaymentCaseItem,
  PaymentIssueType,
  PaymentGuidance,
  ResolutionStatus,
  CashFlowForecastData,
  CashFlowItemRecord,
  ActionCentreData,
} from '@/types/api';

const DEFAULT_USER_ID = 'user-123';
const DEFAULT_USER_NAME = 'Sirijoy';
const STORAGE_KEY = 'yukthi_user_id';
const LEGACY_STORAGE_KEY = 'finova_user_id';
const STORAGE_NAME_KEY = 'yukthi_user_name';
const LEGACY_STORAGE_NAME_KEY = 'finova_user_name';
const STORAGE_EMAIL_KEY = 'yukthi_user_email';
const LEGACY_STORAGE_EMAIL_KEY = 'finova_user_email';

let memoryUserId = DEFAULT_USER_ID;
let memoryUserName = DEFAULT_USER_NAME;
let memoryUserEmail = 'sirijoy@yukthi.in';

function notifyUserChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yukthi-user-changed'));
    window.dispatchEvent(new Event('finova-user-changed'));
  }
}

/**
 * Retrieves the current session user ID
 */
export function getSessionUserId(): string {
  if (typeof window !== 'undefined') {
    return (
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_KEY) ||
      memoryUserId ||
      DEFAULT_USER_ID
    );
  }
  return memoryUserId;
}

/**
 * Retrieves the current session user name / display name
 */
export function getSessionUserName(): string {
  if (typeof window !== 'undefined') {
    return (
      localStorage.getItem(STORAGE_NAME_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_NAME_KEY) ||
      memoryUserName ||
      DEFAULT_USER_NAME
    );
  }
  return memoryUserName;
}

/**
 * Updates the current session user ID in local storage
 */
export function setSessionUserId(userId: string): void {
  const cleanId = userId.trim();
  memoryUserId = cleanId;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, cleanId);
    localStorage.setItem(LEGACY_STORAGE_KEY, cleanId);
    notifyUserChanged();
  }
}

/**
 * Updates the current session user display name in local storage
 */
export function setSessionUserName(userName: string): void {
  const cleanName = userName.trim();
  memoryUserName = cleanName;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_NAME_KEY, cleanName);
    localStorage.setItem(LEGACY_STORAGE_NAME_KEY, cleanName);
    notifyUserChanged();
  }
}

/**
 * Atomically updates user session profile (id, name, email) in storage
 */
export function setSessionUser(userData: { id: string; name?: string; email?: string }): void {
  const cleanId = userData.id.trim();
  memoryUserId = cleanId;
  if (userData.name) memoryUserName = userData.name.trim();
  if (userData.email) memoryUserEmail = userData.email.trim();

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, cleanId);
    localStorage.setItem(LEGACY_STORAGE_KEY, cleanId);
    if (userData.name) {
      localStorage.setItem(STORAGE_NAME_KEY, userData.name.trim());
      localStorage.setItem(LEGACY_STORAGE_NAME_KEY, userData.name.trim());
    }
    if (userData.email) {
      localStorage.setItem(STORAGE_EMAIL_KEY, userData.email.trim());
      localStorage.setItem(LEGACY_STORAGE_EMAIL_KEY, userData.email.trim());
    }
    notifyUserChanged();
  }
}

// Track in-flight mutation signatures to prevent accidental rapid double-submissions
const inFlightRequests = new Set<string>();

/**
 * Base fetcher supporting standard headers, timeouts, correlation IDs,
 * offline detection, and error normalization.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<ApiResponse<T>> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const url = `${baseUrl}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();

  // Guard against offline state in browser
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      success: false,
      error: 'You appear to be offline. Please check your internet connection and retry.',
      errorCode: 'NETWORK_ERROR',
    };
  }

  // Prevent duplicate concurrent mutation requests (e.g., rapid double-clicks)
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const requestFingerprint = isMutation
    ? `${method}:${endpoint}:${typeof options.body === 'string' ? options.body : ''}`
    : '';

  if (isMutation && inFlightRequests.has(requestFingerprint)) {
    return {
      success: false,
      error: 'A request is already in progress. Please wait a moment before trying again.',
      errorCode: 'CONFLICT',
    };
  }

  if (isMutation) {
    inFlightRequests.add(requestFingerprint);
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Generate or propagate correlation request ID
  const requestId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  if (!headers.has('x-request-id')) {
    headers.set('x-request-id', requestId);
  }

  // Provide authenticated user identity header
  const currentUserId = getSessionUserId();
  if (currentUserId && !headers.has('x-user-id')) {
    headers.set('x-user-id', currentUserId);
  }

  // Setup abort controller for timeout handling (default 15 seconds)
  const timeoutMs = options.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const returnedRequestId =
      (res.headers && typeof res.headers.get === 'function' ? res.headers.get('x-request-id') : null) ||
      requestId;

    const data: ApiResponse<T> = await res.json().catch(() => ({
      success: false,
      error:
        res.status >= 500
          ? 'Server temporarily unavailable. Please try again shortly.'
          : `Request failed (HTTP ${res.status})`,
      errorCode: res.status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'HTTP_ERROR',
      requestId: returnedRequestId,
    }));

    if (!data.requestId) {
      data.requestId = returnedRequestId;
    }

    if (!res.ok && data.success !== false) {
      return {
        success: false,
        error: data.error || `HTTP error ${res.status}`,
        errorCode: data.errorCode || (res.status === 401 ? 'UNAUTHORIZED' : res.status === 404 ? 'NOT_FOUND' : 'HTTP_ERROR'),
        requestId: returnedRequestId,
      };
    }

    return data;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error: `Request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please try again.`,
        errorCode: 'TIMEOUT_ERROR',
        requestId,
      };
    }

    const message = err instanceof Error ? err.message : 'Network error. Please check your connection.';
    return {
      success: false,
      error: message,
      errorCode: 'NETWORK_ERROR',
      requestId,
    };
  } finally {
    clearTimeout(timeoutTimer);
    if (isMutation) {
      inFlightRequests.delete(requestFingerprint);
    }
  }
}

export const apiClient = {
  // --------------------------------------------------
  // Authentication & Verification
  // --------------------------------------------------
  auth: {
    login: (data: { identifier: string; password: string; rememberMe?: boolean }) =>
      apiRequest<{ user: { id: string; email: string; displayName?: string; preferredLanguage?: string; verificationStatus?: string } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    signup: (data: {
      fullName: string;
      email: string;
      mobile: string;
      password: string;
      confirmPassword: string;
      preferredLanguage?: string;
      acceptTerms: boolean;
    }) =>
      apiRequest<{ user: { id: string; email: string; displayName?: string; preferredLanguage?: string; verificationStatus?: string } }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getStatus: () =>
      apiRequest<{
        userId: string;
        email: string;
        displayName?: string;
        preferredLanguage?: string;
        verification: {
          status: string;
          providerConfigured: boolean;
          providerStatusMessage: string;
          isOptionalForBasicFeatures: boolean;
        };
      }>('/api/auth/status', {
        method: 'GET',
      }),
  },

  // --------------------------------------------------
  // System Health
  // --------------------------------------------------
  health: {
    check: () => apiRequest<{ status: string; timestamp: string }>('/api/health', { method: 'GET' }),
  },

  // --------------------------------------------------
  // Scam Checker
  // --------------------------------------------------
  scamChecker: {
    analyze: (message: string) =>
      apiRequest<ScamAnalysisData>('/api/scam-checker/analyze', {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
  },

  // --------------------------------------------------
  // Financial Activities
  // --------------------------------------------------
  activities: {
    list: () =>
      apiRequest<{ activities: FinancialActivity[] }>('/api/activities', {
        method: 'GET',
      }),

    create: (data: {
      type: ActivityType;
      amount: number; // in paise
      currency?: string;
      status?: ActivityStatus;
      date: string;
      referenceNumber?: string | null;
      issueType?: PaymentIssueType;
    }) =>
      apiRequest<FinancialActivity>('/api/activities', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateStatus: (id: string, status: ActivityStatus) =>
      apiRequest<FinancialActivity>(`/api/activities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // --------------------------------------------------
  // Payment Cases
  // --------------------------------------------------
  paymentCases: {
    list: () =>
      apiRequest<{ cases?: PaymentCaseItem[]; paymentCases?: PaymentCaseItem[]; disclaimer?: string }>(
        '/api/payment-cases',
        { method: 'GET' }
      ),

    get: (id: string) =>
      apiRequest<{ case?: PaymentCaseItem; guidance?: PaymentGuidance; disclaimer?: string } & Partial<PaymentCaseItem>>(
        `/api/payment-cases/${id}`,
        { method: 'GET' }
      ),

    create: (data: {
      issueType: PaymentIssueType;
      amount: number; // in paise
      currency?: string;
      type?: 'INCOME' | 'EXPENSE';
      date?: string;
      referenceNumber?: string | null;
      nextActionDate?: string | null;
      notes?: string | null;
    }) =>
      apiRequest<{ case: PaymentCaseItem; guidance?: PaymentGuidance } | PaymentCaseItem>(
        '/api/payment-cases',
        {
          method: 'POST',
          body: JSON.stringify({
            currency: 'INR',
            type: 'EXPENSE',
            date: new Date().toISOString(),
            ...data,
          }),
        }
      ),

    update: (
      id: string,
      data: {
        resolutionStatus?: ResolutionStatus;
        nextActionDate?: string | null;
        referenceNumber?: string | null;
        notes?: string;
      }
    ) =>
      apiRequest<PaymentCaseItem>(`/api/payment-cases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // --------------------------------------------------
  // Cash-Flow Planner
  // --------------------------------------------------
  cashFlow: {
    getForecast: () =>
      apiRequest<CashFlowForecastData>('/api/cash-flow/forecast', {
        method: 'GET',
      }),

    simulate: (data: {
      currentAvailableFunds?: number;
      confirmedIncome?: number;
      unconfirmedReceipts?: number;
      expenses?: number;
      items?: Array<{
        id?: string;
        amount: number;
        currency?: string;
        isIncome: boolean;
        isConfirmed: boolean;
        dueDate?: string | null;
      }>;
      hypotheticalScenarios?: Array<{
        name: string;
        additionalIncome?: number;
        additionalExpense?: number;
      }>;
    }) =>
      apiRequest<CashFlowForecastData>('/api/cash-flow/forecast', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getItems: () =>
      apiRequest<{ items: CashFlowItemRecord[] }>('/api/cash-flow/items', {
        method: 'GET',
      }),

    createItem: (data: {
      amount: number; // in paise
      currency?: string;
      isIncome: boolean;
      isConfirmed?: boolean;
      isHypothetical?: boolean;
      dueDate: string;
      description?: string;
      financialActivityId?: string;
    }) =>
      apiRequest<CashFlowItemRecord>('/api/cash-flow/items', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateItem: (
      id: string,
      data: {
        isConfirmed?: boolean;
        amount?: number;
        description?: string;
      }
    ) =>
      apiRequest<CashFlowItemRecord>(`/api/cash-flow/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    deleteItem: (id: string) =>
      apiRequest<{ message: string }>(`/api/cash-flow/items/${id}`, {
        method: 'DELETE',
      }),
  },

  // --------------------------------------------------
  // Action Centre
  // --------------------------------------------------
  actionCentre: {
    getItems: () =>
      apiRequest<ActionCentreData>('/api/action-centre', {
        method: 'GET',
      }),

    resolve: (data: {
      actionId: string;
      entityType: 'PAYMENT_CASE' | 'FINANCIAL_ACTIVITY' | 'CASH_FLOW' | 'RISK_ASSESSMENT';
      entityId: string;
    }) =>
      apiRequest<{ actionId: string; status: string }>(
        '/api/action-centre/resolve',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
  },
};
